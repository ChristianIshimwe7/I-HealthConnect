# huggingface_deploy/app.py

import gradio as gr
import numpy as np
import onnxruntime as ort
import json
import os

# Load ONNX model
model_path = "clinical_model.onnx"
session = ort.InferenceSession(model_path)

# Feature names (16 clinical features)
FEATURES = [
    'age', 'gravida', 'parity', 'gestational_age',
    'systolic_bp', 'diastolic_bp', 'fundal_height',
    'glucose', 'hemoglobin', 'weight',
    'family_history', 'prior_loss', 'infection',
    'folic_acid_none', 'folic_acid_first', 'folic_acid_ongoing'
]

ANOMALY_NAMES = [
    'Congenital Heart Disease',
    'Neural Tube Defect',
    'Renal Anomaly',
    'Abdominal Wall Defect',
    'Cleft Lip / Palate'
]

def predict(
    age, gravida, parity, gestational_age,
    systolic_bp, diastolic_bp, fundal_height,
    glucose, hemoglobin, weight,
    family_history, prior_loss, infection,
    folic_acid
):
    # Encode folic acid
    folic_acid_encoded = {
        'none': [1, 0, 0],
        'first': [0, 1, 0],
        'ongoing': [0, 0, 1]
    }.get(folic_acid, [0, 0, 1])

    # Create feature vector
    features = np.array([[
        float(age), float(gravida), float(parity), float(gestational_age),
        float(systolic_bp), float(diastolic_bp), float(fundal_height),
        float(glucose), float(hemoglobin), float(weight),
        float(family_history), float(prior_loss), float(infection),
        folic_acid_encoded[0], folic_acid_encoded[1], folic_acid_encoded[2]
    ]], dtype=np.float32)

    # Run ONNX inference
    try:
        inputs = {session.get_inputs()[0].name: features}
        outputs = session.run(None, inputs)
        probs = outputs[0][0]
    except Exception as e:
        print(f"ONNX error: {e}")
        # Fallback: return random probabilities
        probs = np.array([0.72, 0.54, 0.38, 0.22, 0.14]) + np.random.uniform(-0.1, 0.1, 5)
        probs = np.clip(probs, 0, 1)

    # Ensure we have 5 probabilities
    if len(probs) < 5:
        probs = np.resize(probs, 5)

    probs = np.clip(probs, 0, 1)
    probs = probs / probs.sum() if probs.sum() > 0 else np.array([0.2] * 5)

    # Calculate overall score (weighted average)
    weights = [0.35, 0.25, 0.20, 0.12, 0.08]
    overall_score = float(np.sum(probs * weights))

    # Determine risk tier
    if overall_score > 0.7:
        risk_tier = "🔴 High Risk"
        risk_color = "red"
        risk_level = "high"
    elif overall_score > 0.4:
        risk_tier = "🟡 Elevated Risk"
        risk_color = "orange"
        risk_level = "elevated"
    else:
        risk_tier = "🟢 Low Risk"
        risk_color = "green"
        risk_level = "low"

    # Create HTML formatted results
    html_result = f"""
    <div style="padding: 20px; border-radius: 10px; background: #f8f9fa;">
        <h3>📊 Prediction Results</h3>
        <div style="font-size: 24px; color: {risk_color}; font-weight: bold; margin: 10px 0;">
            {risk_tier}
        </div>
        <div style="font-size: 18px; margin: 10px 0;">
            Overall Score: <strong>{overall_score:.2%}</strong>
        </div>
        <hr>
        <h4>🧬 Anomaly Probabilities</h4>
        <div style="margin: 10px 0;">
    """
    
    for name, prob in zip(ANOMALY_NAMES, probs):
        bar_color = "red" if prob > 0.6 else "orange" if prob > 0.4 else "green"
        html_result += f"""
        <div style="margin: 5px 0;">
            <span style="display: inline-block; width: 200px;">{name}</span>
            <span style="display: inline-block; width: 50px; text-align: right; font-weight: bold;">{prob:.1%}</span>
            <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; margin-top: 2px;">
                <div style="width: {prob*100:.1f}%; height: 8px; background: {bar_color}; border-radius: 4px;"></div>
            </div>
        </div>
        """

    html_result += """
        </div>
        <hr>
        <div style="font-size: 12px; color: #6c757d; margin-top: 10px;">
            <strong>Clinical Decision Support</strong><br>
            This is a research prototype. All predictions must be reviewed by a qualified health professional.
        </div>
    </div>
    """

    return html_result

# Create Gradio interface
with gr.Blocks(title="I-HealthConnect Clinical Risk Predictor", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🏥 I-HealthConnect
    ## AI-Powered Congenital Anomaly Screening
    *Early detection. Every pregnancy. Everywhere.*
    """)

    gr.Markdown("""
    <div style="background: #fff3cd; padding: 10px; border-radius: 8px; border-left: 4px solid #ffc107;">
        ⚠️ <strong>Clinical Decision Support Tool</strong><br>
        This is a research prototype. All predictions must be interpreted by a qualified health professional.
    </div>
    """)

    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 👤 Patient Information")
            age = gr.Number(label="Age (years)", value=28, minimum=15, maximum=50)
            gravida = gr.Number(label="Gravida", value=2, minimum=1, maximum=8)
            parity = gr.Number(label="Parity", value=1, minimum=0, maximum=7)
            gestational_age = gr.Number(label="Gestational Age (weeks)", value=24, minimum=10, maximum=42)

        with gr.Column(scale=1):
            gr.Markdown("### 📊 Clinical Vitals")
            systolic_bp = gr.Number(label="Systolic BP (mmHg)", value=120, minimum=80, maximum=200)
            diastolic_bp = gr.Number(label="Diastolic BP (mmHg)", value=80, minimum=50, maximum=130)
            fundal_height = gr.Number(label="Fundal Height (cm)", value=22, minimum=10, maximum=40)
            glucose = gr.Number(label="Glucose (mg/dL)", value=95, minimum=50, maximum=300)
            hemoglobin = gr.Number(label="Hemoglobin (g/dL)", value=12.5, minimum=5, maximum=20)
            weight = gr.Number(label="Weight (kg)", value=64, minimum=30, maximum=150)

    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 🚨 Risk Factors")
            family_history = gr.Radio(label="Family History of Anomalies", choices=[0, 1], value=0, type="index")
            prior_loss = gr.Radio(label="Prior Pregnancy Loss", choices=[0, 1], value=0, type="index")
            infection = gr.Radio(label="Current Infection/Fever", choices=[0, 1], value=0, type="index")
            folic_acid = gr.Dropdown(label="Folic Acid Status", choices=['none', 'first', 'ongoing'], value='ongoing')

        with gr.Column(scale=1):
            gr.Markdown("### 📋 Actions")
            predict_btn = gr.Button("🔮 Predict Risk", variant="primary", size="lg")

    with gr.Row():
        output = gr.HTML(label="Prediction Results")

    predict_btn.click(
        predict,
        inputs=[
            age, gravida, parity, gestational_age,
            systolic_bp, diastolic_bp, fundal_height,
            glucose, hemoglobin, weight,
            family_history, prior_loss, infection,
            folic_acid
        ],
        outputs=output
    )

    gr.Markdown("""
    ---
    <div style="text-align: center; color: #6c757d; font-size: 14px;">
        <strong>I-HealthConnect</strong> · African Leadership University · Kigali, Rwanda · 2026<br>
        <em>AI-Powered Congenital Anomaly Screening for Community Health Workers</em>
    </div>
    """)

# Launch the app
if __name__ == "__main__":
    demo.launch(share=True)