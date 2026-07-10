"""
I-HealthConnect — TFLite Export Pipeline
Converts trained sklearn stacking models to a single multi-output TFLite model.

Usage:
  python export_tflite.py --models models/ --data data/processed/ --output exports/
"""

import argparse
import json
import os
import time
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import joblib
import tensorflow as tf

LABELS = ['chd', 'ntd', 'renal', 'abdominal', 'cleft']
N_FEATURES = 16
BENCHMARK_RUNS = 100

# ── Wrap sklearn model in Keras ───────────────────────────────────────────────
class SklearnWrapper(tf.Module):
    """Thin TF wrapper around a sklearn predict_proba call."""
    def __init__(self, sklearn_model):
        super().__init__()
        # Pre-extract probabilities as a fixed lookup isn't possible at runtime;
        # instead we bake the model logic into a dense Keras network trained
        # to replicate it. For production, replace with a real Keras retrain.
        self._model = sklearn_model

    def predict_batch(self, X: np.ndarray) -> np.ndarray:
        return self._model.predict_proba(X)[:, 1].astype(np.float32)

def build_keras_proxy(sklearn_model, X_representative: np.ndarray) -> tf.keras.Model:
    """
    Train a small dense Keras network to replicate the sklearn model output.
    This enables proper TFLite conversion with representative dataset quantization.
    """
    print("  Building Keras proxy network…")

    # Generate soft labels from sklearn model
    y_soft = sklearn_model.predict_proba(X_representative)[:, 1].astype(np.float32)

    inputs = tf.keras.Input(shape=(N_FEATURES,), name='clinical_input')
    x = tf.keras.layers.Dense(64, activation='relu')(inputs)
    x = tf.keras.layers.Dropout(0.2)(x)
    x = tf.keras.layers.Dense(32, activation='relu')(x)
    x = tf.keras.layers.Dense(16, activation='relu')(x)
    output = tf.keras.layers.Dense(1, activation='sigmoid', name='anomaly_prob')(x)

    model = tf.keras.Model(inputs=inputs, outputs=output)
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['mae'])

    model.fit(
        X_representative, y_soft,
        epochs=50, batch_size=64, verbose=0,
        validation_split=0.1,
    )

    # Evaluate proxy fidelity
    preds = model.predict(X_representative[:100], verbose=0).flatten()
    sklearn_preds = y_soft[:100]
    mae = np.mean(np.abs(preds - sklearn_preds))
    print(f"  Proxy fidelity MAE vs sklearn: {mae:.4f}")

    return model

# ── Convert to TFLite with INT8 quantization ──────────────────────────────────
def convert_to_tflite(keras_model: tf.keras.Model,
                       X_representative: np.ndarray,
                       label: str,
                       output_dir: str) -> bytes:
    print(f"  Converting {label} to TFLite with INT8 quantization…")

    def representative_dataset():
        for i in range(0, min(len(X_representative), 500), 1):
            sample = X_representative[i:i+1].astype(np.float32)
            yield [sample]

    converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type  = tf.float32  # keep float input for usability
    converter.inference_output_type = tf.float32

    tflite_model = converter.convert()

    # Save individual model
    path = os.path.join(output_dir, f'model_{label}.tflite')
    with open(path, 'wb') as f:
        f.write(tflite_model)
    size_kb = len(tflite_model) / 1024
    print(f"  ✅ {label}: {size_kb:.1f} KB → {path}")

    return tflite_model

# ── Build combined multi-output model ─────────────────────────────────────────
def build_combined_model(keras_models: dict,
                          X_representative: np.ndarray) -> bytes:
    print("\n  Building combined multi-output TFLite model…")

    inputs = tf.keras.Input(shape=(N_FEATURES,), name='clinical_input')
    outputs = []
    for label in LABELS:
        # Route input through each sub-model
        sub_out = keras_models[label](inputs)
        named = tf.keras.layers.Lambda(lambda x: x, name=f'{label}_prob')(sub_out)
        outputs.append(named)

    combined = tf.keras.Model(inputs=inputs, outputs=outputs, name='ihealthconnect_combined')

    def representative_dataset():
        for i in range(0, min(len(X_representative), 500), 1):
            yield [X_representative[i:i+1].astype(np.float32)]

    converter = tf.lite.TFLiteConverter.from_keras_model(combined)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_dataset

    tflite_bytes = converter.convert()
    print(f"  Combined model size: {len(tflite_bytes)/1024:.1f} KB")
    return tflite_bytes

# ── Benchmark ─────────────────────────────────────────────────────────────────
def benchmark(tflite_bytes: bytes, X_test: np.ndarray) -> dict:
    print(f"\n  Benchmarking inference ({BENCHMARK_RUNS} runs)…")
    interpreter = tf.lite.Interpreter(model_content=tflite_bytes)
    interpreter.allocate_tensors()

    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    times = []
    for i in range(BENCHMARK_RUNS):
        sample = X_test[i % len(X_test):i % len(X_test) + 1].astype(np.float32)
        t0 = time.perf_counter()
        interpreter.set_tensor(input_details[0]['index'], sample)
        interpreter.invoke()
        _ = [interpreter.get_tensor(od['index']) for od in output_details]
        times.append((time.perf_counter() - t0) * 1000)

    mean_ms = np.mean(times)
    std_ms  = np.std(times)
    print(f"  Mean inference: {mean_ms:.2f} ms ± {std_ms:.2f} ms")
    print(f"  {'✅ Under 30 seconds' if mean_ms < 30000 else '⚠️  Exceeds 30 second target'}")
    return {'mean_ms': round(mean_ms, 2), 'std_ms': round(std_ms, 2)}

# ── Verify against sklearn ────────────────────────────────────────────────────
def verify_against_sklearn(tflite_bytes: bytes,
                            sklearn_models: dict,
                            X_test: np.ndarray,
                            n_samples: int = 10):
    print(f"\n  Verifying TFLite vs sklearn on {n_samples} samples…")
    interpreter = tf.lite.Interpreter(model_content=tflite_bytes)
    interpreter.allocate_tensors()
    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    X_sample = X_test[:n_samples].astype(np.float32)

    print(f"\n  {'Sample':>6} | " + " | ".join(f"{l:>8}" for l in LABELS))
    print("  " + "-" * (8 + 13 * len(LABELS)))

    for i in range(n_samples):
        sample = X_sample[i:i+1]
        interpreter.set_tensor(input_details[0]['index'], sample)
        interpreter.invoke()
        tflite_probs = [float(interpreter.get_tensor(od['index'])[0][0]) for od in output_details]
        sklearn_probs = [float(sklearn_models[l].predict_proba(sample)[0, 1]) for l in LABELS]

        row_t = " | ".join(f"{p:8.3f}" for p in tflite_probs)
        row_s = " | ".join(f"{p:8.3f}" for p in sklearn_probs)
        print(f"  TFLite {i+1:>3}  | {row_t}")
        print(f"  Sklearn {i+1:>3}  | {row_s}")
        print()

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--models', default='models/',          help='Trained .pkl models directory')
    parser.add_argument('--data',   default='data/processed/',  help='Processed data directory')
    parser.add_argument('--output', default='exports/',         help='TFLite output directory')
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    # Load representative dataset
    X_all   = np.load(os.path.join(args.data, 'X_all.npy')).astype(np.float32)
    X_test  = np.load(os.path.join(args.data, 'X_test_chd.npy')).astype(np.float32)

    print("=" * 60)
    print("  I-HealthConnect — TFLite Export Pipeline")
    print("=" * 60)

    sklearn_models = {}
    keras_models   = {}

    # 1. Per-label conversion
    for label in LABELS:
        print(f"\n🔵 Processing: {label.upper()}")
        model_path = os.path.join(args.models, f'model_{label}.pkl')
        sklearn_model = joblib.load(model_path)
        sklearn_models[label] = sklearn_model

        keras_model = build_keras_proxy(sklearn_model, X_all)
        keras_models[label] = keras_model

        convert_to_tflite(keras_model, X_all, label, args.output)

    # 2. Combined multi-output model
    combined_bytes = build_combined_model(keras_models, X_all)

    combined_path = os.path.join(args.output, 'model.tflite')
    with open(combined_path, 'wb') as f:
        f.write(combined_bytes)
    print(f"\n✅ Combined model saved → {combined_path}")
    print(f"   Copy to: mobile/assets/model.tflite")

    # 3. Benchmark
    bench = benchmark(combined_bytes, X_test)

    # 4. Verify vs sklearn
    verify_against_sklearn(combined_bytes, sklearn_models, X_test)

    # 5. Save export report
    report = {
        'model_path':   combined_path,
        'size_kb':      round(os.path.getsize(combined_path) / 1024, 1),
        'benchmark':    bench,
        'labels':       LABELS,
        'n_features':   N_FEATURES,
        'quantization': 'INT8',
    }
    report_path = os.path.join(args.output, 'export_report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n📊 Export report → {report_path}")

if __name__ == '__main__':
    main()
