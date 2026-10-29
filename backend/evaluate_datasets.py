
from pathlib import Path
import json

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

# --------------------------------------------------
# PATHS AND SETTINGS
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_DIR / "dataset"
RESULTS_DIR = PROJECT_DIR / "results"

EMAIL_DATASET = DATASET_DIR / "Phishing_Email.csv"
SMS_DATASET = DATASET_DIR / "SMSSpamCollection"

RESULTS_DIR.mkdir(parents=True, exist_ok=True)

TEST_SIZE = 0.20
RANDOM_STATE = 42


# --------------------------------------------------
# LOAD EMAIL DATASET
# --------------------------------------------------

def load_email_dataset():
    print("\nLoading phishing email dataset...")

    if not EMAIL_DATASET.exists():
        raise FileNotFoundError(
            f"Email dataset not found: {EMAIL_DATASET}"
        )

    df = pd.read_csv(EMAIL_DATASET, low_memory=False)

    required_columns = {"Email Text", "Email Type"}

    if not required_columns.issubset(df.columns):
        raise ValueError(
            "Email CSV must contain these columns: "
            "'Email Text' and 'Email Type'. "
            f"Found: {list(df.columns)}"
        )

    df = df[["Email Text", "Email Type"]].copy()
    df.columns = ["text", "original_label"]

    df["text"] = df["text"].fillna("").astype(str).str.strip()
    df["original_label"] = (
        df["original_label"]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.lower()
    )

    # 0 = legitimate email, 1 = phishing email
    label_map = {
        "safe email": 0,
        "safeemail": 0,
        "legitimate": 0,
        "legitimate email": 0,
        "phishing email": 1,
        "phishing": 1,
    }

    df["target"] = df["original_label"].map(label_map)

    # Remove missing text, empty messages, and unknown labels.
    df = df[
        (df["text"] != "")
        & df["target"].notna()
    ].copy()

    df["target"] = df["target"].astype(int)

    if df["target"].nunique() != 2:
        raise ValueError(
            "Email dataset must contain both legitimate and "
            "phishing labels. Check the Email Type column."
        )

    print(f"Email records loaded: {len(df)}")
    print("Email class counts:")
    print(
        df["target"]
        .map({0: "legitimate", 1: "phishing"})
        .value_counts()
        .to_string()
    )

    return df[["text", "target"]]


# --------------------------------------------------
# LOAD SMS DATASET
# --------------------------------------------------

def load_sms_dataset():
    print("\nLoading SMS spam dataset...")

    if not SMS_DATASET.exists():
        raise FileNotFoundError(
            f"SMS dataset not found: {SMS_DATASET}"
        )

    df = pd.read_csv(
        SMS_DATASET,
        sep="\t",
        header=None,
        names=["original_label", "text"],
        encoding="utf-8",
        on_bad_lines="warn",
    )

    df["text"] = df["text"].fillna("").astype(str).str.strip()

    df["original_label"] = (
        df["original_label"]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.lower()
    )

    # 0 = ham (legitimate SMS), 1 = spam SMS
    label_map = {
        "ham": 0,
        "spam": 1,
    }

    df["target"] = df["original_label"].map(label_map)

    df = df[
        (df["text"] != "")
        & df["target"].notna()
    ].copy()

    df["target"] = df["target"].astype(int)

    if df["target"].nunique() != 2:
        raise ValueError(
            "SMS dataset must contain both ham and spam labels."
        )

    print(f"SMS records loaded: {len(df)}")
    print("SMS class counts:")
    print(
        df["target"]
        .map({0: "ham", 1: "spam"})
        .value_counts()
        .to_string()
    )

    return df[["text", "target"]]


# --------------------------------------------------
# BUILD THE NLP CLASSIFIER
# --------------------------------------------------

def build_model():
    return Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                strip_accents="unicode",
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
                random_state=RANDOM_STATE,
            ),
        ),
    ])


# --------------------------------------------------
# TRAIN AND EVALUATE ONE DATASET
# --------------------------------------------------

def evaluate_dataset(dataset_name, df, class_names, output_name):
    print("\n" + "=" * 60)
    print(f"EVALUATING: {dataset_name.upper()}")
    print("=" * 60)

    X = df["text"]
    y = df["target"]

    # Keep the test data separate from model training.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    model = build_model()

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print("Training TF-IDF + Logistic Regression...")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(
        y_test, predictions, pos_label=1, zero_division=0
    )
    recall = recall_score(
        y_test, predictions, pos_label=1, zero_division=0
    )
    f1 = f1_score(
        y_test, predictions, pos_label=1, zero_division=0
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=[0, 1],
    )

    report = classification_report(
        y_test,
        predictions,
        labels=[0, 1],
        target_names=class_names,
        zero_division=0,
        output_dict=True,
    )

    print("\n---------- RESULTS ----------")
    print(f"Accuracy:  {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"Precision: {precision:.4f} ({precision * 100:.2f}%)")
    print(f"Recall:    {recall:.4f} ({recall * 100:.2f}%)")
    print(f"F1-score:  {f1:.4f} ({f1 * 100:.2f}%)")

    print("\nClassification report:")
    print(
        classification_report(
            y_test,
            predictions,
            labels=[0, 1],
            target_names=class_names,
            zero_division=0,
        )
    )

    print("Confusion matrix (rows=actual, columns=predicted):")
    print(matrix)

    results = {
        "dataset": dataset_name,
        "model": "TF-IDF + Logistic Regression",
        "positive_class": class_names[1],
        "test_size": TEST_SIZE,
        "random_state": RANDOM_STATE,
        "total_messages": int(len(df)),
        "training_messages": int(len(X_train)),
        "test_messages": int(len(X_test)),
        "class_counts": {
            class_names[0]: int((y == 0).sum()),
            class_names[1]: int((y == 1).sum()),
        },
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": matrix.tolist(),
        "classification_report": report,
    }

    output_path = RESULTS_DIR / output_name

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(results, file, indent=2)

    print(f"\nSaved evaluation: {output_path}")

    return results


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():
    email_df = load_email_dataset()
    sms_df = load_sms_dataset()

    email_results = evaluate_dataset(
        dataset_name="Phishing Email Dataset",
        df=email_df,
        class_names=["legitimate", "phishing"],
        output_name="email_evaluation.json",
    )

    sms_results = evaluate_dataset(
        dataset_name="SMS Spam Dataset",
        df=sms_df,
        class_names=["ham", "spam"],
        output_name="sms_evaluation.json",
    )

    print("\n" + "=" * 60)
    print("FINAL COMPARISON")
    print("=" * 60)

    print(
        f"{'Metric':<15}"
        f"{'Email':>15}"
        f"{'SMS':>15}"
    )

    print("-" * 45)

    for metric, label in [
        ("accuracy", "Accuracy"),
        ("precision", "Precision"),
        ("recall", "Recall"),
        ("f1_score", "F1-score"),
    ]:
        email_value = email_results[metric] * 100
        sms_value = sms_results[metric] * 100

        print(
            f"{label:<15}"
            f"{email_value:>14.2f}%"
            f"{sms_value:>14.2f}%"
        )

    print("\nBoth independent evaluations completed successfully.")
    print("Results saved in the PhishGuard/results folder.")


if __name__ == "__main__":
    main()
