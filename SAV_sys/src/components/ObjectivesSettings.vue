<template>
    <div class="objectives-settings">
        <div class="card">
            <div class="panel-header-inside">
                <h2>Gestion des Objectifs Mensuels</h2>
                <Button label="Nouvel Objectif" icon="pi pi-plus" severity="info" @click="openAddModal" />
            </div>

            <DataTable :value="filteredObjectives" :paginator="true" :rows="10" dataKey="id" v-model:filters="filters"
                filterDisplay="menu" :loading="loading" :globalFilterFields="['resourceName', 'teamName']"
                class="p-datatable-sm premium-table">

                <template #header>
                    <div class="filter-container">
                        <div class="search-group">
                            <span class="p-input-icon-left search-icon-wrapper">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Rechercher..."
                                    class="search-input" />
                            </span>
                        </div>
                        <div class="filters-group">
                            <Dropdown v-model="selectedResource" :options="resources" optionLabel="fullname"
                                optionValue="id" placeholder="Ressource" class="filter-dropdown" showClear filter />
                            <Dropdown v-model="selectedYear" :options="years" placeholder="Année"
                                class="filter-dropdown" />
                            <Dropdown v-model="selectedMonth" :options="months" optionLabel="name" optionValue="value"
                                placeholder="Mois" class="filter-dropdown" showClear />
                            <Button label="Réinitialiser" icon="pi pi-refresh"
                                class="p-button-outlined p-button-secondary" @click="resetFilters" />
                        </div>
                    </div>
                </template>

                <Column field="resourceName" header="Ressource" sortable style="min-width: 12rem"></Column>
                <Column field="year" header="Année" sortable style="min-width: 6rem"></Column>
                <Column field="monthName" header="Mois" sortable style="min-width: 8rem"></Column>

                <Column field="targetHours" header="Objectif (Heures)" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                        <span class="font-bold">{{ data.targetHours }} h</span>
                    </template>
                </Column>

                <Column field="actualHours" header="Réalisé" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                        <span>{{ data.actualHours || 0 }} h</span>
                    </template>
                </Column>

                <Column field="gapHours" header="Écart" sortable style="min-width: 10rem">
                    <template #body="{ data }">
                        <Tag :severity="data.gapHours >= 0 ? 'success' : 'danger'"
                            :value="(data.gapHours > 0 ? '+' : '') + (data.gapHours || 0) + ' h'" rounded
                            class="text-sm font-bold px-3 py-1" />
                    </template>
                </Column>

                <Column header="Actions" style="width: 10rem">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" text rounded severity="secondary" @click="openEditModal(data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="deleteObjective(data)" />
                    </template>
                </Column>

                <template #empty>
                    <div class="empty-state">Aucun objectif trouvé.</div>
                </template>
            </DataTable>
        </div>

        <!-- Modal Ajout/Edition -->
        <div v-if="showModal" class="modal-overlay">
            <div class="modal-content">
                <h2>{{ isEditing ? 'Modifier Objectif' : 'Nouvel Objectif' }}</h2>
                <form @submit.prevent="saveObjective">
                    <div class="form-group" v-if="!isEditing">
                        <label>Ressource <span class="required">*</span></label>
                        <Dropdown v-model="currentObjective.ressourceId" :options="resources" optionLabel="fullname"
                            optionValue="id" placeholder="Sélectionner une ressource" filter class="w-full" required />
                    </div>
                    <div class="form-group" v-else>
                        <label>Ressource</label>
                        <InputText :value="currentObjective.resourceName" disabled class="w-full" />
                    </div>

                    <div class="form-row">
                        <div class="form-group half">
                            <label>Année <span class="required">*</span></label>
                            <Dropdown v-model="currentObjective.year" :options="years" placeholder="Année"
                                class="w-full" required />
                        </div>
                        <div class="form-group half">
                            <label>Mois <span class="required">*</span></label>
                            <Dropdown v-model="currentObjective.month" :options="months" optionLabel="name"
                                optionValue="value" placeholder="Mois" class="w-full" required />
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Objectif (Heures) <span class="required">*</span></label>
                        <InputNumber v-model="currentObjective.targetHours" mode="decimal" :minFractionDigits="2"
                            :maxFractionDigits="2" :min="0" suffix=" h" class="w-full" required />
                    </div>

                    <div class="modal-actions">
                        <button type="button" @click="closeModal" class="btn-secondary">Annuler</button>
                        <button type="submit" class="btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>

        <Toast />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { dataService } from '../services/dataService';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';

const toast = useToast();
const confirm = useConfirm();
const loading = ref(true);
const objectives = ref([]);
const resources = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const currentObjective = ref({});

const years = [2024, 2025, 2026, 2027];
const months = [
    { name: 'Janvier', value: 1 },
    { name: 'Février', value: 2 },
    { name: 'Mars', value: 3 },
    { name: 'Avril', value: 4 },
    { name: 'Mai', value: 5 },
    { name: 'Juin', value: 6 },
    { name: 'Juillet', value: 7 },
    { name: 'Août', value: 8 },
    { name: 'Septembre', value: 9 },
    { name: 'Octobre', value: 10 },
    { name: 'Novembre', value: 11 },
    { name: 'Décembre', value: 12 }
];

const selectedYear = ref(2025);
const selectedMonth = ref(null);
const selectedResource = ref(null);

const filters = ref({
    global: { value: null, matchMode: 'contains' }
});

const loadObjectives = async () => {
    loading.value = true;
    try {
        const [rawObjectives, rawResources, teams] = await Promise.all([
            dataService.getMonthlyObjectives(),
            dataService.getResources(),
            dataService.getTeams()
        ]);

        resources.value = rawResources.map(r => ({
            ...r,
            fullname: `${r.nom || r.name || ''} ${r.prenom || r.surname || ''}`.trim() || 'Sans Nom'
        }));

        objectives.value = rawObjectives.map(obj => {
            // Parse monthYear (YYYY-MM)
            const [yearStr, monthStr] = (obj.monthYear || '').split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            const monthObj = months.find(m => m.value === month);

            return {
                ...obj,
                year,
                month,
                resourceName: obj.ressourceNom || 'Inconnu',
                teamName: obj.teamName || 'Non assigné',
                monthName: monthObj ? monthObj.name : monthStr
            };
        });
    } catch (error) {
        console.error('Error loading objectives:', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les objectifs', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const filteredObjectives = computed(() => {
    return objectives.value.filter(obj => {
        const yearMatch = selectedYear.value ? obj.year === selectedYear.value : true;
        const monthMatch = selectedMonth.value ? obj.month === selectedMonth.value : true;
        const resourceMatch = selectedResource.value ? obj.ressourceId === selectedResource.value : true;
        return yearMatch && monthMatch && resourceMatch;
    });
});

const openAddModal = () => {
    isEditing.value = false;
    currentObjective.value = {
        ressourceId: null,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        targetHours: 0
    };
    showModal.value = true;
};

const openEditModal = (obj) => {
    isEditing.value = true;
    currentObjective.value = { ...obj };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    currentObjective.value = {};
};

const saveObjective = async () => {
    try {
        // Format monthYear as YYYY-MM
        const monthStr = currentObjective.value.month.toString().padStart(2, '0');
        const payload = {
            ...currentObjective.value,
            monthYear: `${currentObjective.value.year}-${monthStr}`
        };

        if (isEditing.value) {
            await dataService.updateMonthlyObjective(payload);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Objectif mis à jour', life: 3000 });
        } else {
            await dataService.createMonthlyObjective(payload);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Objectif créé', life: 3000 });
        }
        await loadObjectives();
        closeModal();
    } catch (error) {
        console.error('Save error:', error);
        if (error.response && error.response.status === 409) {
            toast.add({ severity: 'warn', summary: 'Doublon', detail: 'Un objectif existe déjà pour cette ressource et ce mois.', life: 5000 });
        } else if (error.code === 'CONFLICT') {
            toast.add({ severity: 'error', summary: 'Conflit', detail: error.message, life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de l\'enregistrement', life: 3000 });
        }
    }
};

const deleteObjective = (obj) => {
    confirm.require({
        message: `Êtes-vous sûr de vouloir supprimer l'objectif de ${obj.resourceName} pour ${obj.monthName} ${obj.year} ?`,
        header: 'Confirmation de suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dataService.deleteMonthlyObjective(obj.id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Objectif supprimé', life: 3000 });
                await loadObjectives();
            } catch (error) {
                console.error('Delete error:', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression', life: 3000 });
            }
        }
    });
};

const resetFilters = () => {
    selectedYear.value = 2025;
    selectedMonth.value = null;
    filters.value.global.value = null;
};

onMounted(() => {
    loadObjectives();
});
</script>

<style scoped>
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

.card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #f1f5f9;
}

/* Filter Container Styles */
.filter-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
}

.search-group {
    flex: 1;
    min-width: 250px;
}

.search-input {
    width: 80%;
    border-radius: 8px;
    padding-left: 2.5rem !important;
}

.filters-group {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.filter-dropdown {
    width: 14rem;
    border-radius: 8px;
}

/* Premium Table Styles */
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

/* Search Icon Positioning */
.search-icon-wrapper {
    position: relative;
    display: block;
}

.search-icon-wrapper>i {
    position: absolute;
    left: 1rem !important;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-content h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #0f172a;
    font-size: 1.5rem;
    font-weight: 700;
}

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

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.btn-primary,
.btn-secondary {
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
    background-color: #2563eb;
}

.btn-secondary {
    background-color: white;
    color: #475569;
    border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
    color: #334155;
}

.w-full {
    width: 100%;
}
</style>
