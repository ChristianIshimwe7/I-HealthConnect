import os
import argparse
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch
from sklearn.metrics import confusion_matrix, roc_curve, auc

LABELS = ["label_chd", "label_ntd", "label_renal", "label_abdominal", "label_cleft"]

def plot_confusion_matrix(y_true, y_pred, labels, save_path):
    cm = confusion_matrix(y_true.argmax(axis=1), y_pred.argmax(axis=1))
    plt.figure(figsize=(6,5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=labels, yticklabels=labels)
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, "confusion_matrix.png"))
    plt.close()

def plot_roc_curves(y_true, y_score, labels, save_path):
    plt.figure(figsize=(7,6))
    for i, label in enumerate(labels):
        fpr, tpr, _ = roc_curve(y_true[:, i], y_score[:, i])
        plt.plot(fpr, tpr, label=f"{label} (AUC={auc(fpr,tpr):.2f})")
    plt.plot([0,1],[0,1],"k--")
    plt.legend()
    plt.title("ROC Curves")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, "roc_curves.png"))
    plt.close()

def plot_feature_heatmap(csv_file, save_path):
    df = pd.read_csv(csv_file)
    plt.figure(figsize=(10,8))
    sns.heatmap(df.corr(), cmap="coolwarm", annot=False)
    plt.title("Feature Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, "feature_heatmap.png"))
    plt.close()

def main(args):
    os.makedirs(args.output, exist_ok=True)

    # Load saved tensors
    y_true = torch.load(os.path.join(args.test_data, "y_true.pt")).numpy()
    y_pred = torch.load(os.path.join(args.test_data, "y_pred.pt")).numpy()
    y_score = torch.load(os.path.join(args.test_data, "y_score.pt")).numpy()

    plot_confusion_matrix(y_true, y_pred, LABELS, args.output)
    plot_roc_curves(y_true, y_score, LABELS, args.output)
    plot_feature_heatmap(args.csv_file, args.output)

    print(f"✅ Visualisations saved in {args.output}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Visualise evaluation results")
    parser.add_argument("--csv_file", type=str, required=True,
                        help="Path to processed_dataset.csv")
    parser.add_argument("--test_data", type=str, required=True,
                        help="Folder containing y_true.pt, y_pred.pt, y_score.pt")
    parser.add_argument("--output", type=str, default="../reports",
                        help="Folder to save visualisations")
    args = parser.parse_args()
    main(args)
