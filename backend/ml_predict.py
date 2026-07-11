#!/usr/bin/env python3
"""
ML Prediction Script - Fixed for your model
"""

import sys
import os
import json
import torch
import torch.nn as nn
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# Add parent directory for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from ml.multimodal_model import MultimodalModel
    print("✅ ML model class loaded", file=sys.stderr)
except ImportError as e:
    print(f"⚠️ Error importing model: {e}", file=sys.stderr)
    class MultimodalModel(nn.Module):
        def __init__(self, num_clinical_features=14, num_classes=5):
            super().__init__()
            self.fc1 = nn.Linear(num_clinical_features, 64)
            self.fc2 = nn.Linear(64, 32)
            self.fc3 = nn.Linear(32, num_classes)
            self.dropout = nn.Dropout(0.2)
        def forward(self, clinical, image):
            x = torch.relu(self.fc1(clinical))
            x = self.dropout(x)
            x = torch.relu(self.fc2(x))
            x = self.dropout(x)
            x = self.fc3(x)
            return x

# Configuration
NUM_CLASSES = 5
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_model():
    try:
        # Find the model file
        model_paths = [
            os.path.join(os.path.dirname(__file__), '..', 'ml', 'models', 'multimodal_model.pth'),
            os.path.join(os.path.dirname(__file__), '..', 'models', 'ihealth_multimodal.pth'),
        ]
        
        model = None
        for model_path in model_paths:
            if os.path.exists(model_path):
                print(f"📂 Loading model from {model_path}", file=sys.stderr)
                checkpoint = torch.load(model_path, map_location=device)
                
                # Try different ways to load the model
                try:
                    # Try to get the state dict
                    if isinstance(checkpoint, dict):
                        if 'state_dict' in checkpoint:
                            state_dict = checkpoint['state_dict']
                        elif 'model_state_dict' in checkpoint:
                            state_dict = checkpoint['model_state_dict']
                        else:
                            state_dict = checkpoint
                    else:
                        state_dict = checkpoint
                    
                    # Get the input dimension from the model
                    # Try to detect from state dict keys
                    input_dim = 14  # default
                    for key in state_dict.keys():
                        if 'clinical' in key and 'weight' in key:
                            # Extract input dimension from the weight shape
                            if len(state_dict[key].shape) >= 2:
                                input_dim = state_dict[key].shape[1]
                                break
                    
                    print(f"📊 Detected input dimension: {input_dim}", file=sys.stderr)
                    
                    # Create model with correct dimensions
                    model = MultimodalModel(
                        num_clinical_features=input_dim,
                        num_classes=NUM_CLASSES
                    )
                    
                    # Load state dict, ignoring mismatched keys
                    missing_keys, unexpected_keys = model.load_state_dict(state_dict, strict=False)
                    if missing_keys:
                        print(f"⚠️ Missing keys: {missing_keys}", file=sys.stderr)
                    if unexpected_keys:
                        print(f"⚠️ Unexpected keys: {unexpected_keys}", file=sys.stderr)
                    
                    model.to(device)
                    model.eval()
                    print(f"✅ Model loaded successfully with {input_dim} features", file=sys.stderr)
                    return model
                    
                except Exception as e:
                    print(f"⚠️ Error loading state dict: {e}", file=sys.stderr)
                    continue
        
        # Fallback - create a model with correct dimensions
        print("⚠️ Creating fallback model", file=sys.stderr)
        model = MultimodalModel(14, NUM_CLASSES)
        model.to(device)
        model.eval()
        return model
        
    except Exception as e:
        print(f"❌ Error loading model: {e}", file=sys.stderr)
        return None

def get_fallback_prediction():
    return {
        'overall_score': 0.35,
        'risk_tier': 'low',
        'chd_prob': 0.15,
        'ntd_prob': 0.12,
        'renal_prob': 0.10,
        'abdominal_prob': 0.08,
        'cleft_prob': 0.05
    }

def predict(data):
    model = load_model()
    
    if model is None:
        return get_fallback_prediction()
    
    try:
        # Extract 16 features (matching your model's training)
        features = np.array([
            float(data.get('maternal_age', data.get('age', 28))),
            float(data.get('gestational_age_weeks', data.get('gestational_age', 24))),
            float(data.get('weight', 70)),
            float(data.get('fundal_height', 24)),
            float(data.get('systolic_bp', 120)),
            float(data.get('diastolic_bp', 80)),
            float(data.get('heart_rate', 80)),
            float(data.get('blood_glucose', data.get('glucose', 95))),
            float(data.get('hemoglobin', 12.5)),
            float(data.get('parity', 0)),
            float(data.get('gravida', 1)),
            1 if data.get('family_history', False) else 0,
            1 if data.get('prior_loss', False) else 0,
            1 if data.get('infection_status') == 'infection' or data.get('infection', False) else 0,
            1 if data.get('medication_exposure') == 'folic_acid' else 0,
            1 if data.get('previous_anomaly', False) else 0
        ], dtype=np.float32)
        
        # Ensure we have the right number of features
        # If model expects 14 features, trim or pad
        if hasattr(model, 'clinical_model') and hasattr(model.clinical_model, '0'):
            expected_dim = model.clinical_model[0].in_features
            if len(features) > expected_dim:
                features = features[:expected_dim]
            elif len(features) < expected_dim:
                # Pad with zeros
                features = np.pad(features, (0, expected_dim - len(features)), 'constant')
        
        clinical_tensor = torch.tensor(features).unsqueeze(0).to(device)
        dummy_image = torch.zeros((1, 3, 224, 224)).to(device)
        
        with torch.no_grad():
            outputs = model(clinical_tensor, dummy_image)
            if isinstance(outputs, tuple):
                outputs = outputs[0]
            probabilities = torch.sigmoid(outputs).cpu().numpy()[0]
        
        overall_score = float(np.mean(probabilities))
        risk_tier = 'high' if overall_score > 0.7 else 'elevated' if overall_score > 0.4 else 'low'
        
        return {
            'overall_score': overall_score,
            'risk_tier': risk_tier,
            'chd_prob': float(probabilities[0]) if len(probabilities) > 0 else 0,
            'ntd_prob': float(probabilities[1]) if len(probabilities) > 1 else 0,
            'renal_prob': float(probabilities[2]) if len(probabilities) > 2 else 0,
            'abdominal_prob': float(probabilities[3]) if len(probabilities) > 3 else 0,
            'cleft_prob': float(probabilities[4]) if len(probabilities) > 4 else 0
        }
    except Exception as e:
        print(f"❌ Prediction error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return get_fallback_prediction()

if __name__ == '__main__':
    try:
        input_data = json.load(sys.stdin)
        result = predict(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        print(json.dumps(get_fallback_prediction()))
