<template>
  <div class="dashboard-layout">
    <TheNavbar />

    <div class="dashboard-container">
      <!-- KPI Cards -->
      <div class="kpi-row">
        <template v-if="loading">
          <div v-for="i in 4" :key="i" class="kpi-card glass-card">
            <Skeleton shape="circle" size="56px" />
            <div class="kpi-content">
              <Skeleton width="60%" height="0.8rem" class="mb-2" />
              <Skeleton width="100%" height="2rem" />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="kpi-card glass-card">
            <div class="kpi-icon-wrapper blue-gradient">
              <i class="pi pi-box"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Commandes Total</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ totalOrders }}</span>
                <span class="kpi-trend positive">
                  <i class="pi pi-arrow-up"></i> {{ ordersTrend }}%
                </span>
              </div>
            </div>
          </div>

          <div class="kpi-card glass-card">
            <div class="kpi-icon-wrapper orange-gradient">
              <i class="pi pi-clock"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">En Cours</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ inProgressOrders }}</span>
                <span class="kpi-trend neutral">{{ inProgressPercent }}%</span>
              </div>
            </div>
          </div>

          <div class="kpi-card glass-card">
            <div class="kpi-icon-wrapper green-gradient">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Taux Complétion</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ completionRate }}%</span>
                <span class="kpi-trend positive">
                  <i class="pi pi-arrow-up"></i> +{{ completionTrend }}%
                </span>
              </div>
            </div>
          </div>

          <div class="kpi-card glass-card">
            <div class="kpi-icon-wrapper purple-gradient">
              <i class="pi pi-dollar"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CA Total 2025</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ totalRevenue }} K {{ currencySymbol }}</span>
                <span class="kpi-trend positive">
                  <i class="pi pi-arrow-up"></i> +{{ revenueTrend }}%
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Main Charts Grid -->
      <div class="charts-grid">
        <!-- Chart 1: CA par Catégorie -->
        <div class="chart-card span-2">
          <div class="chart-header">
            <h3 class="chart-title">CA par Catégorie</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot blue"></span> 2025</span>
              <span class="legend-item"><span class="legend-dot gray"></span> 2024</span>
            </div>
          </div>
          <div class="chart-body">
            <Chart v-if="!loading" type="bar" :data="revenueChartData" :options="revenueChartOptions" />
            <div v-else class="chart-loading"><i class="pi pi-spin pi-spinner"></i></div>
          </div>
        </div>

        <!-- Chart 2: Répartition Statuts -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Répartition Commandes</h3>
          </div>
          <div class="chart-body">
            <Chart v-if="!loading" type="doughnut" :data="statusChartData" :options="statusChartOptions" />
            <div v-else class="chart-loading"><i class="pi pi-spin pi-spinner"></i></div>
          </div>
        </div>
      </div>

      <!-- Performance Cards -->
      <div class="performance-cards">
        <!-- Main d'Œuvre -->
        <div class="perf-card">
          <div class="perf-header">
            <div class="header-left">
              <i class="pi pi-wrench"></i>
              <h4>Main d'Œuvre</h4>
            </div>
          </div>
          <div class="perf-stats-grid">
            <!-- Objectif -->
            <div class="stat-col">
              <span class="col-label">Objectif</span>
              <div class="main-val">{{ moObj2025 }} K {{ currencySymbol }}</div>
              <div class="sub-val">
                <span class="year-label">2024</span>
                <span class="val">{{ moObj2024 }} K {{ currencySymbol }}</span>
              </div>
              <div class="trend" :class="moObjGrowth >= 0 ? 'positive' : 'negative'">
                <i :class="moObjGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(moObjGrowth) }}%
              </div>
            </div>
            <!-- Réalisé -->
            <div class="stat-col">
              <span class="col-label">Réalisé</span>
              <div class="main-val">{{ moTotals2025 }} K {{ currencySymbol }}</div>
              <div class="sub-val">
                <span class="year-label">2024</span>
                <span class="val">{{ moTotals2024 }} K {{ currencySymbol }}</span>
              </div>
              <div class="trend" :class="moGrowth >= 0 ? 'positive' : 'negative'">
                <i :class="moGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(moGrowth) }}%
              </div>
            </div>
            <!-- Performance -->
            <div class="stat-col span-3">
              <div class="perf-label-row">
                <span class="col-label">Performance Globale</span>
                <span class="perf-value" :class="moPerf2025 >= 100 ? 'positive-text' : 'negative-text'">{{ moPerf2025
                }}%</span>
              </div>
              <div class="perf-progress-bg">
                <div class="perf-progress-bar"
                  :style="{ width: Math.min(moPerf2025, 100) + '%', backgroundColor: moPerf2025 >= 100 ? '#10b981' : '#f59e0b' }">
                </div>
              </div>
              <div class="sub-val">
                <span class="year-label">Objectif: {{ moObj2025 }} K | Réalisé: {{ moTotals2025 }} K</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pièces De Rechange -->
        <div class="perf-card">
          <div class="perf-header">
            <div class="header-left">
              <i class="pi pi-cog"></i>
              <h4>Pièces De Rechange</h4>
            </div>
          </div>
          <div class="perf-stats-grid">
            <!-- Objectif -->
            <div class="stat-col">
              <span class="col-label">Objectif</span>
              <div class="main-val">{{ pdrObj2025 }} K {{ currencySymbol }}</div>
              <div class="sub-val">
                <span class="year-label">2024</span>
                <span class="val">{{ pdrObj2024 }} K {{ currencySymbol }}</span>
              </div>
              <div class="trend" :class="pdrObjGrowth >= 0 ? 'positive' : 'negative'">
                <i :class="pdrObjGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(pdrObjGrowth) }}%
              </div>
            </div>
            <!-- Réalisé -->
            <div class="stat-col">
              <span class="col-label">Réalisé</span>
              <div class="main-val">{{ pdrTotals2025 }} K {{ currencySymbol }}</div>
              <div class="sub-val">
                <span class="year-label">2024</span>
                <span class="val">{{ pdrTotals2024 }} K {{ currencySymbol }}</span>
              </div>
              <div class="trend" :class="pdrGrowth >= 0 ? 'positive' : 'negative'">
                <i :class="pdrGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(pdrGrowth) }}%
              </div>
            </div>
            <!-- Performance -->
            <div class="stat-col span-3">
              <div class="perf-label-row">
                <span class="col-label">Performance Globale</span>
                <span class="perf-value" :class="pdrPerf2025 >= 100 ? 'positive-text' : 'negative-text'">{{ pdrPerf2025
                }}%</span>
              </div>
              <div class="perf-progress-bg">
                <div class="perf-progress-bar"
                  :style="{ width: Math.min(pdrPerf2025, 100) + '%', backgroundColor: pdrPerf2025 >= 100 ? '#10b981' : '#f59e0b' }">
                </div>
              </div>
              <div class="sub-val">
                <span class="year-label">Objectif: {{ pdrObj2025 }} K | Réalisé: {{ pdrTotals2025 }} K</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lubrifiants -->
        <div class="perf-card">
          <div class="perf-header">
            <div class="header-left">
              <i class="pi pi-filter"></i>
              <h4>Lubrifiants</h4>
            </div>
          </div>
          <div class="perf-stats-grid">
            <!-- Objectif -->
            <div class="stat-col">
              <span class="col-label">Objectif</span>
              <div class="main-val">{{ lubObj2025 }} K {{ currencySymbol }}</div>
              <div class="sub-val">
                <span class="year-label">2024</span>
                <span class="val">{{ lubObj2024 }} K {{ currencySymbol }}</span>
              </div>
              <div class="trend" :class="lubObjGrowth >= 0 ? 'positive' : 'negative'">
                <i :class="lubObjGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(lubObjGrowth) }}%
              </div>
            </div>
            <!-- Réalisé -->
            <div class="stat-col">
              <span class="col-label">Réalisé</span>
              <div class="main-val">{{ lubTotals2025 }} K {{ currencySymbol }}</div>
              <div class="sub-val">
                <span class="year-label">2024</span>
                <span class="val">{{ lubTotals2024 }} K {{ currencySymbol }}</span>
              </div>
              <div class="trend" :class="lubGrowth >= 0 ? 'positive' : 'negative'">
                <i :class="lubGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(lubGrowth) }}%
              </div>
            </div>
            <!-- Performance -->
            <div class="stat-col span-3">
              <div class="perf-label-row">
                <span class="col-label">Performance Globale</span>
                <span class="perf-value" :class="lubPerf2025 >= 100 ? 'positive-text' : 'negative-text'">{{ lubPerf2025
                }}%</span>
              </div>
              <div class="perf-progress-bg">
                <div class="perf-progress-bar"
                  :style="{ width: Math.min(lubPerf2025, 100) + '%', backgroundColor: lubPerf2025 >= 100 ? '#10b981' : '#f59e0b' }">
                </div>
              </div>
              <div class="sub-val">
                <span class="year-label">Objectif: {{ lubObj2025 }} K | Réalisé: {{ lubTotals2025 }} K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Charts Grid -->
      <div class="charts-grid">
        <!-- Chart 3: Heures par Équipe -->
        <div class="chart-card span-2">
          <div class="chart-header">
            <h3 class="chart-title">Heures Réalisées vs Objectif par Équipe</h3>
            <Dropdown v-model="selectedYear" :options="availableYears" placeholder="Année" class="year-filter-sm"
              @change="loadTeamObjectivesData" />
          </div>
          <div class="chart-body">
            <Chart v-if="!loading" type="bar" :data="teamObjectivesChartData" :options="teamObjectivesOptions" />
            <div v-else class="chart-loading"><i class="pi pi-spin pi-spinner"></i></div>
          </div>
        </div>

        <!-- Chart 4: Tendances Mensuelles -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Tendances Mensuelles 2025</h3>
          </div>
          <div class="chart-body">
            <Chart v-if="!loading" type="line" :data="trendsChartData" :options="trendsChartOptions" />
            <div v-else class="chart-loading"><i class="pi pi-spin pi-spinner"></i></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { dataService } from '../services/dataService';
import Chart from 'primevue/chart';
import Dropdown from 'primevue/dropdown';
import Skeleton from 'primevue/skeleton';
import TheNavbar from '../components/TheNavbar.vue';
import { moMonthlyData } from '../mocks/mo_data.js';
import { pdrMonthlyData } from '../mocks/pdr_data.js';
import { lubrifiantsMonthlyData } from '../mocks/lubrifiants_data.js';
import { useGeneralSettings } from '../composables/useGeneralSettings';

const { settings } = useGeneralSettings();
const currencySymbol = computed(() => settings.value.currencySymbol);

const loading = ref(true);
const selectedYear = ref(2025);
const availableYears = [2024, 2025, 2026, 2027];

const kpis = ref({
  statusCounts: {},
  totalOrders: 0
});

const teamObjectivesChartData = ref({ labels: [], datasets: [] });
const revenueChartData = ref({ labels: [], datasets: [] });
const statusChartData = ref({ labels: [], datasets: [] });
const trendsChartData = ref({ labels: [], datasets: [] });

// Computed KPIs
const totalOrders = computed(() => kpis.value.totalOrders || 0);
const inProgressOrders = computed(() => kpis.value.statusCounts['En cours'] || 0);
const completedOrders = computed(() => kpis.value.statusCounts['Terminé'] || 0);
const completionRate = computed(() => {
  const total = totalOrders.value;
  return total > 0 ? Math.round((completedOrders.value / total) * 100) : 0;
});
const inProgressPercent = computed(() => {
  const total = totalOrders.value;
  return total > 0 ? Math.round((inProgressOrders.value / total) * 100) : 0;
});

// --- Revenue & Objectives Calculations ---

// Helper to sum realized
const sumRealized = (data, year) => data.filter(d => d.year === year).reduce((sum, d) => sum + d.realized, 0);
// Helper to sum objective
const sumObjective = (data, year) => data.filter(d => d.year === year).reduce((sum, d) => sum + d.objective, 0);
// Helper to calculate growth
const calcGrowth = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
// Helper to calculate performance
const calcPerf = (realized, objective) => objective > 0 ? Math.round((realized / objective) * 100) : 0;

// MO
const moTotals2024 = computed(() => sumRealized(moMonthlyData, 2024));
const moTotals2025 = computed(() => sumRealized(moMonthlyData, 2025));
const moObj2024 = computed(() => sumObjective(moMonthlyData, 2024));
const moObj2025 = computed(() => sumObjective(moMonthlyData, 2025));
const moGrowth = computed(() => calcGrowth(moTotals2025.value, moTotals2024.value));
const moObjGrowth = computed(() => calcGrowth(moObj2025.value, moObj2024.value));
const moPerf2024 = computed(() => calcPerf(moTotals2024.value, moObj2024.value));
const moPerf2025 = computed(() => calcPerf(moTotals2025.value, moObj2025.value));

// PDR
const pdrTotals2024 = computed(() => sumRealized(pdrMonthlyData, 2024));
const pdrTotals2025 = computed(() => sumRealized(pdrMonthlyData, 2025));
const pdrObj2024 = computed(() => sumObjective(pdrMonthlyData, 2024));
const pdrObj2025 = computed(() => sumObjective(pdrMonthlyData, 2025));
const pdrGrowth = computed(() => calcGrowth(pdrTotals2025.value, pdrTotals2024.value));
const pdrObjGrowth = computed(() => calcGrowth(pdrObj2025.value, pdrObj2024.value));
const pdrPerf2024 = computed(() => calcPerf(pdrTotals2024.value, pdrObj2024.value));
const pdrPerf2025 = computed(() => calcPerf(pdrTotals2025.value, pdrObj2025.value));

// LUB
const lubTotals2024 = computed(() => sumRealized(lubrifiantsMonthlyData, 2024));
const lubTotals2025 = computed(() => sumRealized(lubrifiantsMonthlyData, 2025));
const lubObj2024 = computed(() => sumObjective(lubrifiantsMonthlyData, 2024));
const lubObj2025 = computed(() => sumObjective(lubrifiantsMonthlyData, 2025));
const lubGrowth = computed(() => calcGrowth(lubTotals2025.value, lubTotals2024.value));
const lubObjGrowth = computed(() => calcGrowth(lubObj2025.value, lubObj2024.value));
const lubPerf2024 = computed(() => calcPerf(lubTotals2024.value, lubObj2024.value));
const lubPerf2025 = computed(() => calcPerf(lubTotals2025.value, lubObj2025.value));

// Total Revenue
const totalRevenue = computed(() => moTotals2025.value + pdrTotals2025.value + lubTotals2025.value);
const totalRevenue2024 = computed(() => moTotals2024.value + pdrTotals2024.value + lubTotals2024.value);

const ordersTrend = computed(() => {
  return totalRevenue2024.value > 0 ? Math.round(((totalRevenue.value - totalRevenue2024.value) / totalRevenue2024.value) * 100) : 0;
});
const completionTrend = ref(5);
const revenueTrend = computed(() => ordersTrend.value);

// Chart Options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  }
};

const revenueChartOptions = {
  ...commonOptions,
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#94a3b8', font: { size: 11 }, callback: (val) => val + ' K ' + currencySymbol.value },
      grid: { color: '#f1f5f9', drawBorder: false }
    },
    x: {
      ticks: { color: '#64748b', font: { size: 11 } },
      grid: { display: false }
    }
  }
};

const teamObjectivesOptions = {
  ...commonOptions,
  plugins: { legend: { display: true, position: 'top', labels: { color: '#64748b', font: { size: 11 } } } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#94a3b8', font: { size: 11 } },
      grid: { color: '#f1f5f9', drawBorder: false }
    },
    x: {
      ticks: { color: '#64748b', font: { size: 11 } },
      grid: { display: false }
    }
  }
};

const statusChartOptions = {
  ...commonOptions,
  cutout: '70%',
  plugins: {
    legend: {
      display: true,
      position: 'right',
      labels: {
        color: '#64748b',
        font: { size: 11, weight: '600' },
        padding: 20,
        usePointStyle: true
      }
    }
  }
};

const trendsChartOptions = {
  ...commonOptions,
  plugins: {
    legend: { display: true, position: 'top', labels: { color: '#64748b', font: { size: 10, weight: '600' }, usePointStyle: true, padding: 15 } },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1e293b',
      bodyColor: '#64748b',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      cornerRadius: 8
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#94a3b8', font: { size: 10 } },
      grid: { color: '#f1f5f9', drawBorder: false }
    },
    x: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { display: false }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index',
  }
};

// Load Data
const loadTeamObjectivesData = async () => {
  try {
    const teamStats = await dataService.getTeamObjectivesVsRealized(selectedYear.value);
    teamObjectivesChartData.value = {
      labels: teamStats.map(t => t.teamName),
      datasets: [
        {
          label: 'Heures Réalisées',
          data: teamStats.map(t => Math.round(t.realized)),
          backgroundColor: '#6366f1',
          borderRadius: 8,
          barThickness: 20
        },
        {
          label: 'Objectif',
          data: teamStats.map(t => Math.round(t.objective)),
          backgroundColor: '#e2e8f0',
          borderRadius: 8,
          barThickness: 20
        }
      ]
    };
  } catch (error) {
    console.error('Failed to load team objectives:', error);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const dashboardStats = await dataService.getDashboardKPIsV2();
    kpis.value = dashboardStats;

    // Revenue Chart
    revenueChartData.value = {
      labels: ['Main d\'Œuvre', 'PDR', 'Lubrifiants'],
      datasets: [
        {
          label: '2025',
          data: [moTotals2025.value, pdrTotals2025.value, lubTotals2025.value],
          backgroundColor: '#6366f1',
          borderRadius: 8,
          barThickness: 30
        },
        {
          label: '2024',
          data: [moTotals2024.value, pdrTotals2024.value, lubTotals2024.value],
          backgroundColor: '#e2e8f0',
          borderRadius: 8,
          barThickness: 30
        }
      ]
    };

    // Status Chart
    statusChartData.value = {
      labels: ['Nouveau', 'En cours', 'Terminé'],
      datasets: [{
        data: [
          dashboardStats.statusCounts['Nouveau'] || 0,
          dashboardStats.statusCounts['En cours'] || 0,
          dashboardStats.statusCounts['Terminé'] || 0
        ],
        backgroundColor: ['#6366f1', '#f97316', '#10b981']
      }]
    };

    // Trends Chart
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const mo2025 = moMonthlyData.filter(d => d.year === 2025).map(d => d.realized);
    const pdr2025 = pdrMonthlyData.filter(d => d.year === 2025).map(d => d.realized);
    const lub2025 = lubrifiantsMonthlyData.filter(d => d.year === 2025).map(d => d.realized);

    trendsChartData.value = {
      labels: months,
      datasets: [
        {
          label: 'Main d\'Œuvre',
          data: mo2025,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 3
        },
        {
          label: 'Pièces',
          data: pdr2025,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 3
        },
        {
          label: 'Lubrifiants',
          data: lub2025,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 3
        }
      ]
    };

    await loadTeamObjectivesData();
  } catch (error) {
    console.error('Failed to load dashboard data', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #f8fafc;
}

.dashboard-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2.5rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* KPI Cards */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
}

.kpi-card {
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.12);
}

.kpi-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.blue-gradient {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.orange-gradient {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.green-gradient {
  background: linear-gradient(135deg, #10b981, #059669);
}

.purple-gradient {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.kpi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kpi-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.kpi-value {
  font-size: 1.85rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.kpi-trend {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.kpi-trend.positive {
  background: #f0fdf4;
  color: #10b981;
}

.kpi-trend.negative {
  background: #fef2f2;
  color: #ef4444;
}

.kpi-trend.neutral {
  background: #f8fafc;
  color: #64748b;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}

.chart-card.span-2 {
  grid-column: span 2;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.chart-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.blue {
  background: #3b82f6;
}

.legend-dot.gray {
  background: #cbd5e1;
}

.chart-body {
  height: 300px;
  position: relative;
  flex: 1;
  width: 100%;
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-size: 1.5rem;
}

.year-filter-sm {
  font-size: 0.75rem;
}

.year-filter-sm :deep(.p-dropdown) {
  font-size: 0.75rem;
  height: 32px;
  border-color: #e2e8f0;
}

/* Performance Cards */
.performance-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.perf-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.perf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.perf-header i {
  font-size: 1.25rem;
  color: #3b82f6;
}

.perf-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.perf-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.stat-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-col.span-3 {
  grid-column: span 2;
  margin-top: 0.5rem;
}

.perf-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.perf-value {
  font-size: 1.1rem;
  font-weight: 800;
}

.perf-progress-bg {
  height: 10px;
  background: #f1f5f9;
  border-radius: 5px;
  overflow: hidden;
}

.perf-progress-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 1s ease-out;
}

.col-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
}

.sub-val {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.year-label {
  font-weight: 500;
  color: #94a3b8;
}

.trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.trend.positive {
  color: #10b981;
}

.trend.negative {
  color: #ef4444;
}

.positive-text {
  color: #10b981;
}

.negative-text {
  color: #ef4444;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.span-2 {
    grid-column: span 1;
  }

  .performance-cards {
    grid-template-columns: 1fr;
  }
}
</style>
