<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { dataService } from '../services/dataService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import InputSwitch from 'primevue/inputswitch';
import Tag from 'primevue/tag';

const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const series = ref([]);
const showDialog = ref(false);
const isEditing = ref(false);
const submitted = ref(false);

const currentSeries = ref({
    id: null,
    entityType: '',
    prefix: '',
    suffix: '',
    startNumber: 1,
    currentNumber: 0,
    increment: 1,
    padding: 6,
    active: true
});

const entityTypes = [
    { label: 'Projet', value: 'PROJECT' },
    { label: 'Ressource', value: 'RESOURCE' },
    { label: 'Client', value: 'CLIENT' },
    { label: 'Devis', value: 'QUOTE' },
    { label: 'Facture', value: 'INVOICE' }
];

onMounted(async () => {
    await loadSeries();
});

const loadSeries = async () => {
    loading.value = true;
    try {
        series.value = await dataService.getNumberingSeries();
    } catch (error) {
        console.error('Error loading series:', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les souches' });
    } finally {
        loading.value = false;
    }
};

const openNew = () => {
    currentSeries.value = {
        id: null,
        entityType: '',
        prefix: '',
        suffix: '',
        startNumber: 1,
        currentNumber: 0,
        increment: 1,
        padding: 6,
        active: true
    };
    submitted.value = false;
    isEditing.value = false;
    showDialog.value = true;
};

const editSeries = (item) => {
    currentSeries.value = { ...item };
    submitted.value = false;
    isEditing.value = true;
    showDialog.value = true;
};

const hideDialog = () => {
    showDialog.value = false;
    submitted.value = false;
};

const saveSeries = async () => {
    submitted.value = true;

    if (!currentSeries.value.entityType || !currentSeries.value.prefix) {
        return;
    }

    try {
        loading.value = true;
        await dataService.updateNumberingSeries(currentSeries.value);
        await loadSeries(); // Reload to reflect changes
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Souche enregistrée', life: 3000 });
        hideDialog();
    } catch (error) {
        console.error('Error saving series:', error);

        let errorMessage = 'Erreur lors de la sauvegarde';
        if (error.response?.status === 403) {
            errorMessage = 'Permission refusée. Vous n\'avez pas les droits pour modifier les souches de numérotation.';
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        toast.add({ severity: 'error', summary: 'Erreur', detail: errorMessage, life: 5000 });
    } finally {
        loading.value = false;
    }
};

const deleteSeries = (item) => {
    confirm.require({
        message: 'Êtes-vous sûr de vouloir supprimer cette souche ?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                loading.value = true;
                // TODO: API Call
                // await dataService.deleteNumberingSeries(item.id);
                series.value = series.value.filter(s => s.id !== item.id);
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Souche supprimée', life: 3000 });
            } catch (error) {
                console.error('Error deleting series:', error);
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression', life: 5000 });
            } finally {
                loading.value = false;
            }
        }
    });
};

const getEntityTypeLabel = (value) => {
    const type = entityTypes.find(t => t.value === value);
    return type ? type.label : value;
};

const getPreview = (s) => {
    const num = (s.currentNumber + s.increment).toString().padStart(s.padding, '0');
    return `${s.prefix}${num}${s.suffix || ''}`;
};
</script>

<template>
    <div class="card">
        <div class="panel-header-inside">
            <h2>Gestion des Souches de Numérotation</h2>
            <Button label="Nouvelle Souche" icon="pi pi-plus" severity="info" @click="openNew" />
        </div>

        <DataTable :value="series" :loading="loading" stripedRows class="p-datatable-sm premium-table">
            <Column field="entityType" header="Type d'entité">
                <template #body="slotProps">
                    <Tag :value="getEntityTypeLabel(slotProps.data.entityType)" severity="info" />
                </template>
            </Column>
            <Column field="prefix" header="Préfixe"></Column>
            <Column field="suffix" header="Suffixe"></Column>
            <Column field="currentNumber" header="Dernier Numéro"></Column>
            <Column header="Aperçu Prochain">
                <template #body="slotProps">
                    <span class="font-bold text-primary">{{ getPreview(slotProps.data) }}</span>
                </template>
            </Column>
            <Column field="active" header="Statut">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.active ? 'Actif' : 'Inactif'"
                        :severity="slotProps.data.active ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width:8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editSeries(slotProps.data)" />
                    <Button icon="pi pi-trash" text rounded severity="danger" @click="deleteSeries(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showDialog" :style="{ width: '1200px' }" header="Configuration de la Souche"
            :modal="true" class="p-fluid series-dialog">

            <!-- Live Preview Section -->
            <div class="preview-box mb-5">
                <span class="preview-label">Aperçu du prochain numéro</span>
                <div class="preview-value">{{ getPreview(currentSeries) }}</div>
            </div>

            <div class="form-content">
                <!-- Section: Identification & Formatage -->
                <div class="mb-5">
                    <h6 class="section-subtitle">Identification & Formatage</h6>
                    <div class="info-grid">
                        <div class="info-item">
                            <label for="entityType">Type d'entité</label>
                            <Select id="entityType" v-model="currentSeries.entityType" :options="entityTypes"
                                optionLabel="label" optionValue="value" placeholder="Sélectionner un type"
                                :class="{ 'p-invalid': submitted && !currentSeries.entityType }" class="w-full" />
                            <small class="p-error block" v-if="submitted && !currentSeries.entityType">Requis</small>
                        </div>
                        <div class="info-item">
                            <label for="prefix">Préfixe</label>
                            <InputText id="prefix" v-model="currentSeries.prefix" placeholder="Ex: FAC-" required="true"
                                :class="{ 'p-invalid': submitted && !currentSeries.prefix }" class="w-full" />
                            <small class="p-error block" v-if="submitted && !currentSeries.prefix">Requis</small>
                        </div>
                        <div class="info-item">
                            <label for="suffix">Suffixe</label>
                            <InputText id="suffix" v-model="currentSeries.suffix" placeholder="Ex: /2024"
                                class="w-full" />
                        </div>
                        <div class="info-item">
                            <label for="padding">Longueur (Zéros)</label>
                            <InputNumber id="padding" v-model="currentSeries.padding" integeronly :min="1" :max="10"
                                class="w-full" showButtons />
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="section-divider mb-5"></div>

                <!-- Section: Séquence & Statut -->
                <div>
                    <h6 class="section-subtitle">Séquence & Statut</h6>
                    <div class="info-grid">
                        <div class="info-item">
                            <label for="startNumber">Début</label>
                            <InputNumber id="startNumber" v-model="currentSeries.startNumber" integeronly class="w-full"
                                showButtons />
                        </div>
                        <div class="info-item">
                            <label for="increment">Incrément</label>
                            <InputNumber id="increment" v-model="currentSeries.increment" integeronly class="w-full"
                                showButtons />
                        </div>
                        <div class="info-item">
                            <label for="currentNumber">Compteur Actuel</label>
                            <InputNumber id="currentNumber" v-model="currentSeries.currentNumber" integeronly
                                class="w-full" showButtons />
                        </div>
                        <div class="info-item">
                            <label for="active">Souche Active</label>
                            <div class="mt-2">
                                <InputSwitch v-model="currentSeries.active" inputId="active" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <template #footer>
                <Button label="Annuler" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Enregistrer" icon="pi pi-check" @click="saveSeries" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.panel-header-inside {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.panel-header-inside h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

.section-subtitle {
    margin: 0 0 1.5rem 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e0f2fe;
    padding-bottom: 0.5rem;
}

.section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e2e8f0, transparent);
    margin: 2rem 0;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.info-item label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
}

.preview-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
}

.preview-label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
}

.preview-value {
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 1.25rem;
    font-weight: 700;
    color: #3b82f6;
    letter-spacing: 1px;
}


.info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
}

@media (max-width: 1200px) {
    .info-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: 1fr;
    }
}

.field label {
    color: #334155;
    font-size: 0.9rem;
}
</style>
