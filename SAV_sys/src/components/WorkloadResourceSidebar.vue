<template>
    <div class="resource-sidebar">
        <div class="resource-info">
            <!-- Avatar + Name -->
            <div class="resource-header-horizontal">
                <div class="resource-avatar-compact">
                    {{ resource.resourceName.charAt(0) }}
                </div>
                <div class="resource-name-compact">{{ resource.resourceName }}</div>
            </div>

            <!-- Planned Hours + Count -->
            <div class="resource-planned-hours"
                :class="{ 'overload-warning': Number(resource.totalPlanned) > monthlyStats.targetHours }">
                <i class="pi pi-clock"></i>
                <span>Prévu: {{ Number(resource.totalPlanned).toFixed(2) }} h</span>
                <span class="count-badge">
                    <i class="pi pi-calendar"></i>
                    {{ resource.plannedCount }}
                </span>
                <i v-if="Number(resource.totalPlanned) > monthlyStats.targetHours"
                    class="pi pi-exclamation-triangle overload-icon"
                    v-tooltip.top="'Surcharge: ' + (Number(resource.totalPlanned) - monthlyStats.targetHours).toFixed(2) + 'h en trop'"></i>
            </div>

            <!-- Monthly Progress Graph -->
            <div class="monthly-progress">
                <div class="month-header">
                    <div class="month-label">{{ monthLabel }}</div>
                    <div class="achievement-percentage">{{ Math.round(monthlyStats.achievementRate) }}%</div>
                </div>

                <!-- Progress Bar -->
                <div class="progress-bar-wrapper">
                    <div class="progress-track-enhanced">
                        <div class="progress-fill-enhanced"
                            :style="{ width: Math.min(monthlyStats.achievementRate, 100) + '%' }">
                            <div class="progress-shine"></div>
                        </div>
                    </div>
                </div>

                <!-- Values Display -->
                <div class="progress-values-enhanced">
                    <div class="value-item">
                        <span class="value-label">Prestées</span>
                        <span class="value-number current">{{ Number(monthlyStats.actualHours).toFixed(2) }} h</span>
                    </div>
                    <div class="value-separator">/</div>
                    <div class="value-item">
                        <span class="value-label">Objectif</span>
                        <span class="value-number target">{{ Number(monthlyStats.targetHours).toFixed(2) }} h</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    resource: Object,
    monthLabel: String,
    monthlyStats: Object
});
</script>

<style scoped>
.resource-sidebar {
    width: 200px;
    min-width: 200px;
    background: #f1f5f9;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    border-right: 1px solid #e2e8f0;
}

.resource-info {
    width: 100%;
}

.resource-header-horizontal {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.25rem;
}

.resource-avatar-compact {
    width: 28px;
    height: 28px;
    min-width: 28px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1.5px solid #e2e8f0;
}

.resource-name-compact {
    font-weight: 600;
    font-size: 0.7rem;
    color: #334155;
    line-height: 1.15;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.resource-planned-hours {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.65rem;
    background: white;
    padding: 0.2rem 0.35rem;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    margin-bottom: 0.1rem;
    font-weight: 600;
    color: #475569;
}

.resource-planned-hours.overload-warning {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
}

.overload-icon {
    color: #dc2626;
    font-size: 0.75rem;
    margin-left: 0.25rem;
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.resource-planned-hours i {
    color: #64748b;
    font-size: 0.6rem;
}

.resource-planned-hours .count-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
    font-weight: 700;
    color: #f59e0b;
    background: #fffbeb;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    border: 1px solid #fde68a;
    font-size: 0.6rem;
}

.resource-planned-hours .count-badge i {
    font-size: 0.55rem;
    color: #f59e0b;
}

.monthly-progress {
    margin-top: 0.2rem;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
    padding: 0.4rem 0.5rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.month-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
}

.month-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.achievement-percentage {
    font-size: 0.85rem;
    font-weight: 800;
    color: #3b82f6;
    text-shadow: 0 1px 2px rgba(59, 130, 246, 0.15);
}

.progress-bar-wrapper {
    margin-bottom: 0.4rem;
}

.progress-track-enhanced {
    height: 8px;
    background: linear-gradient(90deg, #e2e8f0, #f1f5f9);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.progress-fill-enhanced {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8);
    border-radius: 6px;
    transition: width 0.5s ease;
    position: relative;
    overflow: hidden;
}

.progress-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 2s infinite;
}

@keyframes shine {
    0% {
        left: -100%;
    }

    100% {
        left: 100%;
    }
}

.progress-values-enhanced {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
}

.value-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.value-label {
    font-size: 0.55rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.03em;
    margin-bottom: 0.1rem;
}

.value-number {
    font-size: 0.7rem;
    font-weight: 700;
}

.value-number.current {
    color: #3b82f6;
}

.value-number.target {
    color: #475569;
}

.value-separator {
    font-size: 0.85rem;
    color: #cbd5e1;
    font-weight: 300;
}
</style>
