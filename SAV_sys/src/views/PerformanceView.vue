<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { dataService } from '../services/dataService';
import TheNavbar from '../components/TheNavbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';

const performanceData = ref([]);
const loading = ref(false);
const teams = ref([]);
const resources = ref([]);
const tasks = ref([]);
const subtasks = ref([]);

// Details Dialog State
const detailsDialogVisible = ref(false);
const detailsLoading = ref(false);
const selectedDetails = ref({
    content: [],
    ressourceNom: '',
    subtaskLabel: ''
});

const filters = ref({
    teamId: null,
    ressourceId: null,
    taskCode: null,
    subtaskCode: null
});

const loadFiltersData = async () => {
    const [allTeams, allResources, allTasks] = await Promise.all([
        dataService.getTeams(),
        dataService.getResources(),
        dataService.getTasks()
    ]);
    teams.value = allTeams;
    resources.value = allResources;
    tasks.value = allTasks;

    // Extract unique subtasks from performance data or tasks
    // For now, we'll extract them from the performance data after first load
};

const fetchPerformance = async () => {
    loading.value = true;
    try {
        const params = {};
        if (filters.value.teamId) params.teamId = filters.value.teamId;
        if (filters.value.ressourceId) params.ressourceId = filters.value.ressourceId;
        if (filters.value.taskCode) params.taskCode = filters.value.taskCode;
        if (filters.value.subtaskCode) params.subtaskCode = filters.value.subtaskCode;

        performanceData.value = await dataService.getSubtaskPerformance(params);

        // Update subtasks list for filter if not already populated
        if (subtasks.value.length === 0 && performanceData.value.length > 0) {
            const uniqueSubtasks = [];
            const seenCodes = new Set();
            performanceData.value.forEach(item => {
                if (!seenCodes.has(item.subtaskCode)) {
                    seenCodes.add(item.subtaskCode);
                    uniqueSubtasks.push({
                        code: item.subtaskCode,
                        label: item.subtaskLabel
                    });
                }
            });
            subtasks.value = uniqueSubtasks;
        }
    } catch (error) {
        console.error("Error fetching performance data", error);
    } finally {
        loading.value = false;
    }
};

const showDetails = async (row) => {
    detailsLoading.value = true;
    selectedDetails.value = {
        content: [],
        ressourceNom: row.ressourceNom,
        subtaskLabel: row.subtaskLabel
    };
    detailsDialogVisible.value = true;

    try {
        const params = {
            ressourceId: row.ressourceId,
            subtaskCode: row.subtaskCode,
            status: 'COMPLETED',
            size: 100
        };
        const response = await dataService.searchAssignments(params);
        selectedDetails.value.content = response.content || [];
    } catch (error) {
        console.error("Error fetching assignment details", error);
    } finally {
        detailsLoading.value = false;
    }
};

const resetFilters = () => {
    filters.value = {
        teamId: null,
        ressourceId: null,
        taskCode: null,
        subtaskCode: null
    };
    fetchPerformance();
};

onMounted(() => {
    loadFiltersData();
    fetchPerformance();
});

watch(filters, () => {
    fetchPerformance();
}, { deep: true });

const getPerformanceColor = (percent) => {
    if (percent >= 90) return 'success';
    if (percent >= 80) return 'info';
    if (percent >= 70) return 'warning';
    return 'danger';
};

const getPerformanceSeverity = (percent) => {
    if (percent >= 90) return 'success';
    if (percent >= 80) return 'info';
    if (percent >= 70) return 'warning';
    return 'danger';
};

const getEfficienceSeverity = (efficience) => {
    if (efficience >= 100) return 'success';
    if (efficience >= 80) return 'info';
    if (efficience >= 60) return 'warning';
    return 'danger';
};

// Flatten data for the table: Subtask -> Resource
const flattenedData = computed(() => {
    const rows = [];
    performanceData.value.forEach(subtask => {
        subtask.ressources.forEach(res => {
            rows.push({
                subtaskCode: subtask.subtaskCode,
                subtaskLabel: subtask.subtaskLabel,
                parentTasks: subtask.parentTasks.map(t => t.label).join(', '),
                competences: subtask.competences.map(c => c.label).join(', '),
                ...res
            });
        });
    });
    return rows;
});

const expandedRows = ref([]);
</script>

<template>
    <div class="page-layout">
        <TheNavbar />

        <main class="main-content">
            <!-- Header Bar -->
            <div class="header-bar">
                <h1>Analyse Performance</h1>

                <div class="spacer"></div>

                <Select v-model="filters.teamId" :options="teams" optionLabel="name" optionValue="id"
                    placeholder="Équipe" class="team-filter" showClear />

                <Select v-model="filters.ressourceId" :options="resources" optionLabel="nom" optionValue="id"
                    placeholder="Ressource" class="resource-filter" showClear filter />

                <Select v-model="filters.taskCode" :options="tasks" optionLabel="label" optionValue="code"
                    placeholder="Tâche Parente" class="task-filter" showClear filter />

                <Select v-model="filters.subtaskCode" :options="subtasks" optionLabel="label" optionValue="code"
                    placeholder="Sous-tâche" class="subtask-filter" showClear filter />

                <div class="action-buttons">
                    <Button icon="pi pi-refresh" rounded text @click="fetchPerformance" :loading="loading"
                        v-tooltip.top="'Actualiser'" />
                </div>
            </div>

            <section class="data-section">
                <DataTable :value="flattenedData" :loading="loading" stripedRows responsiveLayout="scroll"
                    class="p-datatable-sm custom-table" :paginator="true" :rows="10"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown">

                    <Column field="subtaskLabel" header="Tâche / Sous Tâche" sortable frozen class="font-bold">
                        <template #body="{ data }">
                            <div class="subtask-cell">
                                <div class="task-tags">
                                    <Tag v-for="task in data.parentTasks.split(', ')" :key="task" :value="task"
                                        severity="secondary" class="task-tag" />
                                </div>
                                <span class="subtask-label">{{ data.subtaskLabel }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="ressourceNom" header="Ressource" sortable>
                        <template #body="{ data }">
                            <div class="resource-cell">
                                <span class="name">{{ data.ressourceNom }}</span>
                                <Tag :value="data.teamName" severity="secondary" class="team-tag" />
                            </div>
                        </template>
                    </Column>

                    <Column field="nbAssignments" header="Affectations" sortable class="text-center"
                        headerClass="text-center" />

                    <Column header="Prévu / Réel" class="text-center" headerClass="text-center">
                        <template #body="{ data }">
                            <div class="dual-value-cell">
                                <span class="planned-val" v-tooltip.top="'Prévu'">{{ data.totalPlannedHours.toFixed(2)
                                }}h</span>
                                <span class="separator">/</span>
                                <span class="real-val" v-tooltip.top="'Réel'">{{ data.totalRealHours.toFixed(2)
                                }}h</span>
                            </div>
                        </template>
                    </Column>

                    <Column header="Min / Max" class="text-center" headerClass="text-center">
                        <template #body="{ data }">
                            <div class="min-max-cell">
                                <span class="min-val" v-tooltip.top="'Minimum'">{{ data.minRealHours.toFixed(2)
                                    }}h</span>
                                <span class="separator">/</span>
                                <span class="max-val" v-tooltip.top="'Maximum'">{{ data.maxRealHours.toFixed(2)
                                    }}h</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="avgRealHours" header="Moyenne" sortable class="text-center"
                        headerClass="text-center">
                        <template #body="{ data }">
                            {{ data.avgRealHours.toFixed(2) }}h
                        </template>
                    </Column>

                    <Column field="performancePercent" header="Performance" sortable>
                        <template #body="{ data }">
                            <div class="performance-cell">
                                <div class="perf-info">
                                    <span class="value">{{ data.performancePercent.toFixed(1) }}%</span>
                                    <Button icon="pi pi-info-circle" text rounded
                                        :severity="getPerformanceSeverity(data.performancePercent)" size="small"
                                        @click="showDetails(data)" v-tooltip.top="'Voir détails'" />
                                </div>
                                <ProgressBar :value="data.performancePercent" :showValue="false" style="height: 6px" />
                            </div>
                        </template>
                    </Column>

                    <template #empty>
                        <div class="empty-state">
                            <i class="pi pi-search" style="font-size: 2rem"></i>
                            <p>Aucune donnée de performance trouvée pour ces filtres.</p>
                        </div>
                    </template>
                </DataTable>
            </section>
        </main>

        <!-- Details Dialog -->
        <Dialog v-model:visible="detailsDialogVisible" modal
            :header="'Détails Performance: ' + selectedDetails.ressourceNom" :style="{ width: '80vw' }"
            class="details-dialog">
            <div class="dialog-content">
                <div class="dialog-subheader">
                    <h3>{{ selectedDetails.subtaskLabel }}</h3>
                    <Tag value="COMPLETED" severity="success" />
                </div>

                <DataTable :value="selectedDetails.content" :loading="detailsLoading" stripedRows scrollable
                    scrollHeight="500px" class="p-datatable-sm custom-table" :paginator="true" :rows="10"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown">
                    <Column field="projectNumber" header="N° Commande" sortable class="font-bold" />
                    <Column field="modelName" header="Modèle" sortable />
                    <Column field="createdAt" header="Date" sortable>
                        <template #body="{ data }">
                            {{ new Date(data.createdAt).toLocaleDateString() }}
                        </template>
                    </Column>
                    <Column field="qtePrevue" header="Prévu (h)" sortable class="text-center">
                        <template #body="{ data }">
                            {{ data.qtePrevue.toFixed(2) }}h
                        </template>
                    </Column>
                    <Column field="qteReelle" header="Réel (h)" sortable class="text-center">
                        <template #body="{ data }">
                            {{ data.qteReelle.toFixed(2) }}h
                        </template>
                    </Column>
                    <Column field="ecart" header="Écart" sortable class="text-center">
                        <template #body="{ data }">
                            <span :class="data.ecart >= 0 ? 'text-green-600' : 'text-red-600'">
                                {{ data.ecart.toFixed(2) }}h
                            </span>
                        </template>
                    </Column>
                    <Column field="efficience" header="Efficience" sortable class="text-center">
                        <template #body="{ data }">
                            <Tag :value="data.efficience.toFixed(1) + '%'"
                                :severity="getEfficienceSeverity(data.efficience)" style="min-width: 60px" rounded />
                        </template>
                    </Column>
                </DataTable>
            </div>

        </Dialog>
    </div>
</template>

<style scoped>
.page-layout {
    min-height: 100vh;
    background-color: #f8fafc;
}

.main-content {
    width: 100%;
    padding: 0.5rem 2rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}



.header-bar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
}

.header-bar h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    white-space: nowrap;
}

.spacer {
    flex-grow: 1;
}

.team-filter,
.resource-filter,
.task-filter,
.subtask-filter {
    min-width: 180px;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.data-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.custom-table :deep(.p-datatable-header) {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
}

.custom-table :deep(.p-datatable-thead > tr > th) {
    background: white;
    color: #475569;
    font-weight: 600;
    height: 50px;
    padding: 0.5rem 1rem;
}

.custom-table :deep(.p-column-header-content) {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: #64748b;
}

.custom-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 1rem;
    color: #334155;
}

.subtask-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.task-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.task-tag {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
}

.subtask-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1e293b;
}

.resource-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.resource-cell .name {
    font-weight: 500;
    color: #334155;
}

.team-tag {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
}

.performance-cell {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 120px;
}

.perf-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.perf-info .value {
    font-weight: 700;
    font-size: 0.9375rem;
}

.min-max-cell,
.dual-value-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.875rem;
    font-weight: 600;
}

.min-val {
    color: #10b981;
}

.max-val {
    color: #ef4444;
}

.planned-val {
    color: #64748b;
}

.real-val {
    color: #3b82f6;
    font-weight: 700;
}

.separator {
    color: #cbd5e1;
    font-weight: 400;
}

.empty-state {
    padding: 4rem;
    text-align: center;
    color: #94a3b8;
}

.empty-state p {
    margin-top: 1rem;
}

/* Premium touches */
:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
    background-color: #f8fafc;
}

:deep(.p-progressbar .p-progressbar-value) {
    transition: width 0.5s ease-in-out;
}

:deep(.p-dropdown),
:deep(.p-inputtext) {
    border-color: #e2e8f0;
}

:deep(.p-dropdown:not(.p-disabled).p-focus) {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 0 2px rgba(var(--p-primary-rgb), 0.1);
}

.details-dialog :deep(.p-dialog-content) {
    padding: 0;
}

.dialog-content {
    padding: 0 1.5rem 1.5rem 1.5rem;
}

.dialog-subheader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.dialog-subheader h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1.25rem;
}

:deep(.text-center),
:deep(.text-center .p-column-header-content) {
    justify-content: center !important;
    text-align: center !important;
}

:deep(.text-right),
:deep(.text-right .p-column-header-content) {
    justify-content: flex-end !important;
    text-align: right !important;
}
</style>
