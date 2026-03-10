# ChurnAI | Customer Churn Prediction System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://customer-churn-prediction-ml.vercel.app/)

![Churn Prediction Dashboard](https://raw.githubusercontent.com/MadhuChitikela/customer-churn-prediction-ml/main/screenshot.png)

## 🚀 Overview
ChurnAI is an industry-level predictive analytics system designed to identify customers at high risk of churning. Using machine learning models (Logistic Regression for production deployment), it provides real-time risk assessment and high-fidelity visualizations.

## ✨ Key Features
- **Predictive Analytics**: Real-time churn risk calculation with probability scores.
- **Modern Dashboard**: Glassmorphic UI with dynamic statistics and interactive charts.
- **Vercel Optimized**: Lightweight architecture with model logic distilled into JS for sub-millisecond inference and zero deployment overhead.
- **Telecom Focused**: Trained on Telco customer behavior patterns.

## 🛠️ Tech Stack
- **AI/ML**: Python, Scikit-learn, Logistic Regression.
- **Frontend**: Vanilla JS (ES6+), Chart.js, HTML5, CSS3 (Glassmorphism).
- **Deployment**: Vercel (Edge Functions safe).

## 📁 Project Structure
- `model/`: Contains training scripts and exported model weights.
- `api/`: Vercel-ready API handlers.
- `frontend/`: Dashboard UI and client-side logic.
- `dataset/`: Original datasets used for training.

## ⚙️ How to Run Locally
1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt` (only for model training).
3. Train or Update the model: `python model/train_lite.py`.
4. Run locally using Vercel CLI: `vercel dev`.

## 📈 Model Performance
- **Primary Algorithm**: Logistic Regression (78.8% Accuracy)
- **Features Used**: Tenure, Monthly Charges, Contract Type, Internet Service.

---
Created for [Your Name] Portfolio.
