<template>
    <div class="resources-list">
        <div v-for="(resource, resId) in activeTeam.resources" :key="resId" class="resource-row"
            :class="{ 'drop-zone-active': dropZoneActive === resource.resourceCode }"
            @dragover="$emit('dragover', { event: $event, resourceCode: resource.resourceCode })"
            @dragleave="$emit('dragleave')"
            @drop="$emit('drop', { event: $event, resourceCode: resource.resourceCode })">

            <!-- Sidebar -->
            <WorkloadResourceSidebar :resource="resource" :monthLabel="monthLabel"
                :monthlyStats="getResourceMonthlyStats(resId)" />

            <!-- Content: Single Row (En cours first, then Planifié) -->
            <div class="tasks-container">
                <!-- En cours task (max 1) -->
                <WorkloadTaskCard v-for="task in resource.tasks.filter(t => t.status === 'En cours')" :key="task.id"
                    :task="task" :isDragging="draggedTask && draggedTask.id === task.id" />

                <!-- Planifié tasks -->
                <WorkloadTaskCard v-for="task in resource.tasks.filter(t => t.status === 'Planifié')" :key="task.id"
                    :task="task" :isDragging="draggedTask && draggedTask.id === task.id" class="task-draggable"
                    draggable="true" @dragstart="$emit('dragstart', { task, resourceCode: resource.resourceCode })"
                    @dragend="$emit('dragend')" />

                <!-- Empty state -->
                <div v-if="resource.tasks.length === 0" class="empty-tasks-placeholder">
                    Aucune tâche affectée
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import WorkloadResourceSidebar from './WorkloadResourceSidebar.vue';
import WorkloadTaskCard from './WorkloadTaskCard.vue';

defineProps({
    activeTeam: Object,
    monthLabel: String,
    getResourceMonthlyStats: Function,
    draggedTask: Object,
    dropZoneActive: String
});

defineEmits(['dragstart', 'dragend', 'dragover', 'dragleave', 'drop']);
</script>

<style scoped>
.resources-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
    background: #f8fafc;
}

.resource-row {
    display: flex;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
    min-height: 155px;
}

.resource-row:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e1;
}

.resource-row.drop-zone-active {
    background: #f0f9ff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px #3b82f6;
}

.tasks-container {
    flex: 1;
    display: flex;
    align-items: stretch;
    gap: 1rem;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}

.tasks-container::-webkit-scrollbar {
    height: 8px;
}

.tasks-container::-webkit-scrollbar-track {
    background: transparent;
}

.tasks-container::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
}

.task-draggable {
    cursor: move;
}

.task-draggable:hover {
    cursor: grab;
}

.empty-tasks-placeholder {
    color: #94a3b8;
    font-style: italic;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    padding: 0 1rem;
}
</style>
