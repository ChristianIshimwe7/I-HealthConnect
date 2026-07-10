"""
I-HealthConnect — Data Preprocessing Pipeline
Prepares paired dataset (ultrasound labels + clinical features) for model training.

Usage:
  python ml/preprocess.py --input dataset/clinical_records/ml_ready_dataset.csv --output dataset/processed/
"""

import argparse
import json
import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedShuffleSplit
from imblearn.over_sampling import SMOTE

# ── Constants ─────────────────────────────────────────────────────────────────
NUMERIC_FEATURES = [
    'age', 'systolic_bp', 'diastolic_bp', 'fundal_height',
    'glucose', 'hemoglobin', 'weight', 'gravida', 'parity', 'gestational_age',
]
BINARY_FEATURES = ['family_history', 'prior_loss', 'infection']
CATEGORICAL_FEATURES = ['folic_acid']
LABEL_COLUMNS = ['label_chd', 'label_ntd', 'label_renal', 'label_abdominal', 'label_cleft']

FEATURE_ORDER = [
    'age', 'systolic_bp', 'diastolic_bp', 'fundal_height', 'glucose',
    'hemoglobin', 'weight', 'gravida', 'parity', 'gestational_age',
    'family_history', 'prior_loss', 'infection',
    'folic_none', 'folic_first', 'folic_ongoing',
]

# ── Load data ─────────────────────────────────────────────────────────────────
def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"[Preprocess] Loaded {len(df)} records from {path}")
    print(f"[Preprocess] Columns: {list(df.columns)}")
    return df

# ── Clean ─────────────────────────────────────────────────────────────────────
def clean(df: pd.DataFrame) -> pd.DataFrame:
    original_len = len(df)
    df = df.drop_duplicates()
    print(f"[Clean] Removed {original_len - len(df)} duplicates")

    df['age']              = df['age'].clip(10, 60)
    df['systolic_bp']      = df['systolic_bp'].clip(60, 220)
    df['diastolic_bp']     = df['diastolic_bp'].clip(40, 140)
    df['fundal_height']    = df['fundal_height'].clip(5, 45)
    df['glucose']          = df['glucose'].clip(40, 400)
    df['hemoglobin']       = df['hemoglobin'].clip(4, 20)
    df['weight']           = df['weight'].clip(30, 200)
    df['gestational_age']  = df['gestational_age'].clip(4, 42)

    return df

# ── Impute ────────────────────────────────────────────────────────────────────
def impute(df: pd.DataFrame) -> pd.DataFrame:
    for col in NUMERIC_FEATURES:
        if df[col].isna().sum() > 0:
            df[col] = df[col].fillna(df[col].median())

    for col in BINARY_FEATURES:
        if df[col].isna().sum() > 0:
            df[col] = df[col].fillna(df[col].mode()[0])

    if df['folic_acid'].isna().sum() > 0:
        df['folic_acid'] = df['folic_acid'].fillna('none')

    return df

# ── One-hot encode folic_acid ─────────────────────────────────────────────────
def encode_folic(df: pd.DataFrame) -> pd.DataFrame:
    df['folic_none']    = (df['folic_acid'] == 'none').astype(int)
    df['folic_first']   = (df['folic_acid'] == 'first').astype(int)
    df['folic_ongoing'] = (df['folic_acid'] == 'ongoing').astype(int)
    return df.drop(columns=['folic_acid'])

# ── Normalize + save scaler params ───────────────────────────────────────────
def normalize(X: np.ndarray, output_dir: str) -> np.ndarray:
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    params = {
        'means': scaler.mean_.tolist(),
        'stds':  scaler.scale_.tolist(),
        'feature_order': FEATURE_ORDER,
    }
    with open(os.path.join(output_dir, 'scaler_params.json'), 'w') as f:
        json.dump(params, f, indent=2)
    print(f"[Normalize] Saved scaler params → {output_dir}/scaler_params.json")
    return X_scaled

# ── SMOTE per label ───────────────────────────────────────────────────────────
def apply_smote(X: np.ndarray, y: np.ndarray, label_name: str):
    sm = SMOTE(k_neighbors=min(5, max(1, (y == 1).sum() - 1)), random_state=42)
    return sm.fit_resample(X, y)

# ── Stratified split ──────────────────────────────────────────────────────────
def split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2):
    sss = StratifiedShuffleSplit(n_splits=1, test_size=test_size, random_state=42)
    for train_idx, test_idx in sss.split(X, y):
        return (X[train_idx], X[test_idx], y[train_idx], y[test_idx])

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='I-HealthConnect preprocessing pipeline')
    parser.add_argument('--input',  default='dataset/clinical_records/ml_ready_dataset.csv')
    parser.add_argument('--output', default='dataset/processed/')
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    df = load_data(args.input)
    df = clean(df)
    df = impute(df)
    df = encode_folic(df)

    X_raw = df[FEATURE_ORDER].values.astype(np.float32)
    print(f"\n[Features] Shape: {X_raw.shape}")

    X_scaled = normalize(X_raw, args.output)

    np.save(os.path.join(args.output, 'X_all.npy'), X_scaled)
    print(f"[Save] X_all.npy → {args.output}")

    print("\n── Per-label processing ──────────────────────────────────────────────")
    for label in LABEL_COLUMNS:
        y = df[label].values.astype(int)
        short = label.replace('label_', '')

        X_res, y_res = apply_smote(X_scaled, y, short)
        X_train, X_test, y_train, y_test = split(X_res, y_res)

        np.save(os.path.join(args.output, f'X_train_{short}.npy'), X_train)
        np.save(os.path.join(args.output, f'X_test_{short}.npy'),  X_test)
        np.save(os.path.join(args.output, f'y_train_{short}.npy'), y_train)
        np.save(os.path.join(args.output, f'y_test_{short}.npy'),  y_test)
        print(f"[Save] {short}: train={len(X_train)}, test={len(X_test)}")

    # Save combined CSV for training
    processed_csv = os.path.join(args.output, "processed_dataset.csv")
    df.to_csv(processed_csv, index=False)
    print(f"[Save] processed_dataset.csv → {processed_csv}")

    print("\n✅ Preprocessing complete.")

if __name__ == '__main__':
    main()
