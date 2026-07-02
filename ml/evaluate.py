import argparse
import torch
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, roc_auc_score, multilabel_confusion_matrix, roc_curve, auc
from torch.utils.data import DataLoader
from load_dataset import HealthConnectDataset
from multimodal_model import MultimodalModel

def evaluate_model(model_path, test_data, output_dir):
    num_clinical_features = 16
    num_classes = 5

    print(f"Using {num_clinical_features} clinical features and {num_classes} output classes")

    # Load dataset
    csv_file = f"{test_data}/processed_dataset.csv"
    dataset = HealthConnectDataset(
        csv_file=csv_file,
        image_dir=f"{test_data}/images"
    )
    loader = DataLoader(dataset, batch_size=32, shuffle=False)

    # Build model
    model = MultimodalModel(num_clinical_features=num_clinical_features,
                            num_classes=num_classes)
    model.load_state_dict(torch.load(model_path))
    model.eval()

    y_true, y_pred, y_score = [], [], []

    with torch.no_grad():
        for inputs, labels in loader:
            clinical, image = inputs
            outputs = model(clinical, image)

            probs = torch.sigmoid(outputs)
            preds = (probs > 0.5).int()

            y_true.append(labels)
            y_pred.append(preds)
            y_score.append(probs)

    y_true = torch.cat(y_true).cpu()
    y_pred = torch.cat(y_pred).cpu()
    y_score = torch.cat(y_score).cpu()

    # Classification report
    print("Classification Report:")
    print(classification_report(
        y_true, y_pred,
        target_names=["label_chd","label_ntd","label_renal","label_abdominal","label_cleft"],
        zero_division=0
    ))
    print("Macro ROC-AUC:", roc_auc_score(y_true, y_score, average="macro"))

    # Save tensors
    torch.save(y_true, f"{output_dir}/y_true.pt")
    torch.save(y_pred, f"{output_dir}/y_pred.pt")
    torch.save(y_score, f"{output_dir}/y_score.pt")
    print(f"✅ Saved evaluation outputs to {output_dir}")

    labels = ["CHD", "NTD", "Renal", "Abdominal", "Cleft"]

    # --- Confusion matrices ---
    conf_matrices = multilabel_confusion_matrix(y_true, y_pred)
    fig, axes = plt.subplots(1, len(labels), figsize=(20, 4))
    for i, cm in enumerate(conf_matrices):
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=axes[i])
        axes[i].set_title(labels[i])
        axes[i].set_xlabel("Predicted")
        axes[i].set_ylabel("True")
    plt.tight_layout()
    plt.show()

    # --- ROC curves ---
    plt.figure(figsize=(8, 6))
    for i, label in enumerate(labels):
        fpr, tpr, _ = roc_curve(y_true[:, i], y_score[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f"{label} (AUC = {roc_auc:.2f})")
    plt.plot([0, 1], [0, 1], "k--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curves")
    plt.legend(loc="lower right")
    plt.show()

    # --- Histograms of label counts ---
    true_counts = y_true.sum(dim=0).numpy()
    pred_counts = y_pred.sum(dim=0).numpy()

    x = range(len(labels))
    width = 0.35

    plt.figure(figsize=(8, 6))
    plt.bar(x, true_counts, width, label="True", color="skyblue")
    plt.bar([i + width for i in x], pred_counts, width, label="Predicted", color="orange")
    plt.xticks([i + width/2 for i in x], labels)
    plt.ylabel("Count")
    plt.title("True vs Predicted Label Counts")
    plt.legend()
    plt.show()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate multimodal model")
    parser.add_argument("--input", type=str, required=True,
                        help="Path to trained model (.pth)")
    parser.add_argument("--test_data", type=str, required=True,
                        help="Path to test dataset folder")
    parser.add_argument("--output", type=str, default="dataset/processed",
                        help="Folder to save evaluation outputs")
    args = parser.parse_args()

    evaluate_model(args.input, args.test_data, args.output)
