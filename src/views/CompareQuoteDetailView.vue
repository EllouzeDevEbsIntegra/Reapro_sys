<template>
    <div class="page-layout">
        <TheNavbar />
        <ConfirmDialog />

        <main class="main-content">
            <!-- Header -->
            <div class="header-bar">
                <div class="flex items-center gap-4">
                    <Button icon="pi pi-arrow-left" text rounded @click="handleBack" v-tooltip="'Retour'" />
                    <h1>Comparaison {{ compareQuoteNo }}</h1>
                </div>

                <div class="spacer"></div>

                <div class="flex items-center gap-4">
                    <span :class="getStatusClass(compareQuote?.status)">
                        {{ getStatusLabel(compareQuote?.status) }}
                    </span>
                    <div class="text-slate-500 text-sm flex items-center gap-2">
                        <i class="pi pi-calendar"></i>
                        <span>{{ formatDate(compareQuote?.creationDate) }}</span>
                    </div>
                    <Button icon="pi pi-print" label="Imprimer" outlined severity="secondary" />
                </div>
            </div>

            <!-- Info Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- Info Card -->
                <div class="glass-card p-6">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informations</h3>
                    <div class="flex flex-col gap-4">
                        <div>
                            <span class="text-xs text-slate-400 block mb-1">Description</span>
                            <span class="text-slate-700 font-medium">{{ compareQuote?.description || 'N/A' }}</span>
                        </div>
                        <div>
                            <span class="text-xs text-slate-400 block mb-1">Total Lignes</span>
                            <span class="text-slate-700 font-medium">{{ compareStore.totalLinesElements }}</span>
                        </div>
                    </div>
                </div>

                <!-- Stats Card (Placeholder for now) -->
                <div class="glass-card p-6">
                    <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Statistiques</h3>
                    <div class="flex items-center justify-center h-20 text-slate-400">
                        <span class="text-sm">Pas de données disponibles</span>
                    </div>
                </div>

                <!-- Actions Card -->
                <div class="glass-card p-6 flex flex-col justify-center gap-3">
                    <Button label="Exporter en Excel" icon="pi pi-file-excel" severity="success" outlined />
                    <Button label="Archiver" icon="pi pi-box" severity="warning" outlined />
                </div>
            </div>

            <!-- Lines Table Section -->
            <div class="glass-card overflow-hidden">
                <div class="p-4 border-b border-gray-100 bg-white/50 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800">Lignes de Comparaison</h3>

                    <div class="flex gap-3">
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="filters.itemNo" placeholder="Rechercher article..."
                                @input="applyFilters" class="p-inputtext-sm" />
                        </IconField>
                        <IconField iconPosition="left" class="w-24">
                            <InputIcon class="pi pi-file-pdf" />
                            <InputText v-model="filters.pageNumber" placeholder="Page" type="number"
                                @input="applyFilters" class="p-inputtext-sm" />
                        </IconField>
                        <Button :label="filters.treated === false ? 'Non Traité' : 'Tous'"
                            :icon="filters.treated === false ? 'pi pi-filter' : 'pi pi-list'"
                            :severity="filters.treated === false ? 'danger' : 'secondary'" outlined size="small"
                            @click="toggleTreatedFilter"
                            v-tooltip="filters.treated === false ? 'Afficher tous les articles' : 'Afficher uniquement les non traités'" />
                        <Button icon="pi pi-filter-slash" text rounded @click="clearFilters"
                            v-tooltip="'Réinitialiser'" />
                    </div>
                </div>

                <div v-if="compareStore.isLoading" class="flex justify-center items-center p-12">
                    <ProgressSpinner style="width: 50px; height: 50px" />
                </div>

                <DataTable v-else :value="compareStore.selectedQuoteLines" responsiveLayout="scroll" :rowHover="true"
                    class="p-datatable-hover midone-table" :paginator="true" :rows="pageSize"
                    :rowsPerPageOptions="[10, 20, 50, 100]" :totalRecords="compareStore.totalLinesElements" lazy
                    @page="onPage($event)"
                    paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} lignes">

                    <Column field="itemNo" header="N° Article" sortable style="min-width: 150px">
                        <template #body="slotProps">
                            <span class="font-semibold text-blue-600">
                                {{ slotProps.data.itemNo }}
                            </span>
                        </template>
                    </Column>

                    <Column field="description" header="Description" sortable style="min-width: 300px"></Column>

                    <Column field="quantity" header="Quantité" sortable style="min-width: 120px">
                        <template #body="slotProps">
                            <div class="text-right font-mono text-slate-600">
                                {{ slotProps.data.quantity || 'N/A' }}
                            </div>
                        </template>
                    </Column>

                    <Column field="pageNumber" header="Page PDF" style="min-width: 120px">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-file-pdf text-red-500"></i>
                                <span class="text-sm text-slate-600">Page {{ slotProps.data.pageNumber }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="creationDate" header="Date" sortable style="min-width: 150px">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2 text-slate-500 text-sm">
                                <i class="pi pi-calendar text-xs"></i>
                                {{ formatDate(slotProps.data.creationDate) }}
                            </div>
                        </template>
                    </Column>

                    <template #empty>
                        <div class="text-center p-12">
                            <i class="pi pi-inbox text-4xl text-slate-300 mb-4 block"></i>
                            <p class="text-slate-500">Aucune ligne trouvée</p>
                        </div>
                    </template>
                </DataTable>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompareQuoteStore } from '../stores/compareQuote'
import { useConfirm } from 'primevue/useconfirm'
import TheNavbar from '../components/TheNavbar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const compareStore = useCompareQuoteStore()

const compareQuoteNo = ref(route.params.compareQuoteNo)

const filters = ref({
    itemNo: '',
    pageNumber: '',
    page: 0,
    treated: null  // null = all, false = only non-treated
})

const pageSize = ref(10)

const compareQuote = computed(() => {
    return compareStore.quotes.find(q => q.no === compareQuoteNo.value)
})

onMounted(() => {
    if (compareStore.quotes.length === 0) {
        compareStore.fetchCompareQuotes()
    }
    loadLines()
})

const handleBack = () => {
    console.log('handleBack called')
    console.log('confirm object:', confirm)
    confirm.require({
        message: 'Voulez-vous vraiment quitter cette page ?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        acceptClass: 'p-button-success',
        rejectClass: 'p-button-secondary',
        accept: () => {
            console.log('Accepted')
            router.push('/comparateur')
        },
        reject: () => {
            console.log('Rejected')
        }
    })
}

const loadLines = () => {
    const apiFilters = {
        page: filters.value.page,
        size: pageSize.value
    }

    if (filters.value.itemNo) {
        apiFilters.itemNo = filters.value.itemNo
    }

    if (filters.value.pageNumber) {
        apiFilters.pageNumber = parseInt(filters.value.pageNumber)
    }

    // Add treated filter if it's specifically set to false (non-treated only)
    if (filters.value.treated === false) {
        apiFilters.treated = false
    }

    compareStore.fetchCompareQuoteLines(compareQuoteNo.value, apiFilters)
}

const applyFilters = () => {
    filters.value.page = 0
    loadLines()
}

const clearFilters = () => {
    filters.value = {
        itemNo: '',
        pageNumber: '',
        page: 0,
        treated: null
    }
    loadLines()
}

const toggleTreatedFilter = () => {
    // Toggle between null (all) and false (non-treated only)
    filters.value.treated = filters.value.treated === false ? null : false
    filters.value.page = 0  // Reset to first page when toggling filter
    loadLines()
}

const onPage = (event) => {
    filters.value.page = event.page
    pageSize.value = event.rows
    loadLines()
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
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

const getStatusClass = (status) => {
    switch (status) {
        case 0: return 'badge badge-info'
        case 1: return 'badge badge-warning'
        case 2: return 'badge badge-success'
        default: return 'badge'
    }
}
</script>

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
    min-height: 90px;
    box-sizing: border-box;
}

.header-bar h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    white-space: nowrap;
}

.spacer {
    flex-grow: 1;
}

:deep(.p-datatable-wrapper) {
    /* Ensure table doesn't overflow awkwardly */
    border-radius: 0 0 8px 8px;
}
</style>
