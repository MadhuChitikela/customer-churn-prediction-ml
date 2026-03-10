const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const data = req.body;

        // Load model data
        const modelPath = path.join(process.cwd(), 'model', 'model_lite.json');
        if (!fs.existsSync(modelPath)) {
            throw new Error("Model file not found at " + modelPath);
        }
        const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));

        const { coefficients, intercept, features, encoders, scaler_mean, scaler_scale } = model;

        // Pre-process and Scale input
        let x_input = [];
        features.forEach((feat, i) => {
            let val = data[feat];

            // Handle common field name aliases
            if (val === undefined) {
                if (feat === 'tenure' && data['tenure_bank']) val = data['tenure_bank'];
                if (feat === 'MonthlyCharges' && data['salary']) val = data['salary'] / 12;
            }

            // Encode categorical (if any in lite model)
            if (encoders && encoders[feat]) {
                const classes = encoders[feat];
                val = classes.indexOf(val);
                if (val === -1) val = 0; // Default
            }

            // Convert to numeric
            val = parseFloat(val) || 0;

            // Scale
            const scaled_val = (val - scaler_mean[i]) / scaler_scale[i];
            x_input.push(scaled_val);
        });

        // Dot product
        let z = intercept;
        for (let i = 0; i < x_input.length; i++) {
            z += x_input[i] * coefficients[i];
        }

        // Sigmoid function
        const probability = 1 / (1 + Math.exp(-z));
        const prediction = probability > 0.5 ? 1 : 0;

        res.status(200).json({
            prediction: prediction,
            probability: [1 - probability, probability],
            status: prediction === 1 ? "⚠️ High Churn Risk" : "✅ Low Churn Risk",
            confidence: (prediction === 1 ? probability : (1 - probability)) * 100
        });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
