import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms

from load_dataset import HealthConnectDataset
from multimodal_model import MultimodalModel
import os

def train_model(csv_file, image_dir, num_clinical_features, num_classes, epochs=10, batch_size=32, lr=1e-3):
    # --- Data transforms for images ---
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])

    # --- Dataset & DataLoader ---
    dataset = HealthConnectDataset(csv_file=csv_file, image_dir=image_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # --- Model, Loss, Optimizer ---
    model = MultimodalModel(num_clinical_features=num_clinical_features, num_classes=num_classes)
    criterion = nn.BCEWithLogitsLoss()   # ✅ multi-label loss
    optimizer = optim.Adam(model.parameters(), lr=lr)

    # --- Training loop ---
    for epoch in range(epochs):
        model.train()
        running_loss, correct, total = 0.0, 0, 0

        # ✅ Correct unpacking: dataset returns ((clinical, image), labels)
        for (clinical, images), labels in dataloader:
            optimizer.zero_grad()
            outputs = model(clinical, images)   # shape: [batch, num_classes]
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

            # ✅ Multi-label accuracy (threshold at 0.5)
            preds = (torch.sigmoid(outputs) > 0.5).float()
            correct += (preds == labels).sum().item()
            total += labels.numel()

        epoch_loss = running_loss / len(dataloader)
        epoch_acc = correct / total
        print(f"Epoch {epoch+1}/{epochs} | Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.4f}")

    print("✅ Training complete.")

    # --- Save model weights ---
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/ihealth_multimodal.pth")
    print("💾 Model saved → models/ihealth_multimodal.pth")

    return model


if __name__ == "__main__":
    # Example run
    model = train_model(
        csv_file="dataset/processed/processed_dataset.csv",
        image_dir="dataset/ultrasound_images",
        num_clinical_features=16,   # adjust to match your CSV
        num_classes=5,              # ✅ 5 anomaly labels
        epochs=20,
        batch_size=32,
        lr=1e-3
    )
