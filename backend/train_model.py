
from pathlib import Path
import json
import re

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

# Project paths
ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = ROOT / "dataset"
MODEL_DIR = ROOT / "model"
RESULTS_DIR = ROOT / "results"

EMAIL_FILE = DATASET_DIR / "Phishing_Email.csv"
SMS_FILE = DATASET_DIR / "SMSSpamCollection"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def normalize_label(label):
    """Normalize dataset labels into suspicious or legitimate."""
    label = re.sub(r"[^a-z]", "", str(label).lower())

    if label in {"phishingemail", "phishing", "spam"}:
        return 1

    if label in {"safeemail", "safe", "ham", "legitimate", "legitimateemail"}:
        return 0

    return None


# 1. Load the phishing email dataset
print("Loading phishing email dataset...")

emails = pd.read_csv(
    EMAIL_FILE,
    usecols=["Email Text", "Email Type"],
    encoding="utf-8",
    low_memory=False,
)

emails = emails.rename(
    columns={"Email Text": "message", "Email Type": "original_label"}
)

emails["source"] = "email"

# 2. Load the SMS spam dataset
print("Loading SMS dataset...")

sms = pd.read_csv(
    SMS_FILE,
    sep="\t",
    header=None,
    names=["original_label", "message"],
    encoding="utf-8",
)

sms["source"] = "sms"

# 3. Combine the datasets
data = pd.concat(
    [
        emails[["message", "original_label", "source"]],
        sms[["message", "original_label", "source"]],
    ],
    ignore_index=True,
)

data = data.dropna(subset=["message", "original_label"]).copy()
data["message"] = data["message"].astype(str).str.strip()
data["target"] = data["original_label"].apply(normalize_label)

# Report unexpected labels instead of silently assigning incorrect classes
unknown = data[data["target"].isna()]["original_label"].value_counts()

if not unknown.empty:
    print("\nUnrecognized labels found:")
    print(unknown.to_string())
    raise ValueError(
        "Please review the unrecognized labels before training."
    )

data = data[data["message"].ne("")].copy()
data["target"] = data["target"].astype(int)

# Remove duplicate text to reduce duplicate leakage between train and test
data["normalized_message"] = (
    data["message"].str.lower().str.replace(r"\s+", " ", regex=True).str.strip()
)
data = data.drop_duplicates(subset=["normalized_message"]).reset_index(drop=True)

# 4. Inspect dataset balance
print("\n========== DATASET SUMMARY ==========")
print(f"Total messages: {len(data)}")
print(f"Email messages: {(data['source'] == 'email').sum()}")
print(f"SMS messages: {(data['source'] == 'sms').sum()}")
print("\nClass counts:")
print(data["target"].map({0: "legitimate", 1: "suspicious"}).value_counts())

X = data["message"]
y = data["target"]

if y.nunique() != 2 or y.value_counts().min() < 2:
    raise ValueError("Both classes need at least two examples.")

# 5. Split before fitting the vectorizer
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

# 6. Build the NLP and ML pipeline
model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=50000,
            min_df=2,
            sublinear_tf=True,
        ),
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
        ),
    ),
])

# 7. Train
print("\nTraining the combined email and SMS classifier...")
model.fit(X_train, y_train)

# 8. Evaluate on held-out test data
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, zero_division=0)
recall = recall_score(y_test, predictions, zero_division=0)
f1 = f1_score(y_test, predictions, zero_division=0)

report = classification_report(
    y_test,
    predictions,
    labels=[0, 1],
    target_names=["legitimate", "suspicious"],
    zero_division=0,
)

matrix = confusion_matrix(y_test, predictions, labels=[0, 1])

print("\n========== MODEL EVALUATION ==========")
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-score:  {f1:.4f}")
print("\nClassification report:")
print(report)
print("Confusion matrix (rows=actual, columns=predicted):")
print(matrix)

# 9. Save the complete fitted pipeline
model_path = MODEL_DIR / "phishguard_sms_model.joblib"
joblib.dump(model, model_path)

# 10. Save metrics
metrics = {
    "model": "TF-IDF + Logistic Regression",
    "datasets": ["Phishing_Email.csv", "SMSSpamCollection"],
    "task": "Suspicious-message classification",
    "total_messages": int(len(data)),
    "email_messages": int((data["source"] == "email").sum()),
    "sms_messages": int((data["source"] == "sms").sum()),
    "training_messages": int(len(X_train)),
    "test_messages": int(len(X_test)),
    "accuracy": float(accuracy),
    "precision_suspicious": float(precision),
    "recall_suspicious": float(recall),
    "f1_suspicious": float(f1),
    "confusion_matrix": matrix.tolist(),
}

with open(RESULTS_DIR / "evaluation.json", "w", encoding="utf-8") as file:
    json.dump(metrics, file, indent=2)

with open(
    RESULTS_DIR / "classification_report.txt",
    "w",
    encoding="utf-8",
) as file:
    file.write(report)
    file.write("\nConfusion matrix (rows=actual, columns=predicted):\n")
    file.write(str(matrix))

print(f"\nSaved model: {model_path}")
print(f"Saved metrics: {RESULTS_DIR / 'evaluation.json'}")
print("\nTraining and evaluation completed successfully.")
print(
    "Note: This combined classifier predicts suspicious/spam-like messages. "
    "It does not independently verify whether an email is malicious."
)
