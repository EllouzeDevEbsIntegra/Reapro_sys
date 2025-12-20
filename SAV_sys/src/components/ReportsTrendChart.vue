<template>
    <div class="trend-chart-card">
        <div class="chart-header">
            <h3 class="chart-title">Tendance de Performance</h3>
        </div>
        <div class="chart-container">
            <Chart type="bar" :data="chartData" :options="chartOptions" />
        </div>
    </div>
</template>

<script setup>
import Chart from 'primevue/chart';
import { computed } from 'vue';

const props = defineProps({
    data: {
        type: Object,
        required: true
    },
    viewMode: {
        type: String,
        default: 'monthly'
    }
});

const chartData = computed(() => props.data);

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12,
                    weight: '600'
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1e293b',
            bodyColor: '#64748b',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            boxPadding: 6,
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y + (context.datasetIndex === 2 ? '%' : ' h');
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Heures (h)',
                color: '#64748b',
                font: { size: 11, weight: '600' }
            },
            ticks: { color: '#94a3b8' },
            grid: { color: '#f1f5f9', drawBorder: false }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Performance (%)',
                color: '#64748b',
                font: { size: 11, weight: '600' }
            },
            min: 0,
            ticks: {
                color: '#94a3b8',
                callback: (value) => value + '%'
            },
            grid: { drawOnChartArea: false }
        },
        x: {
            ticks: { color: '#64748b', font: { size: 10 } },
            grid: { display: false }
        }
    }
}));
</script>

<style scoped>
.trend-chart-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #f1f5f9;
    margin-top: 0.5rem;
}

.chart-header {
    margin-bottom: 1.5rem;
}

.chart-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.chart-container {
    height: 150px;
    position: relative;
}
</style>
