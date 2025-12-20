<template>
    <div class="kpi-row">
        <!-- Ressources Actives -->
        <div class="kpi-card">
            <div class="kpi-icon green">
                <i class="pi pi-users"></i>
            </div>
            <div class="kpi-info">
                <div class="kpi-label">Ressources Actives</div>
                <div class="kpi-value">{{ totalResources }}</div>
            </div>
        </div>

        <!-- Heures Prévues -->
        <div class="kpi-card">
            <div class="kpi-icon blue">
                <i class="pi pi-clock"></i>
            </div>
            <div class="kpi-info">
                <div class="kpi-label">Heures Prévues</div>
                <div class="kpi-value">
                    {{ globalYearStats ? formatNumber(globalYearStats.current.planned) : totalPlannedHours }}
                    <span class="kpi-year">({{ currentYear }})</span>
                </div>
                <div class="kpi-sub-value" v-if="globalYearStats">
                    {{ formatNumber(globalYearStats.previous.planned) }} <span class="text-xs">({{ previousYear
                    }})</span>
                    <span class="kpi-trend"
                        :class="globalYearStats.current.planned >= globalYearStats.previous.planned ? 'trend-up' : 'trend-down'">
                        <i
                            :class="globalYearStats.current.planned >= globalYearStats.previous.planned ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                        {{ calculateTrend(globalYearStats.current.planned, globalYearStats.previous.planned) }}%
                    </span>
                </div>
            </div>
        </div>

        <!-- Heures Prestées -->
        <div class="kpi-card">
            <div class="kpi-icon orange">
                <i class="pi pi-briefcase"></i>
            </div>
            <div class="kpi-info">
                <div class="kpi-label">Heures Prestées</div>
                <div class="kpi-value">
                    {{ globalYearStats ? formatNumber(globalYearStats.current.real) : totalWorkedHours }}
                    <span class="kpi-year">({{ currentYear }})</span>
                </div>
                <div class="kpi-sub-value" v-if="globalYearStats">
                    {{ formatNumber(globalYearStats.previous.real) }} <span class="text-xs">({{ previousYear
                    }})</span>
                    <span class="kpi-trend"
                        :class="globalYearStats.current.real >= globalYearStats.previous.real ? 'trend-up' : 'trend-down'">
                        <i
                            :class="globalYearStats.current.real >= globalYearStats.previous.real ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                        {{ calculateTrend(globalYearStats.current.real, globalYearStats.previous.real) }}%
                    </span>
                </div>
            </div>
        </div>

        <!-- Efficience -->
        <div class="kpi-card">
            <div class="kpi-icon purple">
                <i class="pi pi-chart-line"></i>
            </div>
            <div class="kpi-info">
                <div class="kpi-label">Efficience</div>
                <div class="kpi-value">
                    {{ globalYearStats ? Math.round(globalYearStats.current.efficiency * 100) : efficiency }}%
                    <span class="kpi-year">({{ currentYear }})</span>
                </div>
                <div class="kpi-sub-value" v-if="globalYearStats">
                    {{ Math.round(globalYearStats.previous.efficiency * 100) }}% <span class="text-xs">({{ previousYear
                    }})</span>
                    <span class="kpi-trend"
                        :class="globalYearStats.current.efficiency >= globalYearStats.previous.efficiency ? 'trend-up' : 'trend-down'">
                        <i
                            :class="globalYearStats.current.efficiency >= globalYearStats.previous.efficiency ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                        {{ calculateTrend(globalYearStats.current.efficiency, globalYearStats.previous.efficiency) }}%
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    globalYearStats: Object,
    currentYear: Number,
    previousYear: Number,
    totalResources: Number,
    totalPlannedHours: Number,
    totalWorkedHours: Number,
    efficiency: Number,
    formatNumber: Function
});

const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.abs(Math.round(((current - previous) / previous) * 100));
};
</script>

<style scoped>
.kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
}

.kpi-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f1f5f9;
    transition: all 0.2s;
}

.kpi-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.kpi-icon.blue {
    background: #eff6ff;
    color: #3b82f6;
}

.kpi-icon.orange {
    background: #fff7ed;
    color: #f97316;
}

.kpi-icon.green {
    background: #f0fdf4;
    color: #10b981;
}

.kpi-icon.purple {
    background: #faf5ff;
    color: #a855f7;
}

.kpi-info {
    flex: 1;
    min-width: 0;
}

.kpi-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.kpi-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
}

.kpi-year {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 500;
}

.kpi-sub-value {
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.kpi-trend {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    font-weight: 600;
    font-size: 0.75rem;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
}

.trend-up {
    color: #10b981;
    background: #ecfdf5;
}

.trend-down {
    color: #ef4444;
    background: #fef2f2;
}
</style>
