import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import json
import os

# Load the primary dataset (Telco)
df = pd.read_csv("dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv")

# Data Cleaning
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'] = df['TotalCharges'].fillna(df['TotalCharges'].median())

# Dropping ID
df.drop('customerID', axis=1, inplace=True)

# Binary encoding for target
df['Churn'] = df['Churn'].apply(lambda x: 1 if x == 'Yes' else 0)

# Feature Selection for the Web App (to keep it simple and effective)
# We'll use a subset of features that are most impactful
features = ['tenure', 'MonthlyCharges', 'TotalCharges', 'gender', 'SeniorCitizen', 'Partner', 'Dependents', 'MultipleLines', 'InternetService', 'Contract', 'PaymentMethod']

X = df[features].copy()
y = df['Churn']

# Label Encoding for categorical features
encoders = {}
for col in X.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    encoders[col] = {
        'classes': le.classes_.tolist(),
        'encoder': le
    }

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model Training
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model and encoders
joblib.dump(model, 'model/churn_model.pkl')
joblib.dump(features, 'model/feature_names.pkl')

# Save class mappings for the API/Frontend to know what numbers mean
class_mappings = {}
for col, enc_data in encoders.items():
    class_mappings[col] = enc_data['classes']

with open('model/class_mappings.json', 'w') as f:
    json.dump(class_mappings, f)

# Generate some dashboard stats
stats = {
    "total_customers": int(len(df)),
    "churn_rate": float(df['Churn'].mean() * 100),
    "avg_tenure": float(df['tenure'].mean()),
    "avg_monthly_charges": float(df['MonthlyCharges'].mean()),
    "accuracy": float(model.score(X_test, y_test) * 100)
}

with open('frontend/stats.json', 'w') as f:
    json.dump(stats, f)

print(f"Model trained with {stats['accuracy']:.2f}% accuracy")
print("Model and stats saved successfully.")
