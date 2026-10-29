# 🛡️ PhishGuard-NLP
### NLP-Based Phishing Email and SMS Detection System

PhishGuard-NLP is a machine learning-based web application that analyzes email and SMS messages to identify potentially suspicious or spam content. It uses Natural Language Processing (NLP), TF-IDF vectorization, and Logistic Regression to classify messages as **Spam/Suspicious** or **Ham/Legitimate**.

The project combines a React-based frontend with a Flask backend to provide an interactive interface for message analysis, prediction confidence, analysis history, and model performance evaluation.

---

## ✨ Features

- **Message Scanner:** Analyze email or SMS text for potential spam and phishing indicators.
- **NLP-Based Classification:** Converts text into numerical features using TF-IDF.
- **Machine Learning Prediction:** Uses Logistic Regression to classify messages.
- **Prediction Confidence:** Displays the model's estimated spam probability.
- **Dashboard:** Provides an overview of message analysis and detection results.
- **Analysis History:** Stores previous scans in browser local storage.
- **Model Performance:** Displays accuracy, precision, recall, F1-score, and confusion matrices.
- **Dataset-Specific Evaluation:** Shows separate evaluation results for email and SMS datasets.
- **REST API:** Flask endpoints connect the frontend to the trained model.

---

## 🧰 Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend and machine learning |
| Flask | REST API |
| Scikit-learn | TF-IDF vectorization and Logistic Regression |
| Pandas | Dataset processing |
| Joblib | Saving and loading the trained model |
| React | Frontend user interface |
| Vite | Frontend development server and build tool |
| Tailwind CSS | UI styling |
| Lucide React | Interface icons |
| Git and GitHub | Version control and project hosting |

---

## 🏗️ System Architecture

```text
                 User
                   |
                   v
          React Web Interface
                   |
                   v
             Flask REST API
                   |
                   v
          Text Preprocessing
                   |
                   v
             TF-IDF Vectorizer
                   |
                   v
          Logistic Regression
                   |
                   v
        Spam / Ham Classification
                   |
                   v
       Prediction and Probability
                   |
                   v
          Results in the UI
```

---

## 🤖 Machine Learning Approach

### 1. Dataset Preparation

The project uses separate datasets for email and SMS classification:

- **Email dataset:** `dataset/Phishing_Email.csv`
- **SMS dataset:** `dataset/SMSSpamCollection`

The datasets contain labeled examples used to train and evaluate the classification models.

### 2. TF-IDF Vectorization

Term Frequency–Inverse Document Frequency (TF-IDF) converts text into numerical feature vectors. It gives importance to words based on their frequency in a message and how informative they are across the dataset.

The training configuration uses unigram and bigram features, with a maximum vocabulary size of 50,000 features.

### 3. Logistic Regression

Logistic Regression learns patterns from labeled messages and estimates the probability of a message belonging to the suspicious or spam class.

The trained model predicts one of two classes:

- **Spam:** A potentially suspicious or unwanted message.
- **Ham:** A legitimate or non-spam message.

> Note: The model's spam probability is a classification estimate, not a guarantee that a message is malicious or safe.

---

## 📊 Model Evaluation

The combined model was evaluated using a held-out test dataset.

### Combined Model Results

| Metric | Score |
|---|---:|
| Accuracy | 97.35% |
| Precision (Suspicious) | 96.47% |
| Recall (Suspicious) | 95.13% |
| F1-Score (Suspicious) | 95.79% |
| Total Messages | 22,671 |
| Training Messages | 18,136 |
| Test Messages | 4,535 |

### Separate Dataset Evaluation

| Metric | Email Model | SMS Model |
|---|---:|---:|
| Accuracy | 96.65% | 96.86% |
| Precision (Phishing/Spam) | 95.08% | 100.00% |
| Recall (Phishing/Spam) | 96.44% | 76.51% |
| F1-Score (Phishing/Spam) | 95.76% | 86.69% |

**Important:** The combined-model results and the separate email/SMS results come from different evaluation setups. The separate models are independently trained for evaluation and should not be confused with the combined model used by the live scanner.

---

## 📁 Project Structure

```text
PhishGuard/
├── backend/
│   ├── app.py
│   ├── train_model.py
│   └── evaluate_datasets.py
├── dataset/
│   ├── Phishing_Email.csv
│   └── SMSSpamCollection
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── ...
├── model/
│   └── phishguard_sms_model.joblib
├── results/
│   ├── evaluation.json
│   ├── email_evaluation.json
│   └── sms_evaluation.json
├── .gitignore
└── README.md
```

*The structure above describes the main project files; individual files may vary with your local setup.*

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Python 3
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Aryan457-dev/PhishGuard-NLP.git
cd PhishGuard-NLP
```

### 2. Set up the Python backend

Create a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the required Python packages:

```bash
pip install flask flask-cors pandas scikit-learn joblib
```

If the project includes a `requirements.txt` file, use this instead:

```bash
pip install -r requirements.txt
```

### 3. Start the backend

From the project root, run:

```bash
python3 backend/app.py
```

The Flask backend should be available at:

```text
http://127.0.0.1:5000
```

### 4. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Keep both terminals running while using the application.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API status and model information |
| GET | `/api/health` | Backend health check |
| POST | `/api/analyze` | Analyze a message and return its classification |
| GET | `/api/metrics` | Retrieve combined model evaluation metrics |
| GET | `/api/metrics/datasets` | Retrieve separate email and SMS evaluation metrics |

### Example: Analyze a Message

**Request**

```http
POST /api/analyze
Content-Type: application/json
```

```json
{
  "message": "Congratulations! You have won a prize. Click the link to claim it."
}
```

The API returns a classification label, spam probability, and model information. Exact response fields depend on the backend implementation.

---

## 🧪 Evaluation Metrics Explained

- **Accuracy:** Percentage of all test messages classified correctly.
- **Precision:** Percentage of messages predicted as suspicious that are actually suspicious.
- **Recall:** Percentage of actual suspicious messages detected by the model.
- **F1-Score:** Harmonic mean of precision and recall.
- **Confusion Matrix:** Shows correct and incorrect predictions for each class.

These metrics help assess the model's classification performance on the evaluation datasets.

---

## 🔮 Future Improvements

- Improve detection of phishing URLs and suspicious links.
- Expand training data with more diverse and recent messages.
- Explore additional classification algorithms and compare their performance.
- Add stronger input validation and security controls.
- Deploy the application to a cloud platform.
- Add automated model evaluation and retraining workflows.

---

## ⚠️ Limitations

- Predictions depend on the quality and coverage of the training datasets.
- Unseen wording, new phishing techniques, and obfuscated messages may be misclassified.
- High evaluation accuracy does not guarantee detection of every malicious message.
- The application should be used as a decision-support tool, not as the sole basis for security decisions.

---

## 👨‍💻 Author

**Aryan Dabholkar**

GitHub: [@Aryan457-dev](https://github.com/Aryan457-dev)

Project Repository: [PhishGuard-NLP](https://github.com/Aryan457-dev/PhishGuard-NLP)

---

## 📄 License

A license has not been specified. Add a license file if you intend to define the terms under which others may use, modify, and distribute this project.

