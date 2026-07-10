import os
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image

# Label columns from preprocessing
LABEL_COLUMNS = ['label_chd', 'label_ntd', 'label_renal', 'label_abdominal', 'label_cleft']

# Clinical feature order (must match preprocess.py)
FEATURE_ORDER = [
    'age', 'systolic_bp', 'diastolic_bp', 'fundal_height', 'glucose',
    'hemoglobin', 'weight', 'gravida', 'parity', 'gestational_age',
    'family_history', 'prior_loss', 'infection',
    'folic_none', 'folic_first', 'folic_ongoing',
]

class HealthConnectDataset(Dataset):
    def __init__(self, csv_file, image_dir=None, transform=None):
        """
        Args:
            csv_file (str): Path to processed_dataset.csv
            image_dir (str): Directory with ultrasound images (root folder containing subfolders)
            transform (callable, optional): Optional transform to apply to images
        """
        self.data = pd.read_csv(csv_file)
        self.image_dir = image_dir
        # Default transform if none is provided
        self.transform = transform if transform else transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]

        # --- Clinical features (numeric only) ---
        clinical_features = row[FEATURE_ORDER].values.astype('float32')
        clinical_tensor = torch.tensor(clinical_features, dtype=torch.float32)

        # --- Labels (multilabel vector) ---
        labels = row[LABEL_COLUMNS].values.astype('float32')
        labels_tensor = torch.tensor(labels, dtype=torch.float32)

        # --- Image (now uses image_class + image_file) ---
        image_tensor = None
        if self.image_dir is not None and 'image_file' in self.data.columns and 'image_class' in self.data.columns:
            img_path = os.path.join(self.image_dir, row['image_class'], row['image_file'])
            if not os.path.exists(img_path):
                raise FileNotFoundError(f"Image not found: {img_path}")
            image = Image.open(img_path).convert("RGB")
            image_tensor = self.transform(image)  # ✅ always convert to tensor

        # ✅ Return inputs as a tuple
        return (clinical_tensor, image_tensor), labels_tensor


# Example usage
if __name__ == "__main__":
    dataset = HealthConnectDataset(
        csv_file="dataset/processed/processed_dataset.csv",
        image_dir="dataset/processed/images"  # processed images folder
    )

    dataloader = DataLoader(dataset, batch_size=16, shuffle=True)

    # ✅ Unpack as (clinical, image), labels
    for (clinical, image), labels in dataloader:
        print("Clinical:", clinical.shape)
        print("Image:", image.shape if image is not None else None)
        print("Labels:", labels.shape)
        break
