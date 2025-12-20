<script setup>
import { ref, computed } from 'vue';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';
import { useGeneralSettings, currencies } from '../composables/useGeneralSettings';

const toast = useToast();
const { settings: generalSettings, saveSettings, formatCurrency } = useGeneralSettings();

const newRate = ref({
    startDate: null,
    endDate: null,
    rate: null
});

const disabledDates = computed(() => {
    if (!generalSettings.value.hourlyRates) return [];
    const dates = [];
    generalSettings.value.hourlyRates.forEach(rate => {
        let current = new Date(rate.startDate);
        const end = new Date(rate.endDate);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    });
    return dates;
});

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
};

const isDateOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1).setHours(0, 0, 0, 0);
    const e1 = new Date(end1).setHours(23, 59, 59, 999);
    const s2 = new Date(start2).setHours(0, 0, 0, 0);
    const e2 = new Date(end2).setHours(23, 59, 59, 999);
    return s1 <= e2 && e1 >= s2;
};

const addRate = () => {
    if (!newRate.value.startDate || !newRate.value.endDate || !newRate.value.rate) return;

    // Check for overlaps
    if (generalSettings.value.hourlyRates && generalSettings.value.hourlyRates.length > 0) {
        const hasOverlap = generalSettings.value.hourlyRates.some(rate =>
            isDateOverlap(newRate.value.startDate, newRate.value.endDate, rate.startDate, rate.endDate)
        );

        if (hasOverlap) {
            toast.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Cette période chevauche une période existante.',
                life: 5000
            });
            return;
        }
    }

    if (!generalSettings.value.hourlyRates) {
        generalSettings.value.hourlyRates = [];
    }

    generalSettings.value.hourlyRates.push({
        id: Date.now(),
        startDate: newRate.value.startDate,
        endDate: newRate.value.endDate,
        rate: newRate.value.rate
    });

    // Reset form
    newRate.value = { startDate: null, endDate: null, rate: null };

    toast.add({ severity: 'success', summary: 'Ajouté', detail: 'Taux horaire ajouté', life: 2000 });
};

const removeRate = (rate) => {
    generalSettings.value.hourlyRates = generalSettings.value.hourlyRates.filter(r => r.id !== rate.id);
};

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
</script>

<template>
    <div class="settings-container">
        <!-- Header -->
        <div class="page-header">
            <h2>Paramètres Généraux</h2>
            <Button label="Enregistrer les paramètres" icon="pi pi-check" severity="info"
                @click="saveGeneralSettings" />
        </div>

        <div class="top-row-grid">
            <!-- Devise Card -->
            <div class="settings-card">
                <div class="card-icon-header">
                    <i class="pi pi-money-bill"></i>
                    <h4>Devise</h4>
                </div>
                <div class="compact-row">
                    <div class="form-group-simple flex-grow">
                        <label>Devise par défaut</label>
                        <Select v-model="generalSettings.currency" :options="currencies" optionLabel="label"
                            optionValue="code" placeholder="Sélectionner une devise" @change="onCurrencyChange"
                            class="w-full">
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="currency-display">
                                    <span class="currency-badge">{{ generalSettings.currencySymbol }}</span>
                                    <span>{{currencies.find(c => c.code === slotProps.value)?.label}}</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <div class="currency-option">
                                    <span class="currency-badge">{{ slotProps.option.symbol }}</span>
                                    <span>{{ slotProps.option.label }}</span>
                                </div>
                            </template>
                        </Select>
                    </div>

                    <div class="form-group-simple width-auto">
                        <label>Symbole affiché</label>
                        <InputText v-model="generalSettings.currencySymbol" disabled
                            class="currency-display-input symbol-input" />
                    </div>
                </div>
            </div>

            <!-- Format des nombres Card -->
            <div class="settings-card">
                <div class="card-icon-header">
                    <i class="pi pi-calculator"></i>
                    <h4>Format des nombres</h4>
                </div>
                <div class="form-group-simple">
                    <label>Nombre de décimales</label>
                    <div class="input-preview-container">
                        <InputNumber v-model="generalSettings.decimalPlaces" :min="0" :max="4" showButtons
                            buttonLayout="horizontal" :step="1" inputClass="text-center"
                            style="width:20rem !important" />

                        <span class="preview-label">Exemple :</span>
                        <strong class="preview-value">{{ (1234.555).toFixed(generalSettings.decimalPlaces) }} {{
                            generalSettings.currencySymbol }}</strong>
                    </div>
                </div>
            </div>
        </div>

        <!-- Taux Horaires Card -->
        <div class="settings-card full-width">
            <div class="card-icon-header">
                <i class="pi pi-clock"></i>
                <h4>Taux Horaires Main d'Œuvre</h4>
            </div>

            <div class="form-row-simple hourly-rates-form">
                <div class="form-group-simple">
                    <label>Date Début</label>
                    <Calendar v-model="newRate.startDate" dateFormat="dd/mm/yy" showIcon placeholder="jj/mm/aaaa"
                        :disabledDates="disabledDates" />
                </div>
                <div class="form-group-simple">
                    <label>Date Fin</label>
                    <Calendar v-model="newRate.endDate" dateFormat="dd/mm/yy" showIcon placeholder="jj/mm/aaaa"
                        :disabledDates="disabledDates" />
                </div>
                <div class="form-group-simple">
                    <label>Taux Horaire</label>
                    <InputNumber v-model="newRate.rate" mode="currency" :currency="generalSettings.currency"
                        locale="fr-FR" placeholder="0.00" />
                </div>
                <div class="form-group-simple button-group">
                    <Button label="Ajouter" icon="pi pi-plus" severity="info" @click="addRate"
                        :disabled="!newRate.startDate || !newRate.endDate || !newRate.rate" />
                </div>
            </div>

            <DataTable :value="generalSettings.hourlyRates" stripedRows size="small"
                v-if="generalSettings.hourlyRates && generalSettings.hourlyRates.length > 0" class="rates-table">
                <Column field="startDate" header="Date Début">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.startDate) }}
                    </template>
                </Column>
                <Column field="endDate" header="Date Fin">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.endDate) }}
                    </template>
                </Column>
                <Column field="rate" header="Taux">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.rate) }}
                    </template>
                </Column>
                <Column header="Actions" style="width: 100px">
                    <template #body="slotProps">
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="removeRate(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
            <div v-else class="hint" style="text-align: center; padding: 1rem;">
                Aucun taux horaire configuré.
            </div>
        </div>


    </div>
</template>

<style scoped>
.settings-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #f1f5f9;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
}

.page-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
}

.top-row-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.settings-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f1f5f9;
}

.card-icon-header i {
    color: #1e3a8a;
    font-size: 1.25rem;
    background: #dbeafe;
    padding: 0.5rem;
    border-radius: 8px;
}

.card-icon-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
}

/* Compact Row Layout */
.compact-row {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
}

.flex-grow {
    flex-grow: 1;
}

.width-auto {
    width: auto;
    min-width: 120px;
}

.form-group-simple {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group-simple label {
    font-weight: 600;
    color: #475569;
    font-size: 0.9rem;
}

/* Input Preview Container */
.input-preview-container {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-top: 0.25rem;
}

.preview-text {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.preview-label {
    color: #64748b;
    font-size: 0.95rem;
}

.preview-value {
    color: #1e3a8a;
    font-size: 1.25rem;
    font-weight: 700;
}

/* Currency Styling */
.currency-display,
.currency-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.currency-badge {
    background: #dbeafe;
    color: #1e3a8a;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.9rem;
    min-width: 45px;
    text-align: center;
}

.currency-display-input {
    background: #dbeafe !important;
    border-color: #93c5fd !important;
    color: #1e3a8a !important;
    font-weight: 700;
    font-size: 1.1rem;
    text-align: center;
}

.symbol-input {
    width: 100%;
    text-align: center;
}

/* Hourly Rates Form */
.hourly-rates-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    align-items: flex-end;
    margin-bottom: 1.5rem;
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
}

/* Hint text */
.hint {
    color: #94a3b8;
    font-size: 0.875rem;
    font-style: italic;
    margin-top: 0.25rem;
}

/* Actions */
.card-actions-bottom {
    display: flex;
    justify-content: flex-end;
    padding-top: 1rem;
}

/* Responsive */
@media (max-width: 900px) {
    .top-row-grid {
        grid-template-columns: 1fr;
    }

    .compact-row {
        flex-direction: column;
    }

    .width-auto {
        width: 100%;
    }
}
</style>
