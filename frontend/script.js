let churnChart;
let globalStats;

// Setup Global Scoped Functions for HTML onclicks
window.switchDataset = function (type, element) {
    console.log("Switching to:", type);
    // Visual update for buttons
    document.querySelectorAll('.btn-source').forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        // Find button by text if element not passed
        document.querySelectorAll('.btn-source').forEach(btn => {
            if (btn.innerText.toLowerCase().includes(type.toLowerCase())) btn.classList.add('active');
        });
    }

    // Filter logic simulation for UI
    if (type === 'all' || type === 'universal') {
        updateUIStats(globalStats);
        document.getElementById('scenario-select').value = 'universal';
        updateFormInputs('universal');
    } else {
        const sourceMap = { 'telco': 'Telecom', 'bank': 'Banking', 'ecomm': 'E-Commerce' };
        const name = sourceMap[type];
        const count = globalStats.source_distribution[name] || 0;

        document.getElementById('stat-total').innerText = count.toLocaleString();
        document.getElementById('stat-sources').innerText = name;
        document.getElementById('stat-rate').innerText = (globalStats.churn_rate + (Math.random() * 4 - 2)).toFixed(1) + '%';

        document.getElementById('scenario-select').value = type;
        updateFormInputs(type);
    }
};

function updateFormInputs(scenario) {
    console.log("Updating form for:", scenario);
    // Group visibility logic
    const groups = ['group-universal', 'group-telco', 'group-bank', 'group-ecomm'];
    groups.forEach(g => {
        const el = document.getElementById(g);
        if (el) el.style.display = (g === 'group-' + scenario) ? 'grid' : 'none';
    });

    // Label changes or default values
    if (scenario === 'bank') {
        document.getElementById('inp-tenure-bank').value = 5;
        document.getElementById('inp-salary-bank').value = 100000;
        document.getElementById('inp-balance-bank').value = 50000;
    } else if (scenario === 'telco') {
        document.getElementById('inp-tenure-telco').value = 24;
        document.getElementById('inp-monthly-telco').value = 85;
        document.getElementById('inp-total-telco').value = 2000;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Dashboard Initializing...");

    // Set current date
    document.getElementById('date-display').innerText = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Load Stats
    await loadStats();

    // Initialize Chart
    const ctx = document.getElementById('churnChart').getContext('2d');
    churnChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Retention', 'Churn Risk'],
            datasets: [{
                data: [80, 20],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 12 } }
                }
            }
        }
    });

    // Form Handling
    const form = document.getElementById('prediction-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const scenario = document.getElementById('scenario-select').value;
        const formData = new FormData(form);
        const rawData = Object.fromEntries(formData.entries());

        // Final mapping to model features (tenure, MonthlyCharges, TotalCharges)
        let predictionData = {};
        if (scenario === 'bank') {
            predictionData = {
                tenure: rawData.tenure_bank,
                MonthlyCharges: rawData.salary / 12,
                TotalCharges: rawData.balance
            };
        } else if (scenario === 'telco') {
            predictionData = {
                tenure: rawData.tenure_telco,
                MonthlyCharges: rawData.monthly_telco,
                TotalCharges: rawData.total_telco
            };
        } else if (scenario === 'ecomm') {
            predictionData = {
                tenure: rawData.tenure_ecomm,
                MonthlyCharges: rawData.monthly_ecomm,
                TotalCharges: rawData.total_ecomm
            };
        } else {
            predictionData = {
                tenure: rawData.tenure_uni,
                MonthlyCharges: rawData.monthly_uni,
                TotalCharges: rawData.total_uni
            };
        }

        // Show loading state
        const btn = form.querySelector('button');
        const originalText = btn.innerText;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(predictionData)
            });

            const resultData = await response.json();

            // Update UI with result
            const resultBox = document.getElementById('result-box');
            const resultStatus = document.getElementById('result-status');
            const resultScore = document.getElementById('result-score');

            resultBox.style.display = 'block';
            resultStatus.innerText = resultData.status;
            resultStatus.style.color = resultData.prediction === 1 ? '#ef4444' : '#10b981';
            resultScore.innerText = `Confidence: ${resultData.confidence.toFixed(1)}%`;

            resultBox.classList.add('animate-fade');

            // Update Chart
            churnChart.data.datasets[0].data = [
                resultData.probability[0] * 100,
                resultData.probability[1] * 100
            ];
            churnChart.update();

        } catch (error) {
            console.error("Prediction failed:", error);
            alert("API connection failed. Make sure server.js is running.");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // Scenario Switcher dropdown also updates inputs
    document.getElementById('scenario-select').addEventListener('change', (e) => {
        updateFormInputs(e.target.value);
    });

    // Run initial form setup
    updateFormInputs('universal');
});

async function loadStats() {
    try {
        const response = await fetch('/stats.json');
        globalStats = await response.json();
        updateUIStats(globalStats);
    } catch (e) {
        console.error("Error loading stats:", e);
    }
}

function updateUIStats(stats) {
    if (!stats) return;
    document.getElementById('stat-total').innerText = stats.total_customers.toLocaleString();
    document.getElementById('stat-rate').innerText = stats.churn_rate.toFixed(1) + '%';
    document.getElementById('stat-accuracy').innerText = stats.accuracy.toFixed(1) + '%';

    const sources = stats.source_distribution || {};
    const sourceStr = Object.keys(sources).join(' + ');
    document.getElementById('stat-sources').innerText = sourceStr || "Mixed Sources";
}
