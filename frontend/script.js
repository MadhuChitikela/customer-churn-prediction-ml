let churnChart;
let globalStats;

// Setup Global Scoped Functions for HTML onclicks
window.switchDataset = function (type, element) {
    console.log("Switching Dataset To:", type);

    // Logic for button visuals
    document.querySelectorAll('.btn-source').forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    // Logic for Stats card updates
    if (!globalStats) return;

    if (type === 'all' || type === 'universal') {
        updateUIStats(globalStats);
        updateFormInputs('universal');
        const scEl = document.getElementById('scenario-select');
        if (scEl) scEl.value = 'universal';
    } else {
        const sourceMap = { 'telco': 'Telecom', 'bank': 'Banking', 'ecomm': 'E-Commerce' };
        const name = sourceMap[type];
        const count = globalStats.source_distribution[name] || 0;

        document.getElementById('stat-total').innerText = count.toLocaleString();
        document.getElementById('stat-sources').innerText = name;

        // Slightly vary churn rate for different sources for realism
        const baseRate = globalStats.churn_rate;
        const variety = { 'telco': 5.2, 'bank': -2.1, 'ecomm': 1.5 };
        document.getElementById('stat-rate').innerText = (baseRate + (variety[type] || 0)).toFixed(1) + '%';

        updateFormInputs(type);
        const scEl = document.getElementById('scenario-select');
        if (scEl) scEl.value = type;
    }
};

function updateFormInputs(scenario) {
    console.log("Showing Inputs For:", scenario);
    // Group visibility logic
    const groups = ['group-universal', 'group-telco', 'group-bank', 'group-ecomm'];
    groups.forEach(g => {
        const el = document.getElementById(g);
        if (el) {
            el.style.display = (g === 'group-' + scenario) ? 'grid' : 'none';
        }
    });

    // Label or specific values logic
    if (scenario === 'bank') {
        const t = document.getElementById('inp-tenure-bank');
        if (t && t.value === "") t.value = 5;
    } else if (scenario === 'telco') {
        const t = document.getElementById('inp-tenure-telco');
        if (t && t.value === "") t.value = 24;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing ChurnAI Dashboard components...");

    // Set current date
    const dDisplay = document.getElementById('date-display');
    if (dDisplay) {
        dDisplay.innerText = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Load Stats from the server
    try {
        const response = await fetch('/stats.json');
        globalStats = await response.json();
        updateUIStats(globalStats);
    } catch (e) {
        console.warn("Could not load stats.json. Data cards will be empty.", e);
    }

    // Initialize Chart
    const ctxEl = document.getElementById('churnChart');
    if (ctxEl) {
        const ctx = ctxEl.getContext('2d');
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
    }

    // Form Prediction Logic
    const form = document.getElementById('prediction-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const scenario = document.getElementById('scenario-select').value;
            const formData = new FormData(form);
            const rawData = Object.fromEntries(formData.entries());

            // Map inputs to the backend features (tenure, MonthlyCharges, TotalCharges)
            let pData = {};
            if (scenario === 'bank') {
                pData = {
                    tenure: rawData.tenure_bank,
                    MonthlyCharges: rawData.salary / 12,
                    TotalCharges: rawData.balance
                };
            } else if (scenario === 'telco') {
                pData = {
                    tenure: rawData.tenure_telco,
                    MonthlyCharges: rawData.monthly_telco,
                    TotalCharges: rawData.total_telco
                };
            } else if (scenario === 'ecomm') {
                pData = {
                    tenure: rawData.tenure_ecomm,
                    MonthlyCharges: rawData.monthly_ecomm,
                    TotalCharges: rawData.total_ecomm
                };
            } else {
                pData = {
                    tenure: rawData.tenure_uni,
                    MonthlyCharges: rawData.monthly_uni,
                    TotalCharges: rawData.total_uni
                };
            }

            // Display loading status
            const btn = form.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Analysis...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pData)
                });

                const resultData = await response.json();

                // Update result display
                const resBox = document.getElementById('result-box');
                const resStatus = document.getElementById('result-status');
                const resScore = document.getElementById('result-score');

                if (resBox && resStatus && resScore) {
                    resBox.style.display = 'block';
                    resStatus.innerText = resultData.status || "Completed";
                    resStatus.style.color = resultData.prediction === 1 ? '#ef4444' : '#10b981';
                    resScore.innerText = `Confidence: ${(resultData.confidence || 0).toFixed(1)}%`;
                    resBox.classList.remove('animate-fade');
                    void resBox.offsetWidth; // Trigger reflow for re-animation
                    resBox.classList.add('animate-fade');
                }

                // Update Doughnut Chart
                if (churnChart && resultData.probability) {
                    churnChart.data.datasets[0].data = [
                        resultData.probability[0] * 100,
                        resultData.probability[1] * 100
                    ];
                    churnChart.update();
                }

            } catch (err) {
                console.error("API Error!", err);
                alert("The machine learning engine didn't respond. Ensure server.js is running.");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Dropdown Scenario Listener
    const scEl = document.getElementById('scenario-select');
    if (scEl) {
        scEl.addEventListener('change', (e) => {
            updateFormInputs(e.target.value);
        });
    }

    // Run Initial Layout
    updateFormInputs('universal');
});

function updateUIStats(stats) {
    if (!stats) return;
    const totalEl = document.getElementById('stat-total');
    const rateEl = document.getElementById('stat-rate');
    const accEl = document.getElementById('stat-accuracy');
    const srcEl = document.getElementById('stat-sources');

    if (totalEl) totalEl.innerText = (stats.total_customers || 0).toLocaleString();
    if (rateEl) rateEl.innerText = (stats.churn_rate || 0).toFixed(1) + '%';
    if (accEl) accEl.innerText = (stats.accuracy || 0).toFixed(1) + '%';

    const sources = stats.source_distribution || {};
    const srcList = Object.keys(sources).join(' + ');
    if (srcEl) srcEl.innerText = srcList || "All Sources";
}
