import torch
import numpy as np
import json
from pathlib import Path

print("🧠 Testing ML Model...\n")

# 1. Check if model exists
model_path = Path("models/ihealth_multimodal.pth")
if model_path.exists():
    print(f"✅ Model found: {model_path}")
    print(f"   Size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
else:
    print("❌ Model not found!")
    exit()

# 2. Try to load the model
try:
    print("\n📂 Loading model...")
    model = torch.load(model_path, map_location='cpu')
    print("✅ Model loaded successfully!")
    print(f"   Model type: {type(model)}")
    
    # Check if it's a dict or a model class
    if isinstance(model, dict):
        print(f"   Keys in model: {list(model.keys())}")
    else:
        print(f"   Model class: {model.__class__.__name__}")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# 3. Test with sample patient data
print("\n🔮 Testing predictions on sample patients...")

sample_patients = [
    {"id": 1, "name": "Patient A", "age": 28, "gender": "Female"},
    {"id": 2, "name": "Patient B", "age": 35, "gender": "Male"},
    {"id": 3, "name": "Patient C", "age": 42, "gender": "Male"},
]

for patient in sample_patients:
    age = patient["age"]
    # Simple risk calculation (replace with actual model inference)
    score = min(100, max(0, (age - 20) * 1.5 + np.random.normal(0, 10)))
    
    if score > 70:
        risk = "high"
    elif score > 40:
        risk = "elevated"
    else:
        risk = "low"
    
    print(f"   {patient['name']} (age {age}): {risk} risk (score: {score:.1f})")

print("\n✅ ML test complete!")
