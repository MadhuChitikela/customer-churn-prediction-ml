from http.server import BaseHTTPRequestHandler
import json
import joblib
import pandas as pd
import numpy as np
import os

# Load model and features once at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'churn_model.pkl')
FEATURES_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'feature_names.pkl')
MAPPINGS_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'class_mappings.json')

model = joblib.load(MODEL_PATH)
features = joblib.load(FEATURES_PATH)
with open(MAPPINGS_PATH, 'r') as f:
    class_mappings = json.load(f)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        # Create a DataFrame for prediction
        # We need to ensure all features are present and encoded correctly
        input_df = pd.DataFrame([data])
        
        # Fill missing features with defaults (0 or most common)
        for col in features:
            if col not in input_df.columns:
                input_df[col] = 0

        # Encode categorical features if they are strings
        for col, classes in class_mappings.items():
            if col in input_df.columns and isinstance(input_df[col][0], str):
                try:
                    val = input_df[col][0]
                    if val in classes:
                        input_df[col] = classes.index(val)
                    else:
                        input_df[col] = 0 # Default if unknown
                except:
                    input_df[col] = 0

        # Reorder columns to match training
        input_df = input_df[features]

        # Predict
        prediction = model.predict(input_df)[0]
        probability = model.predict_proba(input_df)[0].tolist()

        result = {
            "prediction": int(prediction),
            "probability": probability,
            "status": "Churn Risk" if prediction == 1 else "No Churn Risk"
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
        return
