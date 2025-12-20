<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import AutoComplete from 'primevue/autocomplete';
import Badge from 'primevue/badge';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import Avatar from 'primevue/avatar';
import { dataService } from '../services/dataService';
import { itemService } from '../services/itemService';
import { useGeneralSettings } from '../composables/useGeneralSettings';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import { useAuthStore } from '../stores/auth';

const { formatCurrency, getHourlyRateForDate } = useGeneralSettings();
const confirm = useConfirm();
const toast = useToast();
const authStore = useAuthStore();

const props = defineProps({
    visible: { type: Boolean, default: false },
    projectId: { type: String, default: null }
});

const emit = defineEmits(['update:visible', 'saved']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const project = ref(null);
const loading = ref(false);
const models = ref([]);
const brands = ref([]);
const enumValues = ref({ types: [], priorities: [], statuses: [] });

// Collapse states
const headerCollapsed = ref(true);
const itemsCollapsed = ref(false);
const tasksCollapsed = ref(false);

const itemLines = computed(() => {
    if (!project.value?.lines) return [];
    return project.value.lines.filter(l => l.type === 'ITEM');
});

const taskLines = computed(() => {
    if (!project.value?.lines) return [];
    return project.value.lines.filter(l => l.type === 'TASK');
});

const isNewProject = computed(() => !props.projectId);
const isHeaderEditing = ref(false);

// Filter models by selected brand
const filteredModels = computed(() => {
    if (!project.value?.brandId) return [];
    return models.value.filter(m => m.brandId === project.value.brandId);
});

// Watch brand changes to reset model if it's not in filtered list
watch(() => project.value?.brandId, (newBrandId) => {
    if (!project.value || !newBrandId || !project.value.modelId) return;

    const modelExists = filteredModels.value.some(m => m.id === project.value.modelId);
    if (!modelExists) {
        project.value.modelId = null;
    }
});

// Calculate planned duration when dates change
watch(() => [project.value?.plannedStartDate, project.value?.plannedEndDate], ([startDate, endDate]) => {
    if (!project.value || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        project.value.plannedDurationDays = diffDays;
    } else {
        project.value.plannedDurationDays = 0;
    }
}, { deep: true });


// Disable Sundays in date picker (0 = Sunday)
const disabledDays = [0];

watch(() => props.visible, async (newVal) => {
    console.log('ProjectEditDialog visible changed:', newVal, 'projectId:', props.projectId);
    if (newVal) {
        // Load enums first
        try {
            const enums = await dataService.getProjectEnumValues();
            if (enums) enumValues.value = enums;
        } catch (e) {
            console.error('Failed to load enums', e);
        }

        if (props.projectId) {
            console.log('Loading existing project...');
            isHeaderEditing.value = false;
            await loadProject();
        } else {
            console.log('Initializing new project...');
            isHeaderEditing.value = true;

            // Generate next project number
            let nextProjectNumber = 'NOUVEAU';
            try {
                const generated = await dataService.generateNextNumber('PROJECT');
                if (generated) nextProjectNumber = generated;
            } catch (e) {
                console.error('Failed to generate project number', e);
            }

            // Initialize new project
            project.value = {
                name: '',
                projectNumber: nextProjectNumber,
                status: 'NOUVEAU',
                priority: 'MOYENNE',
                type: '',
                description: '',
                modelId: null,
                brandId: null,
                lines: [],
                subtasks: [],
                attributes: {},
                creationDate: new Date().toISOString()
            };

            // Load models and brands if not loaded
            try {
                if (models.value.length === 0) models.value = await dataService.getModels();
                if (brands.value.length === 0) brands.value = await dataService.getBrands();
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        }
    }
});

const loadProject = async () => {
    loading.value = true;
    try {
        if (models.value.length === 0) models.value = await dataService.getModels();
        if (brands.value.length === 0) brands.value = await dataService.getBrands();

        project.value = await dataService.getProjectWithLines(props.projectId);
    } catch (error) {
        console.error('Failed to load project:', error);
    } finally {
        loading.value = false;
    }
};

const getModelName = (modelId) => {
    if (!modelId) return 'N/A';
    const model = models.value.find(m => m.id == modelId);
    return model ? model.name : 'N/A';
};

const closeDialog = () => {
    dialogVisible.value = false;
};

// Autocomplete for items
const availableItems = ref([]);
const filteredItems = ref([]);

const searchItems = async (event) => {
    try {
        const params = event.query ? { search: event.query } : {};
        const response = await itemService.getItems(params);

        // Handle various API response formats
        if (Array.isArray(response)) {
            filteredItems.value = response;
        } else if (response.content && Array.isArray(response.content)) {
            filteredItems.value = response.content;
        } else if (response.items && Array.isArray(response.items)) {
            filteredItems.value = response.items;
        } else if (response.data && Array.isArray(response.data)) {
            filteredItems.value = response.data;
        } else {
            filteredItems.value = [];
        }
    } catch (error) {
        console.error('Error searching items:', error);
        filteredItems.value = [];
    }
};

const onItemSelect = (event) => {
    if (editingItem.value && event.value) {
        editingItem.value.no = event.value.no;
        editingItem.value.description = event.value.designation;
        editingItem.value.unitPriceHT = event.value.unitPriceHT || 0;
    }
};

const saveProject = async () => {
    try {
        loading.value = true;
        const payload = getProjectPayload();

        let savedProject;
        if (props.projectId) {
            savedProject = await dataService.updateProjectWithLines(props.projectId, payload);
        } else {
            savedProject = await dataService.createProjectWithLines(payload);
        }

        emit('saved', savedProject);

        if (isHeaderEditing.value) {
            // If we were in header editing mode (new project), we stay open but switch mode
            isHeaderEditing.value = false;
            // Update local project with saved data (to get ID etc)
            project.value = savedProject;

            // Increment the numbering series counter for PROJECT
            try {
                await dataService.incrementNumberingSeries('PROJECT');
            } catch (error) {
                console.error('Failed to increment numbering series:', error);
                // Non-blocking error - we still show success message
            }

            toast.add({ severity: 'success', summary: 'Succès', detail: 'Projet créé. Vous pouvez maintenant ajouter des articles et des tâches.', life: 5000 });
        } else {
            closeDialog();
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Erreur lors de la sauvegarde du projet');
    } finally {
        loading.value = false;
    }
};

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
};

const getStatusSeverity = (status) => {
    if (!status) return 'secondary';
    const s = status.toUpperCase();
    if (s === 'NOUVEAU') return 'info';
    if (s === 'EN_COURS' || s === 'EN COURS') return 'warn';
    if (s === 'TERMINE' || s === 'TERMINÉ') return 'success';
    if (s === 'EN_ATTENTE' || s === 'EN ATTENTE') return 'secondary';
    return 'secondary';
};

const getPrioritySeverity = (priority) => {
    if (!priority) return 'secondary';
    const p = priority.toUpperCase();
    if (p === 'HAUTE') return 'danger';
    if (p === 'MOYENNE') return 'warn';
    if (p === 'BASSE') return 'success';
    return 'secondary';
};

const getStatusLabel = (status) => {
    const map = {
        'NOUVEAU': 'Nouveau',
        'EN_COURS': 'En cours',
        'TERMINE': 'Terminé',
        'EN_ATTENTE': 'En attente'
    };
    return map[status] || status || 'N/A';
};

const getPriorityLabel = (priority) => {
    const map = {
        'HAUTE': 'Haute',
        'MOYENNE': 'Moyenne',
        'BASSE': 'Basse'
    };
    return map[priority] || priority || 'N/A';
};

// ===== SUBTASKS LOGIC =====
const subtasksDialogVisible = ref(false);
const addAssignmentDialogVisible = ref(false);
const selectedTaskForSubtasks = ref(null);
const currentSubtaskForAssignment = ref(null);
const projectAssignments = ref([]);
const resources = ref([]);
const newAssignment = ref({}); // Map of subtaskId -> { resourceId, qtePrevue }

const loadResources = async () => {
    try {
        resources.value = await dataService.getResources();
    } catch (error) {
        console.error('Error loading resources:', error);
    }
};

const loadProjectAssignments = async () => {
    if (!project.value?.id) return;
    try {
        projectAssignments.value = await dataService.getProjectAssignments(project.value.id);
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
};

const getSubtaskAssignments = (subtaskId) => {
    return projectAssignments.value.filter(a => a.projectSubtaskId === subtaskId);
};

const openSubtasksDialog = async (task) => {
    selectedTaskForSubtasks.value = task;
    currentSubtaskForAssignment.value = null; // Reset assignments view
    subtasksDialogVisible.value = true;
    await loadResources();
    await loadProjectAssignments(); // Load existing assignments
};

const openAddAssignmentDialog = (subtask) => {
    currentSubtaskForAssignment.value = subtask;
    if (!newAssignment.value[subtask.id]) {
        newAssignment.value[subtask.id] = {
            resourceId: null,
            qtePrevue: subtask.theoreticalQuantity
        };
    }
    addAssignmentDialogVisible.value = true;
};

const closeAddAssignmentDialog = () => {
    addAssignmentDialogVisible.value = false;
};

const getSubtaskTotalPlanned = (subtaskId) => {
    const assignments = getSubtaskAssignments(subtaskId);
    return assignments.reduce((sum, a) => sum + (a.qtePrevue || 0), 0);
};

// Removed openAssignmentDialog as selection is now handled via v-model

const createAssignment = async (subtask) => {
    const data = newAssignment.value[subtask.id];
    if (!data || !data.resourceId) {
        toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez sélectionner une ressource', life: 3000 });
        return;
    }

    try {
        loading.value = true;
        const payload = {
            projectSubtaskId: subtask.id,
            ressourceId: data.resourceId,
            qtePrevue: data.qtePrevue || subtask.theoreticalQuantity
        };
        await dataService.createAssignment(payload);
        await loadProjectAssignments();
        // Reset form for this subtask
        newAssignment.value[subtask.id] = { resourceId: null, qtePrevue: null };

        closeAddAssignmentDialog(); // Close the popup
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Ressource affectée', life: 3000 });
    } catch (error) {
        console.error('Error creating assignment:', error);
        // Handle 409 Conflict specifically
        if (error.response && error.response.status === 409) {
            toast.add({ severity: 'error', summary: 'Conflit', detail: 'Cette ressource est déjà affectée à cette sous-tâche', life: 5000 });
        } else {
            const msg = error.response?.data?.message || 'Erreur lors de l\'affectation';
            toast.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 5000 });
        }
    } finally {
        loading.value = false;
    }
};

const updateAssignmentPlannedQty = async (assignment) => {
    try {
        await dataService.updateAssignmentPlannedQty(assignment.id, assignment.qtePrevue);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Quantité prévue mise à jour', life: 3000 });
    } catch (error) {
        console.error('Error updating planned quantity:', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour', life: 3000 });
    }
};

const deleteAssignment = (assignment) => {
    confirm.require({
        message: 'Voulez-vous vraiment supprimer cette affectation ?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await dataService.deleteAssignment(assignment.id);
                await loadProjectAssignments();
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Affectation supprimée', life: 3000 });
            } catch (error) {
                console.error('Error deleting assignment:', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer l\'affectation', life: 3000 });
            } finally {
                loading.value = false;
            }
        }
    });
};

const getAssignmentStatusSeverity = (status) => {
    switch (status) {
        case 'PLANNED': return 'info';
        case 'IN_PROGRESS': return 'warn';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'secondary';
        default: return 'secondary';
    }
};

const getAssignmentStatusLabel = (status) => {
    switch (status) {
        case 'PLANNED': return 'Planifié';
        case 'IN_PROGRESS': return 'En cours';
        case 'COMPLETED': return 'Terminé';
        case 'CANCELLED': return 'Annulé';
        default: return status;
    }
};

const getTaskSubtasks = (taskLine) => {
    if (!project.value?.subtasks) return [];
    // Match by taskCode (stored in line.no)
    return project.value.subtasks.filter(s => s.taskCode === taskLine.no);
};

// ===== INLINE EDITING STATE =====
const editingItemId = ref(null);
const editingTaskId = ref(null);
const editingItem = ref(null);
const editingTask = ref(null);

// ===== ITEM EDITING FUNCTIONS =====
const startEditItem = (item) => {
    editingItemId.value = item.lineNo;
    editingItem.value = { ...item };
};

const cancelEditItem = () => {
    editingItemId.value = null;
    editingItem.value = null;
};

const getProjectPayload = () => {
    // Required fields
    const requiredFields = [
        'creationDate',
        'modelId',
        'name',
        'userCreator',
        'status',
        'priority',
        'type',
        'projectNumber',
        'lines' // Always include lines for project structure
    ];

    // Build payload with required fields
    const payload = {};

    requiredFields.forEach(field => {
        if (project.value[field] !== undefined) {
            payload[field] = project.value[field];
        }
    });

    // Add optional fields only if they have values
    const optionalFields = [
        'brandId',
        'description',
        'desiredDate',
        'plannedStartDate',
        'plannedEndDate',
        'plannedDurationDays',
        'actualStartDate',
        'actualEndDate',
        'actualDurationDays',
        'durationVarianceDays'
    ];

    optionalFields.forEach(field => {
        const value = project.value[field];
        // Include if value exists and is not empty string/null/undefined
        if (value !== null && value !== undefined && value !== '') {
            payload[field] = value;
        }
    });

    // Fix Enum case sensitivity for backend
    if (payload.priority) payload.priority = payload.priority.toUpperCase();
    if (payload.status) payload.status = payload.status.toUpperCase();

    // Add userCreator if not present (for new projects)
    if (!payload.userCreator && authStore.user) {
        payload.userCreator = authStore.user.firstName || authStore.user.nom || 'Unknown';
    }

    return payload;
};

const saveEditItem = async () => {
    if (editingItem.value) {
        // Calcul automatique du total et typage strict
        const quantity = parseFloat(editingItem.value.quantity) || 0;
        const unitPrice = parseFloat(editingItem.value.unitPriceHT) || 0;
        const discount = parseFloat(editingItem.value.discountPercent) || 0;

        const subtotal = quantity * unitPrice;
        const discountAmount = (subtotal * discount) / 100;

        // Mise à jour de l'objet avec des nombres
        editingItem.value.quantity = quantity;
        editingItem.value.unitPriceHT = unitPrice;
        editingItem.value.discountPercent = discount;
        editingItem.value.totalAmountHT = subtotal - discountAmount;

        try {
            loading.value = true;

            // Mise à jour dans le projet local
            const index = project.value.lines.findIndex(l => l.lineNo === editingItemId.value);
            if (index !== -1) {
                project.value.lines[index] = { ...editingItem.value };
            }

            // Appel API pour sauvegarder immédiatement
            // Use project.value.id to support newly created projects
            const projectId = project.value.id || props.projectId;
            if (editingItem.value._isNew) {
                await dataService.addProjectLine(projectId, editingItem.value);
                delete editingItem.value._isNew;
            } else {
                await dataService.updateProjectLine(projectId, editingItem.value.lineNo, editingItem.value);
            }

            // Rafraîchir pour récupérer les totaux à jour
            await loadProject();

            toast.add({ severity: 'success', summary: 'Succès', detail: 'Article enregistré', life: 3000 });
            cancelEditItem();
        } catch (error) {
            console.error('Error saving line:', error);
            const msg = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde';
            toast.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 5000 });
        } finally {
            loading.value = false;
        }
    }
};

const deleteItem = (item) => {
    confirm.require({
        message: 'Voulez-vous vraiment supprimer cet article ?',
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        accept: async () => {
            try {
                loading.value = true;
                if (item._isNew) {
                    project.value.lines = project.value.lines.filter(l => l.lineNo !== item.lineNo);
                } else {
                    const projectId = project.value.id || props.projectId;
                    await dataService.deleteProjectLine(projectId, item.lineNo);
                    await loadProject();
                }
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Article supprimé', life: 3000 });
            } catch (error) {
                console.error('Error deleting line:', error);
                const msg = error.response?.data?.message || error.message || 'Erreur lors de la suppression';
                toast.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 5000 });
            } finally {
                loading.value = false;
            }
        }
    });
};

const addNewItem = () => {
    // Calculate max line number from ALL lines (Items + Tasks) to avoid collisions
    const maxLineNo = project.value.lines.reduce((max, l) => Math.max(max, l.lineNo || 0), 0);
    const newLineNo = maxLineNo + 10;

    const newItem = {
        lineNo: newLineNo,
        type: 'ITEM',
        no: '',
        description: '',
        quantity: 1,
        unitPriceHT: 0,
        discountPercent: 0,
        totalAmountHT: 0,
        _isNew: true
    };

    project.value.lines.push(newItem);
    startEditItem(newItem);
};

// ===== TASK EDITING FUNCTIONS =====
const startEditTask = (task) => {
    editingTaskId.value = task.lineNo;
    editingTask.value = { ...task };
};

const cancelEditTask = () => {
    editingTaskId.value = null;
    editingTask.value = null;
};

// Task Autocomplete
const filteredTasks = ref([]);
const searchTasks = async (event) => {
    try {
        // Fetch all tasks
        let allTasksResponse = await dataService.getTasks();
        let allTasks = [];

        // Handle various API response formats
        if (Array.isArray(allTasksResponse)) {
            allTasks = allTasksResponse;
        } else if (allTasksResponse.content && Array.isArray(allTasksResponse.content)) {
            allTasks = allTasksResponse.content;
        } else if (allTasksResponse.items && Array.isArray(allTasksResponse.items)) {
            allTasks = allTasksResponse.items;
        } else if (allTasksResponse.data && Array.isArray(allTasksResponse.data)) {
            allTasks = allTasksResponse.data;
        }

        const query = event.query.toLowerCase();
        filteredTasks.value = allTasks.filter(t =>
            (t.name && t.name.toLowerCase().includes(query)) ||
            (t.label && t.label.toLowerCase().includes(query)) ||
            (t.code && t.code.toLowerCase().includes(query))
        );
    } catch (error) {
        console.error('Error searching tasks:', error);
        filteredTasks.value = [];
    }
};

const onTaskSelect = (event) => {
    if (editingTask.value && event.value) {
        editingTask.value.description = event.value.label || event.value.name;
        // Map Task Code to 'no' field as required by backend for subtask generation
        editingTask.value.no = event.value.code;

        // Auto-set hourly rate based on project date
        const projectDate = project.value.creationDate || new Date();
        const rate = getHourlyRateForDate(projectDate);
        if (rate > 0) {
            editingTask.value.unitPriceHT = rate;
        }
    }
};

const saveEditTask = async () => {
    if (editingTask.value) {
        // Calcul automatique du total et typage strict
        const quantity = parseFloat(editingTask.value.quantity) || 0;
        const unitPrice = parseFloat(editingTask.value.unitPriceHT) || 0;

        // Mise à jour de l'objet avec des nombres
        editingTask.value.quantity = quantity;
        editingTask.value.unitPriceHT = unitPrice;
        editingTask.value.totalAmountHT = quantity * unitPrice;

        try {
            loading.value = true;

            // Mise à jour dans le projet local
            const index = project.value.lines.findIndex(l => l.lineNo === editingTaskId.value);
            if (index !== -1) {
                project.value.lines[index] = { ...editingTask.value };
            }

            // Appel API
            // Use project.value.id to support newly created projects
            const projectId = project.value.id || props.projectId;
            if (editingTask.value._isNew) {
                await dataService.addProjectLine(projectId, editingTask.value);
                delete editingTask.value._isNew;
            } else {
                await dataService.updateProjectLine(projectId, editingTask.value.lineNo, editingTask.value);
            }

            // Rafraîchir
            await loadProject();

            toast.add({ severity: 'success', summary: 'Succès', detail: 'Tâche enregistrée', life: 3000 });
            cancelEditTask();
        } catch (error) {
            console.error('Error saving task:', error);
            const msg = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde';
            toast.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 5000 });
        } finally {
            loading.value = false;
        }
    }
};

const deleteTask = (task) => {
    confirm.require({
        message: 'Voulez-vous vraiment supprimer cette tâche ?',
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        accept: async () => {
            try {
                loading.value = true;
                if (task._isNew) {
                    project.value.lines = project.value.lines.filter(l => l.lineNo !== task.lineNo);
                } else {
                    const projectId = project.value.id || props.projectId;
                    await dataService.deleteProjectLine(projectId, task.lineNo);
                    await loadProject();
                }
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Tâche supprimée', life: 3000 });
            } catch (error) {
                console.error('Error deleting task:', error);
                const msg = error.response?.data?.message || error.message || 'Erreur lors de la suppression';
                toast.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 5000 });
            } finally {
                loading.value = false;
            }
        }
    });
};

const addNewTask = () => {
    // Calculate max line number from ALL lines (Items + Tasks) to avoid collisions
    const maxLineNo = project.value.lines.reduce((max, l) => Math.max(max, l.lineNo || 0), 0);
    const newLineNo = maxLineNo + 10;

    const newTask = {
        lineNo: newLineNo,
        type: 'TASK',
        no: '', // Required by backend
        description: '',
        quantity: 1,
        unitPriceHT: 0,
        totalAmountHT: 0,
        _isNew: true
    };

    project.value.lines.push(newTask);
    startEditTask(newTask);
};
</script>

<template>
    <Dialog v-model:visible="dialogVisible" modal :closable="true" :style="{ width: '95vw', maxWidth: '1600px' }"
        header="Édition Commande" class="project-dialog">

        <div v-if="loading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Chargement...</p>
        </div>

        <div v-else-if="project" class="dialog-content">
            <!-- Header Info Card -->
            <div class="info-card">
                <div class="info-header clickable" @click="headerCollapsed = !headerCollapsed">
                    <div class="header-left">
                        <h3>{{ project.projectNumber }} . {{ project.name }}</h3>
                    </div>
                    <div class="header-right">
                        <div v-if="headerCollapsed" class="header-summary fade-in">
                            <span class="summary-item">{{ getModelName(project.modelId) }}</span>
                            <span class="summary-separator">•</span>
                            <span class="summary-item">{{ project.type }}</span>
                            <span class="summary-separator">•</span>
                            <span class="summary-item">{{ formatDate(project.creationDate) }}</span>
                        </div>
                        <Tag :value="getStatusLabel(project.status)" :severity="getStatusSeverity(project.status)" />
                        <Tag :value="getPriorityLabel(project.priority)"
                            :severity="getPrioritySeverity(project.priority)" />
                        <i :class="headerCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                            class="collapse-icon"></i>
                    </div>
                </div>

                <div v-show="!headerCollapsed" class="info-body">
                    <div class="info-section">
                        <h5 class="section-subtitle">Informations principales</h5>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Nom du projet</label>
                                <InputText v-if="isHeaderEditing" v-model="project.name" placeholder="Nom du projet"
                                    class="w-full" />
                                <span v-else>{{ project.name }}</span>
                            </div>

                            <div class="info-item">
                                <label>Marque</label>
                                <Select v-if="isHeaderEditing" v-model="project.brandId" :options="brands"
                                    optionLabel="name" optionValue="id" placeholder="Sélectionner une marque"
                                    class="w-full" filter />
                                <span v-else>{{brands.find(b => b.id === project.brandId)?.name || 'N/A'}}</span>
                            </div>

                            <div class="info-item">
                                <label>Modèle véhicule</label>
                                <Select v-if="isHeaderEditing" v-model="project.modelId" :options="filteredModels"
                                    optionLabel="name" optionValue="id" placeholder="Sélectionner un modèle"
                                    :disabled="!project.brandId" class="w-full" filter />
                                <span v-else>{{ getModelName(project.modelId) }}</span>
                            </div>

                            <div class="info-item">
                                <label>Type intervention</label>
                                <Select v-if="isHeaderEditing" v-model="project.type" :options="enumValues.types"
                                    optionLabel="label" optionValue="key" placeholder="Type" class="w-full" />
                                <span v-else>{{enumValues.types.find(t => t.key === project.type)?.label ||
                                    project.type || 'N/A'}}</span>
                            </div>

                            <div class="info-item">
                                <label>Priorité</label>
                                <Select v-if="isHeaderEditing" v-model="project.priority"
                                    :options="enumValues.priorities" optionLabel="label" optionValue="key"
                                    placeholder="Priorité" class="w-full" />
                                <span v-else>
                                    <Tag :value="enumValues.priorities.find(p => p.key === project.priority)?.label || project.priority"
                                        :severity="getPrioritySeverity(project.priority)" />
                                </span>
                            </div>

                            <div class="info-item">
                                <label>Date création</label>
                                <span>{{ formatDate(project.creationDate) }}</span>
                            </div>

                            <div class="info-item">
                                <label>Date souhaitée</label>
                                <DatePicker v-if="isHeaderEditing" v-model="project.desiredDate" dateFormat="dd/mm/yy"
                                    showIcon class="w-full" />
                                <span v-else>{{ formatDate(project.desiredDate) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h5 class="section-subtitle">Planification</h5>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Début planifié</label>
                                <DatePicker v-if="isHeaderEditing" v-model="project.plannedStartDate"
                                    dateFormat="dd/mm/yy" showIcon :disabledDays="disabledDays" />
                                <span v-else>{{ formatDate(project.plannedStartDate) }}</span>
                            </div>
                            <div class="info-item">
                                <label>Fin planifiée</label>
                                <DatePicker v-if="isHeaderEditing" v-model="project.plannedEndDate"
                                    dateFormat="dd/mm/yy" showIcon :disabledDays="disabledDays"
                                    :minDate="project.plannedStartDate" />
                                <span v-else>{{ formatDate(project.plannedEndDate) }}</span>
                            </div>
                            <div class="info-item">
                                <label>Durée planifiée</label>
                                <span>{{ project.plannedDurationDays || 0 }} jour(s)</span>
                            </div>
                            <div class="info-item"></div>
                        </div>
                    </div>

                    <div class="info-section"
                        v-if="!isHeaderEditing && (project.actualStartDate || project.actualEndDate)">
                        <h5 class="section-subtitle">Réalisation</h5>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Début réel</label>
                                <span>{{ formatDate(project.actualStartDate) || 'Non démarré' }}</span>
                            </div>
                            <div class="info-item">
                                <label>Fin réelle</label>
                                <span>{{ formatDate(project.actualEndDate) || 'En cours' }}</span>
                            </div>
                            <div class="info-item">
                                <label>Durée réelle</label>
                                <span>{{ project.actualDurationDays || 0 }} jour(s)</span>
                            </div>
                            <div class="info-item">
                                <label>Écart durée</label>
                                <span
                                    :class="project.durationVarianceDays < 0 ? 'text-success' : project.durationVarianceDays > 0 ? 'text-warning' : ''">
                                    {{ project.durationVarianceDays > 0 ? '+' : '' }}{{ project.durationVarianceDays ||
                                        0 }} jour(s)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="description">
                        <label>Description</label>
                        <Textarea v-if="isHeaderEditing" v-model="project.description" rows="3" class="w-full" />
                        <p v-else>{{ project.description }}</p>
                    </div>

                    <div v-if="isHeaderEditing" class="flex justify-content-end mt-3">
                        <Button label="Valider l'entête et Créer" icon="pi pi-check" @click="saveProject" />
                    </div>
                </div>
            </div>

            <!-- Articles Section -->
            <div class="section-card" :class="{ 'disabled-section': isHeaderEditing }">
                <div class="section-header clickable" @click="!isHeaderEditing && (itemsCollapsed = !itemsCollapsed)">
                    <div class="section-title">
                        <i class="pi pi-box"></i>
                        <h4>Articles & Pièces</h4>
                        <span class="count-badge">{{ itemLines.length }}</span>
                    </div>
                    <div class="section-actions">
                        <Button label="Ajouter" icon="pi pi-plus" size="small" outlined @click.stop="addNewItem"
                            :disabled="isHeaderEditing" />
                        <i :class="itemsCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                            class="collapse-icon"></i>
                    </div>
                </div>

                <div v-show="!itemsCollapsed && !isHeaderEditing">
                    <DataTable v-if="itemLines.length > 0" :value="itemLines" class="items-table" stripedRows>
                        <Column field="lineNo" header="#" style="width: 60px"></Column>


                        <Column header="Code" style="min-width: 150px">
                            <template #body="{ data }">
                                <AutoComplete v-if="editingItemId === data.lineNo" v-model="editingItem.no"
                                    :suggestions="filteredItems" @complete="searchItems" @item-select="onItemSelect"
                                    optionLabel="no" placeholder="Chercher..." class="inline-input" :dropdown="true">
                                    <template #option="slotProps">
                                        <div class="autocomplete-item">
                                            <strong>{{ slotProps.option.no }}</strong>
                                            <span class="item-desc">{{ slotProps.option.designation }}</span>
                                        </div>
                                    </template>
                                </AutoComplete>
                                <span v-else>{{ data.no }}</span>
                            </template>
                        </Column>

                        <Column header="Désignation" style="min-width: 200px">
                            <template #body="{ data }">
                                <InputText v-if="editingItemId === data.lineNo" v-model="editingItem.description"
                                    class="inline-input" placeholder="Désignation" />
                                <span v-else>{{ data.description }}</span>
                            </template>
                        </Column>

                        <Column header="Qté" style="width: 100px">
                            <template #body="{ data }">
                                <InputNumber v-if="editingItemId === data.lineNo" v-model="editingItem.quantity"
                                    :min="0" :step="1" showButtons buttonLayout="horizontal"
                                    class="inline-input-number" />
                                <span v-else>{{ data.quantity }}</span>
                            </template>
                        </Column>

                        <Column header="P.U. HT" style="width: 130px">
                            <template #body="{ data }">
                                <InputNumber v-if="editingItemId === data.lineNo" v-model="editingItem.unitPriceHT"
                                    :minFractionDigits="2" :maxFractionDigits="4" class="inline-input-number" />
                                <span v-else>{{ formatCurrency(data.unitPriceHT) }}</span>
                            </template>
                        </Column>

                        <Column header="Rem. %" style="width: 100px">
                            <template #body="{ data }">
                                <InputNumber v-if="editingItemId === data.lineNo" v-model="editingItem.discountPercent"
                                    :min="0" :max="100" suffix="%" class="inline-input-number" />
                                <span v-else>{{ data.discountPercent }}%</span>
                            </template>
                        </Column>

                        <Column header="Total HT" style="width: 130px">
                            <template #body="{ data }">
                                <strong>{{ formatCurrency(data.totalAmountHT) }}</strong>
                            </template>
                        </Column>

                        <Column header="Actions" style="width: 110px">
                            <template #body="{ data }">
                                <div v-if="editingItemId === data.lineNo" class="inline-actions">
                                    <Button icon="pi pi-check" text rounded size="small" severity="info"
                                        @click="saveEditItem" v-tooltip.top="'Valider'" />
                                    <Button icon="pi pi-times" text rounded size="small" severity="danger"
                                        @click="cancelEditItem" v-tooltip.top="'Annuler'" />
                                </div>
                                <div v-else class="inline-actions">
                                    <Button icon="pi pi-pencil" text rounded size="small" @click="startEditItem(data)"
                                        v-tooltip.top="'Modifier'" />
                                    <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                                        @click="deleteItem(data)" v-tooltip.top="'Supprimer'" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>

                    <div v-else class="empty-state">
                        <i class="pi pi-inbox"></i>
                        <p>Aucun article</p>
                    </div>
                </div>
            </div>

            <!-- Tâches Section -->
            <div class="section-card" :class="{ 'disabled-section': isHeaderEditing }">
                <div class="section-header clickable" @click="!isHeaderEditing && (tasksCollapsed = !tasksCollapsed)">
                    <div class="section-title">
                        <i class="pi pi-wrench"></i>
                        <h4>Main d'œuvre & Tâches</h4>
                        <span class="count-badge">{{ taskLines.length }}</span>
                    </div>
                    <div class="section-actions">
                        <Button label="Ajouter" icon="pi pi-plus" size="small" outlined @click.stop="addNewTask"
                            :disabled="isHeaderEditing" />
                        <i :class="tasksCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                            class="collapse-icon"></i>
                    </div>
                </div>

                <div v-show="!tasksCollapsed && !isHeaderEditing">
                    <DataTable v-if="taskLines.length > 0" :value="taskLines" dataKey="lineNo" class="items-table"
                        stripedRows>
                        <Column field="lineNo" header="#" style="width: 60px"></Column>

                        <Column header="Désignation" style="min-width: 300px">
                            <template #body="{ data }">
                                <div class="flex align-items-center"
                                    style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="flex: 1;">
                                        <AutoComplete v-if="editingTaskId === data.lineNo"
                                            v-model="editingTask.description" :suggestions="filteredTasks"
                                            @complete="searchTasks" @item-select="onTaskSelect" optionLabel="name"
                                            placeholder="Chercher une tâche..." class="inline-input" :dropdown="true">
                                            <template #option="slotProps">
                                                <div class="autocomplete-item">
                                                    <span>{{ slotProps.option.name || slotProps.option.label }}</span>
                                                </div>
                                            </template>
                                        </AutoComplete>
                                        <span v-else>{{ data.description }}</span>
                                    </div>
                                    <Badge v-if="getTaskSubtasks(data).length > 0" :value="getTaskSubtasks(data).length"
                                        severity="info" v-tooltip.top="'Voir les sous-tâches'" style="cursor: pointer;"
                                        @click="openSubtasksDialog(data)" />
                                </div>
                            </template>
                        </Column>

                        <Column header="Heures" style="width: 120px">
                            <template #body="{ data }">
                                <InputNumber v-if="editingTaskId === data.lineNo" v-model="editingTask.quantity"
                                    :min="0" :step="0.5" :minFractionDigits="1" :maxFractionDigits="2" showButtons
                                    buttonLayout="horizontal" class="inline-input-number" />
                                <span v-else>{{ data.quantity }}</span>
                            </template>
                        </Column>

                        <Column header="Taux horaire" style="width: 140px">
                            <template #body="{ data }">
                                <InputNumber v-if="editingTaskId === data.lineNo" v-model="editingTask.unitPriceHT"
                                    :minFractionDigits="2" :maxFractionDigits="4" class="inline-input-number" />
                                <span v-else>{{ formatCurrency(data.unitPriceHT) }}</span>
                            </template>
                        </Column>

                        <Column header="Total HT" style="width: 130px">
                            <template #body="{ data }">
                                <strong>{{ formatCurrency(data.totalAmountHT) }}</strong>
                            </template>
                        </Column>

                        <Column header="Actions" style="width: 110px">
                            <template #body="{ data }">
                                <div v-if="editingTaskId === data.lineNo" class="inline-actions">
                                    <Button icon="pi pi-check" text rounded size="small" severity="info"
                                        @click="saveEditTask" v-tooltip.top="'Valider'" />
                                    <Button icon="pi pi-times" text rounded size="small" severity="danger"
                                        @click="cancelEditTask" v-tooltip.top="'Annuler'" />
                                </div>
                                <div v-else class="inline-actions">
                                    <Button icon="pi pi-pencil" text rounded size="small" @click="startEditTask(data)"
                                        v-tooltip.top="'Modifier'" />
                                    <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                                        @click="deleteTask(data)" v-tooltip.top="'Supprimer'" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>

                    <div v-else class="empty-state">
                        <i class="pi pi-inbox"></i>
                        <p>Aucune tâche</p>
                    </div>
                </div>
            </div>

            <!-- Subtasks Dialog -->
            <Dialog v-model:visible="subtasksDialogVisible" modal :closable="true"
                :style="{ width: '75vw', maxWidth: '1200px' }"
                :header="selectedTaskForSubtasks ? `Sous-tâches : ${selectedTaskForSubtasks.description}` : 'Sous-tâches'"
                class="project-dialog">
                <div v-if="selectedTaskForSubtasks" class="dialog-content">
                    <DataTable :value="getTaskSubtasks(selectedTaskForSubtasks)"
                        v-model:selection="currentSubtaskForAssignment" selectionMode="single" dataKey="id"
                        metaKeySelection="false" stripedRows class="items-table subtasks-table p-datatable-sm">
                        <Column field="subtaskCode" header="Code" style="width: 250px"></Column>
                        <Column field="subtaskDescription" header="Description"></Column>
                        <Column field="theoreticalQuantity" header="Qté Théorique" style="width: 120px">
                            <template #body="slotProps">
                                {{ slotProps.data.theoreticalQuantity }} h
                            </template>
                        </Column>
                        <Column header="Total Prévu" style="width: 120px">
                            <template #body="slotProps">
                                <span
                                    :class="{ 'text-green-600 font-bold': getSubtaskTotalPlanned(slotProps.data.id) >= slotProps.data.theoreticalQuantity }">
                                    {{ getSubtaskTotalPlanned(slotProps.data.id) }} h
                                </span>
                            </template>
                        </Column>
                        <Column header="Affectations" style="width: 100px" class="text-center">
                            <template #body="slotProps">
                                <Badge :value="getSubtaskAssignments(slotProps.data.id).length" severity="info" />
                            </template>
                        </Column>
                        <Column header="Actions" style="width: 80px" class="text-center">
                            <template #body="slotProps">
                                <Button icon="pi pi-plus" text rounded severity="info" size="small"
                                    @click.stop="openAddAssignmentDialog(slotProps.data)"
                                    v-tooltip.top="'Nouvelle Affectation'" />
                            </template>
                        </Column>
                    </DataTable>

                    <!-- Assignments Section (Master-Detail View) -->
                    <div v-if="currentSubtaskForAssignment" class="mt-4 pt-4 border-top-1 border-300 slide-down">
                        <!-- Existing Assignments List -->
                        <div>

                            <DataTable :value="getSubtaskAssignments(currentSubtaskForAssignment.id)"
                                class="p-datatable-sm border-1 border-200 border-round overflow-hidden shadow-sm"
                                stripedRows showGridlines>
                                <Column field="nomRessource" header="Ressource">
                                    <template #body="slotProps">
                                        <div class="flex align-items-center gap-2">
                                            <Avatar :label="slotProps.data.nomRessource.charAt(0)" shape="circle"
                                                size="small" class="bg-gray-100 text-gray-700" />
                                            <span class="font-medium text-900">{{ slotProps.data.nomRessource }}</span>
                                        </div>
                                    </template>
                                </Column>
                                <Column field="qtePrevue" header="Prévu (H)" style="width: 150px">
                                    <template #body="aProps">
                                        <div class="flex align-items-center justify-content-center gap-2">
                                            <InputNumber v-model="aProps.data.qtePrevue" :min="0" :step="0.5"
                                                mode="decimal" showButtons buttonLayout="horizontal" :allowEmpty="false"
                                                inputStyle="width: 50px; padding: 0.25rem; text-align: center;"
                                                class="compact-input-number"
                                                @blur="updateAssignmentPlannedQty(aProps.data)"
                                                :disabled="aProps.data.status === 'CANCELLED'" />
                                        </div>
                                    </template>
                                </Column>
                                <Column field="qteReelle" header="Réalisé (H)" style="width: 100px" class="text-center">
                                    <template #body="slotProps">
                                        <span class="font-medium">{{ slotProps.data.qteReelle || 0 }} h</span>
                                    </template>
                                </Column>
                                <Column field="status" header="Statut" style="width: 110px" class="text-center">
                                    <template #body="aProps">
                                        <Tag :value="getAssignmentStatusLabel(aProps.data.status)"
                                            :severity="getAssignmentStatusSeverity(aProps.data.status)"
                                            class="uppercase text-xs font-bold px-2 py-1" rounded />
                                    </template>
                                </Column>
                                <Column field="efficience" header="Efficience" style="width: 100px" class="text-center">
                                    <template #body="aProps">
                                        <div v-if="aProps.data.efficience" class="flex justify-content-center">
                                            <Tag :value="Math.round(aProps.data.efficience) + '%'"
                                                :severity="aProps.data.efficience >= 100 ? 'success' : (aProps.data.efficience >= 90 ? 'warning' : 'danger')"
                                                class="font-bold" rounded />
                                        </div>
                                        <span v-else class="text-400">-</span>
                                    </template>
                                </Column>
                                <Column style="width: 50px" header="">
                                    <template #body="aProps">
                                        <Button icon="pi pi-trash" text rounded severity="secondary" size="small"
                                            class="hover:bg-red-50 hover:text-red-600 transition-colors"
                                            @click="deleteAssignment(aProps.data)"
                                            :disabled="aProps.data.status !== 'PLANNED'"
                                            v-tooltip.top="'Supprimer (Planifié uniquement)'" />
                                    </template>
                                </Column>
                                <template #empty>
                                    <div class="text-center p-4 text-500 bg-white">
                                        <i class="pi pi-info-circle mr-2"></i>
                                        Aucune ressource affectée. Utilisez le formulaire ci-dessus pour en ajouter.
                                    </div>
                                </template>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </Dialog>

            <!-- Add Assignment Popup Dialog -->
            <Dialog v-model:visible="addAssignmentDialogVisible" modal :closable="true" header="Nouvelle Affectation"
                :style="{ width: '800px' }">

                <div v-if="currentSubtaskForAssignment && newAssignment[currentSubtaskForAssignment.id]"
                    style="padding: 1rem;">

                    <div
                        style="display: flex; flex-direction: row; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="width: 50%;">
                            <label style="font-weight: 500; margin-bottom: 0.5rem; display: block;">Ressource</label>
                            <Select v-model="newAssignment[currentSubtaskForAssignment.id].resourceId"
                                :options="resources" optionLabel="nom" optionValue="id"
                                placeholder="Choisir une ressource" filter :showClear="true" style="width:100%;">
                                <template #option="slotProps">
                                    <div class="flex align-items-center gap-2">
                                        <div>
                                            <div class="font-medium">{{ slotProps.option.nom }} {{
                                                slotProps.option.prenom
                                            }}</div>
                                        </div>
                                    </div>
                                </template>
                            </Select>
                        </div>
                        <div style="width: 220px;">
                            <label style="font-weight: 500; margin-bottom: 0.5rem; display: block;">Quantité (h)</label>
                            <InputNumber v-model="newAssignment[currentSubtaskForAssignment.id].qtePrevue" :min="0"
                                :step="0.5" mode="decimal" showButtons buttonLayout="horizontal"
                                :placeholder="currentSubtaskForAssignment.theoreticalQuantity.toString()"
                                inputClass="text-center" suffix=" h" style="width: 100%;" />
                        </div>
                    </div>

                    <div
                        style="display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <Button label="Annuler" icon="pi pi-times" text severity="secondary"
                            @click="closeAddAssignmentDialog" />
                        <Button label="Valider" icon="pi pi-check" severity="info"
                            @click="createAssignment(currentSubtaskForAssignment)"
                            :disabled="!newAssignment[currentSubtaskForAssignment.id].resourceId" />
                    </div>
                </div>
            </Dialog>

            <div class="totals-footer">
                <div class="totals-row">
                    <div class="total-item">
                        <span class="total-label">Total HT</span>
                        <span class="total-value">{{ formatCurrency(project.totalAmountHT) }}</span>
                    </div>
                    <div class="total-divider"></div>
                    <div class="total-item">
                        <span class="total-label">Remise</span>
                        <span class="total-value discount">-{{ formatCurrency(project.totalDiscountAmount)
                            }}</span>
                    </div>
                    <div class="total-divider"></div>
                    <div class="total-item">
                        <span class="total-label">TVA</span>
                        <span class="total-value">{{ formatCurrency(project.totalVatAmount) }}</span>
                    </div>
                    <div class="total-divider"></div>
                    <div class="total-item total-ttc">
                        <span class="total-label">Total TTC</span>
                        <span class="total-value-grand">{{ formatCurrency(project.totalAmountTTC) }}</span>
                    </div>
                </div>
            </div>
        </div>

    </Dialog>
</template>

<style scoped>
.project-dialog :deep(.p-dialog) {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.project-dialog :deep(.p-dialog-content) {
    padding: 0;
    max-height: 75vh;
    overflow-y: auto;
}

.project-dialog :deep(.p-dialog-header) {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
}

.project-dialog :deep(.p-dialog-footer) {
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
}

/* Loading */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    color: #64748b;
}

.loading-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

/* Content */
.dialog-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: #f8fafc;
}

/* Info Card */
.info-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

.info-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #e0f2fe;
}

.info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.info-header.clickable {
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
    padding: 1rem;
    margin: -1rem -1rem 0 -1rem;
    border-radius: 8px 8px 0 0;
}

.info-header.clickable:hover {
    background: #f8fafc;
}

.info-body {
    padding-top: 1.25rem;
    animation: slideDown 0.3s ease-out;
}

.header-left h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
}

.client-name {
    color: #64748b;
    font-size: 0.95rem;
}

.header-right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.header-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1rem;
}

.summary-item {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
}

.summary-separator {
    color: #cbd5e1;
    font-size: 0.85rem;
}

.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.info-section {
    margin-bottom: 1.5rem;
}

.info-section:last-of-type {
    margin-bottom: 1rem;
}

.section-subtitle {
    margin: 0 0 1rem 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e0f2fe;
    padding-bottom: 0.5rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.info-item label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
}

.info-item span {
    font-size: 0.95rem;
    color: #1e293b;
    font-weight: 500;
}

.text-success {
    color: #059669 !important;
    font-weight: 700;
}

.text-warning {
    color: #f59e0b !important;
    font-weight: 700;
}

.description {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.description label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5rem;
}

.description p {
    margin: 0;
    color: #475569;
    line-height: 1.6;
}

/* Section Card */
.section-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

.section-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #e0f2fe;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}

.section-header.clickable {
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
    padding: 1rem;
    margin: -1rem -1rem 1.25rem -1rem;
    border-radius: 8px;
}

.section-header.clickable:hover {
    background: #f8fafc;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.section-title i {
    font-size: 1.25rem;
    color: #3b82f6;
}

.section-title h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
}

.count-badge {
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 700;
}

.section-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.collapse-icon {
    font-size: 1.25rem;
    color: #64748b;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clickable:hover .collapse-icon {
    color: #3b82f6;
    transform: scale(1.1);
}

/* Table */
.items-table {
    border-radius: 6px;
    overflow: hidden;
}

.items-table :deep(th) {
    background: #f8fafc;
    font-weight: 700;
    font-size: 0.85rem;
    color: #475569;
    text-transform: uppercase;
    padding: 0.75rem;
}

.items-table :deep(td) {
    padding: 0.75rem;
    font-size: 0.95rem;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem;
    color: #94a3b8;
    background: #f8fafc;
    border-radius: 6px;
}

.empty-state i {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    opacity: 0.4;
}

.empty-state p {
    margin: 0;
    font-weight: 500;
}

/* Totals Footer - COMPACT & SIMPLE */
.totals-footer {
    background: white;
    border-radius: 8px;
    padding: 0.85rem 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.totals-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2rem;
}

.total-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.total-item.total-ttc {
    background: #059669;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    margin-left: 1rem;
}

.total-label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
}

.total-ttc .total-label {
    color: white;
}

.total-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
}

.total-value.discount {
    color: #ef4444;
}

.total-value-grand {
    font-size: 1.25rem;
    font-weight: 800;
    color: white;
}

.total-divider {
    width: 1px;
    height: 22px;
    background: #e2e8f0;
}

.total-divider.totals-separator {
    display: none;
}

/* Animations */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Scrollbar */
.project-dialog :deep(.p-dialog-content)::-webkit-scrollbar {
    width: 8px;
}

.project-dialog :deep(.p-dialog-content)::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.project-dialog :deep(.p-dialog-content)::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

/* Responsive */
@media (max-width: 1200px) {
    .info-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: 1fr;
    }

    .totals-row {
        flex-wrap: wrap;
        gap: 1rem;
    }

    .total-item {
        flex-basis: calc(50% - 0.5rem);
    }

    .total-item.total-ttc {
        flex-basis: 100%;
    }

    .total-divider {
        display: none;
    }
}

/* ===== INLINE EDITING STYLES ===== */
.inline-input {
    width: 100%;
    font-size: 0.9rem;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
}

.inline-input:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.inline-input-number {
    width: 100%;
}

.inline-input-number :deep(.p-inputnumber-input) {
    font-size: 0.9rem;
    padding: 0.5rem;
    text-align: right;
    border-radius: 6px;
}

.disabled-section {
    opacity: 0.6;
    pointer-events: none;
    filter: grayscale(1);
}

.disabled-section .section-header {
    cursor: not-allowed !important;
}

.w-full {
    width: 100%;
}

.inline-input-number :deep(.p-inputnumber-button) {
    width: 2rem;
}

.inline-actions {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
    align-items: center;
}

.items-table :deep(.p-datatable-tbody > tr:hover) {
    background: #f8fafc;
}

.items-table :deep(.p-datatable-tbody > tr) {
    transition: background 0.2s ease;
}

/* Autocomplete styles */
.autocomplete-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.autocomplete-item .item-desc {
    font-size: 0.85rem;
    color: #64748b;
}

.p-autocomplete {
    width: 100%;
}

.p-autocomplete :deep(.p-autocomplete-input) {
    width: 100%;
}
</style>
