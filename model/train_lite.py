import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
import json
import os

# Load the primary dataset (Telco)
df = pd.read_csv("dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv")

# Data Cleaning
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'] = df['TotalCharges'].fillna(df['TotalCharges'].median())
df.drop('customerID', axis=1, inplace=True)
df['Churn'] = df['Churn'].apply(lambda x: 1 if x == 'Yes' else 0)

# Feature Selection
features = ['tenure', 'MonthlyCharges', 'TotalCharges', 'InternetService', 'Contract']
X = df[features].copy()
y = df['Churn']

# Label Encoding for categorical features
encoders = {}
for col in X.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    encoders[col] = le.classes_.tolist()

# Scaling (Crucial for Logistic Regression)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train
model = LogisticRegression()
model.fit(X_scaled, y)

# Export Model for JS
model_data = {
    "coefficients": model.coef_[0].tolist(),
    "intercept": float(model.intercept_[0]),
    "features": features,
    "encoders": encoders,
    "scaler_mean": scaler.mean_.tolist(),
    "scaler_scale": scaler.scale_.tolist(),
    "accuracy": float(model.score(X_scaled, y) * 100)
}

with open('model/model_lite.json', 'w') as f:
    json.dump(model_data, f)

# Stats for dashboard
stats = {
    "total_customers": int(len(df)),
    "churn_rate": float(df['Churn'].mean() * 100),
    "avg_tenure": float(df['tenure'].mean()),
    "avg_monthly_charges": float(df['MonthlyCharges'].mean()),
    "accuracy": model_data["accuracy"]
}

with open('frontend/stats.json', 'w') as f:
    json.dump(stats, f)

print(f"Logistic Model exported: {stats['accuracy']:.2f}% accuracy")
