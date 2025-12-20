<template>
    <div class="task-card" :class="{ 'task-card-encours': task.status === 'En cours', 'task-dragging': isDragging }">
        <!-- Line 1: Project + Icon -->
        <div class="task-line-1">
            <div class="task-project-compact">{{ task.projectNumber }}</div>
            <i v-if="task.status === 'En cours'" class="pi pi-spin pi-spinner status-icon-encours"></i>
            <i v-else class="pi pi-calendar status-icon-planned"></i>
        </div>

        <!-- Lines 2-3: Description -->
        <div class="task-description" v-tooltip.top="tooltipContent">
            {{ task.subTaskName }}
        </div>

        <!-- Line 4-5: Hours -->
        <div class="task-hours-vertical-compact">
            <div class="hour-item">Prévu: {{ Number(task.plannedHours).toFixed(2) }} h</div>
            <div v-if="task.status === 'En cours'" class="hour-item">Réel: {{ Number(task.workedHours).toFixed(2) }} h
            </div>
        </div>

        <!-- Line 6: Progress Bar -->
        <div class="task-progress-bar" :class="{ 'task-progress-bar-planned': task.status === 'Planifié' }">
            <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
            <span class="progress-percentage">{{ progress }}%</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    task: Object,
    isDragging: Boolean
});

const progress = computed(() => {
    if (!props.task.plannedHours || props.task.plannedHours === 0) return 0;
    return Math.round((props.task.workedHours / props.task.plannedHours) * 100);
});

const tooltipContent = computed(() => {
    return `Tâche: ${props.task.taskName || 'N/A'}\nSous-tâche: ${props.task.subTaskName}`;
});
</script>

<style scoped>
.task-card {
    min-width: 150px;
    max-width: 150px;
    min-height: 155px;
    max-height: 155px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem;
    font-size: 0.75rem;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    position: relative;
}

.task-card:hover {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
    border-color: #cbd5e1;
}

.task-card-encours {
    border-left: 4px solid #dc2626;
}

.task-dragging {
    opacity: 0.5;
    transform: scale(0.98);
}

.task-line-1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.task-project-compact {
    font-weight: 700;
    color: #3b82f6;
    font-size: 0.75rem;
}

.status-icon-encours {
    color: #dc2626;
    font-size: 0.85rem;
}

.status-icon-planned {
    color: #f59e0b;
    font-size: 0.85rem;
}

.task-description {
    color: #475569;
    font-size: 0.7rem;
    line-height: 1.3;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    height: 2.6em;
    overflow: hidden;
    cursor: help;
    flex: none;
}

.task-hours-vertical-compact {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.62rem;
    color: #64748b;
    background: #f8fafc;
    padding: 0.25rem 0.35rem;
    border-radius: 4px;
    font-weight: 600;
    margin-top: auto;
}

.hour-item {
    display: flex;
    justify-content: space-between;
}

.task-progress-bar {
    position: relative;
    height: 14px;
    background: #e2e8f0;
    border-radius: 7px;
    overflow: hidden;
    flex-shrink: 0;
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    transition: width 0.3s ease;
}

.task-progress-bar-planned {
    background: #f1f5f9;
}

.task-progress-bar-planned .progress-bar-fill {
    background: linear-gradient(90deg, #cbd5e1, #94a3b8);
    opacity: 0.7;
}

.progress-percentage {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.6rem;
    font-weight: 700;
    color: #1e293b;
    text-shadow:
        -1px -1px 0 rgba(255, 255, 255, 0.8),
        1px -1px 0 rgba(255, 255, 255, 0.8),
        -1px 1px 0 rgba(255, 255, 255, 0.8),
        1px 1px 0 rgba(255, 255, 255, 0.8),
        0 0 3px rgba(255, 255, 255, 0.6);
}
</style>
