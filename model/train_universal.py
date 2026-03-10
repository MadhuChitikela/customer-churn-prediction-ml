import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
import json
import os

def load_and_preprocess():
    print("Loading and Merging 3 Datasets...")
    
    # 1. Telco Dataset
    df_telco = pd.read_csv("dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv")
    df_telco['TotalCharges'] = pd.to_numeric(df_telco['TotalCharges'], errors='coerce')
    df_telco['TotalCharges'] = df_telco['TotalCharges'].fillna(df_telco['TotalCharges'].median())
    df_telco['Churn'] = df_telco['Churn'].apply(lambda x: 1 if x == 'Yes' else 0)
    # Map consistent columns
    telco_features = df_telco[['tenure', 'MonthlyCharges', 'TotalCharges', 'Churn']].copy()
    telco_features['Source'] = 'Telecom'

    # 2. Bank Churn Dataset
    df_bank = pd.read_csv("dataset/Churn_Modelling.csv")
    # Mapping: EstimatedSalary -> MonthlyCharges (approx), Balance -> TotalCharges (approx)
    bank_features = pd.DataFrame()
    bank_features['tenure'] = df_bank['Tenure']
    bank_features['MonthlyCharges'] = df_bank['EstimatedSalary'] / 12
    bank_features['TotalCharges'] = df_bank['Balance']
    bank_features['Churn'] = df_bank['Exited']
    bank_features['Source'] = 'Banking'

    # 3. E-Commerce Dataset (Excel)
    df_ecomm = pd.read_excel("dataset/E Commerce Dataset.xlsx", sheet_name='E Comm')
    # Column names in Ecomm: 'Tenure', 'MonthlyShiftAmount' (approx for charges)
    ecomm_features = pd.DataFrame()
    ecomm_features['tenure'] = df_ecomm['Tenure'].fillna(df_ecomm['Tenure'].median())
    ecomm_features['MonthlyCharges'] = df_ecomm['CashbackAmount'].fillna(df_ecomm['CashbackAmount'].median()) * 5 # Proxy
    ecomm_features['TotalCharges'] = ecomm_features['MonthlyCharges'] * ecomm_features['tenure']
    ecomm_features['Churn'] = df_ecomm['Churn']
    ecomm_features['Source'] = 'E-Commerce'

    # Merge all
    df_merged = pd.concat([telco_features, bank_features, ecomm_features], ignore_index=True)
    
    # Final cleanup
    df_merged = df_merged.dropna()
    
    # Export stats for UI
    stats = {
        "total_customers": int(len(df_merged)),
        "churn_rate": float(df_merged['Churn'].mean() * 100),
        "avg_tenure": float(df_merged['tenure'].mean()),
        "avg_monthly_charges": float(df_merged['MonthlyCharges'].mean()),
        "source_distribution": df_merged['Source'].value_counts().to_dict()
    }
    
    return df_merged, stats

# Feature Selection
features_to_use = ['tenure', 'MonthlyCharges', 'TotalCharges']

df, stats = load_and_preprocess()
X = df[features_to_use]
y = df['Churn']

# Scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train Universal Model
model = LogisticRegression()
model.fit(X_scaled, y)

# Export for JS
model_data = {
    "coefficients": model.coef_[0].tolist(),
    "intercept": float(model.intercept_[0]),
    "features": features_to_use,
    "encoders": {}, # None needed for these numeric features
    "scaler_mean": scaler.mean_.tolist(),
    "scaler_scale": scaler.scale_.tolist(),
    "accuracy": float(model.score(X_scaled, y) * 100)
}

stats["accuracy"] = model_data["accuracy"]

# Save
with open('model/model_lite.json', 'w') as f:
    json.dump(model_data, f)

with open('stats.json', 'w') as f:
    json.dump(stats, f)

print(f"Universal Model trained on 3 datasets! Accuracy: {stats['accuracy']:.2f}%")
