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

## ⚙️ Deployment & Live Demo

The project is fully hosted on **Vercel** and does not require any local server to be running.

### **Live URL**
- **[https://customer-churn-prediction-ml.vercel.app/](https://customer-churn-prediction-ml.vercel.app/)**

### **How it Works**
- The frontend is served as a static site.
- The backend is a **Vercel Serverless Function** located in `/api/predict.js`.
- Predictions are calculated on the fly in the cloud using the pre-trained ML models in the `/model` directory.

## 📈 Model Performance
- **Primary Algorithm**: Logistic Regression (78.8% Accuracy)
- **Features Used**: Tenure, Monthly Charges, Contract Type, Internet Service.

---
Created for [Your Name] Portfolio.
