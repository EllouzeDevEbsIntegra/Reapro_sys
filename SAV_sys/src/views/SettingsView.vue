<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import TheNavbar from '../components/TheNavbar.vue';
import ObjectivesSettings from '../components/ObjectivesSettings.vue';
import GeneralSettings from '../components/GeneralSettings.vue';
import NumberingSeriesSettings from '../components/NumberingSeriesSettings.vue';
import { dataService } from '../services/dataService';
import { itemService } from '../services/itemService';
import { authService } from '../services/authService';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import InputSwitch from 'primevue/inputswitch';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import Avatar from 'primevue/avatar';
import Password from 'primevue/password';
import Divider from 'primevue/divider';
import { useConfirm } from 'primevue/useconfirm';
import { useAuthStore } from '../stores/auth';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Paginator from 'primevue/paginator';
import { useGeneralSettings, currencies } from '../composables/useGeneralSettings';
import SecureImage from '../components/SecureImage.vue';

const activeTab = ref('objectives');
const isSidebarCollapsed = ref(false);
const toast = useToast();
const confirm = useConfirm();
const authStore = useAuthStore();

const loggedInUserId = computed(() => authStore.user?.id);

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const tabs = [
    { id: 'objectives', label: 'Objectifs', icon: 'pi pi-bullseye' },
    { id: 'resources', label: 'Ressources', icon: 'pi pi-users' },
    { id: 'competences', label: 'Compétences', icon: 'pi pi-briefcase' },
    { id: 'teams', label: 'Équipes', icon: 'pi pi-sitemap' },
    { id: 'tasks', label: 'Tâches', icon: 'pi pi-check-square' },
    { id: 'subtasks', label: 'Sous-Tâches', icon: 'pi pi-list' },
    { id: 'brands', label: 'Marque Véhicule', icon: 'pi pi-car' },
    { id: 'models', label: 'Modèle Véhicule', icon: 'pi pi-cog' },
    { id: 'taskconfigs', label: 'Configuration Tâches', icon: 'pi pi-sliders-h' },
    { id: 'items', label: 'Article', icon: 'pi pi-box' },
    { id: 'users', label: 'Utilisateurs', icon: 'pi pi-user' },
    { id: 'numbering', label: 'Souches', icon: 'pi pi-sort-numeric-down' },
    { id: 'general', label: 'Général', icon: 'pi pi-cog' }
];

const viewOptions = [
    { icon: 'pi pi-list', value: 'list' },
    { icon: 'pi pi-th-large', value: 'card' }
];

const resourceViewMode = ref('list');
const teamViewMode = ref('list');

// Resources State
const resources = ref([]);
const showResourceModal = ref(false);
const isEditingResource = ref(false);
const currentResource = ref({
    id: '',
    nom: '',
    description: '',
    typeRessource: 'Humaine',
    telephone: '',
    adresse: '',
    dateRecrutement: '',
    teamId: '',
    competenceIds: [],
    estActive: true,
    version: 0,
    picture: null
});

const resourcePictureFile = ref(null);

// Resource Pagination & Filtering
const resourceFirst = ref(0);
const resourceRows = ref(10);

const resourceFilters = ref({ global: { value: null, matchMode: 'contains' } });

const filteredResources = computed(() => {
    let data = resources.value;
    if (resourceFilters.value.global.value) {
        const searchTerm = resourceFilters.value.global.value.toLowerCase();
        data = data.filter(r =>
            (r.nom && r.nom.toLowerCase().includes(searchTerm)) ||
            (r.teamName && r.teamName.toLowerCase().includes(searchTerm)) ||
            (r.description && r.description.toLowerCase().includes(searchTerm))
        );
    }
    return data;
});

const paginatedResources = computed(() => {
    return filteredResources.value.slice(resourceFirst.value, resourceFirst.value + resourceRows.value);
});

// Teams State
const teams = ref([]);
const showTeamModal = ref(false);
const isEditingTeam = ref(false);
const currentTeam = ref({ id: '', name: '', description: '', version: 0, picture: null });
const teamPictureFile = ref(null);

// Competences State
const competences = ref([]);
const showCompetenceModal = ref(false);
const isEditingCompetence = ref(false);
const currentCompetence = ref({ id: '', code: '', label: '', description: '' });

// Tasks State
const tasks = ref([]);
const showTaskModal = ref(false);
const isEditingTask = ref(false);
const currentTask = ref({ id: '', code: '', label: '', competenceIds: [], subTaskLinks: [], _etag: '' });

// SubTasks State
const subtasks = ref([]);
const showSubTaskModal = ref(false);
const isEditingSubTask = ref(false);
const currentSubTask = ref({ id: '', code: '', label: '', competenceIds: [], _etag: '' });

// Brands State
const brands = ref([]);
const showBrandModal = ref(false);
const isEditingBrand = ref(false);
const currentBrand = ref({ id: '', name: '' });

// Models State
const models = ref([]);
const showModelModal = ref(false);
const isEditingModel = ref(false);
const currentModel = ref({ id: '', name: '', commercialDescription: '', brandId: '' });

// Task Configuration State (nouvelle approche)
const selectedTaskId = ref(null); // ID de la tâche sélectionnée (pour le Dropdown)
const selectedTaskForConfig = ref(null); // Objet complet de la tâche sélectionnée
const taskSubTaskLinks = ref([]); // Sous-tâches associées à la tâche sélectionnée
const showSubTaskLinkModal = ref(false);
const isEditingSubTaskLink = ref(false);
const currentSubTaskLink = ref({ subTaskId: null, theoreticalQuantity: 0, modelId: null });
const editingLinkIndex = ref(-1); // Index du lien en cours d'édition

// Items State
const items = ref([]);
const showItemModal = ref(false);
const isEditingItem = ref(false);
const currentItem = ref({
    no: '',
    designation: '',
    unitPriceHT: 0,
    category: '',
    subcategory: ''
});

// Item categories and subcategories
const itemCategories = [
    { value: 'PDR', label: 'Pièces de rechange' },
    { value: 'LUB', label: 'Lubrifiants' }
];

const itemSubcategories = {
    PDR: [
        { value: 'CAR', label: 'CAR' },
        { value: 'MEC', label: 'MEC' },
        { value: 'RAPIDE', label: 'RAPIDE' },
        { value: 'AUTRE', label: 'AUTRE' }
    ],
    LUB: [
        { value: 'HUILE_MOTEUR', label: 'HUILE MOTEUR' },
        { value: 'HUILE_BOITE', label: 'HUILE BOITE' },
        { value: 'ADBLUE', label: 'ADBLUE' },
        { value: 'AUTRE', label: 'AUTRE' }
    ]
};

// Computed filtered subcategories based on selected category
const filteredSubcategories = computed(() => {
    if (!currentItem.value.category) return [];
    return itemSubcategories[currentItem.value.category] || [];
});

// Items pagination
const itemsLazyParams = ref({
    first: 0,
    rows: 10,
    page: 0
});
const totalItemsRecords = ref(0);

// Items filters
const itemFilters = ref({ global: { value: null, matchMode: 'contains' } });

// Users State
const users = ref([]);
const showUserModal = ref(false);
const isEditingUser = ref(false);
const currentUser = ref({ id: '', firstname: '', lastname: '', email: '', role: 'ROLE_ADMIN', password: '', confirmPassword: '' });

const currentUserRole = computed(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            return user.role;
        } catch (e) {
            return null;
        }
    }
    return null;
});

// General Settings
const { settings: generalSettings, saveSettings, loadSettings } = useGeneralSettings();

const onCurrencyChange = () => {
    const selected = currencies.find(c => c.code === generalSettings.value.currency);
    if (selected) {
        generalSettings.value.currencySymbol = selected.symbol;
    }
};

const saveGeneralSettings = () => {
    saveSettings(generalSettings.value);
    toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Paramètres généraux enregistrés avec succès',
        life: 3000
    });
};

// ...

// In the template, I will change the condition to be more inclusive or just check for truthiness if I want to trust the backend.
// But for now, let's just see the log.



// Computed for filtered models based on selected brand
const filteredModels = computed(() => {
    if (!selectedBrandForConfig.value) return [];
    return models.value.filter(m => m.brandId === selectedBrandForConfig.value);
});

// Filters for DataTables


const competenceFilters = ref({ global: { value: null, matchMode: 'contains' } });
const teamFilters = ref({ global: { value: null, matchMode: 'contains' } });
const taskFilters = ref({ global: { value: null, matchMode: 'contains' } });
const subtaskFilters = ref({ global: { value: null, matchMode: 'contains' } });
const brandFilters = ref({ global: { value: null, matchMode: 'contains' } });
const modelFilters = ref({ global: { value: null, matchMode: 'contains' } });
const taskConfigFilters = ref({ global: { value: null, matchMode: 'contains' } });
const userFilters = ref({ global: { value: null, matchMode: 'contains' } });




// Load Data


const loadResources = async () => {
    try {
        resources.value = await dataService.getResources();
    } catch (error) {
        console.error('Failed to load resources', error);
    }
};

const loadCompetences = async () => {
    try {
        competences.value = await dataService.getCompetences();
    } catch (error) {
        console.error('Failed to load competences', error);
    }
};

const loadTasks = async () => {
    try {
        tasks.value = await dataService.getTasks();
    } catch (error) {
        console.error('Failed to load tasks', error);
    }
};

const loadSubTasks = async () => {
    try {
        subtasks.value = await dataService.getSubTasks();
    } catch (error) {
        console.error('Failed to load subtasks', error);
    }
};

const loadBrands = async () => {
    try {
        brands.value = await dataService.getBrands();
    } catch (error) {
        console.error('Failed to load brands', error);
    }
};

const loadModels = async () => {
    try {
        models.value = await dataService.getModels();
    } catch (error) {
        console.error('Failed to load models', error);
    }
};


const loadTeams = async () => {
    try {
        teams.value = await dataService.getTeams();
    } catch (error) {
        console.error('Failed to load teams', error);
    }
};

const loadUsers = async () => {
    try {
        const response = await authService.getAdmins();
        users.value = response.content || response; // Handle paginated or list response
    } catch (error) {
        console.error('Failed to load users', error);
        console.error('Error details:', error.response?.data);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les utilisateurs: ' + (error.response?.data?.message || error.message), life: 5000 });
    }
};


onMounted(async () => {

    await loadResources();
    await loadCompetences();
    await loadTeams();
    await loadTasks();
    await loadSubTasks();
    await loadBrands();
    await loadModels();
    await loadUsers();
});




// Resource Methods
const openAddResourceModal = () => {
    isEditingResource.value = false;
    currentResource.value = {
        nom: '',
        description: '',
        typeRessource: 'Humaine',
        telephone: '',
        adresse: '',
        dateRecrutement: '',
        teamId: '',
        competenceIds: [],
        estActive: true,
        version: 0,
        picture: null
    };
    resourcePictureFile.value = null;
    showResourceModal.value = true;
};

const openEditResourceModal = (resource) => {
    isEditingResource.value = true;
    // Extraire les IDs des compétences si c'est un array d'objets
    const competenceIds = Array.isArray(resource.competences)
        ? resource.competences.map(c => typeof c === 'object' ? c.id : c)
        : [];

    currentResource.value = {
        ...resource,
        competenceIds,
        teamId: resource.teamId || ''
    };
    resourcePictureFile.value = null;
    showResourceModal.value = true;
};

const closeResourceModal = () => {
    showResourceModal.value = false;
};

const saveResource = async () => {
    try {
        let resourceId;
        if (isEditingResource.value) {
            await dataService.updateResource(currentResource.value);
            resourceId = currentResource.value.id;
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Ressource mise à jour avec succès', life: 3000 });
        } else {
            const newResource = await dataService.createResource(currentResource.value);
            resourceId = newResource.id;
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Ressource créée avec succès', life: 3000 });
        }

        // Handle Picture Upload
        if (resourcePictureFile.value) {
            await dataService.uploadResourcePicture(resourceId, resourcePictureFile.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo uploadée avec succès', life: 3000 });
            resourcePictureFile.value = null;
        }

        await loadResources();
        closeResourceModal();
    } catch (error) {
        console.error('Failed to save resource', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de la ressource', life: 5000 });
    }
};

const onResourcePictureSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        resourcePictureFile.value = file;
    }
};

const getResourcePictureUrl = (resourceId) => {
    if (!resourceId) return null;
    return `/ressources/${resourceId}/picture`;
};

const deleteResource = (resource) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer la ressource "${resource.nom}" ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteResource(resource.id, resource.version);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Ressource supprimée avec succès', life: 3000 });
                await loadResources();
            } catch (error) {
                console.error('Failed to delete resource', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de la ressource', life: 5000 });
            }
        }
    });
};

// Competence Methods
const openAddCompetenceModal = () => {
    isEditingCompetence.value = false;
    currentCompetence.value = { code: '', label: '', description: '' };
    showCompetenceModal.value = true;
};

const openEditCompetenceModal = (comp) => {
    isEditingCompetence.value = true;
    currentCompetence.value = { ...comp };
    showCompetenceModal.value = true;
};

const closeCompetenceModal = () => {
    showCompetenceModal.value = false;
};

const saveCompetence = async () => {
    try {
        if (isEditingCompetence.value) {
            await dataService.updateCompetence(currentCompetence.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Compétence mise à jour avec succès', life: 3000 });
        } else {
            await dataService.createCompetence(currentCompetence.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Compétence créée avec succès', life: 3000 });
        }
        await loadCompetences();
        closeCompetenceModal();
    } catch (error) {
        console.error('Failed to save competence', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de la compétence', life: 5000 });
    }
};

const deleteCompetence = (id) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer cette compétence ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteCompetence(id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Compétence supprimée avec succès', life: 3000 });
                await loadCompetences();
            } catch (error) {
                console.error('Failed to delete competence', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de la compétence', life: 5000 });
            }
        }
    });
};

// Task Methods
const openAddTaskModal = () => {
    isEditingTask.value = false;
    currentTask.value = { code: '', label: '', competenceIds: [], subTaskLinks: [], _etag: '' };
    showTaskModal.value = true;
};

const openEditTaskModal = (task) => {
    isEditingTask.value = true;
    // Extraire les IDs des compétences
    const competenceIds = Array.isArray(task.competences)
        ? task.competences.map(c => typeof c === 'object' ? c.id : c)
        : [];

    // Extraire les subTaskLinks depuis la réponse API
    const subTaskLinks = Array.isArray(task.subTasks)
        ? task.subTasks.map(st => ({
            subTaskId: st.subTaskId,
            theoreticalQuantity: st.theoreticalQuantity || 0,
            modelId: st.modelId || null
        }))
        : [];

    currentTask.value = {
        ...task,
        competenceIds,
        subTaskLinks
    };
    showTaskModal.value = true;
};

const closeTaskModal = () => {
    showTaskModal.value = false;
};

const saveTask = async () => {
    try {
        if (isEditingTask.value) {
            await dataService.updateTask(currentTask.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Tâche mise à jour avec succès', life: 3000 });
        } else {
            await dataService.createTask(currentTask.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Tâche créée avec succès', life: 3000 });
        }
        await loadTasks();
        closeTaskModal();
    } catch (error) {
        console.error('Failed to save task', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de la tâche', life: 5000 });
    }
};

const deleteTask = (task) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer la tâche "${task.label}" ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteTask(task.id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Tâche supprimée avec succès', life: 3000 });
                await loadTasks();
            } catch (error) {
                console.error('Failed to delete task', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de la tâche', life: 5000 });
            }
        }
    });
};

// SubTask Methods
const openAddSubTaskModal = () => {
    isEditingSubTask.value = false;
    currentSubTask.value = { code: '', label: '', competenceIds: [], _etag: '' };
    showSubTaskModal.value = true;
};

const openEditSubTaskModal = (subtask) => {
    isEditingSubTask.value = true;
    const competenceIds = Array.isArray(subtask.competences)
        ? subtask.competences.map(c => typeof c === 'object' ? c.id : c)
        : [];

    currentSubTask.value = {
        ...subtask,
        competenceIds
    };
    showSubTaskModal.value = true;
};

const closeSubTaskModal = () => {
    showSubTaskModal.value = false;
};

const saveSubTask = async () => {
    try {
        if (isEditingSubTask.value) {
            await dataService.updateSubTask(currentSubTask.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Sous-tâche mise à jour avec succès', life: 3000 });
        } else {
            await dataService.createSubTask(currentSubTask.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Sous-tâche créée avec succès', life: 3000 });
        }
        await loadSubTasks();
        closeSubTaskModal();
    } catch (error) {
        console.error('Failed to save subtask', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de la sous-tâche', life: 5000 });
    }
};

const deleteSubTask = (subtask) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer la sous-tâche "${subtask.label}" ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteSubTask(subtask.id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Sous-tâche supprimée avec succès', life: 3000 });
                await loadSubTasks();
            } catch (error) {
                console.error('Failed to delete subtask', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de la sous-tâche', life: 5000 });
            }
        }
    });
};

// Brand Methods
const openAddBrandModal = () => {
    isEditingBrand.value = false;
    currentBrand.value = { id: '', name: '' };
    showBrandModal.value = true;
};

const openEditBrandModal = (brand) => {
    isEditingBrand.value = true;
    currentBrand.value = {
        id: brand.id,
        name: brand.name
    };
    showBrandModal.value = true;
};

const closeBrandModal = () => {
    showBrandModal.value = false;
};



const logoFile = ref(null);

const onLogoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        logoFile.value = file;
    }
};

const getBrandLogoUrl = (brandId) => {
    if (!brandId) return null;
    // Use the API endpoint directly. SecureImage will handle the auth token.
    // The base URL (http://localhost:8055/api) is handled by the api instance in SecureImage,
    // but SecureImage takes a full URL or a path.
    // If we pass a relative path starting with /, SecureImage calls api.get(path).
    // api.js has baseURL: 'http://localhost:8055/api'.
    // So passing '/brands/${brandId}/logo' results in 'http://localhost:8055/api/brands/${brandId}/logo'.
    return `/brands/${brandId}/logo`;
};

const saveBrand = async () => {
    try {
        let brandId = currentBrand.value.id;

        if (isEditingBrand.value) {
            await dataService.updateBrand(
                currentBrand.value.id,
                { name: currentBrand.value.name }
            );
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Marque mise à jour avec succès', life: 3000 });
        } else {
            await dataService.createBrand({
                id: currentBrand.value.id,
                name: currentBrand.value.name
            });
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Marque créée avec succès', life: 3000 });
        }

        // Handle Logo Upload
        if (logoFile.value) {
            await dataService.uploadBrandLogo(brandId, logoFile.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Logo uploadé avec succès', life: 3000 });
            logoFile.value = null; // Reset file
        }

        await loadBrands();
        closeBrandModal();
    } catch (error) {
        console.error('Failed to save brand', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de la marque', life: 5000 });
    }
};

const deleteBrand = (id) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer cette marque ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteBrand(id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Marque supprimée avec succès', life: 3000 });
                await loadBrands();
            } catch (error) {
                console.error('Failed to delete brand', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de la marque', life: 5000 });
            }
        }
    });
};

// Model Methods
const openAddModelModal = () => {
    isEditingModel.value = false;
    currentModel.value = { name: '', commercialDescription: '', brandId: '' };
    showModelModal.value = true;
};

const openEditModelModal = (model) => {
    isEditingModel.value = true;
    currentModel.value = {
        id: model.id,
        name: model.name,
        commercialDescription: model.commercialDescription || '',
        brandId: model.brandId
    };
    showModelModal.value = true;
};

const closeModelModal = () => {
    showModelModal.value = false;
};

const saveModel = async () => {
    try {
        if (isEditingModel.value) {
            await dataService.updateModel(
                currentModel.value.id,
                {
                    name: currentModel.value.name,
                    commercialDescription: currentModel.value.commercialDescription || '',
                    brandId: currentModel.value.brandId
                }
            );
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Modèle mis à jour avec succès', life: 3000 });
        } else {
            await dataService.createModel({
                name: currentModel.value.name,
                commercialDescription: currentModel.value.commercialDescription || '',
                brandId: currentModel.value.brandId
            });
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Modèle créé avec succès', life: 3000 });
        }
        await loadModels();
        closeModelModal();
    } catch (error) {
        console.error('Failed to save model', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement du modèle', life: 5000 });
    }
};

const deleteModel = (id) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer ce modèle ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteModel(id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Modèle supprimé avec succès', life: 3000 });
                await loadModels();
            } catch (error) {
                console.error('Failed to delete model', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression du modèle', life: 5000 });
            }
        }
    });
};

// Items Methods
const loadItems = async (event = null) => {
    try {
        // Update lazy params if event is provided (pagination event)
        if (event) {
            itemsLazyParams.value = event;
        }

        const params = {
            page: itemsLazyParams.value.page || 0,
            size: itemsLazyParams.value.rows || 10
        };

        // Add search parameter only if there's a value
        const searchValue = itemFilters.value.global?.value;
        if (searchValue && searchValue.trim() !== '') {
            params.search = searchValue.trim();
        }

        const data = await itemService.getItems(params);

        items.value = data.content || [];
        totalItemsRecords.value = data.totalElements || 0;
    } catch (error) {
        console.error('Failed to load items', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du chargement des articles', life: 5000 });
    }
};

const onItemsPage = (event) => {
    loadItems(event);
};

const onItemsSearch = () => {
    // Reset to first page when searching
    itemsLazyParams.value.page = 0;
    itemsLazyParams.value.first = 0;
    loadItems();
};

const openAddItemModal = () => {
    isEditingItem.value = false;
    currentItem.value = {
        no: '',
        designation: '',
        unitPriceHT: 0,
        category: '',
        subcategory: ''
    };
    showItemModal.value = true;
};

const onCategoryChange = () => {
    // Reset subcategory when category changes
    currentItem.value.subcategory = '';
};

const openEditItemModal = (item) => {
    isEditingItem.value = true;
    currentItem.value = { ...item };
    showItemModal.value = true;
};

const closeItemModal = () => {
    showItemModal.value = false;
};

const saveItem = async () => {
    try {
        if (isEditingItem.value) {
            await itemService.updateItem(currentItem.value.no, currentItem.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Article mis à jour avec succès', life: 3000 });
        } else {
            await itemService.createItem(currentItem.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Article créé avec succès', life: 3000 });
        }
        await loadItems();
        closeItemModal();
    } catch (error) {
        console.error('Failed to save item', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de l\'article', life: 5000 });
    }
};

const deleteItem = (no) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer cet article ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await itemService.deleteItem(no);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Article supprimé avec succès', life: 3000 });
                await loadItems();
            } catch (error) {
                console.error('Failed to delete item', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de l\'article', life: 5000 });
            }
        }
    });
};


// Task Configuration Methods (nouvelle approche)
const onTaskSelected = async (event) => {
    const taskId = event.value;
    if (!taskId) {
        selectedTaskForConfig.value = null;
        taskSubTaskLinks.value = [];
        return;
    }

    // Charger les détails de la tâche
    try {
        const taskResponse = await dataService.getTask(taskId);
        selectedTaskForConfig.value = {
            ...taskResponse.data,
            _etag: taskResponse.etag // Stocker l'ETag pour les futures mises à jour
        };

        // Extraire les subTaskLinks depuis la réponse
        taskSubTaskLinks.value = Array.isArray(selectedTaskForConfig.value.subTasks)
            ? selectedTaskForConfig.value.subTasks.map(st => ({
                subTaskId: st.subTaskId,
                subTaskCode: st.subTaskCode,
                subTaskLabel: st.subTaskLabel,
                theoreticalQuantity: st.theoreticalQuantity || 0,
                modelId: st.modelId || null,
                modelName: st.modelName || null
            }))
            : [];
    } catch (error) {
        console.error('Failed to load task details', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du chargement de la tâche', life: 3000 });
        // Reset selection on error
        selectedTaskId.value = null;
        selectedTaskForConfig.value = null;
    }
};

const openAddSubTaskLinkModal = () => {
    isEditingSubTaskLink.value = false;
    currentSubTaskLink.value = { subTaskId: null, theoreticalQuantity: 0, modelId: null };
    editingLinkIndex.value = -1;
    showSubTaskLinkModal.value = true;
};

const openEditSubTaskLinkModal = (link, index) => {
    isEditingSubTaskLink.value = true;
    currentSubTaskLink.value = { ...link };
    editingLinkIndex.value = index;
    showSubTaskLinkModal.value = true;
};

const closeSubTaskLinkModal = () => {
    showSubTaskLinkModal.value = false;
};

const saveSubTaskLink = async () => {
    try {
        if (!selectedTaskForConfig.value) {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Aucune tâche sélectionnée', life: 3000 });
            return;
        }

        // Créer une copie des liens actuels
        let updatedLinks = [...taskSubTaskLinks.value];

        if (isEditingSubTaskLink.value) {
            // Modifier le lien existant
            updatedLinks[editingLinkIndex.value] = {
                subTaskId: currentSubTaskLink.value.subTaskId,
                theoreticalQuantity: parseFloat(currentSubTaskLink.value.theoreticalQuantity),
                modelId: currentSubTaskLink.value.modelId
            };
        } else {
            // Ajouter un nouveau lien
            updatedLinks.push({
                subTaskId: currentSubTaskLink.value.subTaskId,
                theoreticalQuantity: parseFloat(currentSubTaskLink.value.theoreticalQuantity),
                modelId: currentSubTaskLink.value.modelId
            });
        }

        // Préparer les données pour l'API
        const taskToUpdate = {
            id: selectedTaskForConfig.value.id,
            code: selectedTaskForConfig.value.code,
            label: selectedTaskForConfig.value.label,
            competenceIds: selectedTaskForConfig.value.competences?.map(c => c.id) || [],
            subTaskLinks: updatedLinks.map(link => ({
                subTaskId: link.subTaskId,
                theoreticalQuantity: link.theoreticalQuantity,
                modelId: link.modelId
            })),
            _etag: selectedTaskForConfig.value._etag
        };

        // Sauvegarder via PUT
        await dataService.updateTask(taskToUpdate);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Configuration sauvegardée avec succès', life: 3000 });

        // Recharger la tâche
        await onTaskSelected({ value: selectedTaskForConfig.value.id });
        closeSubTaskLinkModal();
    } catch (error) {
        console.error('Failed to save subtask link', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la sauvegarde', life: 5000 });
    }
};

const deleteSubTaskLink = (index) => {
    confirm.require({
        message: 'Êtes-vous sûr de vouloir supprimer cette association ?',
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                // Créer une copie sans le lien à supprimer
                const updatedLinks = taskSubTaskLinks.value.filter((_, i) => i !== index);

                // Préparer les données pour l'API
                const taskToUpdate = {
                    id: selectedTaskForConfig.value.id,
                    code: selectedTaskForConfig.value.code,
                    label: selectedTaskForConfig.value.label,
                    competenceIds: selectedTaskForConfig.value.competences?.map(c => c.id) || [],
                    subTaskLinks: updatedLinks.map(link => ({
                        subTaskId: link.subTaskId,
                        theoreticalQuantity: link.theoreticalQuantity,
                        modelId: link.modelId
                    })),
                    _etag: selectedTaskForConfig.value._etag
                };

                // Sauvegarder via PUT
                await dataService.updateTask(taskToUpdate);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Association supprimée avec succès', life: 3000 });

                // Recharger la tâche
                await onTaskSelected({ value: selectedTaskForConfig.value.id });
            } catch (error) {
                console.error('Failed to delete subtask link', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression', life: 5000 });
            }
        }
    });
};

const onBrandChange = () => {
    currentTaskConfig.value.modelId = '';
};

// User Methods
const openAddUserModal = () => {
    isEditingUser.value = false;
    currentUser.value = {
        firstname: '',
        lastname: '',
        email: '',
        role: 'ROLE_ADMIN',
        password: '',
        confirmPassword: ''
    };
    showUserModal.value = true;
};

const openEditUserModal = (user) => {
    isEditingUser.value = true;
    currentUser.value = {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
    };
    showUserModal.value = true;
};

const closeUserModal = () => {
    showUserModal.value = false;
};

const saveUser = async () => {
    try {
        if (isEditingUser.value) {
            await authService.updateAdmin(currentUser.value.id, {
                firstname: currentUser.value.firstname,
                lastname: currentUser.value.lastname,
                email: currentUser.value.email,
                role: currentUser.value.role
            });
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur mis à jour avec succès', life: 3000 });
        } else {
            if (currentUser.value.password !== currentUser.value.confirmPassword) {
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas', life: 3000 });
                return;
            }
            await authService.register(currentUser.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur créé avec succès', life: 3000 });
        }
        await loadUsers();
        closeUserModal();
    } catch (error) {
        console.error('Failed to save user', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: typeof error.response?.data === 'string' ? error.response.data : 'Erreur lors de l\'enregistrement', life: 5000 });
    }
};

const toggleUserActive = async (user) => {
    try {
        await authService.toggleAdminActive(user.id);
        toast.add({ severity: 'success', summary: 'Succès', detail: `Utilisateur ${user.active ? 'désactivé' : 'activé'} avec succès`, life: 3000 });
        await loadUsers();
    } catch (error) {
        console.error('Failed to toggle user', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du changement de statut', life: 3000 });
    }
};

const deleteUser = (id) => {
    // Deprecated or not supported by API for admins generally, but keeping placeholder or removing
    // If API doesn't support DELETE /admins/{id}, we should rely on toggleActive
    // But for now, let's just comment it out or remove it to avoid confusion
    console.warn('Delete user not fully supported, use toggle active');
};


// Team Methods
const openAddTeamModal = () => {
    isEditingTeam.value = false;
    currentTeam.value = { name: '', description: '', version: 0, picture: null };
    teamPictureFile.value = null;
    showTeamModal.value = true;
};

const openEditTeamModal = (team) => {
    isEditingTeam.value = true;
    currentTeam.value = { ...team };
    teamPictureFile.value = null;
    showTeamModal.value = true;
};

const closeTeamModal = () => {
    showTeamModal.value = false;
};

const saveTeam = async () => {
    try {
        let teamId;
        if (isEditingTeam.value) {
            await dataService.updateTeam(currentTeam.value);
            teamId = currentTeam.value.id;
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Équipe mise à jour avec succès', life: 3000 });
        } else {
            const newTeam = await dataService.createTeam(currentTeam.value);
            teamId = newTeam.id;
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Équipe créée avec succès', life: 3000 });
        }

        // Handle Team Picture Upload
        if (teamPictureFile.value) {
            await dataService.uploadTeamPicture(teamId, teamPictureFile.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo d\'équipe uploadée avec succès', life: 3000 });
            teamPictureFile.value = null;
        }

        await loadTeams();
        closeTeamModal();
    } catch (error) {
        console.error('Failed to save team', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de l\'enregistrement de l\'équipe', life: 5000 });
    }
};

const onTeamPictureSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        teamPictureFile.value = file;
    }
};

const getTeamPictureUrl = (teamId) => {
    if (!teamId) return null;
    return `/teams/${teamId}/picture`;
};

const deleteTeam = (team) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteTeam(team.id, team.version);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Équipe supprimée avec succès', life: 3000 });
                await loadTeams();
            } catch (error) {
                console.error('Failed to delete team', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Erreur lors de la suppression de l\'équipe', life: 5000 });
            }
        }
    });
};

// Watch activeTab to load data when switching tabs
watch(activeTab, (newTab) => {
    if (newTab === 'items') {
        loadItems();
    }
});

// Load initial data
onMounted(() => {
    if (activeTab.value === 'items') {
        loadItems();
    }
});

</script>

<template>
    <Toast />
    <div class="page-layout">
        <TheNavbar />

        <div class="settings-container">
            <!-- Sidebar Navigation -->
            <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
                <div class="panel-header sidebar-header">
                    <h2 v-if="!isSidebarCollapsed">Paramètres</h2>
                    <Button :icon="isSidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" text rounded
                        severity="info" @click="toggleSidebar" class="toggle-btn" />
                </div>
                <ul class="nav-list">
                    <li v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" class="nav-item"
                        :class="{ active: activeTab === tab.id, 'collapsed-item': isSidebarCollapsed }"
                        :title="isSidebarCollapsed ? tab.label : ''">
                        <i :class="tab.icon"></i>
                        <span v-if="!isSidebarCollapsed">{{ tab.label }}</span>
                    </li>
                </ul>
            </aside>

            <!-- Main Content -->
            <main class="settings-content">
                <!-- Objectifs Tab -->
                <div v-if="activeTab === 'objectives'" class="tab-panel">
                    <ObjectivesSettings />
                </div>

                <!-- Général Tab -->
                <div v-else-if="activeTab === 'general'" class="tab-panel">
                    <GeneralSettings />
                </div>

                <!-- Souches Tab -->
                <div v-else-if="activeTab === 'numbering'" class="tab-panel">
                    <NumberingSeriesSettings />
                </div>

                <!-- Ressources Tab -->
                <div v-else-if="activeTab === 'resources'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Ressources</h2>
                            <div class="header-actions">
                                <span class="p-input-icon-left search-icon-wrapper">
                                    <i class="pi pi-search" />
                                    <InputText v-model="resourceFilters['global'].value" placeholder="Rechercher..."
                                        class="search-input" />
                                </span>
                                <SelectButton v-model="resourceViewMode" :options="viewOptions" optionLabel="icon"
                                    optionValue="value" :allowEmpty="false">
                                    <template #option="slotProps">
                                        <i :class="slotProps.option.icon"></i>
                                    </template>
                                </SelectButton>
                                <Button label="Nouvelle Ressource" icon="pi pi-plus" severity="info"
                                    @click="openAddResourceModal" />
                            </div>
                        </div>

                        <DataTable v-if="resourceViewMode === 'list'" :value="resources" :paginator="true"
                            :rows="resourceRows" :rowsPerPageOptions="[10, 20, 50, 100]" dataKey="id"
                            v-model:filters="resourceFilters" filterDisplay="menu"
                            :globalFilterFields="['id', 'nom', 'description', 'teamName']"
                            class="p-datatable-sm premium-table">

                            <Column header="Photo" style="width: 5rem">
                                <template #body="{ data }">
                                    <div class="resource-avatar-container">
                                        <SecureImage v-if="data.picture" :src="getResourcePictureUrl(data.id)"
                                            :alt="data.nom" class="resource-avatar-img">
                                            <template #error>
                                                <Avatar icon="pi pi-user" shape="circle" size="large" />
                                            </template>
                                        </SecureImage>
                                        <Avatar v-else icon="pi pi-user" shape="circle" size="large" />
                                    </div>
                                </template>
                            </Column>

                            <Column field="id" header="ID" sortable style="min-width: 8rem"></Column>
                            <Column field="nom" header="Nom" sortable style="min-width: 12rem"></Column>
                            <Column field="telephone" header="Téléphone" sortable style="min-width: 10rem"></Column>
                            <Column field="dateRecrutement" header="Date Recrutement" sortable style="min-width: 10rem">
                                <template #body="{ data }">
                                    {{ data.dateRecrutement ? new Date(data.dateRecrutement).toLocaleDateString() : '-'
                                    }}
                                </template>
                            </Column>
                            <Column field="teamName" header="Équipe" sortable style="min-width: 10rem"></Column>
                            <Column header="Compétences" style="min-width: 15rem">
                                <template #body="{ data }">
                                    <div class="tags-container">
                                        <span v-for="comp in data.competences" :key="comp.id" class="tag">
                                            {{ comp.label || comp.code }}
                                        </span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="estActive" header="Statut" sortable style="min-width: 8rem">
                                <template #body="{ data }">
                                    <span :class="data.estActive ? 'badge-yes' : 'badge-no'">
                                        {{ data.estActive ? 'Actif' : 'Inactif' }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditResourceModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteResource(data)" />
                                </template>
                            </Column>
                        </DataTable>

                        <div v-else class="grid-view-container">
                            <div class="grid-view">
                                <div v-for="resource in paginatedResources" :key="resource.id" class="resource-card">
                                    <div class="card-header">
                                        <div class="header-left">
                                            <div class="resource-avatar-large">
                                                <SecureImage v-if="resource.picture"
                                                    :src="getResourcePictureUrl(resource.id)" :alt="resource.nom"
                                                    class="resource-avatar-img-large">
                                                    <template #error>
                                                        <Avatar icon="pi pi-user" shape="circle" size="xlarge" />
                                                    </template>
                                                </SecureImage>
                                                <Avatar v-else icon="pi pi-user" shape="circle" size="xlarge" />
                                            </div>
                                            <div class="header-info">
                                                <h3>{{ resource.nom }}</h3>
                                                <p class="role-text">{{ resource.typeRessource }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="info-row-combined">
                                            <div class="info-item" title="Équipe">
                                                <i class="pi pi-users"></i>
                                                <span>{{ resource.teamName || 'Aucune équipe' }}</span>
                                            </div>
                                            <div class="info-item" title="Téléphone">
                                                <i class="pi pi-phone"></i>
                                                <span>{{ resource.telephone || '-' }}</span>
                                            </div>
                                        </div>
                                        <div class="competences-section">
                                            <span class="section-title">Compétences</span>
                                            <div class="tags-container">
                                                <span v-for="comp in resource.competences" :key="comp.id" class="tag">
                                                    {{ comp.label || comp.code }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <span :class="resource.estActive ? 'badge-yes' : 'badge-no'">
                                            {{ resource.estActive ? 'Actif' : 'Inactif' }}
                                        </span>
                                        <div class="card-actions">
                                            <Button icon="pi pi-pencil" text rounded severity="secondary"
                                                @click="openEditResourceModal(resource)" />
                                            <Button icon="pi pi-trash" text rounded severity="danger"
                                                @click="deleteResource(resource)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Paginator v-model:first="resourceFirst" v-model:rows="resourceRows"
                                :totalRecords="filteredResources.length" :rowsPerPageOptions="[10, 20, 50, 100]"
                                template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown" />
                        </div>
                    </div>
                </div>

                <!-- Brands Tab -->
                <div v-else-if="activeTab === 'brands'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Marques Véhicule</h2>
                            <Button label="Nouvelle Marque" icon="pi pi-plus" severity="info"
                                @click="openAddBrandModal" />
                        </div>

                        <DataTable :value="brands" :paginator="true" :rows="10" dataKey="id"
                            v-model:filters="brandFilters" filterDisplay="menu" :globalFilterFields="['name']"
                            class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="brandFilters['global'].value" placeholder="Rechercher..."
                                            class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column header="Logo" style="width: 8rem">
                                <template #body="{ data }">
                                    <div class="brand-logo-container">
                                        <SecureImage v-if="data.logo" :src="getBrandLogoUrl(data.id)" :alt="data.name"
                                            class="brand-logo-img">
                                            <template #error>
                                                <span class="no-logo">-</span>
                                            </template>
                                        </SecureImage>
                                        <span v-else class="no-logo">-</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="name" header="Nom" sortable style="min-width: 15rem"></Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditBrandModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteBrand(data.id)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucune marque trouvée.</div>
                            </template>
                        </DataTable>
                    </div>
                </div>

                <!-- Models Tab -->
                <div v-else-if="activeTab === 'models'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Modèles Véhicule</h2>
                            <Button label="Nouveau Modèle" icon="pi pi-plus" severity="info"
                                @click="openAddModelModal" />
                        </div>

                        <DataTable :value="models" :paginator="true" :rows="10" dataKey="id"
                            v-model:filters="modelFilters" filterDisplay="menu"
                            :globalFilterFields="['name', 'commercialDescription']"
                            class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="modelFilters['global'].value" placeholder="Rechercher..."
                                            class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column field="name" header="Nom" sortable style="min-width: 12rem"></Column>
                            <Column field="commercialDescription" header="Description" sortable
                                style="min-width: 15rem"></Column>
                            <Column header="Marque" sortable style="min-width: 12rem">
                                <template #body="{ data }">
                                    {{brands.find(b => b.id === data.brandId)?.name || '-'}}
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditModelModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteModel(data.id)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucun modèle trouvé.</div>
                            </template>
                        </DataTable>
                    </div>
                </div>

                <!-- Competences Tab -->
                <div v-else-if="activeTab === 'competences'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Compétences</h2>
                            <Button label="Nouvelle Compétence" icon="pi pi-plus" severity="info"
                                @click="openAddCompetenceModal" />
                        </div>

                        <DataTable :value="competences" :paginator="true" :rows="10" dataKey="id"
                            v-model:filters="competenceFilters" filterDisplay="menu"
                            :globalFilterFields="['code', 'label', 'description']" class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="competenceFilters['global'].value"
                                            placeholder="Rechercher..." class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column field="code" header="Code" sortable style="min-width: 12rem"></Column>
                            <Column field="label" header="Nom" sortable style="min-width: 12rem"></Column>
                            <Column field="description" header="Description" sortable style="min-width: 20rem"></Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditCompetenceModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteCompetence(data.id)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucune compétence trouvée.</div>
                            </template>
                        </DataTable>
                    </div>
                </div>

                <!-- Teams Tab -->
                <div v-else-if="activeTab === 'teams'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Équipes</h2>
                            <div class="header-actions">
                                <SelectButton v-model="teamViewMode" :options="viewOptions" optionLabel="icon"
                                    optionValue="value" :allowEmpty="false">
                                    <template #option="slotProps">
                                        <i :class="slotProps.option.icon"></i>
                                    </template>
                                </SelectButton>
                                <Button label="Nouvelle Équipe" icon="pi pi-plus" severity="info"
                                    @click="openAddTeamModal" />
                            </div>
                        </div>

                        <DataTable v-if="teamViewMode === 'list'" :value="teams" :paginator="true" :rows="10"
                            dataKey="id" v-model:filters="teamFilters" filterDisplay="menu"
                            :globalFilterFields="['id', 'name', 'description']" class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="teamFilters['global'].value" placeholder="Rechercher..."
                                            class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column header="Photo" style="width: 5rem">
                                <template #body="{ data }">
                                    <div class="resource-avatar-container">
                                        <SecureImage v-if="data.picture" :src="getTeamPictureUrl(data.id)"
                                            :alt="data.name" class="resource-avatar-img">
                                            <template #error>
                                                <Avatar icon="pi pi-users" shape="circle" size="large" />
                                            </template>
                                        </SecureImage>
                                        <Avatar v-else icon="pi pi-users" shape="circle" size="large" />
                                    </div>
                                </template>
                            </Column>
                            <Column field="id" header="ID" sortable style="min-width: 10rem"></Column>
                            <Column field="name" header="Nom" sortable style="min-width: 15rem"></Column>
                            <Column field="description" header="Description" sortable style="min-width: 20rem"></Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditTeamModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteTeam(data)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucune équipe trouvée.</div>
                            </template>
                        </DataTable>

                        <div v-else class="grid-view">
                            <div v-for="team in teams" :key="team.id" class="resource-card">
                                <div class="card-header">
                                    <div class="header-left">
                                        <div class="resource-avatar-large">
                                            <SecureImage v-if="team.picture" :src="getTeamPictureUrl(team.id)"
                                                :alt="team.name" class="resource-avatar-img-large">
                                                <template #error>
                                                    <Avatar icon="pi pi-users" shape="circle" size="xlarge" />
                                                </template>
                                            </SecureImage>
                                            <Avatar v-else icon="pi pi-users" shape="circle" size="xlarge" />
                                        </div>
                                        <div class="header-info">
                                            <h3>{{ team.name }}</h3>
                                            <p class="role-text">{{ team.id }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="info-row-combined" style="border-bottom: none; padding-bottom: 0;">
                                        <div class="info-item" title="Description" style="width: 100%;">
                                            <span style="white-space: normal; line-height: 1.4;">{{ team.description ||
                                                'Aucune description'
                                            }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <div class="status-badge">
                                        <!-- Placeholder for alignment if needed, or remove -->
                                    </div>
                                    <div class="card-actions">
                                        <Button icon="pi pi-pencil" text rounded severity="secondary"
                                            @click="openEditTeamModal(team)" />
                                        <Button icon="pi pi-trash" text rounded severity="danger"
                                            @click="deleteTeam(team)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tasks Tab -->
                <div v-else-if="activeTab === 'tasks'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Tâches</h2>
                            <Button label="Nouvelle Tâche" icon="pi pi-plus" severity="info"
                                @click="openAddTaskModal()" />
                        </div>

                        <DataTable :value="tasks" :paginator="true" :rows="10" dataKey="id"
                            v-model:filters="taskFilters" filterDisplay="menu" :globalFilterFields="['code', 'label']"
                            class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="taskFilters['global'].value" placeholder="Rechercher..."
                                            class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column field="code" header="Code" sortable style="min-width: 10rem"></Column>
                            <Column field="label" header="Libellé" sortable style="min-width: 15rem"></Column>
                            <Column header="Compétences" style="min-width: 20rem">
                                <template #body="{ data }">
                                    <span v-if="data.competences && data.competences.length > 0"
                                        class="competences-list">
                                        <span v-for="comp in data.competences" :key="comp.id" class="badge-competence">
                                            {{ comp.label }}
                                        </span>
                                    </span>
                                    <span v-else class="text-muted">-</span>
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditTaskModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteTask(data)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucune tâche trouvée.</div>
                            </template>
                        </DataTable>
                    </div>
                </div>

                <!-- Subtasks Tab -->
                <div v-else-if="activeTab === 'subtasks'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Sous-Tâches</h2>
                            <Button label="Nouvelle Sous-Tâche" icon="pi pi-plus" severity="info"
                                @click="openAddSubTaskModal()" />
                        </div>
                        <DataTable :value="subtasks" :paginator="true" :rows="10" dataKey="id"
                            v-model:filters="subtaskFilters" filterDisplay="menu"
                            :globalFilterFields="['code', 'label']" class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="subtaskFilters['global'].value" placeholder="Rechercher..."
                                            class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column field="code" header="Code" sortable style="min-width: 10rem"></Column>
                            <Column field="label" header="Libellé" sortable style="min-width: 15rem"></Column>
                            <Column header="Compétences" style="min-width: 15rem">
                                <template #body="{ data }">
                                    <span v-if="data.competences && data.competences.length > 0"
                                        class="competences-list">
                                        <span v-for="comp in data.competences" :key="comp.id" class="badge-competence">
                                            {{ comp.label }}
                                        </span>
                                    </span>
                                    <span v-else class="text-muted">-</span>
                                </template>
                            </Column>

                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditSubTaskModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteSubTask(data)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucune sous-tâche trouvée.</div>
                            </template>
                        </DataTable>
                    </div>
                </div>

                <!-- Task Config Tab -->
                <div v-else-if="activeTab === 'taskconfigs'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Configuration des Tâches</h2>
                        </div>

                        <!-- Sélecteur de tâche -->
                        <div class="config-selector">
                            <label for="task-select">Sélectionner une tâche :</label>
                            <Dropdown id="task-select" v-model="selectedTaskId" :options="tasks" optionLabel="label"
                                optionValue="id" placeholder="Choisir une tâche" @change="onTaskSelected"
                                class="w-full md:w-14rem" showClear />
                        </div>

                        <!-- Tableau des sous-tâches associées -->
                        <div v-if="selectedTaskForConfig" class="config-content">
                            <div class="panel-header-inside">
                                <h3>Sous-tâches associées</h3>
                                <Button label="Ajouter Sous-Tâche" icon="pi pi-plus" severity="info"
                                    @click="openAddSubTaskLinkModal" />
                            </div>

                            <DataTable :value="taskSubTaskLinks" dataKey="subTaskId"
                                class="p-datatable-sm premium-table">
                                <Column field="subTaskCode" header="Code" sortable style="min-width: 10rem"></Column>
                                <Column field="subTaskLabel" header="Libellé" sortable style="min-width: 15rem">
                                </Column>
                                <Column field="theoreticalQuantity" header="Quantité (h)" sortable
                                    style="min-width: 10rem">
                                    <template #body="{ data }">
                                        {{ data.theoreticalQuantity.toFixed(2) }}
                                    </template>
                                </Column>
                                <Column header="Modèle" sortable style="min-width: 15rem">
                                    <template #body="{ data }">
                                        <span v-if="data.modelName">{{ data.modelName }}</span>
                                        <span v-else class="text-muted">Tous les modèles</span>
                                    </template>
                                </Column>
                                <Column header="Actions" style="width: 10rem">
                                    <template #body="{ data, index }">
                                        <Button icon="pi pi-pencil" text rounded severity="secondary"
                                            @click="openEditSubTaskLinkModal(data, index)" />
                                        <Button icon="pi pi-trash" text rounded severity="danger"
                                            @click="deleteSubTaskLink(index)" />
                                    </template>
                                </Column>

                                <template #empty>
                                    <div class="empty-state">Aucune sous-tâche associée à cette tâche.</div>
                                </template>
                            </DataTable>
                        </div>

                        <!-- Message si aucune tâche sélectionnée -->
                        <div v-else class="empty-state" style="margin-top: 2rem;">
                            Sélectionnez une tâche pour gérer ses sous-tâches.
                        </div>
                    </div>
                </div>

                <!-- Items Tab -->
                <div v-else-if="activeTab === 'items'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Articles</h2>
                            <Button label="Nouvel Article" icon="pi pi-plus" severity="info"
                                @click="openAddItemModal" />
                        </div>

                        <DataTable :value="items" :lazy="true" :paginator="true" :rows="10"
                            :totalRecords="totalItemsRecords" @page="onItemsPage" dataKey="no"
                            v-model:filters="itemFilters" filterDisplay="menu"
                            :globalFilterFields="['no', 'designation', 'category']"
                            class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="itemFilters['global'].value" placeholder="Rechercher..."
                                            @input="onItemsSearch" class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column field="no" header="Code" sortable style="min-width: 10rem"></Column>
                            <Column field="designation" header="Désignation" sortable style="min-width: 15rem"></Column>
                            <Column field="unitPriceHT" header="Prix Unit. HT" sortable style="min-width: 10rem">
                                <template #body="{ data }">
                                    {{ data.unitPriceHT?.toFixed(2) }} €
                                </template>
                            </Column>
                            <Column field="category" header="Catégorie" sortable style="min-width: 10rem"></Column>
                            <Column field="subcategory" header="Sous-Catégorie" sortable style="min-width: 10rem">
                            </Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditItemModal(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="deleteItem(data.no)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucun article trouvé.</div>
                            </template>
                        </DataTable>
                    </div>
                </div>

                <!-- Users Tab -->
                <div v-else-if="activeTab === 'users'" class="tab-panel">
                    <div v-if="true" class="card">
                        <div class="panel-header-inside">
                            <h2>Gestion des Utilisateurs</h2>
                            <Button label="Nouvel Utilisateur" icon="pi pi-plus" severity="info"
                                @click="openAddUserModal" />
                        </div>

                        <DataTable :value="users" :paginator="true" :rows="10" dataKey="id"
                            v-model:filters="userFilters" filterDisplay="menu"
                            :globalFilterFields="['username', 'name', 'role']" class="p-datatable-sm premium-table">

                            <template #header>
                                <div class="table-header">
                                    <span class="p-input-icon-left search-icon-wrapper">
                                        <i class="pi pi-search" />
                                        <InputText v-model="userFilters['global'].value" placeholder="Rechercher..."
                                            class="search-input" />
                                    </span>
                                </div>
                            </template>

                            <Column field="email" header="Identifiant" sortable style="min-width: 12rem"></Column>
                            <Column header="Nom Complet" sortable style="min-width: 15rem">
                                <template #body="{ data }">
                                    {{ data.firstname }} {{ data.lastname }}
                                </template>
                            </Column>
                            <Column field="role" header="Rôle" sortable style="min-width: 10rem">
                                <template #body="{ data }">
                                    <span :class="data.role === 'ROLE_ADMIN' ? 'badge-yes' : 'badge-no'">
                                        {{ data.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Utilisateur' }}
                                    </span>
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 10rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary"
                                        @click="openEditUserModal(data)" />
                                    <Button :icon="data.active ? 'pi pi-check-circle' : 'pi pi-circle'" text rounded
                                        :severity="data.active ? 'success' : 'warning'"
                                        :title="data.active ? 'Désactiver' : 'Activer'"
                                        :disabled="data.id === loggedInUserId" @click="toggleUserActive(data)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="empty-state">Aucun utilisateur trouvé.</div>
                            </template>
                        </DataTable>
                    </div>
                    <div v-else class="card">
                        <div class="empty-state">
                            <i class="pi pi-lock"
                                style="font-size: 2rem; color: var(--red-500); margin-bottom: 1rem;"></i>
                            <p>Accès refusé. Vous devez être administrateur pour voir cette page.</p>
                        </div>
                    </div>
                </div>

                <!-- General Tab -->
                <div v-else-if="activeTab === 'general'" class="tab-panel">
                    <div class="card">
                        <div class="panel-header-inside">
                            <h2>Paramètres Généraux</h2>
                        </div>
                        <div class="empty-state">
                            Fonctionnalité à venir.
                        </div>
                    </div>
                </div>
            </main>

            <!-- Modal for Users -->
            <div v-if="showUserModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur' }}</h2>
                    <form @submit.prevent="saveUser">
                        <div class="form-group">
                            <label>Prénom <span class="required">*</span></label>
                            <input v-model="currentUser.firstname" type="text" required placeholder="Ex: Jean" />
                        </div>
                        <div class="form-group">
                            <label>Nom <span class="required">*</span></label>
                            <input v-model="currentUser.lastname" type="text" required placeholder="Ex: Dupont" />
                        </div>
                        <div class="form-group">
                            <label>Email <span class="required">*</span></label>
                            <input v-model="currentUser.email" type="email" required
                                placeholder="Ex: jean@exemple.com" />
                        </div>
                        <div class="form-group">
                            <label>Rôle <span class="required">*</span></label>
                            <select v-model="currentUser.role" required>
                                <option value="ROLE_ADMIN">Administrateur</option>
                                <option value="ROLE_USER">Utilisateur</option>
                            </select>
                        </div>

                        <div v-if="!isEditingUser">
                            <div class="form-group">
                                <label>Mot de passe <span class="required">*</span></label>
                                <input v-model="currentUser.password" type="password" required />
                            </div>
                            <div class="form-group">
                                <label>Confirmer le mot de passe <span class="required">*</span></label>
                                <input v-model="currentUser.confirmPassword" type="password" required />
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeUserModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Attributes -->
            <div v-if="showAttributeModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingAttribute ? 'Modifier Attribut' : 'Nouvel Attribut' }}</h2>
                    <form @submit.prevent="saveAttribute">
                        <div class="form-group">
                            <label>Nom de l'Attribut</label>
                            <input v-model="currentAttribute.name" type="text" required placeholder="Ex: Priorité" />
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select v-model="currentAttribute.type" required>
                                <option value="select">Liste (select)</option>
                                <option value="text">Texte</option>
                                <option value="textarea">Zone de texte</option>
                                <option value="number">Nombre</option>
                                <option value="date">Date</option>
                            </select>
                        </div>
                        <div class="form-group" v-if="currentAttribute.type === 'select'">
                            <label>Options (une par ligne)</label>
                            <textarea :value="currentAttribute.options ? currentAttribute.options.join('\n') : ''"
                                @input="currentAttribute.options = $event.target.value.split('\n').filter(o => o.trim())"
                                rows="5" placeholder="Ex:&#10;Haute&#10;Moyenne&#10;Basse"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Ordre d'affichage</label>
                            <input v-model.number="currentAttribute.displayOrder" type="number" min="0" step="10"
                                required />
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" v-model="currentAttribute.isRequired" />
                                <span>Champ obligatoire</span>
                            </label>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeAttributeModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Resources -->
            <div v-if="showResourceModal" class="modal-overlay">
                <div class="modal-content modal-lg">
                    <h2>{{ isEditingResource ? 'Modifier Ressource' : 'Nouvelle Ressource' }}</h2>
                    <form @submit.prevent="saveResource">
                        <div class="resource-picture-upload-section">
                            <div class="avatar-preview-container">
                                <SecureImage v-if="currentResource.picture && !resourcePictureFile"
                                    :src="getResourcePictureUrl(currentResource.id)" :alt="currentResource.nom"
                                    class="avatar-preview-img" />
                                <Avatar v-else-if="!resourcePictureFile" icon="pi pi-user" shape="circle"
                                    size="xlarge" />
                                <div v-else class="avatar-preview-img-wrapper">
                                    <img :src="URL.createObjectURL(resourcePictureFile)" class="avatar-preview-img" />
                                </div>
                            </div>
                            <div class="upload-controls">
                                <label class="btn-upload">
                                    <i class="pi pi-camera"></i>
                                    {{ resourcePictureFile ? 'Changer la photo' : 'Ajouter une photo' }}
                                    <input type="file" @change="onResourcePictureSelect" accept="image/*" hidden />
                                </label>
                                <small class="hint">Format JPG, PNG. Max 2Mo.</small>
                            </div>
                        </div>

                        <div class="modal-body-grid">
                            <!-- Section 1: Info Générale -->
                            <div class="form-section">
                                <h3>Identité & Coordonnées</h3>
                                <div class="form-group">
                                    <label>Nom <span class="required">*</span></label>
                                    <InputText v-model="currentResource.nom" required placeholder="Ex: Jean Dupont"
                                        class="w-full" />
                                </div>
                                <div class="form-group">
                                    <label>Description</label>
                                    <Textarea v-model="currentResource.description" rows="2"
                                        placeholder="Description de la ressource" class="w-full" />
                                </div>
                                <div class="form-group">
                                    <label>Type <span class="required">*</span></label>
                                    <Dropdown v-model="currentResource.typeRessource"
                                        :options="['Humaine', 'Matérielle']" placeholder="Sélectionner le type"
                                        class="w-full" />
                                </div>
                                <div class="form-group">
                                    <label>Téléphone</label>
                                    <InputText v-model="currentResource.telephone" placeholder="Ex: +33 6 12 34 56 78"
                                        class="w-full" />
                                </div>
                                <div class="form-group">
                                    <label>Adresse</label>
                                    <InputText v-model="currentResource.adresse" placeholder="Ex: 123 Rue de Paris"
                                        class="w-full" />
                                </div>
                                <div class="form-group flex align-items-center gap-2">
                                    <InputSwitch v-model="currentResource.estActive" inputId="active-switch" />
                                    <label for="active-switch" class="mb-0 cursor-pointer">Actif</label>
                                </div>
                            </div>

                            <!-- Section 2: Vie Professionnelle -->
                            <div class="form-section">
                                <h3>Affectation & Compétences</h3>
                                <div class="form-group">
                                    <label>Équipe <span class="required">*</span></label>
                                    <Dropdown v-model="currentResource.teamId" :options="teams" optionLabel="name"
                                        optionValue="id" placeholder="Sélectionner une équipe" class="w-full" />
                                </div>
                                <div class="form-group">
                                    <label>Compétences</label>
                                    <MultiSelect v-model="currentResource.competenceIds" :options="competences"
                                        optionLabel="label" optionValue="id" placeholder="Sélectionner les compétences"
                                        display="chip" class="w-full" :maxSelectedLabels="3" />
                                </div>
                                <div class="form-group">
                                    <label>Date de Recrutement</label>
                                    <InputText v-model="currentResource.dateRecrutement" type="date" class="w-full" />
                                </div>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeResourceModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">
                                {{ isEditingResource ? 'Enregistrer les modifications' : 'Créer la ressource' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Competences -->
            <div v-if="showCompetenceModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingCompetence ? 'Modifier Compétence' : 'Nouvelle Compétence' }}</h2>
                    <form @submit.prevent="saveCompetence">
                        <div class="form-group">
                            <label>Code <span class="required">*</span></label>
                            <input v-model="currentCompetence.code" type="text" required placeholder="Ex: MECANIQUE"
                                :readonly="isEditingCompetence" :class="{ 'readonly-field': isEditingCompetence }" />
                            <small v-if="!isEditingCompetence" class="hint">Code unique de la compétence
                                (majuscules)</small>
                        </div>
                        <div class="form-group">
                            <label>Libellé <span class="required">*</span></label>
                            <input v-model="currentCompetence.label" type="text" required placeholder="Ex: Mécanique" />
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea v-model="currentCompetence.description" rows="3"
                                placeholder="Description de la compétence"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeCompetenceModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Teams -->
            <div v-if="showTeamModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingTeam ? 'Modifier Équipe' : 'Nouvelle Équipe' }}</h2>
                    <form @submit.prevent="saveTeam">
                        <div class="resource-picture-upload-section">
                            <div class="avatar-preview-container">
                                <SecureImage v-if="currentTeam.picture && !teamPictureFile"
                                    :src="getTeamPictureUrl(currentTeam.id)" :alt="currentTeam.name"
                                    class="avatar-preview-img" />
                                <Avatar v-else-if="!teamPictureFile" icon="pi pi-users" shape="circle" size="xlarge" />
                                <div v-else class="avatar-preview-img-wrapper">
                                    <img :src="URL.createObjectURL(teamPictureFile)" class="avatar-preview-img" />
                                </div>
                            </div>
                            <div class="upload-controls">
                                <label class="btn-upload">
                                    <i class="pi pi-camera"></i>
                                    {{ teamPictureFile ? 'Changer la photo' : 'Ajouter une photo' }}
                                    <input type="file" @change="onTeamPictureSelect" accept="image/*" hidden />
                                </label>
                                <small class="hint">Format JPG, PNG. Max 2Mo.</small>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Nom <span class="required">*</span></label>
                            <input v-model="currentTeam.name" type="text" required placeholder="Ex: Mécanique" />
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea v-model="currentTeam.description" rows="3"
                                placeholder="Description de l'équipe"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeTeamModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Brands -->
            <div v-if="showBrandModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingBrand ? 'Modifier Marque' : 'Nouvelle Marque' }}</h2>
                    <form @submit.prevent="saveBrand">
                        <div class="form-group" v-if="!isEditingBrand">
                            <label>ID <span class="required">*</span></label>
                            <input v-model="currentBrand.id" type="text" required placeholder="Ex: renault"
                                pattern="[a-z0-9-]+" title="Lettres minuscules, chiffres et tirets uniquement" />
                            <small class="hint">Identifiant unique (lettres minuscules, chiffres, tirets)</small>
                        </div>
                        <div class="form-group">
                            <label>Nom <span class="required">*</span></label>
                            <input v-model="currentBrand.name" type="text" required placeholder="Ex: Renault" />
                        </div>
                        <div class="form-group">
                            <label>Logo</label>
                            <div class="file-upload-wrapper">
                                <input type="file" @change="onLogoSelect" accept="image/*" class="file-input" />
                                <small class="hint">Formats: PNG, JPG, WEBP. Max 5 Mo.</small>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeBrandModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Models -->
            <div v-if="showModelModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingModel ? 'Modifier Modèle' : 'Nouveau Modèle' }}</h2>
                    <form @submit.prevent="saveModel">
                        <div class="form-group">
                            <label>Nom <span class="required">*</span></label>
                            <input v-model="currentModel.name" type="text" required placeholder="Ex: Clio V" />
                        </div>
                        <div class="form-group">
                            <label>Description Commerciale</label>
                            <textarea v-model="currentModel.commercialDescription" rows="3"
                                placeholder="Description du modèle pour usage commercial"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Marque <span class="required">*</span></label>
                            <select v-model="currentModel.brandId" required>
                                <option value="">-- Sélectionner une marque --</option>
                                <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                                    {{ brand.name }}
                                </option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeModelModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Items -->
            <div v-if="showItemModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingItem ? 'Modifier Article' : 'Nouvel Article' }}</h2>
                    <form @submit.prevent="saveItem">
                        <div class="form-group">
                            <label>Code <span class="required">*</span></label>
                            <input v-model="currentItem.no" type="text" required placeholder="Ex: REF-100045"
                                :disabled="isEditingItem" />
                            <small class="hint" v-if="!isEditingItem">Code unique de l'article</small>
                        </div>
                        <div class="form-group">
                            <label>Désignation <span class="required">*</span></label>
                            <input v-model="currentItem.designation" type="text" required
                                placeholder="Ex: Kit embrayage" />
                        </div>
                        <div class="form-group">
                            <label>Prix Unitaire HT <span class="required">*</span></label>
                            <input v-model.number="currentItem.unitPriceHT" type="number" step="0.01" required
                                placeholder="0.00" />
                        </div>
                        <div class="form-group">
                            <label>Catégorie <span class="required">*</span></label>
                            <select v-model="currentItem.category" @change="onCategoryChange" required>
                                <option value="">-- Sélectionner une catégorie --</option>
                                <option v-for="cat in itemCategories" :key="cat.value" :value="cat.value">
                                    {{ cat.label }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Sous-Catégorie <span class="required">*</span></label>
                            <select v-model="currentItem.subcategory" :disabled="!currentItem.category" required>
                                <option value="">-- Sélectionner une sous-catégorie --</option>
                                <option v-for="subcat in filteredSubcategories" :key="subcat.value"
                                    :value="subcat.value">
                                    {{ subcat.label }}
                                </option>
                            </select>
                            <small class="hint" v-if="!currentItem.category">Sélectionnez d'abord une catégorie</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeItemModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Task Configurations -->
            <div v-if="showTaskConfigModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingTaskConfig ? 'Modifier Configuration' : 'Nouvelle Configuration' }}</h2>
                    <form @submit.prevent="saveTaskConfig">
                        <div class="form-group">
                            <label>Tâche <span class="required">*</span></label>
                            <select v-model="currentTaskConfig.taskId" required>
                                <option value="">-- Sélectionner une tâche --</option>
                                <option v-for="task in mainTasks" :key="task.id" :value="task.id">
                                    {{ task.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Sous-tâche <span class="required">*</span></label>
                            <select v-model="currentTaskConfig.subtaskId" required>
                                <option value="">-- Sélectionner une sous-tâche --</option>
                                <option v-for="subtask in subTasks" :key="subtask.id" :value="subtask.id">
                                    {{ subtask.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Marque <span class="required">*</span></label>
                            <select v-model="selectedBrandForConfig" @change="onBrandChange" required>
                                <option value="">-- Sélectionner une marque --</option>
                                <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                                    {{ brand.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Modèle <span class="required">*</span></label>
                            <select v-model="currentTaskConfig.modelId" required :disabled="!selectedBrandForConfig">
                                <option value="">-- Sélectionner un modèle --</option>
                                <option v-for="model in filteredModels" :key="model.id" :value="model.id">
                                    {{ model.name }}
                                </option>
                            </select>
                            <small class="hint" v-if="!selectedBrandForConfig">Veuillez d'abord sélectionner une
                                marque</small>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Qté Théorique <span class="required">*</span></label>
                                <input v-model.number="currentTaskConfig.theoreticalQty" type="number" step="0.1"
                                    min="0" required />
                            </div>
                            <div class="form-group">
                                <label>Unité <span class="required">*</span></label>
                                <select v-model="currentTaskConfig.unit" required>
                                    <option value="Heure">Heure</option>
                                    <option value="Jour">Jour</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" @click="closeTaskConfigModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for Tasks -->
            <div v-if="showTaskModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingTask ? 'Modifier Tâche' : 'Nouvelle Tâche' }}</h2>
                    <form @submit.prevent="saveTask">
                        <div class="form-group">
                            <label>Code <span class="required">*</span></label>
                            <InputText v-model="currentTask.code" type="text" required placeholder="Ex: REMP-PLAQ" />
                        </div>

                        <div class="form-group">
                            <label>Libellé <span class="required">*</span></label>
                            <InputText v-model="currentTask.label" type="text" required
                                placeholder="Ex: Remplacement Plaquettes" />
                        </div>

                        <!-- Competences Multi-select -->
                        <div class="form-group">
                            <label>Compétences Requises</label>
                            <MultiSelect v-model="currentTask.competenceIds" :options="competences" optionLabel="label"
                                optionValue="id" placeholder="Sélectionner des compétences" display="chip"
                                :filter="true" class="w-full" />
                            <small class="hint">Sélectionnez les compétences nécessaires pour cette tâche.</small>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeTaskModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal for SubTasks -->
            <div v-if="showSubTaskModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingSubTask ? 'Modifier Sous-Tâche' : 'Nouvelle Sous-Tâche' }}</h2>
                    <form @submit.prevent="saveSubTask">
                        <div class="form-group">
                            <label>Code <span class="required">*</span></label>
                            <InputText v-model="currentSubTask.code" type="text" required placeholder="Ex: SUB-CHECK" />
                        </div>

                        <div class="form-group">
                            <label>Libellé <span class="required">*</span></label>
                            <InputText v-model="currentSubTask.label" type="text" required
                                placeholder="Ex: Vérifier niveau huile" />
                        </div>

                        <!-- Competences Multi-select -->
                        <div class="form-group">
                            <label>Compétences Requises</label>
                            <MultiSelect v-model="currentSubTask.competenceIds" :options="competences"
                                optionLabel="label" optionValue="id" placeholder="Sélectionner des compétences"
                                display="chip" :filter="true" class="w-full" />
                            <small class="hint">Sélectionnez les compétences nécessaires pour cette sous-tâche.</small>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeSubTaskModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>


            <!-- Modal for SubTask Link Configuration -->
            <div v-if="showSubTaskLinkModal" class="modal-overlay">
                <div class="modal-content">
                    <h2>{{ isEditingSubTaskLink ? 'Modifier Association' : 'Ajouter Sous-Tâche' }}</h2>
                    <form @submit.prevent="saveSubTaskLink">
                        <div class="form-group">
                            <label>Sous-Tâche <span class="required">*</span></label>
                            <Dropdown v-model="currentSubTaskLink.subTaskId" :options="subtasks" optionLabel="label"
                                optionValue="id" placeholder="Sélectionner une sous-tâche" :filter="true" class="w-full"
                                required />
                        </div>

                        <div class="form-group">
                            <label>Quantité Théorique (heures) <span class="required">*</span></label>
                            <InputNumber v-model="currentSubTaskLink.theoreticalQuantity" mode="decimal"
                                :minFractionDigits="2" :maxFractionDigits="2" :min="0" :step="0.25"
                                placeholder="Ex: 2.50" class="w-full" required />
                            <small class="hint">Temps estimé en heures pour cette sous-tâche</small>
                        </div>

                        <div class="form-group">
                            <label>Modèle de Véhicule</label>
                            <Dropdown v-model="currentSubTaskLink.modelId" :options="models" optionLabel="name"
                                optionValue="id" placeholder="Tous les modèles" :filter="true" class="w-full"
                                showClear />
                            <small class="hint">Laissez vide pour appliquer à tous les modèles</small>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeSubTaskLinkModal" class="btn-secondary">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>



            <!-- Confirmation Modal -->
            <div v-if="showConfirmModal" class="modal-overlay">
                <div class="modal-content" style="max-width: 400px;">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <i class="pi pi-exclamation-triangle"
                            style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                        <h2>{{ confirmTitle }}</h2>
                        <p style="color: #64748b; margin: 0;">{{ confirmMessage }}</p>
                    </div>
                    <div class="modal-actions" style="justify-content: center;">
                        <button type="button" @click="closeConfirmModal" class="btn-secondary">Annuler</button>
                        <button type="button" @click="executeConfirmAction" class="btn-primary"
                            style="background-color: #ef4444;">Supprimer</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* General Settings Styles */
.general-settings-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.settings-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.settings-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #e0f2fe;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
    border-bottom: 2px solid #e0f2fe;
}

.card-header i {
    color: #3b82f6;
    font-size: 1.5rem;
}

.card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
}

.card-body {
    padding: 2rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.form-field label {
    font-weight: 600;
    color: #475569;
    font-size: 0.95rem;
}

.w-full {
    width: 100%;
}

.currency-display,
.currency-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.currency-symbol {
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.35rem 0.85rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 1.1rem;
    min-width: 45px;
    text-align: center;
}

.currency-preview {
    background: #f0fdf4;
    border-color: #86efac;
    font-weight: 700;
    font-size: 1.15rem;
    color: #059669;
    text-align: center;
}

.field-hint {
    display: block;
    color: #64748b;
    font-size: 0.875rem;
    font-style: italic;
    margin-top: 0.25rem;
}

.preview-field {
    grid-column: 1 / -1;
}

.preview-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.preview-label {
    color: #64748b;
    font-weight: 600;
    font-size: 0.95rem;
}

.preview-value {
    font-weight: 700;
    font-size: 1.1rem;
    color: #1e293b;
}

.preview-value.highlight {
    color: #059669;
    font-size: 1.25rem;
}

.settings-actions {
    display: flex;
    justify-content: flex-end;
    padding: 1.5rem 0;
    border-top: 2px solid #e2e8f0;
    margin-top: 1rem;
}

/* Existing styles */
.general-settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.settings-section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e0f2fe;
}

.section-title i {
    color: #3b82f6;
    font-size: 1.25rem;
}

.settings-fields {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.currency-display,
.currency-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.currency-symbol {
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 1.1rem;
}

.currency-preview {
    background: #f8fafc;
    font-weight: 700;
    font-size: 1.1rem;
    color: #059669;
}

.field-hint {
    display: block;
    margin-top: 0.5rem;
    color: #64748b;
    font-style: italic;
}

.panel-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

/* Existing Styles */
.page-layout {
    min-height: 100vh;
    background-color: #f8fafc;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
}

.settings-container {
    display: flex;
    flex: 1;
    width: 100%;
    padding: 1.5rem 2rem 2rem 2rem;
    gap: 2rem;
}

/* Sidebar Navigation */
.sidebar {
    width: 280px;
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    height: fit-content;
    transition: width 0.3s ease;
    flex-shrink: 0;
}

.sidebar.collapsed {
    width: 80px;
    padding: 1.5rem 0.75rem;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
    min-height: 53px;
    /* Ensure height stability when title is hidden */
}

.sidebar.collapsed .sidebar-header {
    justify-content: center;
}

.toggle-btn {
    padding: 0.5rem !important;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-item {
    padding: 0.875rem 1rem;
    cursor: pointer;
    border-radius: 10px;
    color: #64748b;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
}

.nav-item.collapsed-item {
    justify-content: center;
    padding: 0.875rem;
}

.nav-item i {
    font-size: 1.1rem;
    color: #94a3b8;
    transition: color 0.2s;
}

.nav-item:hover {
    background-color: #f1f5f9;
    color: #1e293b;
}

.nav-item:hover i {
    color: #475569;
}

.nav-item.active {
    background-color: #eff6ff;
    color: #2563eb;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.05);
}

.nav-item.active i {
    color: #3b82f6;
}

.settings-content {
    flex: 1;
    min-width: 0;
    /* Prevents overflow */
}

/* Panel Header */
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.panel-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.025em;
}

/* Card Style */
.card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #f1f5f9;
}

/* Panel Header Inside Card */
.panel-header-inside {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.panel-header-inside h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.025em;
}

/* Table Header with Search */
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
}

.search-icon-wrapper {
    position: relative;
    display: block;
    width: 300px;
}

.search-icon-wrapper>i {
    position: absolute;
    left: 1rem !important;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
}

.search-input {
    width: 100%;
    border-radius: 8px;
    padding-left: 2.5rem !important;
}

/* Premium DataTable Styles */
:deep(.premium-table .p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0 0 1rem 0;
}

:deep(.premium-table .p-datatable-thead > tr > th) {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

:deep(.premium-table .p-datatable-tbody > tr) {
    transition: background-color 0.2s;
}

:deep(.premium-table .p-datatable-tbody > tr:hover) {
    background-color: #f8fafc;
}

:deep(.premium-table .p-datatable-tbody > tr > td) {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
}

/* Data Table (Premium Style) */
.data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.9rem;
}

.data-table th {
    background-color: #f8fafc;
    color: #475569;
    font-weight: 600;
    text-align: left;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
}

.data-table th:first-child {
    border-top-left-radius: 8px;
}

.data-table th:last-child {
    border-top-right-radius: 8px;
}

.data-table td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: middle;
}

.data-table tr:last-child td {
    border-bottom: none;
}

.data-table tr:hover td {
    background-color: #f8fafc;
}

/* Actions Cell */
.actions-cell {
    display: flex;
    gap: 0.5rem;
}

/* Badges */
.badge-yes,
.badge-no {
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.badge-yes {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
}

.badge-no {
    background-color: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

/* Empty State */
.empty-state {
    text-align: center;
    color: #94a3b8;
    padding: 3rem !important;
    font-style: italic;
    background-color: #f9fafb;
    border-radius: 8px;
    margin-top: 1rem;
}

/* Form Styles (Modal) */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: modalSlideIn 0.3s ease-out;
}

.modal-content.modal-lg {
    max-width: 900px;
    width: 90%;
}

.modal-body-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.form-section h3 {
    font-size: 1.1rem;
    color: #1e293b;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e2e8f0;
}

@media (max-width: 768px) {
    .modal-body-grid {
        grid-template-columns: 1fr;
    }
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-content h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    color: #0f172a;
    font-weight: 700;
}

.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #334155;
    font-size: 0.875rem;
}

.form-group input:not(.p-inputtext),
.form-group select,
.form-group textarea:not(.p-inputtextarea) {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
    background-color: #f8fafc;
}

.form-group input:not(.p-inputtext):focus,
.form-group select:focus,
.form-group textarea:not(.p-inputtextarea):focus {
    outline: none;
    border-color: #3b82f6;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.w-full {
    width: 100%;
}

.flex {
    display: flex;
}

.align-items-center {
    align-items: center;
}

.gap-2 {
    gap: 0.5rem;
}

.mb-0 {
    margin-bottom: 0 !important;
}

.cursor-pointer {
    cursor: pointer;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid #e2e8f0;
}

.btn-secondary {
    background-color: white;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.btn-secondary:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
    color: #334155;
}

.btn-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.875rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
    background-color: #2563eb;
}

/* Tags */
.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag {
    background-color: #eff6ff;
    color: #3b82f6;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid #dbeafe;
}

/* Competences badges */
.competences-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.badge-competence {
    background-color: #f0f9ff;
    color: #0369a1;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid #bae6fd;
    display: inline-block;
}

.text-muted {
    color: #94a3b8;
    font-style: italic;
}

.badge-task {
    background-color: #fef3c7;
    color: #92400e;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid #fde68a;
    display: inline-block;
}

/* Configuration styles */
.config-selector {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
}

.config-selector label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #334155;
}

.config-content {
    margin-top: 2rem;
}

.config-content h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #0f172a;
}

/* Brand Logo Styles */
.brand-logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 40px;
    background: #fff;
    border-radius: 4px;
    padding: 2px;
    border: 1px solid #e2e8f0;
}

.brand-logo-img {
    width: 100%;
    height: 100%;
}

:deep(.brand-logo-img img) {
    object-fit: contain;
}

.no-logo {
    color: #94a3b8;
    font-size: 0.8rem;
}

.file-upload-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.file-input {
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: white;
    width: 100%;
}

/* Resource Picture Management Styles */
.resource-avatar-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.resource-avatar-img {
    width: 100%;
    height: 100%;
}

:deep(.resource-avatar-img img) {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e2e8f0;
}

.resource-picture-upload-section {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    margin-bottom: 2rem;
    border: 1px solid #e2e8f0;
}

.avatar-preview-container {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    background: #fff;
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-preview-img-wrapper {
    width: 100%;
    height: 100%;
}

.avatar-preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

:deep(.avatar-preview-img img) {
    width: 100px;
    height: 100px;
    object-fit: cover;
}

.upload-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.btn-upload {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    color: #334155;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-upload:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
}

.btn-upload i {
    color: #3b82f6;
}

.hint {
    display: block;
    color: #64748b;
    font-size: 0.8rem;
    font-style: italic;
    margin-top: 0.25rem;
}

.panel-header-inside {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

/* Grid View Styles */
.grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    padding: 0.25rem;
}

.resource-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.resource-card:hover {
    transform: translateY(-2px);
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.header-info h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.2;
}

.header-info .role-text {
    margin: 0;
    color: #64748b;
    font-size: 0.75rem;
    line-height: 1.4;
}

.resource-avatar-large {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    overflow: hidden;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid #e2e8f0;
}

.resource-avatar-img-large {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
}

.info-row-combined {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    font-size: 0.85rem;
    color: #64748b;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #bfdbfe;
    /* Blue line */
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.info-item i {
    font-size: 0.9rem;
    color: #94a3b8;
}

.competences-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.section-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 0.25rem;
    margin-bottom: 0.25rem;
}

.card-footer {
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mt-1 {
    margin-top: 0.25rem;
}
</style>
