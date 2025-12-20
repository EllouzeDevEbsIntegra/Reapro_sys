<template>
    <div class="calendar-header">
        <div class="header-left">
            <h2 class="month-title">
                {{ viewMode === 'monthly' ? currentMonthYear : selectedMonth.getFullYear() }}
            </h2>
            <div class="view-toggle ml-4">
                <SelectButton :modelValue="viewMode" @update:modelValue="$emit('update:viewMode', $event)"
                    :options="viewOptions" optionLabel="label" optionValue="value" class="custom-select-button" />
            </div>
        </div>

        <div class="header-center">
            <div class="nav-controls">
                <Button icon="pi pi-chevron-left" class="p-button-rounded p-button-text p-button-secondary w-8 h-8"
                    @click="$emit('previous')" />
                <Button :label="viewMode === 'monthly' ? 'Mois actuel' : 'Année actuelle'"
                    class="p-button-text p-button-success text-sm font-medium px-3" @click="$emit('goToToday')" />
                <Button icon="pi pi-chevron-right" class="p-button-rounded p-button-text p-button-secondary w-8 h-8"
                    @click="$emit('next')" />
            </div>
        </div>

        <div class="header-right">
            <div class="control-group">
                <i class="pi pi-users" style="color: black"></i>
                <Dropdown :modelValue="selectedTeam" @update:modelValue="$emit('update:selectedTeam', $event)"
                    :options="teams" optionLabel="name" optionValue="id" placeholder="Équipe" class="header-input"
                    showClear :pt="{
                        input: { class: 'header-input-field' },
                        trigger: { class: 'w-8' }
                    }" />
            </div>
            <div class="divider"></div>
            <div class="control-group">
                <i class="pi pi-user" style="color: black"></i>
                <Dropdown :modelValue="selectedResource" @update:modelValue="$emit('update:selectedResource', $event)"
                    :options="filteredResources" optionLabel="nom" optionValue="id" placeholder="Ressource"
                    class="header-input" showClear :pt="{
                        input: { class: 'header-input-field' },
                        trigger: { class: 'w-8' }
                    }" />
            </div>
            <div class="divider"></div>
            <div class="control-group">
                <Button icon="pi pi-download" class="p-button-rounded p-button-text p-button-secondary w-8 h-8"
                    v-tooltip.bottom="'Télécharger PDF'" @click="$emit('download-pdf')" />
            </div>
            <div class="divider"></div>
            <div class="control-group">
                <i class="pi pi-calendar" style="color: black"></i>
                <Calendar :modelValue="selectedMonth" @update:modelValue="$emit('update:selectedMonth', $event)"
                    :view="viewMode === 'monthly' ? 'month' : 'year'"
                    :dateFormat="viewMode === 'monthly' ? 'mm/yy' : 'yy'"
                    :placeholder="viewMode === 'monthly' ? 'Mois' : 'Année'" class="header-input"
                    inputClass="calendar-input-field" />
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import SelectButton from 'primevue/selectbutton';

defineProps({
    currentMonthYear: String,
    teams: Array,
    selectedTeam: [Number, String],
    filteredResources: Array,
    selectedResource: [Number, String],
    selectedMonth: Date,
    viewMode: String
});

const viewOptions = [
    { label: 'Mensuel', value: 'monthly' },
    { label: 'Annuel', value: 'yearly' }
];

defineEmits([
    'previous',
    'next',
    'goToToday',
    'update:selectedTeam',
    'update:selectedResource',
    'update:selectedMonth',
    'update:viewMode',
    'download-pdf'
]);
</script>

<style scoped>
.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: white;
    border-bottom: 1px solid #f1f5f9;
}

.header-left {
    display: flex;
    align-items: center;
}

.header-center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.nav-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #f8fafc;
    padding: 0.25rem;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
}

.month-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    text-transform: capitalize;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #f8fafc;
    padding: 0.375rem 1rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.divider {
    width: 1px;
    height: 24px;
    background: #cbd5e1;
}

.header-input {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
}

:deep(.header-input-field) {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: #334155 !important;
    box-shadow: none !important;
    width: auto !important;
    min-width: 220px;
}

:deep(.calendar-input-field) {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: #334155 !important;
    box-shadow: none !important;
    width: 90px !important;
}

:deep(.p-dropdown-trigger) {
    width: 1.5rem !important;
    color: #94a3b8 !important;
}

.ml-4 {
    margin-left: 1rem;
}

/* Custom SelectButton Styling */
:deep(.custom-select-button.p-selectbutton) {
    background: #f1f5f9;
    padding: 2px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

:deep(.custom-select-button .p-button) {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    transition: all 0.2s;
}

:deep(.custom-select-button .p-button.p-highlight) {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.custom-select-button .p-button:not(.p-highlight):hover) {
    background: rgba(255, 255, 255, 0.5);
}
</style>
