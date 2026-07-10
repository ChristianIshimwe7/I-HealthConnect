# ml/export_pytorch_tflite.py

import torch
import torch.nn as nn
import numpy as np
import json
import os
import argparse

print("🚀 Starting export script...")

class HealthModel(nn.Module):
    def __init__(self, input_size=16, hidden_size=128, num_classes=5):
        super(HealthModel, self).__init__()
        self.layer1 = nn.Linear(input_size, hidden_size)
        self.bn1 = nn.BatchNorm1d(hidden_size)
        self.layer2 = nn.Linear(hidden_size, hidden_size // 2)
        self.bn2 = nn.BatchNorm1d(hidden_size // 2)
        self.layer3 = nn.Linear(hidden_size // 2, hidden_size // 4)
        self.bn3 = nn.BatchNorm1d(hidden_size // 4)
        self.output = nn.Linear(hidden_size // 4, num_classes)
        self.dropout = nn.Dropout(0.3)
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu(self.bn1(self.layer1(x)))
        x = self.dropout(x)
        x = self.relu(self.bn2(self.layer2(x)))
        x = self.dropout(x)
        x = self.relu(self.bn3(self.layer3(x)))
        x = self.sigmoid(self.output(x))
        return x

def export_to_onnx(model_path, output_dir):
    print(f"📦 Loading model: {model_path}")
    model = HealthModel()
    checkpoint = torch.load(model_path, map_location='cpu')
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    model.eval()
    dummy_input = torch.randn(1, 16)
    onnx_path = os.path.join(output_dir, 'model.onnx')
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        input_names=['clinical_features'],
        output_names=['predictions'],
        dynamic_axes={'clinical_features': {0: 'batch_size'}, 'predictions': {0: 'batch_size'}},
        opset_version=11,
        do_constant_folding=True
    )
    print(f"✅ ONNX model saved to: {onnx_path}")
    return onnx_path

def export_weights_json(model_path, output_dir):
    print("📦 Exporting weights to JSON...")
    model = HealthModel()
    checkpoint = torch.load(model_path, map_location='cpu')
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    model.eval()
    weights = {}
    for name, param in model.named_parameters():
        weights[name] = param.detach().numpy().tolist()
    for name, param in model.named_buffers():
        weights[name] = param.detach().numpy().tolist()
    weights_path = os.path.join(output_dir, 'model_weights.json')
    with open(weights_path, 'w') as f:
        json.dump(weights, f, indent=2)
    print(f"✅ Model weights saved to: {weights_path}")
    return weights_path

def export_numpy_arrays(model_path, output_dir):
    print("📦 Exporting numpy arrays...")
    model = HealthModel()
    checkpoint = torch.load(model_path, map_location='cpu')
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    model.eval()
    config = {
        'input_size': 16,
        'hidden_size': 128,
        'num_classes': 5,
        'class_names': ['CHD', 'NTD', 'Renal', 'Abdominal', 'Cleft']
    }
    config_path = os.path.join(output_dir, 'model_config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    weights = {}
    for name, param in model.named_parameters():
        weights[name] = param.detach().numpy()
    np.savez_compressed(os.path.join(output_dir, 'model_weights.npz'), **weights)
    print(f"✅ Model config saved to: {config_path}")
    return config_path

def main():
    print("=" * 60)
    print("  I-HealthConnect — PyTorch Export Pipeline")
    print("=" * 60)
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=str, required=True, help='Input model .pth file')
    parser.add_argument('--output', type=str, default='models/', help='Output directory')
    parser.add_argument('--format', type=str, default='all', choices=['onnx', 'json', 'numpy', 'all'])
    args = parser.parse_args()
    
    print(f"📦 Input model: {args.input}")
    print(f"📁 Output directory: {args.output}")
    
    os.makedirs(args.output, exist_ok=True)
    
    if args.format in ['onnx', 'all']:
        export_to_onnx(args.input, args.output)
    if args.format in ['json', 'all']:
        export_weights_json(args.input, args.output)
    if args.format in ['numpy', 'all']:
        export_numpy_arrays(args.input, args.output)
    
    print("=" * 60)
    print("✅ Export complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()