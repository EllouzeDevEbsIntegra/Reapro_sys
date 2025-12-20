<template>
    <div class="compare-quotes-layout">
        <TheNavbar />

        <div class="compare-quotes-content animate-fade-in">
            <div class="page-header flex justify-between items-center mb-6">
                <div>
                    <h1>Comparateur Achat</h1>
                    <p class="text-muted">Gérez et comparez vos offres d'achat.</p>
                </div>
                <div class="header-actions">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="searchQuery" placeholder="Rechercher..." @input="handleSearch" />
                    </span>
                </div>
            </div>

            <div class="grid">
                <div :class="selectedQuote ? 'col-12 lg:col-5' : 'col-12'">
                    <Card class="table-card">
                        <template #content>
                            <DataTable :value="compareStore.quotes" :loading="compareStore.isLoading" :paginator="true"
                                :rows="compareStore.pageSize" :totalRecords="compareStore.totalElements" lazy
                                @page="onPage($event)" selectionMode="single" v-model:selection="selectedQuote"
                                @row-select="onRowSelect" responsiveLayout="scroll" class="p-datatable-sm">
                                <Column field="no" header="N°" sortable></Column>
                                <Column field="description" header="Description" sortable></Column>
                                <Column field="creationDate" header="Date Création" sortable>
                                    <template #body="slotProps">
                                        {{ formatDate(slotProps.data.creationDate) }}
                                    </template>
                                </Column>
                                <Column field="status" header="Statut">
                                    <template #body="slotProps">
                                        <Tag :value="getStatusLabel(slotProps.data.status)"
                                            :severity="getStatusSeverity(slotProps.data.status)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                    </Card>
                </div>

                <div v-if="selectedQuote" class="col-12 lg:col-7 animate-slide-in-right">
                    <Card class="detail-card">
                        <template #title>
                            <div class="flex justify-between items-center">
                                <span>Détails: {{ selectedQuote.no }}</span>
                                <Button icon="pi pi-times" text rounded aria-label="Fermer" @click="closeDetail" />
                            </div>
                        </template>
                        <template #content>
                            <div v-if="compareStore.isLoading && !compareStore.quotes.length"
                                class="flex justify-center p-8">
                                <ProgressSpinner style="width: 50px; height: 50px" />
                            </div>
                            <DataTable v-else :value="compareStore.selectedQuoteLines" class="p-datatable-sm"
                                responsiveLayout="scroll" scrollable scrollHeight="500px">
                                <Column field="itemNo" header="Article"></Column>
                                <Column field="pageNumber" header="Page PDF" class="text-center"></Column>
                                <Column field="creationDate" header="Date">
                                    <template #body="slotProps">
                                        {{ formatDate(slotProps.data.creationDate) }}
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCompareQuoteStore } from '../stores/compareQuote'
import TheNavbar from '../components/TheNavbar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const compareStore = useCompareQuoteStore()
const searchQuery = ref('')
const selectedQuote = ref(null)

onMounted(() => {
    compareStore.fetchCompareQuotes()
})

const handleSearch = () => {
    compareStore.fetchCompareQuotes(0, searchQuery.value)
}

const onPage = (event) => {
    compareStore.fetchCompareQuotes(event.page, searchQuery.value)
}

const onRowSelect = (event) => {
    compareStore.fetchCompareQuoteLines(event.data.no)
}

const closeDetail = () => {
    selectedQuote.value = null
    compareStore.clearSelectedLines()
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const getStatusLabel = (status) => {
    switch (status) {
        case 0: return 'Ouvert'
        case 1: return 'En cours'
        case 2: return 'Terminé'
        default: return 'Inconnu'
    }
}

const getStatusSeverity = (status) => {
    switch (status) {
        case 0: return 'info'
        case 1: return 'warning'
        case 2: return 'success'
        default: return 'secondary'
    }
}
</script>

<style scoped>
.compare-quotes-layout {
    min-height: 100vh;
    background-color: #f8fafc;
}

.compare-quotes-content {
    padding: 2rem;
    max-width: 1600px;
    margin: 0 auto;
}

.page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
}

.text-muted {
    color: #64748b;
}

.table-card,
.detail-card {
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    border: none;
}

.animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(20px);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
