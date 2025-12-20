<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { dataService } from '../services/dataService';
import TheNavbar from '../components/TheNavbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { workloadAssignments } from '../mocks/workload_assignments.js';
import WorkloadKpiCards from '../components/WorkloadKpiCards.vue';
import WorkloadKanbanHeader from '../components/WorkloadKanbanHeader.vue';
import WorkloadKanbanBoard from '../components/WorkloadKanbanBoard.vue';
import * as XLSX from 'xlsx';

const toast = useToast();

const activeTabIndex = ref(0);
const loading = ref(true);
const teams = ref([]);
const resources = ref([]);
const kanbanAssignments = ref([]); // Data for Kanban
const tableAssignments = ref([]); // Data for Table
const totalRecords = ref(0);
const lazyParams = ref({ page: 0, size: 10, sort: null });

const searchQuery = ref('');
const teamFilter = ref(null);
const resourceFilter = ref(null);
const statusFilter = ref(null);
const kanbanExpanded = ref(true);
const yearStats = ref(null);
const currentYear = new Date().getFullYear();
const previousYear = currentYear - 1;
const currentMonth = new Date().getMonth() + 1; // 1-indexed
const monthlyStats = ref({}); // { resourceId: { actualHours, targetHours, achievementRate } }

// Computed Global Stats for KPIs
const globalYearStats = computed(() => {
    if (!yearStats.value || !yearStats.value.statsByYear) return null;

    const statsCurrent = yearStats.value.statsByYear[currentYear] || [];
    const statsPrevious = yearStats.value.statsByYear[previousYear] || [];

    const sumCurrent = statsCurrent.reduce((acc, t) => ({
        planned: acc.planned + t.totalPlannedHours,
        real: acc.real + t.totalRealHours,
        efficiencySum: acc.efficiencySum + t.efficiency,
        count: acc.count + 1
    }), { planned: 0, real: 0, efficiencySum: 0, count: 0 });

    const sumPrevious = statsPrevious.reduce((acc, t) => ({
        planned: acc.planned + t.totalPlannedHours,
        real: acc.real + t.totalRealHours,
        efficiencySum: acc.efficiencySum + t.efficiency,
        count: acc.count + 1
    }), { planned: 0, real: 0, efficiencySum: 0, count: 0 });

    // Calculate Global Efficiency (Average of team efficiencies for now, or Total Real / Total Planned)
    // User data shows efficiency per team. Let's average them for global KPI or use weighted.
    // Simple average for now as per user example structure.
    const effCurrent = sumCurrent.count > 0 ? sumCurrent.efficiencySum / sumCurrent.count : 0;
    const effPrevious = sumPrevious.count > 0 ? sumPrevious.efficiencySum / sumPrevious.count : 0;

    return {
        current: {
            planned: sumCurrent.planned,
            real: sumCurrent.real,
            efficiency: effCurrent
        },
        previous: {
            planned: sumPrevious.planned,
            real: sumPrevious.real,
            efficiency: effPrevious
        }
    };
});

// Helper to get specific team stats for header
const getTeamStats = (teamId) => {
    if (!yearStats.value || !yearStats.value.statsByYear) return null;

    // Ensure we match loosely (string vs number) just in case
    const currentStats = (yearStats.value.statsByYear[currentYear] || []).find(t => String(t.teamId) === String(teamId));
    const previousStats = (yearStats.value.statsByYear[previousYear] || []).find(t => String(t.teamId) === String(teamId));

    if (!currentStats && !previousStats) return null;

    return {
        current: currentStats || { totalPlannedHours: 0, totalRealHours: 0, efficiency: 0 },
        previous: previousStats || { totalPlannedHours: 0, totalRealHours: 0, efficiency: 0 }
    };
};

// Helper to get monthly stats for a resource
const getResourceMonthlyStats = (resourceId) => {
    return monthlyStats.value[resourceId] || { actualHours: 0, targetHours: 0, achievementRate: 0 };
};

// Current month label for display
const currentMonthLabel = computed(() => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[currentMonth - 1]} ${currentYear}`;
});


// Drag and drop state
const draggedTask = ref(null);
const dragSourceResourceId = ref(null);
const dragSourceTeamId = ref(null);
const dropZoneActive = ref(null);

// Helper to load monthly stats for resources
const loadMonthlyStatsForResources = async () => {
    if (!resources.value || resources.value.length === 0) return;

    try {
        // Fetch monthly stats for all resources in parallel
        const statsPromises = resources.value.map(async (resource) => {
            try {
                const data = await dataService.getMonthlyHours({
                    ressourceId: resource.id,
                    year: currentYear,
                    month: currentMonth
                });
                return {
                    resourceId: resource.id,
                    actualHours: data.actualHours || 0,
                    targetHours: data.targetHours || 0,
                    achievementRate: data.achievementRate || 0
                };
            } catch (error) {
                console.error(`Error loading monthly stats for resource ${resource.id}:`, error);
                return {
                    resourceId: resource.id,
                    actualHours: 0,
                    targetHours: 0,
                    achievementRate: 0
                };
            }
        });

        const statsArray = await Promise.all(statsPromises);

        // Convert to map for easy lookup
        const statsMap = {};
        statsArray.forEach(stat => {
            statsMap[stat.resourceId] = stat;
        });

        monthlyStats.value = statsMap;
    } catch (error) {
        console.error('Error loading monthly stats:', error);
    }
};


const loadKanbanData = async () => {
    try {
        // Fetch assignments for Kanban (PLANNED and IN_PROGRESS)
        // We might need to fetch all or use a large page size if API doesn't support "all"
        // Assuming we can fetch a reasonable amount for the board.
        // Or we fetch by team if the dataset is huge, but for now let's try fetching active tasks.

        // Strategy: Fetch PLANNED and IN_PROGRESS separately or together if API supports IN operator
        // User example showed single status. Let's try fetching both.
        const [planned, inProgress, stats] = await Promise.all([
            dataService.searchAssignments({ status: 'PLANNED', size: 1000 }), // Adjust size as needed
            dataService.searchAssignments({ status: 'IN_PROGRESS', size: 1000 }),
            dataService.getTeamYearStats(currentYear)
        ]);

        yearStats.value = stats;

        const allActive = [...(planned.content || []), ...(inProgress.content || [])];

        // Map API data to internal format for Kanban
        kanbanAssignments.value = allActive.map(mapAssignment);

        // Load monthly stats for each resource
        await loadMonthlyStatsForResources();

    } catch (error) {
        console.error('Error loading Kanban data:', error);
    }
};

const loadTableData = async () => {
    loading.value = true;
    try {
        const params = {
            page: lazyParams.value.page,
            size: lazyParams.value.size,
            sort: lazyParams.value.sort,
            teamId: teamFilter.value,
            ressourceId: resourceFilter.value,
            status: statusFilter.value,
            search: searchQuery.value
        };

        console.log('DEBUG: Loading table data with params:', params);
        const response = await dataService.searchAssignments(params);
        console.log('DEBUG: Table API Response:', response);

        if (response && response.content) {
            tableAssignments.value = response.content.map(mapAssignment);
            totalRecords.value = response.totalElements;
        } else {
            tableAssignments.value = [];
            totalRecords.value = 0;
        }

    } catch (error) {
        console.error('Error loading table data:', error);
    } finally {
        loading.value = false;
    }
};

const mapAssignment = (apiAssignment) => {
    return {
        id: apiAssignment.id,
        resourceId: apiAssignment.ressourceId,
        resourceCode: apiAssignment.ressourceId, // Assuming ID is the code based on mock
        resourceName: apiAssignment.nomRessource,
        teamId: apiAssignment.teamId,
        teamName: apiAssignment.teamName,
        projectCode: apiAssignment.taskCode, // Keep taskCode if needed for other things, or replace usage
        projectNumber: apiAssignment.projectNumber,
        modelName: apiAssignment.modelName,
        modelName: apiAssignment.modelName,
        subTaskId: apiAssignment.subtaskId,
        taskName: apiAssignment.taskLabel,
        subTaskName: apiAssignment.subtaskLabel,
        plannedHours: apiAssignment.qtePrevue,
        workedHours: apiAssignment.qteReelle,
        status: apiAssignment.status === 'PLANNED' ? 'Planifié' :
            apiAssignment.status === 'IN_PROGRESS' ? 'En cours' :
                apiAssignment.status === 'COMPLETED' ? 'Terminé' : apiAssignment.status,
        gap: apiAssignment.ecart,
        efficiency: apiAssignment.efficience
    };
};

const loadReferenceData = async () => {
    try {
        const [teamsData, resourcesData] = await Promise.all([
            dataService.getTeams(),
            dataService.getResources()
        ]);
        teams.value = teamsData;
        resources.value = resourcesData;
    } catch (error) {
        console.error('Error loading reference data:', error);
    }
};

const onPage = (event) => {
    lazyParams.value = { ...lazyParams.value, page: event.page, size: event.rows };
    loadTableData();
};

const onSort = (event) => {
    // Map PrimeVue sort field to API sort field if needed
    const field = event.sortField === 'resourceName' ? 'nomRessource' : event.sortField;
    const order = event.sortOrder === 1 ? 'asc' : 'desc';
    lazyParams.value = { ...lazyParams.value, sort: `${field},${order}` };
    loadTableData();
};

// Watchers for filters
watch([teamFilter, resourceFilter, statusFilter], () => {
    lazyParams.value.page = 0; // Reset to first page
    loadTableData();
});

// Debounce search
let searchTimeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.page = 0;
        loadTableData();
    }, 300);
});

onMounted(async () => {
    await loadReferenceData();
    loadKanbanData();
    loadTableData();
});

// Removed filteredAssignments computed as we use server-side filtering now
// But we need to update the template to use tableAssignments

// Liste unique des ressources pour le filtre
// Liste unique des ressources pour le filtre (already populated from API)
const uniqueResources = computed(() => {
    if (teamFilter.value) {
        return resources.value.filter(r => r.teamId === teamFilter.value);
    }
    return resources.value;
});

// Options de statut
// Options de statut (Updated values to match API expectations if needed, but UI labels remain French)
const statusOptions = [
    { label: 'En cours', value: 'IN_PROGRESS' },
    { label: 'Planifié', value: 'PLANNED' },
    { label: 'Terminé', value: 'COMPLETED' }
];

// KPIs
// KPIs (Need to be recalculated based on kanbanAssignments or fetched separately)
// For now, let's base them on the loaded Kanban data (Active Workload)
const totalResources = computed(() => {
    const unique = new Set(kanbanAssignments.value.map(a => a.resourceId));
    return unique.size;
});
const totalPlannedHours = computed(() => Math.round(kanbanAssignments.value.reduce((sum, a) => sum + a.plannedHours, 0)));
const totalWorkedHours = computed(() => Math.round(kanbanAssignments.value.reduce((sum, a) => sum + a.workedHours, 0)));
const efficiency = computed(() => {
    // Global efficiency based on loaded data
    return totalPlannedHours.value > 0
        ? Math.round(((totalPlannedHours.value - totalWorkedHours.value) / totalPlannedHours.value) * 100)
        : 0;
});

const getStatusSeverity = (status) => {
    if (status === 'Terminé') return 'success';
    if (status === 'En cours') return 'warn';
    return 'secondary';
};

const getGapClass = (gap) => {
    if (gap > 0) return 'gap-positive';
    if (gap < 0) return 'gap-negative';
    return 'gap-neutral';
};

const getEfficiencyClass = (eff) => {
    if (eff > 0) return 'eff-positive';
    if (eff < 0) return 'eff-negative';
    return 'eff-neutral';
};

// Drag and Drop handlers
const handleDragStart = (task, resourceId, teamId) => {
    // Only allow dragging planned tasks
    if (task.status !== 'Planifié') {
        return;
    }

    draggedTask.value = task;
    dragSourceResourceId.value = resourceId;
    dragSourceTeamId.value = teamId;
};

const handleDragOver = (event, targetResourceId, targetTeamId) => {
    // Prevent default to allow drop
    event.preventDefault();

    // Only allow drop in the same team
    if (draggedTask.value && dragSourceTeamId.value === targetTeamId) {
        dropZoneActive.value = targetResourceId;
        event.dataTransfer.dropEffect = 'move';
    } else {
        event.dataTransfer.dropEffect = 'none';
    }
};

const handleDragLeave = () => {
    dropZoneActive.value = null;
};

const handleDragEnd = () => {
    draggedTask.value = null;
    dragSourceResourceId.value = null;
    dragSourceTeamId.value = null;
    dropZoneActive.value = null;
};

const handleDrop = async (event, targetResourceId, targetTeamId) => {
    event.preventDefault();
    dropZoneActive.value = null;

    if (!draggedTask.value || !dragSourceResourceId.value) {
        return;
    }

    // Verify same team
    if (dragSourceTeamId.value !== targetTeamId) {
        console.warn('Cannot reassign task to a different team');
        handleDragEnd();
        return;
    }

    // Verify different resource
    if (dragSourceResourceId.value === targetResourceId) {
        handleDragEnd();
        return;
    }

    // Find the task in assignments and update it
    const taskIndex = kanbanAssignments.value.findIndex(a => a.id === draggedTask.value.id);
    if (taskIndex !== -1) {
        // Find target resource name from the team resources
        const targetTeam = teamResourceView.value.find(t =>
            Object.values(t.resources).some(r => r.resourceCode === targetResourceId)
        );

        if (targetTeam) {
            const targetResource = Object.values(targetTeam.resources).find(r =>
                r.resourceCode === targetResourceId
            );

            if (targetResource) {
                // Capture necessary data before async call because draggedTask.value might be cleared by dragend event
                const taskId = draggedTask.value.id;
                const taskName = draggedTask.value.subTaskName;
                const sourceResId = dragSourceResourceId.value;

                try {
                    // Call API to update assignment
                    const updatedAssignment = await dataService.reassignResource(taskId, targetResourceId);

                    // Update the assignment in local state
                    // We need to find the index again or ensure we have the right one. 
                    // Since we are inside the function, taskIndex is still valid for the array state 
                    // unless the array mutated significantly (unlikely in this short time).
                    if (kanbanAssignments.value[taskIndex]) {
                        kanbanAssignments.value[taskIndex].resourceId = targetResourceId;
                        kanbanAssignments.value[taskIndex].resourceCode = targetResourceId;
                        kanbanAssignments.value[taskIndex].resourceName = targetResource.resourceName;
                    }

                    toast.add({ severity: 'success', summary: 'Succès', detail: 'Affectation mise à jour', life: 3000 });
                    console.log(`Task "${taskName}" reassigned from resource ${sourceResId} to ${targetResourceId}`);

                } catch (error) {
                    console.error('Reassignment failed:', error);
                    let errorMessage = 'Erreur lors de la réaffectation';

                    if (error.response) {
                        switch (error.response.status) {
                            case 404:
                                errorMessage = "L'affectation ou la ressource n'existe pas.";
                                break;
                            case 400:
                                errorMessage = "Statut invalide ou équipes différentes.";
                                break;
                            case 409:
                                errorMessage = "La ressource est déjà affectée à cette sous-tâche.";
                                break;
                            default:
                                errorMessage = "Une erreur inattendue s'est produite.";
                        }
                    }
                    toast.add({ severity: 'error', summary: 'Erreur', detail: errorMessage, life: 5000 });
                }
            }
        }
    }

    // We don't need to call handleDragEnd here because the @dragend event on the element will trigger it.
    // Calling it here might be redundant or cause issues if we wanted to keep state, 
    // but cleaning up is fine. However, since it's async, the dragend event likely already fired.
    handleDragEnd();
};

const exportToExcel = () => {
    const activeTeam = teamResourceView.value[activeTabIndex.value];
    if (!activeTeam) return;

    const data = [];
    // Header Row
    data.push([
        'Ressource',
        'Projet',
        'Tâche',
        'Sous-tâche',
        'Statut',
        'Heures Prévues',
        'Heures Réelles',
        'Progression (%)'
    ]);

    // Data Rows
    Object.values(activeTeam.resources).forEach(resource => {
        resource.tasks.forEach(task => {
            data.push([
                resource.resourceName,
                task.projectNumber,
                task.taskName || 'N/A',
                task.subTaskName,
                task.status,
                task.plannedHours,
                task.workedHours,
                task.plannedHours > 0 ? Math.round((task.workedHours / task.plannedHours) * 100) : 0
            ]);
        });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Workload');

    // Auto-size columns
    const colWidths = data[0].map((_, i) => ({
        wch: Math.max(...data.map(row => row[i] ? row[i].toString().length : 0)) + 2
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Workload_${activeTeam.teamName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.add({
        severity: 'success',
        summary: 'Export Réussi',
        detail: `Le rapport pour l'équipe ${activeTeam.teamName} a été généré.`,
        life: 3000
    });
};

const formatNumber = (val) => {
    if (val === null || val === undefined) return '0';
    return Math.round(val).toLocaleString('fr-FR').replace(/\u00a0/g, ' ');
};

// Vue kanban par équipe et ressource
const teamResourceView = computed(() => {
    const grouped = {};

    // Grouper par équipe
    teams.value.forEach(team => {
        grouped[team.id] = {
            teamId: team.id,
            teamName: team.name,
            resources: {}
        };
    });

    // Ajouter les ressources et leurs tâches (En cours ou Planifié uniquement)
    kanbanAssignments.value
        .filter(a => a.status === 'En cours' || a.status === 'Planifié')
        .forEach(assignment => {
            if (grouped[assignment.teamId]) {
                if (!grouped[assignment.teamId].resources[assignment.resourceId]) {
                    grouped[assignment.teamId].resources[assignment.resourceId] = {
                        resourceCode: assignment.resourceCode,
                        resourceName: assignment.resourceName,
                        tasks: [],
                        totalPlanned: 0,
                        totalReal: 0,
                        plannedCount: 0,
                        inProgressCount: 0
                    };
                }
                grouped[assignment.teamId].resources[assignment.resourceId].tasks.push(assignment);
                grouped[assignment.teamId].resources[assignment.resourceId].totalPlanned += assignment.plannedHours;
                grouped[assignment.teamId].resources[assignment.resourceId].totalReal += assignment.workedHours;

                // Count by status
                if (assignment.status === 'Planifié') {
                    grouped[assignment.teamId].resources[assignment.resourceId].plannedCount++;
                } else if (assignment.status === 'En cours') {
                    grouped[assignment.teamId].resources[assignment.resourceId].inProgressCount++;
                }
            }
        });

    const result = Object.values(grouped).filter(team => Object.keys(team.resources).length > 0);
    console.log('TeamResourceView result:', result);
    return result;
});
</script>

<template>
    <div class="page-layout">
        <Toast />
        <TheNavbar />

        <main class="main-content">
            <!-- KPI Cards -->
            <WorkloadKpiCards :globalYearStats="globalYearStats" :currentYear="currentYear" :previousYear="previousYear"
                :totalResources="totalResources" :totalPlannedHours="totalPlannedHours"
                :totalWorkedHours="totalWorkedHours" :efficiency="efficiency" :formatNumber="formatNumber" />


            <!-- Vue Kanban par Équipe/Ressource -->
            <WorkloadKanbanHeader :activeTeam="teamResourceView[activeTabIndex]"
                :teamStats="getTeamStats(teamResourceView[activeTabIndex]?.teamId)" :teams="teamResourceView"
                :activeTabIndex="activeTabIndex" :isExpanded="kanbanExpanded" :currentYear="currentYear"
                :formatNumber="formatNumber" @update:activeTabIndex="activeTabIndex = $event"
                @update:isExpanded="kanbanExpanded = $event" @export-excel="exportToExcel" />

            <!-- Vue Kanban par Équipe/Ressource (Collapsible) -->
            <transition name="kanban-slide">
                <div v-show="kanbanExpanded" class="kanban-section">
                    <!-- Content: Active Team Swimlanes -->
                    <WorkloadKanbanBoard v-if="teamResourceView[activeTabIndex]"
                        :activeTeam="teamResourceView[activeTabIndex]" :monthLabel="currentMonthLabel"
                        :getResourceMonthlyStats="getResourceMonthlyStats" :draggedTask="draggedTask"
                        :dropZoneActive="dropZoneActive"
                        @dragstart="handleDragStart($event.task, $event.resourceCode, teamResourceView[activeTabIndex].teamName)"
                        @dragend="handleDragEnd"
                        @dragover="handleDragOver($event.event, $event.resourceCode, teamResourceView[activeTabIndex].teamName)"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop($event.event, $event.resourceCode, teamResourceView[activeTabIndex].teamName)" />
                </div>
            </transition>

            <!-- Table -->
            <div class="table-card">
                <div class="table-header">
                    <h3 class="table-title">Tableau de Chargement Détaillé</h3>
                    <div class="table-filters">
                        <InputText v-model="searchQuery" placeholder="Rechercher..." class="search-input" />
                        <Dropdown v-model="teamFilter" :options="teams" optionLabel="name" optionValue="id"
                            placeholder="Toutes les équipes" showClear class="team-filter" />
                        <Dropdown v-model="resourceFilter" :options="uniqueResources" optionLabel="nom" optionValue="id"
                            placeholder="Toutes les ressources" showClear class="resource-filter" />
                        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label"
                            optionValue="value" placeholder="Tous les statuts" showClear class="status-filter" />
                    </div>
                </div>

                <DataTable :value="tableAssignments" :loading="loading" stripedRows class="assignments-table"
                    sortField="resourceName" :sortOrder="1" :paginator="true" :rows="lazyParams.size"
                    :totalRecords="totalRecords" :lazy="true" @page="onPage" @sort="onSort"
                    :rowsPerPageOptions="[10, 20, 50]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} affectations">

                    <Column field="resourceName" header="Ressource" sortable style="width: 200px">
                        <template #body="{ data }">
                            <div class="resource-name-cell">{{ data.resourceName }}</div>
                        </template>
                    </Column>

                    <Column field="projectNumber" header="Commande" sortable style="width: 180px">
                        <template #body="{ data }">
                            <span class="font-semibold">{{ data.projectNumber }}</span>
                            <div v-if="data.modelName" class="text-sm text-gray-500">{{ data.modelName }}</div>
                        </template>
                    </Column>

                    <Column field="subTaskName" header="Sous Taches" sortable style="min-width: 180px"></Column>

                    <Column field="plannedHours" header="Qte Prévu" sortable style="width: 120px">
                        <template #body="{ data }">
                            <span class="qty-value">{{ Number(data.plannedHours).toFixed(2) }}</span>
                        </template>
                    </Column>

                    <Column field="workedHours" header="Qte Présté" sortable style="width: 120px">
                        <template #body="{ data }">
                            <span class="qty-value">{{ Number(data.workedHours).toFixed(2) }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Statut" sortable style="width: 130px">
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" class="status-tag" />
                        </template>
                    </Column>

                    <Column field="gap" header="Ecart" sortable style="width: 100px">
                        <template #body="{ data }">
                            <span v-if="data.gap !== null" :class="getGapClass(data.gap)" class="gap-value">
                                {{ data.gap > 0 ? '+' + Number(data.gap).toFixed(2) : Number(data.gap).toFixed(2) }}
                            </span>
                            <span v-else class="gap-na">-</span>
                        </template>
                    </Column>

                    <Column field="efficiency" header="Efficience" sortable style="width: 120px">
                        <template #body="{ data }">
                            <span v-if="data.efficiency !== null" :class="getEfficiencyClass(data.efficiency)"
                                class="efficiency-value">
                                {{ data.efficiency > 0 ? '+' + Number(data.efficiency).toFixed(2) :
                                    Number(data.efficiency).toFixed(2) }}%
                            </span>
                            <span v-else class="eff-na">-</span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </main>
    </div>
</template>

<style scoped>
.page-layout {
    min-height: 100vh;
    background: #f8fafc;
}

.main-content {
    max-width: 100%;
    margin: 0 auto;
    padding: 1.5rem 2.5rem;
}

/* Table Card */
.table-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f1f5f9;
    overflow: hidden;
}

.table-header {
    padding: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.table-filters {
    display: flex;
    gap: 1rem;
}

.search-input,
.team-filter,
.resource-filter,
.status-filter {
    min-width: 200px;
}

:deep(.assignments-table) {
    border: none;
}

:deep(.assignments-table .p-datatable-thead > tr > th) {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

:deep(.assignments-table .p-datatable-tbody > tr > td) {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
}

:deep(.assignments-table .p-datatable-tbody > tr:hover) {
    background: #f8fafc;
}

.resource-code,
.resource-name-cell {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.875rem;
}

.qty-value {
    font-weight: 600;
    color: #475569;
    font-size: 0.875rem;
}

.status-tag {
    font-weight: 600;
    font-size: 0.75rem;
}

.gap-value,
.efficiency-value {
    font-weight: 700;
    font-size: 0.875rem;
}

.gap-positive {
    color: #10b981;
}

.gap-negative {
    color: #ef4444;
}

.gap-neutral {
    color: #64748b;
}

.eff-positive {
    color: #10b981;
}

.eff-negative {
    color: #ef4444;
}

.eff-neutral {
    color: #64748b;
}

.gap-na,
.eff-na {
    color: #94a3b8;
    font-style: italic;
}

/* Kanban Toggle */
.kanban-toggle-section {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
}

.kanban-toggle-btn {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.kanban-toggle-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.kanban-toggle-btn i {
    font-size: 0.75rem;
    color: #64748b;
}

/* Kanban Transition */
.kanban-slide-enter-active,
.kanban-slide-leave-active {
    transition: all 0.3s ease;
    max-height: 2000px;
    overflow: hidden;
}

.kanban-slide-enter-from,
.kanban-slide-leave-to {
    max-height: 0;
    opacity: 0;
    margin-bottom: 0;
}

/* Kanban Vue */
.kanban-section {
    margin-bottom: 2rem;
    /* Removed grid layout for TabView */
}

.team-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f1f5f9;
    overflow: hidden;
}

/* Team header styles removed as we use TabView headers */

/* Media Queries */
@media (max-width: 1200px) {
    .kanban-section {
        grid-template-columns: 1fr;
    }

    .resources-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
}
</style>
