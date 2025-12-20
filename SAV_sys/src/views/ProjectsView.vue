<script setup>
import { ref, onMounted, computed } from 'vue';
import { dataService } from '../services/dataService';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import TheNavbar from '../components/TheNavbar.vue';
import ProjectEditDialog from '../components/ProjectEditDialog.vue';


// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Panel from 'primevue/panel';
import Tag from 'primevue/tag';
import Toolbar from 'primevue/toolbar';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Paginator from 'primevue/paginator';
import SecureImage from '../components/SecureImage.vue';

const toast = useToast();
const confirm = useConfirm();



const projects = ref([]);

const loading = ref(true);
const totalRecords = ref(0);
const lazyParams = ref({
  first: 0,
  rows: 10,
  page: 0
});

const showModal = ref(false);
const isEditing = ref(false);
const currentProjectId = ref(null); // Just store ID for new dialog


// Collapsible Sections State
const showProjectInfoSection = ref(true);
const showTaskLinesSection = ref(true);
const showInfoSection = ref(true);
const showDetailsSection = ref(true);

// Task Lines State
const projectCompositions = ref([]);
const taskConfigurations = ref([]);
const expandedTasks = ref(new Set());
const selectedTaskToAdd = ref('');

// Data Loading State
const tasks = ref([]);
const models = ref([]);
const brands = ref([]);
const resources = ref([]);

// Resource Assignment Dialog State
const showResourceDialog = ref(false);
const currentSubtask = ref(null);
const resourceAssignments = ref([]);
const selectedResource = ref('');
const estimatedTime = ref(1);

// Bulk Assignment Dialog State
const showBulkAssignmentDialog = ref(false);
const bulkAssignments = ref([]); // All assignments for the project
const subtaskAssignments = ref({}); // Map of subtaskId -> {resourceId, estimatedTime}

// Search and Filter State
const searchQuery = ref(''); // For name search

const statusFilter = ref('');
const priorityFilter = ref('');
const typeFilter = ref('');
const startDate = ref('');
const endDate = ref('');

// Status Options for Filter (from API)
const statusOptions = [
  'Nouveau',
  'En cours',
  'Terminé'
];

// Priority Options for Filter
const priorityOptions = [
  'Haute',
  'Moyenne',
  'Basse'
];

// Type Options for Filter
const typeOptions = [
  'SRV RAPIDE',
  'MEC',
  'CAR',
  'LAVAGE'
];

// Computed Filtered Projects - Removed (now done server-side)
// Priority Color Helper
const getPrioritySeverity = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'haute': return 'danger';
    case 'moyenne': return 'warn';
    case 'basse': return 'success';
    default: return 'secondary';
  }
};

const getStatusSeverity = (status) => {
  switch (status) {
    case 'Nouveau':
      return 'info'; // Blue
    case 'En cours':
      return 'warn'; // Orange
    case 'Terminé':
      return 'success'; // Green
    default:
      return 'secondary';
  }
};

// Models Dictionary for quick lookup
const modelsMap = ref(new Map());

const loadModels = async () => {
  try {
    const loadedModels = await dataService.getModels();
    models.value = loadedModels;

    // Create a Map for O(1) lookup by model ID
    modelsMap.value = new Map(
      loadedModels.map(model => [String(model.id), model])
    );
  } catch (error) {
    console.error('Failed to load models:', error);
  }
};

// Helper functions to get model info
const getModelInfo = (modelId) => {
  if (!modelId) return null;
  return modelsMap.value.get(String(modelId));
};

const getBrandName = (modelId) => {
  const model = getModelInfo(modelId);
  return model?.brandName || 'N/A';
};

const getModelDescription = (modelId) => {
  const model = getModelInfo(modelId);
  return model?.commercialDescription || 'N/A';
};

const loadProjects = async (event) => {
  loading.value = true;
  try {
    if (event) {
      lazyParams.value = event;
    }

    const page = Math.floor(lazyParams.value.first / lazyParams.value.rows);

    // Prepare filters
    // Prepare filters
    const filters = {};
    if (searchQuery.value) filters.search = searchQuery.value;
    // Removed individual filters for name and projectNumber as they are replaced by global search
    if (statusFilter.value) filters.status = statusFilter.value;
    if (priorityFilter.value) filters.priority = priorityFilter.value;
    if (typeFilter.value) filters.type = typeFilter.value;

    if (startDate.value) {
      const start = new Date(startDate.value);
      start.setHours(0, 0, 0, 0);
      filters.dateDebut = start.toISOString();
    }

    if (endDate.value) {
      const end = new Date(endDate.value);
      end.setHours(23, 59, 59, 999);
      filters.dateFin = end.toISOString();
    }

    const response = await dataService.getProjects({
      page: page,
      size: lazyParams.value.rows,
      filters: filters
    });

    projects.value = response.content;
    totalRecords.value = response.totalElements;
  } catch (error) {
    console.error('Failed to load projects', error);
  } finally {
    loading.value = false;
  }
};




const loadTasks = async () => {
  try {
    tasks.value = await dataService.getTasks();
  } catch (error) {
    console.error('Failed to load tasks', error);
  }
};



const loadBrands = async () => {
  try {
    brands.value = await dataService.getBrands();
  } catch (error) {
    console.error('Failed to load brands', error);
  }
};

const loadResources = async () => {
  try {
    resources.value = await dataService.getResources();
  } catch (error) {
    console.error('Failed to load resources', error);
  }
};

onMounted(async () => {

  await loadProjects();
  await loadTasks();
  await loadModels();
  await loadBrands();
  await loadResources();
});



const openAddModal = () => {
  console.log('openAddModal called');
  isEditing.value = false;
  currentProjectId.value = null;
  showModal.value = true;
};

const openEditModal = async (project) => {
  isEditing.value = true;
  currentProjectId.value = project.id;
  showModal.value = true;
};

/* OLD CODE - BACKUP FOR REFERENCE
const openEditModalOLD = async (project) => {
  isEditing.value = true;
  // Find brandId from modelId if not present (for existing projects)
  let brandId = project.brandId;
  if (!brandId && project.modelId) {
    const model = models.value.find(m => m.id === project.modelId);
    brandId = model ? model.brandId : '';
  }

  currentProject.value = {
    ...project,
    brandId: brandId,
    attributes: project.attributes || initializeProjectAttributes()
  };

  // Load compositions and configurations
  await loadProjectCompositions(project.id);
  if (project.modelId) {
    await loadTaskConfigurations(project.modelId);
  }

  // Reset states
  showProjectInfoSection.value = true;
  showTaskLinesSection.value = true;
  expandedTasks.value = new Set();

  showModal.value = true;
};
*/


const loadProjectCompositions = async (projectId) => {
  try {
    projectCompositions.value = await dataService.getProjectCompositions(projectId);
  } catch (error) {
    console.error('Failed to load project compositions', error);
    projectCompositions.value = [];
  }
};

const loadTaskConfigurations = async (modelId) => {
  try {
    taskConfigurations.value = await dataService.getTaskConfigurationsByModel(modelId);
  } catch (error) {
    console.error('Failed to load task configurations', error);
    taskConfigurations.value = [];
  }
};

const getSubtasksForTask = (taskId) => {
  if (!currentProject.value.modelId) return [];
  return taskConfigurations.value.filter(tc => tc.taskId === taskId);
};

const toggleTaskExpand = (taskId) => {
  if (expandedTasks.value.has(taskId)) {
    expandedTasks.value.delete(taskId);
  } else {
    expandedTasks.value.add(taskId);
  }
};



const removeTaskLine = async (compositionId) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await dataService.deleteProjectComposition(compositionId);
        await loadProjectCompositions(currentProject.value.id);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Tâche supprimée', life: 3000 });
      } catch (error) {
        console.error('Failed to remove task line', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la tâche', life: 3000 });
      }
    }
  });
};

const toggleProjectInfo = () => {
  showProjectInfoSection.value = !showProjectInfoSection.value;
};

const toggleTaskLines = () => {
  showTaskLinesSection.value = !showTaskLinesSection.value;
};

const closeModal = () => {
  showModal.value = false;
};

const saveProject = async () => {
  try {
    if (isEditing.value) {
      await dataService.updateProject(currentProject.value);
    } else {
      await dataService.createProject(currentProject.value);
    }
    await loadProjects();
    closeModal();
  } catch (error) {
    console.error('Failed to save project', error);
  }
};

const deleteProject = async (id) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cette commande ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await dataService.deleteProject(id);
        await loadProjects();
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Commande supprimée', life: 3000 });
      } catch (error) {
        console.error('Failed to delete project', error);

        let detail = 'Impossible de supprimer la commande';
        if (error.response?.data?.includes('project_subtasks') || error.response?.data?.includes('foreign key')) {
          detail = 'Impossible de supprimer : cette commande contient des tâches ou des sous-tâches. Veuillez d\'abord les supprimer.';
        } else if (error.response?.status === 400) {
          detail = 'Impossible de supprimer : cette commande est liée à d\'autres éléments (tâches, factures, etc.).';
        }

        toast.add({ severity: 'error', summary: 'Erreur', detail: detail, life: 5000 });
      }
    }
  });
};

// Details Dialog Methods Removed
const openDetailsDialog = async (project) => {
  // Deprecated - merged into edit modal
};

const closeDetailsDialog = () => {
  // Deprecated
};

// Helper Functions
const getTaskName = (taskId) => tasks.value.find(t => t.id === taskId)?.name || 'N/A';
const getModelName = (modelId) => models.value.find(m => m.id === modelId)?.name || 'N/A';

// Formatted display helpers
const getModelDisplay = (modelId) => {
  const model = models.value.find(m => m.id === modelId);
  if (!model) return 'N/A';
  return `${model.id} - ${model.name}`;
};

const getBrandDisplay = (modelId) => {
  const model = models.value.find(m => m.id === modelId);
  if (!model) return 'N/A';
  const brand = brands.value.find(b => b.id === model.brandId);
  if (!brand) return 'N/A';
  return brand.name;
};

const getBrandLogo = (modelId) => {
  const model = getModelInfo(modelId);
  if (!model) return null;

  // Use loose comparison or string conversion for IDs to be safe
  const brand = brands.value.find(b => String(b.id) === String(model.brandId));

  if (!brand || !brand.logo) return null;
  return `/brands/${brand.id}/logo`;
};

const getMainTasks = () => tasks.value.filter(t => t.indentation === 0);

// Searchable Dropdown Logic
const taskSearchQuery = ref('');
const showTaskDropdown = ref(false);
const isAddingRow = ref(false);

const filteredTasksToAdd = computed(() => {
  const query = taskSearchQuery.value.toLowerCase();
  return getMainTasks().filter(task =>
    task.name.toLowerCase().includes(query)
  );
});

import ProgressBar from 'primevue/progressbar';

// ... imports ...

// Grouped Compositions for Display
const groupedCompositions = computed(() => {
  const groups = {};
  projectCompositions.value.forEach(comp => {
    if (!groups[comp.taskId]) {
      groups[comp.taskId] = {
        taskId: comp.taskId,
        status: comp.status, // Use status of the first found (or logic to aggregate)
        compositions: []
      };
    }
    groups[comp.taskId].compositions.push(comp);
  });

  // Calculate progress for each group
  return Object.values(groups).map(group => {
    let total = 0;
    let completed = 0;
    group.compositions.forEach(c => {
      const est = c.theoreticalQty || 0;
      total += est;
      if (c.status === 'Terminé') completed += est;
    });
    group.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return group;
  });
});

const selectTaskToAdd = async (task) => {
  // Just set the value, the button triggers the add
  selectedTaskToAdd.value = task.id;
  isAddingRow.value = false;
  taskSearchQuery.value = '';
  showTaskDropdown.value = false;
};

// Resource Assignment Dialog Methods
const openResourceDialog = async (composition) => {
  currentSubtask.value = composition;
  showResourceDialog.value = true;
  await loadResourceAssignments(composition.id);
};

const closeResourceDialog = () => {
  showResourceDialog.value = false;
  currentSubtask.value = null;
  resourceAssignments.value = [];
  selectedResource.value = '';
  estimatedTime.value = 1;
};

const loadResourceAssignments = async (compositionId) => {
  try {
    resourceAssignments.value = await dataService.getResourceAssignments(compositionId);
  } catch (error) {
    console.error('Failed to load resource assignments', error);
    resourceAssignments.value = [];
  }
};

const addResourceAssignment = async () => {
  if (!selectedResource.value || !estimatedTime.value) return;

  try {
    const newAssignment = {
      projectCompositionId: currentSubtask.value.id,
      resourceId: selectedResource.value,
      estimatedTime: parseFloat(estimatedTime.value),
      unit: 'Heure',
      status: 'Planifié'
    };
    await dataService.createResourceAssignment(newAssignment);
    await loadResourceAssignments(currentSubtask.value.id);
    selectedResource.value = '';
    estimatedTime.value = 1;
  } catch (error) {
    console.error('Failed to add resource assignment', error);
  }
};

const removeResourceAssignment = async (id) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cette affectation ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await dataService.deleteResourceAssignment(id);
        await loadResourceAssignments(currentSubtask.value.id);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Affectation supprimée', life: 3000 });
      } catch (error) {
        console.error('Failed to remove resource assignment', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer l\'affectation', life: 3000 });
      }
    }
  });
};

const getResourceName = (resourceId) => resources.value.find(r => r.id === resourceId)?.name || 'N/A';

const totalEstimatedTime = computed(() => {
  return resourceAssignments.value.reduce((sum, ra) => sum + (ra.estimatedTime || 0), 0);
});

// Bulk Assignment Dialog Methods
const openBulkAssignmentDialog = async () => {
  showBulkAssignmentDialog.value = true;
  await loadAllProjectAssignments();
};

const closeBulkAssignmentDialog = () => {
  showBulkAssignmentDialog.value = false;
  bulkAssignments.value = [];
  subtaskAssignments.value = {};
};

const loadAllProjectAssignments = async () => {
  try {
    bulkAssignments.value = await dataService.getProjectAssignments(currentProject.value.id);
  } catch (error) {
    console.error('Failed to load project assignments', error);
    bulkAssignments.value = [];
  }
};

// Get resources that match subtask competencies
const getMatchingResources = (subtask) => {
  if (!subtask.competences || subtask.competences.length === 0) {
    return resources.value; // No restriction
  }

  return resources.value.filter(resource => {
    return resource.competences && resource.competences.some(comp =>
      subtask.competences.includes(comp)
    );
  });
};

// Add assignment for a subtask
const addSubtaskAssignment = async (subtask) => {
  const assignment = subtaskAssignments.value[subtask.id];
  if (!assignment || !assignment.resourceId || !assignment.estimatedTime) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez sélectionner une ressource et un temps estimé', life: 3000 });
    return;
  }

  // Validate competency
  const resource = resources.value.find(r => r.id === assignment.resourceId);
  if (subtask.competences && subtask.competences.length > 0) {
    const hasRequiredCompetence = resource.competences && resource.competences.some(comp =>
      subtask.competences.includes(comp)
    );

    if (!hasRequiredCompetence) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Cette ressource n\'a pas les compétences requises pour cette sous-tâche',
        life: 3000
      });
      return;
    }
  }

  try {
    await dataService.assignResource({
      projectCompositionId: subtask.id,
      resourceId: assignment.resourceId,
      estimatedTime: parseFloat(assignment.estimatedTime)
    });

    await loadAllProjectAssignments();
    await dataService.autoUpdateProjectStatus(currentProject.value.id);
    await loadProjects();

    // Clear the form for this subtask
    delete subtaskAssignments.value[subtask.id];

    toast.add({ severity: 'success', summary: 'Succès', detail: 'Affectation créée', life: 3000 });
  } catch (error) {
    console.error('Failed to add assignment', error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer l\'affectation', life: 3000 });
  }
};

// Remove assignment
const removeAssignment = async (assignmentId) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cette affectation ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await dataService.deleteAssignment(assignmentId);
        await loadAllProjectAssignments();
        await dataService.autoUpdateProjectStatus(currentProject.value.id);
        await loadProjects();
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Affectation supprimée', life: 3000 });
      } catch (error) {
        console.error('Failed to remove assignment', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer l\'affectation', life: 3000 });
      }
    }
  });
};

// Get assignments for a specific subtask
const getSubtaskAssignments = (subtaskId) => {
  return bulkAssignments.value.filter(a => a.projectCompositionId === subtaskId);
};

// Get competency badges for display
const getCompetenceBadges = (competences) => {
  if (!competences || competences.length === 0) return 'Aucune';
  return competences.join(', ');
};

// Mark project as controlled (Fin travaux -> Véhicule Prêt à la livraison)
const markAsControlled = async (project) => {
  confirm.require({
    message: 'Marquer cette commande comme contrôlée et prête à la livraison ?',
    header: 'Confirmation',
    icon: 'pi pi-check-circle',
    accept: async () => {
      try {
        await dataService.updateProjectStatus(project.id, 'Véhicule Prêt à la livraison');
        await loadProjects();
        toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Commande marquée comme prête à la livraison',
          life: 3000
        });
      } catch (error) {
        console.error('Failed to mark as controlled', error);
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de mettre à jour le statut',
          life: 3000
        });
      }
    }
  });
};


// Auto-populate tasks logic
const populateTasks = async () => {
  confirm.require({
    message: 'Voulez-vous générer automatiquement les tâches pour toutes les commandes existantes ?',
    header: 'Confirmation',
    icon: 'pi pi-question-circle',
    accept: async () => {
      const allProjects = await dataService.getProjects();
      let count = 0;

      for (const project of allProjects) {
        // Check if project already has tasks
        const existingTasks = await dataService.getProjectCompositions(project.id);
        if (existingTasks.length > 0) continue;

        const typeAttr = project.attributes['attr9']; // Type
        const descAttr = project.attributes['attr3']; // Description

        let tasksToAdd = [];

        // Logic based on Type
        if (typeAttr === 'SRV RAPIDE') tasksToAdd.push('VIDANGE');
        else if (typeAttr === 'MEC') tasksToAdd.push('DIAG');
        else if (typeAttr === 'CAR') tasksToAdd.push('MO-0000002'); // Example bodywork task
        else if (typeAttr === 'LAVAGE') tasksToAdd.push('LAVAGE');

        // Logic based on Description keywords
        if (descAttr) {
          const desc = descAttr.toUpperCase();
          if (desc.includes('VIDANGE') && !tasksToAdd.includes('VIDANGE')) tasksToAdd.push('VIDANGE');
          if (desc.includes('DIAG') && !tasksToAdd.includes('DIAG')) tasksToAdd.push('DIAG');
          if (desc.includes('LAVAGE') && !tasksToAdd.includes('LAVAGE')) tasksToAdd.push('LAVAGE');
          if (desc.includes('FREIN') && !tasksToAdd.includes('MO-0000022')) tasksToAdd.push('MO-0000022'); // Plaquette frein
        }

        // Add tasks
        for (const taskId of tasksToAdd) {
          // Find subtasks for this task and model
          const subtasks = await dataService.getTaskConfigurationsByModel(project.modelId);
          const relevantSubtasks = subtasks.filter(tc => tc.taskId === taskId);

          if (relevantSubtasks.length > 0) {
            // Add main task with subtasks
            for (const st of relevantSubtasks) {
              await dataService.createProjectComposition({
                projectId: project.id,
                taskId: taskId,
                subtaskId: st.subtaskId,
                theoreticalQty: st.theoreticalQty,
                unit: st.unit,
                status: 'À faire'
              });
            }
          } else {
            // Add just the main task if no subtasks configured (fallback)
            await dataService.createProjectComposition({
              projectId: project.id,
              taskId: taskId,
              subtaskId: null,
              theoreticalQty: 1,
              unit: 'Heure',
              status: 'À faire'
            });
          }
        }
        if (tasksToAdd.length > 0) count++;
      }
      toast.add({ severity: 'success', summary: 'Succès', detail: `Tâches générées pour ${count} commandes.`, life: 3000 });
      loadProjects(); // Reload to show changes
    }
  });
};

const addTaskLine = async () => {
  if (!selectedTaskToAdd.value) return;

  try {
    // Check for subtasks configuration
    const subtasks = await dataService.getTaskConfigurationsByModel(currentProject.value.modelId);
    const relevantSubtasks = subtasks.filter(tc => tc.taskId === selectedTaskToAdd.value);

    if (relevantSubtasks.length > 0) {
      // Add all subtasks
      for (const st of relevantSubtasks) {
        await dataService.createProjectComposition({
          projectId: currentProject.value.id,
          taskId: selectedTaskToAdd.value,
          subtaskId: st.subtaskId,
          theoreticalQty: st.theoreticalQty,
          unit: st.unit,
          status: 'À faire'
        });
      }
    } else {
      // Add single main task
      const newComposition = {
        projectId: currentProject.value.id,
        taskId: selectedTaskToAdd.value,
        subtaskId: null,
        status: 'À faire',
        theoreticalQty: 1,
        unit: 'Heure'
      };
      await dataService.createProjectComposition(newComposition);
    }

    await loadProjectCompositions(currentProject.value.id);
    selectedTaskToAdd.value = '';
  } catch (error) {
    console.error('Failed to add task line', error);
  }
};

const viewMode = ref('list'); // 'list' or 'card'
const toggleViewMode = (mode) => {
  viewMode.value = mode;
};

</script>

<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- Header -->
      <div class="header-bar">
        <h1>Commande Service</h1>

        <IconField iconPosition="left" class="search-field" style="width: 400px;">
          <InputIcon class="pi pi-search" />
          <InputText v-model="searchQuery" placeholder="Rechercher (N°, Nom, Description)..."
            @keydown.enter="loadProjects()" />
        </IconField>

        <div class="spacer"></div>

        <DatePicker v-model="startDate" placeholder="Date début" showIcon class="date-filter" dateFormat="dd/mm/yy"
          @update:modelValue="loadProjects()" />
        <DatePicker v-model="endDate" placeholder="Date fin" showIcon class="date-filter" dateFormat="dd/mm/yy"
          @update:modelValue="loadProjects()" />
        <Select v-model="priorityFilter" :options="priorityOptions" placeholder="Priorité" class="status-filter"
          showClear @update:modelValue="loadProjects()" />
        <Select v-model="typeFilter" :options="typeOptions" placeholder="Type" class="status-filter" showClear
          @update:modelValue="loadProjects()" />
        <Select v-model="statusFilter" :options="statusOptions" placeholder="Statut" class="status-filter" showClear
          @update:modelValue="loadProjects()" />
        <div class="action-buttons">
          <div class="view-toggle">
            <Button icon="pi pi-list" text :class="{ 'p-button-primary': viewMode === 'list' }"
              @click="toggleViewMode('list')" v-tooltip.top="'Vue Liste'" />
            <Button icon="pi pi-th-large" text :class="{ 'p-button-primary': viewMode === 'card' }"
              @click="toggleViewMode('card')" v-tooltip.top="'Vue Carte'" />
          </div>
          <Button label="Nouvelle" icon="pi pi-plus" severity="info" @click="openAddModal" />
        </div>
      </div>

      <!-- DataTable (List View) -->
      <DataTable v-if="viewMode === 'list'" :value="projects" :lazy="true" :paginator="true" :rows="lazyParams.rows"
        :totalRecords="totalRecords" :loading="loading" @page="loadProjects($event)" dataKey="id" class="data-table"
        stripedRows :rowsPerPageOptions="[10, 20, 50, 100]"
        currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} commandes">


        <template #empty>
          <div class="text-center p-4 text-gray-500">
            <i class="pi pi-folder-open text-4xl mb-2"></i>
            <p>Aucune commande trouvée.</p>
          </div>
        </template>

        <Column field="projectNumber" header="N° Projet" sortable></Column>
        <Column field="name" header="Nom" sortable></Column>
        <Column header="Marque">
          <template #body="slotProps">
            {{ getBrandName(slotProps.data.modelId) }}
          </template>
        </Column>
        <Column header="Modèle">
          <template #body="slotProps">
            {{ getModelDescription(slotProps.data.modelId) }}
          </template>
        </Column>
        <Column header="Priorité" field="priority" sortable>
          <template #body="slotProps">
            <Tag :value="slotProps.data.priority || '-'" :severity="getPrioritySeverity(slotProps.data.priority)" />
          </template>
        </Column>
        <Column header="Statut" sortable field="status">
          <template #body="slotProps">
            <Tag :value="slotProps.data.status || '-'" :severity="getStatusSeverity(slotProps.data.status)" />
          </template>
        </Column>
        <Column header="Type" field="type" sortable>
          <template #body="slotProps">
            {{ slotProps.data.type || '-' }}
          </template>
        </Column>
        <Column header="Description" field="description" sortable style="min-width: 15rem">
          <template #body="slotProps">
            {{ slotProps.data.description || '-' }}
          </template>
        </Column>
        <Column header="Date" sortable field="creationDate">
          <template #body="slotProps">
            {{ new Date(slotProps.data.creationDate).toLocaleDateString() }}
          </template>
        </Column>
        <Column header="Taux Avancement" sortable field="progress">
          <template #body="slotProps">
            <ProgressBar :value="slotProps.data.progress" :showValue="true" style="height: 1.5rem; width: 150px">
            </ProgressBar>
          </template>
        </Column>
        <Column header="Actions" :exportable="false" style="min-width:8rem">
          <template #body="slotProps">
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <Button icon="pi pi-pencil" outlined rounded size="small" @click="openEditModal(slotProps.data)"
                v-tooltip.top="'Modifier'" />
              <Button icon="pi pi-trash" outlined rounded size="small" severity="danger"
                @click="deleteProject(slotProps.data.id)" v-tooltip.top="'Supprimer'" />
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Card View -->
      <div v-else class="card-view-container">
        <div v-if="projects.length === 0" class="text-center p-4 text-gray-500 w-full">
          <i class="pi pi-folder-open text-4xl mb-2"></i>
          <p>Aucune commande trouvée.</p>
        </div>
        <div v-else>
          <div class="project-cards-grid">
            <div v-for="project in projects" :key="project.id" class="project-card">
              <div class="card-left-border" :class="getStatusSeverity(project.status)"></div>
              <div class="card-content">
                <div class="card-header">
                  <div class="project-title">
                    <h3>{{ project.name }}</h3>
                    <span class="project-number">#{{ project.projectNumber }}</span>
                  </div>
                  <div class="card-actions">
                    <Button icon="pi pi-pencil" text rounded size="small" @click="openEditModal(project)" />
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                      @click="deleteProject(project.id)" />
                  </div>
                </div>

                <div class="card-body">
                  <div class="info-row-with-logo">
                    <div class="info-details">
                      <div class="info-row">
                        <i class="pi pi-car"></i>
                        <span>{{ getBrandName(project.modelId) }} - {{ getModelDescription(project.modelId) }}</span>
                      </div>
                      <div class="info-row">
                        <i class="pi pi-tag"></i>
                        <span>{{ project.type || 'Type non défini' }}</span>
                      </div>
                      <div class="info-row description-row" v-if="project.description">
                        <i class="pi pi-align-left"></i>
                        <span class="description-text" :title="project.description">{{ project.description }}</span>
                      </div>
                    </div>
                    <div class="brand-logo-wrapper" v-if="getBrandLogo(project.modelId)">
                      <SecureImage :src="getBrandLogo(project.modelId)" :alt="getBrandName(project.modelId)"
                        class="card-brand-logo" />
                    </div>
                  </div>
                </div>

                <div class="card-footer">
                  <div class="tags-group">
                    <Tag :value="project.status || 'Nouveau'" :severity="getStatusSeverity(project.status)"
                      class="status-tag" />
                    <Tag :value="project.priority || 'Moyenne'" :severity="getPrioritySeverity(project.priority)"
                      class="priority-tag" />
                  </div>
                  <div class="date-info">
                    <i class="pi pi-calendar"></i>
                    {{ new Date(project.creationDate).toLocaleDateString() }}
                  </div>
                </div>

                <div class="progress-section">
                  <ProgressBar :value="project.progress" :showValue="false" style="height: 6px"
                    :class="getStatusSeverity(project.status)"></ProgressBar>
                  <span class="progress-text">{{ project.progress }}%</span>
                </div>
              </div>
            </div>
          </div>
          <Paginator :first="lazyParams.first" :rows="lazyParams.rows" :totalRecords="totalRecords"
            :rowsPerPageOptions="[10, 20, 50, 100]" @page="loadProjects($event)" style="margin-top: 2rem" />
        </div>
      </div>
    </main>


    <!-- New Project Edit Dialog Component -->
    <ProjectEditDialog v-model:visible="showModal" :project-id="currentProjectId" @saved="loadProjects" />
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
  width: 350px !important;
  min-width: 200px !important;
  max-width: 350px !important;
}

.search-field :deep(.p-inputtext) {
  width: 100% !important;
}

.spacer {
  flex-grow: 1;
}

.date-filter {
  width: 250px;
}

.status-filter {
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

.view-toggle {
  display: flex;
  gap: 0;
  margin-right: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.view-toggle :deep(.p-button) {
  border-radius: 0;
  border: none;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #64748b;
}

.view-toggle :deep(.p-button.p-button-primary) {
  background: #eff6ff;
  color: #3b82f6;
}

.view-toggle :deep(.p-button:hover) {
  background: #f8fafc;
  color: #1e293b;
}

.view-toggle :deep(.p-button.p-button-primary:hover) {
  background: #dbeafe;
  color: #2563eb;
}

/* Card View Styles */
.card-view-container {
  width: 100%;
}

.project-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-left-border {
  width: 6px;
  height: 100%;
  flex-shrink: 0;
}

.card-left-border.info {
  background-color: #3b82f6;
}

.card-left-border.warn {
  background-color: #f59e0b;
}

.card-left-border.success {
  background-color: #22c55e;
}

.card-left-border.secondary {
  background-color: #64748b;
}

.card-left-border.danger {
  background-color: #ef4444;
}

.card-content {
  flex: 1;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.project-number {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row-with-logo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.info-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.brand-logo-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: white;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Deep selector for SecureImage img tag */
:deep(.card-brand-logo img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.9rem;
}

.info-row i {
  color: #94a3b8;
  font-size: 1rem;
}

.description-row {
  align-items: flex-start;
}

.description-row i {
  margin-top: 0.2rem;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85rem;
  color: #64748b;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}

.tags-group {
  display: flex;
  gap: 0.5rem;
}

.date-info {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-section :deep(.p-progressbar) {
  flex: 1;
  background: #f1f5f9;
}

.progress-section :deep(.p-progressbar .p-progressbar-value) {
  background: #3b82f6;
}

/* Custom progress colors based on status */
.progress-section :deep(.p-progressbar.success .p-progressbar-value) {
  background: #22c55e;
}

.progress-section :deep(.p-progressbar.warn .p-progressbar-value) {
  background: #f59e0b;
}

.progress-section :deep(.p-progressbar.info .p-progressbar-value) {
  background: #3b82f6;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  min-width: 2.5rem;
  text-align: right;
}

@media (max-width: 640px) {
  .project-cards-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================
   COMMAND DIALOG STYLES
   ============================================ */

.command-dialog :deep(.p-dialog-content) {
  padding: 0 !important;
  overflow: visible;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  max-height: 75vh;
  overflow-y: auto;
}

/* Scrollbar Styling */
.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Section Containers */
.info-section,
.details-section,
.tasks-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;
}

.info-section:hover,
.details-section:hover,
.tasks-section:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
  transition: all 0.2s ease;
}

.section-header.clickable {
  cursor: pointer;
  user-select: none;
}

.section-header.clickable:hover {
  background-color: #f8fafc;
  margin: -0.5rem -1rem 1.5rem -1rem;
  padding: 0.5rem 1rem 1rem 1rem;
  border-radius: 8px;
}

.section-header i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.section-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.01em;
  flex: 1;
}

.toggle-icon {
  font-size: 1.25rem !important;
  color: #64748b !important;
  transition: transform 0.3s ease, color 0.2s ease;
}

.section-header.clickable:hover .toggle-icon {
  color: #3b82f6 !important;
}

/* Grid Layouts */
.info-grid,
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

@media (max-width: 768px) {

  .info-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }
}

/* Field Styling */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
}

.required {
  color: #ef4444;
  font-weight: 700;
  margin-left: 0.125rem;
}

/* Input Field Enhancements */
.field :deep(.p-inputtext),
.field :deep(.p-select),
.field :deep(.p-datepicker) {
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  transition: all 0.2s ease;
}

.field :deep(.p-inputtext:hover),
.field :deep(.p-select:hover),
.field :deep(.p-datepicker:hover) {
  border-color: #94a3b8;
}

.field :deep(.p-inputtext:focus),
.field :deep(.p-select:focus),
.field :deep(.p-datepicker:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field :deep(.p-inputtext:disabled) {
  background-color: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

/* Tasks Section Specific Styles */
.add-task-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
}

.task-select-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-select-wrapper label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.add-task-btn {
  flex-shrink: 0;
  height: 42px;
}

.tasks-table-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.tasks-table :deep(.p-datatable-thead) {
  background: #f8fafc;
}

.tasks-table :deep(.p-datatable-thead th) {
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Subtasks Expansion */
.subtasks-expansion {
  padding: 1.5rem;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  border-top: 2px solid #e2e8f0;
}

.subtasks-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subtasks-title::before {
  content: '→';
  color: #3b82f6;
  font-weight: 700;
}

.subtasks-table {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.dialog-footer :deep(.p-button) {
  min-width: 120px;
  font-weight: 600;
}

/* Responsive Adjustments */
@media (max-width: 640px) {
  .dialog-content {
    padding: 1rem;
    gap: 1rem;
  }

  .info-section,
  .details-section,
  .tasks-section {
    padding: 1rem;
  }

  .section-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }

  .add-task-row {
    flex-direction: column;
    align-items: stretch;
  }

  .add-task-btn {
    width: 100%;
  }
}

/* Animation for sections */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-section,
.details-section,
.tasks-section {
  animation: fadeInUp 0.3s ease-out;
}

.info-section {
  animation-delay: 0s;
}

.details-section {
  animation-delay: 0.1s;
}

.tasks-section {
  animation-delay: 0.2s;
}
</style>
