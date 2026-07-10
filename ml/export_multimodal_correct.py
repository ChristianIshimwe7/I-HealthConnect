# ml/export_multimodal_correct.py

import torch
import torch.nn as nn
from torchvision import models
import numpy as np
import json
import os

print("🚀 Exporting multimodal model (correct architecture)...")

class MultimodalModel(nn.Module):
    def __init__(self, num_clinical_features, num_classes):
        super(MultimodalModel, self).__init__()
        
        # Image branch (ResNet18 backbone)
        self.image_model = models.resnet18(weights=None)
        self.image_model.fc = nn.Identity()
        image_feature_dim = 512
        
        # Clinical branch
        self.clinical_model = nn.Sequential(
            nn.Linear(num_clinical_features, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU()
        )
        
        # Fusion layer
        self.fc = nn.Sequential(
            nn.Linear(image_feature_dim + 32, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, clinical, image):
        img_features = self.image_model(image)
        clinical_features = self.clinical_model(clinical)
        combined = torch.cat((img_features, clinical_features), dim=1)
        return self.fc(combined)

def export_clinical_model():
    model_path = 'models/ihealth_multimodal.pth'
    output_dir = 'models/'
    
    print(f"📦 Loading model: {model_path}")
    
    # Load full multimodal model
    model = MultimodalModel(num_clinical_features=16, num_classes=5)
    checkpoint = torch.load(model_path, map_location='cpu')
    
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    print("✅ Model loaded")
    
    # Extract clinical branch only
    clinical_model = model.clinical_model
    clinical_model.eval()
    
    # Export clinical model to ONNX
    dummy_clinical = torch.randn(1, 16)
    onnx_path = os.path.join(output_dir, 'clinical_model.onnx')
    torch.onnx.export(
        clinical_model,
        dummy_clinical,
        onnx_path,
        input_names=['clinical_features'],
        output_names=['clinical_output'],
        dynamic_axes={'clinical_features': {0: 'batch_size'}},
        opset_version=11
    )
    print(f"✅ Clinical model ONNX: {onnx_path}")
    
    # Export clinical weights as JSON
    weights = {}
    for name, param in clinical_model.named_parameters():
        weights[name] = param.detach().numpy().tolist()
    
    weights_path = os.path.join(output_dir, 'clinical_weights.json')
    with open(weights_path, 'w') as f:
        json.dump(weights, f, indent=2)
    print(f"✅ Clinical weights JSON: {weights_path}")
    
    # Export clinical weights as numpy
    weights_np = {}
    for name, param in clinical_model.named_parameters():
        weights_np[name] = param.detach().numpy()
    np.savez_compressed(os.path.join(output_dir, 'clinical_weights.npz'), **weights_np)
    print(f"✅ Clinical weights NPZ: {os.path.join(output_dir, 'clinical_weights.npz')}")
    
    # Export config
    config = {
        'input_size': 16,
        'num_classes': 5,
        'class_names': ['CHD', 'NTD', 'Renal', 'Abdominal', 'Cleft'],
        'model_type': 'clinical_only',
        'hidden_layers': [64, 32]
    }
    config_path = os.path.join(output_dir, 'model_config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✅ Config: {config_path}")
    
    print("=" * 50)
    print("✅ Export complete!")
    print("📁 Files saved in:", output_dir)
    print("📌 Use clinical_model.onnx for pure clinical predictions")
    print("📌 Use clinical_weights.json for JavaScript inference")
    print("=" * 50)

if __name__ == '__main__':
    export_clinical_model()
