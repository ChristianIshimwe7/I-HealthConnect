import torch
import torch.nn as nn
from torchvision import models

class MultimodalModel(nn.Module):
    def __init__(self, num_clinical_features, num_classes):
        super(MultimodalModel, self).__init__()

        # --- Image branch (ResNet18 backbone) ---
        self.image_model = models.resnet18(weights=None)
        self.image_model.fc = nn.Identity()
        image_feature_dim = 512

        # --- Clinical branch ---
        self.clinical_model = nn.Sequential(
            nn.Linear(num_clinical_features, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU()
        )

        # --- Fusion layer ---
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
