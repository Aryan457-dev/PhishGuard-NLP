
from pathlib import Path
import json

import joblib
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PROJECT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_DIR / "model" / "phishguard_sms_model.joblib"
METRICS_PATH = PROJECT_DIR / "results" / "evaluation.json"
EMAIL_METRICS_PATH = PROJECT_DIR / "results" / "email_evaluation.json"
SMS_METRICS_PATH = PROJECT_DIR / "results" / "sms_evaluation.json"

model = joblib.load(MODEL_PATH)

MODEL_TYPE = "TF-IDF + Logistic Regression"
MODEL_SCOPE = "Combined email and SMS suspicious-message classification"


@app.get("/")
def home():
    return jsonify({
        "message": "PhishGuard NLP API",
        "status": "running",
        "model": MODEL_TYPE,
        "scope": MODEL_SCOPE,
    })


@app.get("/api/health")
def health():
    return jsonify({"status": "healthy"})


@app.post("/api/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({
            "error": "Please provide a non-empty message."
        }), 400

    if len(message) > 10000:
        return jsonify({
            "error": "Message is too long. Maximum 10000 characters."
        }), 400

    prediction = int(model.predict([message])[0])
    probabilities = model.predict_proba([message])[0]
    suspicious_probability = float(probabilities[1])

    return jsonify({
        "prediction": "spam" if prediction == 1 else "ham",
        "label": (
            "Potentially suspicious"
            if prediction == 1
            else "Likely legitimate"
        ),
        "spam_probability": round(suspicious_probability, 4),
        "model_type": MODEL_TYPE,
        "scope": MODEL_SCOPE,
    })


@app.get("/api/metrics")
def get_metrics():
    if not METRICS_PATH.exists():
        return jsonify({
            "error": "Metrics file not found. Run train_model.py first."
        }), 404

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as file:
            metrics = json.load(file)

        return jsonify(metrics)

    except (json.JSONDecodeError, OSError) as error:
        return jsonify({
            "error": f"Could not read metrics: {error}"
        }), 500


@app.get("/api/metrics/datasets")
def get_dataset_metrics():
    if not EMAIL_METRICS_PATH.exists() or not SMS_METRICS_PATH.exists():
        return jsonify({
            "error": (
                "Separate evaluation files not found. "
                "Run evaluate_datasets.py first."
            )
        }), 404

    try:
        with open(EMAIL_METRICS_PATH, "r", encoding="utf-8") as file:
            email_metrics = json.load(file)

        with open(SMS_METRICS_PATH, "r", encoding="utf-8") as file:
            sms_metrics = json.load(file)

        return jsonify({
            "email": email_metrics,
            "sms": sms_metrics,
        })

    except (json.JSONDecodeError, OSError) as error:
        return jsonify({
            "error": f"Could not read dataset metrics: {error}"
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
