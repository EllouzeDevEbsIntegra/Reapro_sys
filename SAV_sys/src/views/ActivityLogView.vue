<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { dataService } from '../services/dataService';
import TheNavbar from '../components/TheNavbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import Card from 'primevue/card';
import ToggleSwitch from 'primevue/toggleswitch';

const toast = useToast();
const confirm = useConfirm();

// Data State
const logs = ref([]);
const totalRecords = ref(0);
const resources = ref([]);
const assignments = ref([]);
const projects = ref([]);
const tasks = ref([]);
const loading = ref(true);

// Pagination & Filter State
const lazyParams = ref({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'dateHeureDebut',
    sortOrder: -1
});

// Active Session State
const activeLog = ref(null);
const activeSessionDuration = ref('00:00:00');
let timerInterval = null;

// Search and Filter State
const searchQuery = ref('');

// Initialize dates to current month (1st to last day)
const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const startDate = ref(firstDayOfMonth);
const endDate = ref(lastDayOfMonth);
const resourceFilter = ref(null);
const statusFilter = ref(null); // null=All, true=Closed, false=In Progress

const statusOptions = [
    { label: 'Tout', value: null },
    { label: 'Clôturé', value: true },
    { label: 'En cours', value: false }
];

// Dialog State
const logDialog = ref(false);
const deleteLogDialog = ref(false);
const startWorkDialog = ref(false);
const stopWorkDialog = ref(false);

// Form State
const log = ref({
    date: new Date(),
    startTime: null,
    endTime: null,
    cloture: false
});
const submitted = ref(false);
const newSession = ref({});
const dynamicAssignments = ref([]);
const loadingAssignments = ref(false);

const loadData = async () => {
    loading.value = true;
    try {
        // Prepare params for API
        const params = {
            page: lazyParams.value.page,
            size: lazyParams.value.rows,
            sort: `${lazyParams.value.sortField},${lazyParams.value.sortOrder === 1 ? 'asc' : 'desc'}`,
            ressourceId: resourceFilter.value,
            cloture: statusFilter.value
        };

        if (startDate.value) {
            const start = new Date(startDate.value);
            start.setHours(0, 0, 0, 0);
            params.dateFrom = start.toISOString();
        }
        if (endDate.value) {
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59, 999);
            params.dateTo = end.toISOString();
        }

        // Parallel fetch for reference data
        const [logsResponse, allResources, allAssignments, allProjects, allTasks, allCompositions] = await Promise.all([
            dataService.getDailyLogs(params),
            dataService.getResources(),
            dataService.getResourceAssignments(),
            dataService.getProjects(),
            dataService.getTasks(),
            dataService.getProjectCompositions()
        ]);

        // Handle API response format { content: [], totalElements: 0 }
        const logsList = logsResponse.content || [];
        totalRecords.value = logsResponse.totalElements || 0;

        resources.value = allResources;

        const projectsList = allProjects.content || allProjects || [];
        projects.value = projectsList;
        tasks.value = allTasks;

        // Enrich assignments with subtask and project details
        const projectsMap = new Map(projectsList.map(p => [p.id, p]));
        const compositionsMap = new Map(allCompositions.map(c => [c.id, c]));

        assignments.value = allAssignments.map(a => {
            const composition = compositionsMap.get(a.projectCompositionId);
            const project = composition ? projectsMap.get(composition.projectId) : null;
            return {
                ...a,
                subtaskName: composition ? composition.name : 'Tâche inconnue',
                projectName: project ? project.name : 'Projet inconnu'
            };
        });

        // Enrich logs with names
        logs.value = logsList.map(l => {
            const resource = resources.value.find(r => r.id === l.ressourceId); // API uses ressourceId
            const assignment = assignments.value.find(a => a.id === l.assignmentId);
            const project = assignment ? projects.value.find(p => p.id === assignment.projectId) : null;

            // Calculate hours from minutes if not provided and format to 2 decimals
            let hours = l.dureeHeures;
            if (hours === undefined || hours === null) {
                hours = l.dureeMinutes ? l.dureeMinutes / 60 : 0;
            }
            // Ensure 2 decimal places
            hours = Number(hours).toFixed(2);

            return {
                ...l,
                resourceName: l.ressourceNom || (resource ? resource.nom : 'Inconnu'),
                projectName: l.projectNumber || (project ? project.name : 'N/A'),
                assignmentStatus: l.assignmentStatus || (assignment ? assignment.status : 'N/A'),
                assignmentRef: l.assignmentId,
                hours: hours,
                description: l.subtaskDescription || l.description || (assignment ? assignment.subtaskName : 'Pointage')
            };
        });

    } catch (error) {
        console.error('Failed to load data', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const onPage = (event) => {
    lazyParams.value = event;
    loadData();
};

const onSort = (event) => {
    lazyParams.value = event;
    loadData();
};

onMounted(() => {
    loadData();
});

// Watch filters to reload data
watch([startDate, endDate, resourceFilter, statusFilter], () => {
    lazyParams.value.first = 0;
    lazyParams.value.page = 0;
    loadData();
});

// Manual Filtering Logic (Not used as filtering is handled in loadData)

// Calcul automatique des heures travaillées
const calculatedHours = computed(() => {
    if (!log.value.startTime || !log.value.endTime) return 0;
    const diff = log.value.endTime.getTime() - log.value.startTime.getTime();
    if (diff <= 0) return 0;
    return (diff / (1000 * 60 * 60)).toFixed(2);
});

// Helper pour formater en ISO combiné (Date + Heure)
const formatToISO = (date, time) => {
    if (!date || !time) return null;
    const d = new Date(date);
    const t = new Date(time);
    d.setHours(t.getHours(), t.getMinutes(), 0, 0);
    // Use local time but format as ISO-like string for the API
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Filter assignments for manual entry based on selected resource
const filteredAssignmentsForLog = computed(() => {
    if (!log.value.resourceId) return [];
    return assignments.value.filter(a =>
        a.resourceId === log.value.resourceId &&
        ['PLANNED', 'IN_PROGRESS', 'Planifié', 'En cours'].includes(a.status)
    );
});

// Clear assignment when resource changes and load dynamic assignments
watch(() => log.value.resourceId, async (newResourceId) => {
    log.value.assignmentId = null;
    dynamicAssignments.value = [];

    if (newResourceId) {
        loadingAssignments.value = true;
        try {
            // Call API: status=PLANNED as requested
            const response = await dataService.searchAssignments({
                ressourceId: newResourceId,
                status: 'PLANNED'
            });

            // The API returns a list of assignments, we need to enrich them for display if needed
            // But searchAssignments already returns enriched data in some cases or we can map it
            dynamicAssignments.value = (response.content || response || []).map(a => {
                const subtaskName = a.subtaskLabel || a.subtaskName || a.compositionName || 'Tâche inconnue';
                const projectName = a.projectNumber || a.projectName || 'Projet inconnu';
                return {
                    ...a,
                    subtaskName,
                    projectName,
                    displayName: `${projectName} - ${subtaskName}`
                };
            });
        } catch (error) {
            console.error('Error loading assignments for resource:', error);
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les affectations', life: 3000 });
        } finally {
            loadingAssignments.value = false;
        }
    }
});

// --- Start / Stop Work Logic ---

const openStartWorkDialog = () => {
    newSession.value = { resourceId: resourceFilter.value || null, assignmentId: null };
    startWorkDialog.value = true;
};

const startWork = async () => {
    if (!newSession.value.assignmentId) {
        toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez sélectionner une affectation', life: 3000 });
        return;
    }

    try {
        const response = await dataService.startDailyLog(newSession.value.assignmentId);
        activeLog.value = response;
        startTimer(response.dateHeureDebut);
        startWorkDialog.value = false;
        toast.add({ severity: 'success', summary: 'Travail démarré', detail: 'Bon courage !', life: 3000 });
        loadData(); // Refresh list
    } catch (error) {
        if (error.response && error.response.status === 409) {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Un pointage est déjà en cours sur cette affectation', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de démarrer le pointage', life: 3000 });
        }
    }
};

const openStopWorkDialog = () => {
    stopWorkDialog.value = true;
};

const stopWork = async (cloture) => {
    if (!activeLog.value) return;

    try {
        await dataService.stopDailyLog(activeLog.value.id, cloture);

        if (timerInterval) clearInterval(timerInterval);
        activeLog.value = null;
        stopWorkDialog.value = false;

        const detail = cloture ? 'Affectation terminée' : 'Travail mis en pause';
        toast.add({ severity: 'success', summary: 'Travail arrêté', detail: detail, life: 3000 });
        loadData(); // Refresh list
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'arrêter le pointage', life: 3000 });
    }
};

// --- CRUD Logic (Legacy) ---

const openNew = () => {
    log.value = {
        date: new Date(),
        startTime: null,
        endTime: null,
        cloture: false,
        resourceId: resourceFilter.value || null
    };
    submitted.value = false;
    logDialog.value = true;
};

const hideDialog = () => {
    logDialog.value = false;
    submitted.value = false;
};

const saveLog = async () => {
    submitted.value = true;

    const isValid = log.value.resourceId &&
        log.value.assignmentId &&
        log.value.date &&
        log.value.startTime &&
        log.value.endTime;

    if (isValid) {
        try {
            const payload = {
                assignmentId: log.value.assignmentId,
                dateHeureDebut: formatToISO(log.value.date, log.value.startTime),
                dateHeureFin: formatToISO(log.value.date, log.value.endTime),
                cloture: log.value.cloture || false
            };

            if (log.value.id) {
                // Update existing log using PATCH manual
                await dataService.updateManualDailyLog(log.value.id, payload, log.value.version);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Pointage mis à jour', life: 3000 });
            } else {
                // Create new manual log
                await dataService.createManualDailyLog(payload);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Pointage manuel enregistré', life: 3000 });
            }
            logDialog.value = false;
            loadData();
        } catch (error) {
            console.error('Error saving manual log:', error);
            if (error.response && error.response.status === 412) {
                toast.add({
                    severity: 'error',
                    summary: 'Conflit de version',
                    detail: 'Ce pointage a été modifié par un autre utilisateur. Veuillez rafraîchir la page.',
                    life: 5000
                });
            } else {
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde', life: 3000 });
            }
        }
    }
};

const editLog = (item) => {
    // Convert ISO strings to Date objects for the form
    const startDate = new Date(item.dateHeureDebut);
    const endDate = item.dateHeureFin ? new Date(item.dateHeureFin) : null;

    log.value = {
        ...item,
        date: startDate,
        startTime: startDate,
        endTime: endDate,
        cloture: item.cloture || false,
        resourceId: item.ressourceId,
        assignmentId: item.assignmentId,
        version: item.version // Store version for If-Match
    };
    logDialog.value = true;
};

const confirmDeleteLog = (item) => {
    log.value = item;
    deleteLogDialog.value = true;
};

const deleteLog = async () => {
    try {
        await dataService.deleteDailyLog(log.value.id);
        deleteLogDialog.value = false;
        log.value = {};
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Log supprimé', life: 3000 });
        loadData();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression', life: 3000 });
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'Terminé': return 'success';
        case 'En cours': return 'info';
        case 'Planifié': return 'warning';
        case 'Annulé': return 'danger';
        default: return null;
    }
};
</script>

<template>
    <div class="page-layout">
        <TheNavbar />
        <Toast />
        <ConfirmDialog />

        <main class="main-content">
            <!-- Active Session Card -->
            <div v-if="activeLog" class="mb-4">
                <Card class="active-session-card border-left-3 border-primary-500">
                    <template #title>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-clock text-primary-500 text-xl"></i>
                            <span class="text-xl font-bold text-primary-900">Pointage en cours</span>
                            <Tag value="En cours" severity="info" class="ml-2" />
                        </div>
                    </template>
                    <template #content>
                        <div class="flex flex-column md:flex-row justify-content-between align-items-center gap-4">
                            <div class="flex flex-column gap-1">
                                <span class="text-gray-600">Ressource: <span class="font-semibold text-gray-900">{{
                                    activeLog.ressourceNom }}</span></span>
                                <span class="text-gray-600">Début: <span class="font-semibold text-gray-900">{{ new
                                    Date(activeLog.dateHeureDebut).toLocaleTimeString() }}</span></span>
                            </div>
                            <div class="text-4xl font-mono font-bold text-primary-600">
                                {{ activeSessionDuration }}
                            </div>
                            <div class="flex gap-2">
                                <Button label="Pause" icon="pi pi-pause" severity="warning"
                                    @click="openStopWorkDialog" />
                                <Button label="Terminer" icon="pi pi-check-circle" severity="info"
                                    @click="stopWork(true)" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Header -->
            <div class="header-bar">
                <h1>Journal d'Activité</h1>

                <!-- Note: Global search is currently client-side only or requires API update -->
                <!-- <IconField iconPosition="left" class="search-field">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="searchQuery" placeholder="Rechercher..." />
                </IconField> -->

                <div class="spacer"></div>

                <DatePicker v-model="startDate" placeholder="Date début" showIcon class="date-filter"
                    dateFormat="dd/mm/yy" />
                <DatePicker v-model="endDate" placeholder="Date fin" showIcon class="date-filter" dateFormat="dd/mm/yy"
                    :minDate="startDate" />

                <Select v-model="resourceFilter" :options="resources" optionLabel="nom" optionValue="id"
                    placeholder="Ressource" class="resource-filter" showClear filter />

                <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value"
                    placeholder="Statut" class="status-filter" showClear />

                <div class="action-buttons">
                    <Button label="Démarrer" icon="pi pi-play" severity="info" @click="openStartWorkDialog"
                        :disabled="!!activeLog" />
                    <Button label="Saisie Manuelle" icon="pi pi-plus" outlined @click="openNew" />
                </div>
            </div>

            <!-- DataTable -->
            <DataTable :value="logs" :lazy="true" :paginator="true" :rows="10" :totalRecords="totalRecords"
                :loading="loading" @page="onPage" @sort="onSort" dataKey="id" class="data-table" stripedRows
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} pointages"
                sortField="dateHeureDebut" :sortOrder="-1">

                <template #empty>
                    <div class="text-center p-4 text-gray-500">
                        <i class="pi pi-calendar-times text-4xl mb-2"></i>
                        <p>Aucun pointage trouvé.</p>
                    </div>
                </template>

                <Column field="dateHeureDebut" header="Date" sortable dataType="date" style="min-width: 10rem">
                    <template #body="{ data }">
                        {{ new Date(data.dateHeureDebut).toLocaleDateString() }}
                        {{ new Date(data.dateHeureDebut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }}
                    </template>
                </Column>

                <Column field="resourceName" header="Ressource" sortable style="min-width: 10rem"></Column>

                <Column field="projectName" header="Commande" sortable style="min-width: 10rem"></Column>

                <Column field="description" header="Description / Tâche" style="min-width: 15rem"></Column>

                <Column field="hours" header="Heures" sortable style="min-width: 6rem">
                    <template #body="{ data }">
                        <span class="font-bold">{{ data.hours }} h</span>
                    </template>
                </Column>

                <Column field="assignmentStatus" header="Statut" sortable style="min-width: 8rem">
                    <template #body="{ data }">
                        <Tag :value="data.assignmentStatus" :severity="getStatusLabel(data.assignmentStatus)" />
                    </template>
                </Column>

                <Column :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editLog(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteLog(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>

            <!-- Start Work Dialog -->
            <Dialog v-model:visible="startWorkDialog" :style="{ width: '450px' }" header="Démarrer une tâche"
                :modal="true" class="p-fluid">
                <div class="field mb-4">
                    <label for="start-assignment" class="font-bold block mb-2">Affectation à démarrer</label>
                    <Select id="start-assignment" v-model="newSession.assignmentId" :options="assignments"
                        optionLabel="id" optionValue="id" placeholder="Sélectionner une affectation" filter
                        class="w-full">
                        <template #option="slotProps">
                            <div class="flex flex-column">
                                <span class="font-bold">{{ slotProps.option.subtaskName || 'Tâche inconnue' }}</span>
                                <span class="text-sm text-gray-500">{{ slotProps.option.resourceName }} - {{
                                    slotProps.option.projectName }}</span>
                            </div>
                        </template>
                    </Select>
                </div>
                <template #footer>
                    <Button label="Annuler" icon="pi pi-times" text @click="startWorkDialog = false" />
                    <Button label="Démarrer" icon="pi pi-play" severity="info" @click="startWork"
                        :disabled="!newSession.assignmentId" />
                </template>
            </Dialog>

            <!-- Manual Log Dialog -->
            <Dialog v-model:visible="logDialog" :style="{ width: '500px' }" header="Détails du Pointage" :modal="true"
                class="custom-dialog">
                <div class="modal-body py-2">
                    <div class="form-group">
                        <label>Date <span class="required">*</span></label>
                        <DatePicker id="date" v-model="log.date" dateFormat="dd/mm/yy" :showIcon="true"
                            class="w-full" />
                        <small class="p-error" v-if="submitted && !log.date">La date est requise.</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group half">
                            <label>Heure Début <span class="required">*</span></label>
                            <DatePicker v-model="log.startTime" timeOnly hourFormat="24" placeholder="08:00"
                                class="w-full" />
                            <small class="p-error" v-if="submitted && !log.startTime">Requis.</small>
                        </div>
                        <div class="form-group half">
                            <label>Heure Fin <span class="required">*</span></label>
                            <DatePicker v-model="log.endTime" timeOnly hourFormat="24" placeholder="10:30"
                                class="w-full" />
                            <small class="p-error" v-if="submitted && !log.endTime">Requis.</small>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group half">
                            <label>Durée Calculée</label>
                            <InputText :value="calculatedHours + ' h'" disabled class="w-full bg-gray-100" />
                        </div>
                        <div class="form-group half flex align-items-center gap-3 pt-4">
                            <label class="mb-0">Clôturer la tâche</label>
                            <ToggleSwitch v-model="log.cloture" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Ressource <span class="required">*</span></label>
                        <Select id="resource" v-model="log.resourceId" :options="resources" optionLabel="nom"
                            optionValue="id" placeholder="Sélectionner une ressource" filter class="w-full" />
                        <small class="p-error" v-if="submitted && !log.resourceId">La ressource est requise.</small>
                    </div>

                    <div class="form-group">
                        <label>Affectation <span class="required">*</span></label>
                        <Select id="assignment" v-model="log.assignmentId" :options="dynamicAssignments"
                            optionLabel="displayName" optionValue="id" placeholder="Sélectionner une affectation" filter
                            :disabled="!log.resourceId || loadingAssignments" :loading="loadingAssignments"
                            class="w-full">
                            <template #option="slotProps">
                                <div class="flex flex-column">
                                    <span class="font-bold">{{ slotProps.option.displayName }}</span>
                                </div>
                            </template>
                        </Select>
                        <small class="p-error" v-if="submitted && !log.assignmentId">L'affectation est requise.</small>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <Textarea id="description" v-model="log.description" rows="3" class="w-full"
                            placeholder="Détails du travail effectué..." />
                    </div>
                </div>

                <div class="modal-divider"></div>

                <template #footer>
                    <div class="modal-actions">
                        <Button label="Annuler" @click="hideDialog" class="btn-secondary-custom" />
                        <Button label="Enregistrer" @click="saveLog" class="btn-primary-custom" />
                    </div>
                </template>
            </Dialog>

            <!-- Stop Work Dialog (Pause vs Complete) -->
            <Dialog v-model:visible="stopWorkDialog" :style="{ width: '450px' }" header="Arrêter le travail"
                :modal="true">
                <div class="flex flex-column gap-3 p-3">
                    <p class="m-0 text-lg">Souhaitez-vous mettre en pause ou terminer définitivement cette tâche ?</p>
                    <div class="flex gap-2 mt-2">
                        <Button label="Pause (Reprendre plus tard)" icon="pi pi-pause" severity="warning" class="flex-1"
                            @click="stopWork(false)" />
                        <Button label="Terminer (Clôturer)" icon="pi pi-check-circle" severity="info" class="flex-1"
                            @click="stopWork(true)" />
                    </div>
                </div>
            </Dialog>

            <Dialog v-model:visible="deleteLogDialog" :style="{ width: '450px' }" header="Confirmer" :modal="true">
                <div class="confirmation-content flex items-center">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span v-if="log">Êtes-vous sûr de vouloir supprimer ce pointage ?</span>
                </div>
                <template #footer>
                    <Button label="Non" icon="pi pi-times" text @click="deleteLogDialog = false" />
                    <Button label="Oui" icon="pi pi-check" severity="danger" @click="deleteLog" />
                </template>
            </Dialog>

        </main>
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

.search-field {
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
}

.search-field :deep(.p-inputtext) {
    width: 100% !important;
}

.spacer {
    flex-grow: 1;
}

.date-filter {
    width: 280px;
}

.resource-filter {
    width: 160px;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.data-table {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.p-datatable-header) {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
}

:deep(.p-datatable-thead > tr > th) {
    background: white;
    color: #475569;
    font-weight: 600;
    padding: 0.75rem 1rem;
}

:deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 1rem;
    color: #334155;
}

:deep(.p-datatable-tbody > tr:hover) {
    background-color: #f1f5f9 !important;
}

.active-session-card {
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
}

.active-session-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
    .header-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .search-field,
    .date-filter,
    .resource-filter {
        width: 100%;
    }

    .header-bar h1 {
        margin-right: 0;
        margin-bottom: 0.5rem;
    }

    .action-buttons {
        justify-content: flex-end;
    }
}

/* Custom Modal Styles (Inspired by ObjectivesSettings.vue) */
.form-group {
    margin-bottom: 1.25rem;
}

.form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.25rem;
}

.form-group.half {
    flex: 1;
    margin-bottom: 0;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #334155;
    font-size: 0.875rem;
}

.required {
    color: #ef4444;
    margin-left: 0.25rem;
}

.modal-divider {
    border-top: 1px solid #e2e8f0;
    margin: 1rem 0;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 0.5rem 1rem 1rem 1rem;
}

.btn-primary-custom {
    background-color: #3b82f6 !important;
    color: white !important;
    border: none !important;
    padding: 0.6rem 1.5rem !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
}

.btn-primary-custom:hover {
    background-color: #2563eb !important;
}

.btn-secondary-custom {
    background-color: white !important;
    color: #475569 !important;
    border: 1px solid #cbd5e1 !important;
    padding: 0.6rem 1.5rem !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
}

.btn-secondary-custom:hover {
    background-color: #f8fafc !important;
}

.w-full {
    width: 100% !important;
}
</style>
