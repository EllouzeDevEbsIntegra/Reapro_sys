<template>
    <div class="page-layout">
        <TheNavbar />

        <main class="main-content">
            <template v-if="!selectedLine">
                <!-- Dual Headers -->
                <div class="flex gap-6 mb-6">
                    <!-- Left Header: Comparateur -->
                    <div class="w-2/3 header-bar">
                        <h1>Comparateur</h1>

                        <IconField iconPosition="left" class="search-field" style="width: 300px;">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Rechercher (N°, Description)..."
                                @input="handleSearch" />
                        </IconField>

                        <div class="spacer"></div>
                    </div>

                    <!-- Right Header: Lignes -->
                    <div class="w-1/3 header-bar">
                        <h1>Lignes</h1>

                        <IconField iconPosition="left" class="search-field" style="width: 200px;">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="linesSearchQuery" placeholder="Rechercher article..."
                                @input="handleLinesSearch" />
                        </IconField>

                        <div class="spacer"></div>
                    </div>
                </div>

                <div class="flex gap-6 h-[calc(100vh-220px)]">
                    <!-- Left Panel: List (2/3 width) -->
                    <div
                        class="w-2/3 transition-all duration-300 ease-in-out flex flex-col gap-0 overflow-hidden glass-card p-0">
                        <DataTable :value="compareStore.quotes" :loading="compareStore.isLoading"
                            v-model:selection="selectedQuote" selectionMode="single" @row-select="onRowSelect"
                            @row-unselect="onRowUnselect" responsiveLayout="scroll"
                            class="p-datatable-hover flex-1 midone-table" :rowHover="true" scrollable scrollHeight="flex">

                            <Column field="no" header="N°" sortable style="min-width: 150px">
                                <template #body="slotProps">
                                    <span style="font-weight: 600; color: var(--primary-color);">
                                        {{ slotProps.data.no }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="description" header="Description" sortable style="min-width: 250px"></Column>

                            <Column field="creationDate" header="Date Création" sortable style="min-width: 150px">
                                <template #body="slotProps">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="pi pi-calendar"
                                            style="color: var(--text-muted); font-size: 0.875rem;"></i>
                                        {{ formatDate(slotProps.data.creationDate) }}
                                    </div>
                                </template>
                            </Column>

                            <Column field="status" header="Statut" style="min-width: 120px">
                                <template #body="slotProps">
                                    <span :class="getStatusClass(slotProps.data.status)">
                                        {{ getStatusLabel(slotProps.data.status) }}
                                    </span>
                                </template>
                            </Column>

                            <Column header="Actions" style="width: 80px">
                                <template #body="slotProps">
                                    <Button icon="pi pi-chevron-right" text rounded
                                        :severity="selectedQuote?.no === slotProps.data.no ? 'primary' : 'secondary'"
                                        @click.stop="selectQuote(slotProps.data)" />
                                </template>
                            </Column>

                            <template #empty>
                                <div style="text-align: center; padding: 3rem;">
                                    <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-muted);"></i>
                                    <p style="margin-top: 1rem; color: var(--text-muted);">Aucune comparaison trouvée</p>
                                </div>
                            </template>
                        </DataTable>

                        <!-- Custom Pagination Bar - CENTERED -->
                        <div class="custom-pagination-bar justify-center gap-6">
                            <div class="flex items-center gap-2">
                                <Button icon="pi pi-angle-double-left" text rounded size="small"
                                    :disabled="compareStore.currentPage === 0"
                                    @click="compareStore.fetchCompareQuotes(0, searchQuery)" />
                                <Button icon="pi pi-angle-left" text rounded size="small"
                                    :disabled="compareStore.currentPage === 0"
                                    @click="compareStore.fetchCompareQuotes(compareStore.currentPage - 1, searchQuery)" />

                                <div class="flex items-center gap-1 mx-2">
                                    <Button v-for="page in totalPages" :key="page" :label="page.toString()" size="small"
                                        class="page-num-btn"
                                        :class="{ 'active-page': compareStore.currentPage === page - 1 }"
                                        @click="compareStore.fetchCompareQuotes(page - 1, searchQuery)" />
                                </div>

                                <Button icon="pi pi-angle-right" text rounded size="small"
                                    :disabled="compareStore.currentPage >= totalPages - 1"
                                    @click="compareStore.fetchCompareQuotes(compareStore.currentPage + 1, searchQuery)" />
                                <Button icon="pi pi-angle-double-right" text rounded size="small"
                                    :disabled="compareStore.currentPage >= totalPages - 1"
                                    @click="compareStore.fetchCompareQuotes(totalPages - 1, searchQuery)" />
                            </div>

                            <div class="flex items-center gap-3">
                                <Dropdown v-model="compareStore.pageSize" :options="[10, 20, 50, 100]" class="rows-dropdown"
                                    @change="handleSearch" />
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Details (1/3 width) -->
                    <div class="w-1/3 animate-slide-in-right">
                        <div class="glass-card h-full overflow-hidden p-0 flex flex-col">
                            <div v-if="!selectedQuote"
                                class="h-full flex flex-col items-center justify-center text-gray-400">
                                <i class="pi pi-arrow-left text-4xl mb-4"></i>
                                <p>Sélectionnez une comparaison pour voir les détails</p>
                            </div>
                            <CompareQuoteLines v-else :compareQuoteNo="selectedQuote.no" :search="linesSearchQuery"
                                @close="selectedQuote = null" @line-selected="handleLineSelected" />
                        </div>
                    </div>
                </div>
            </template>

            <!-- Line Detail View -->
            <CompareQuoteLineDetail v-else :line="selectedLine" :totalElements="compareStore.totalLinesElements"
                @back="selectedLine = null" @prev="handlePrevLine" @next="handleNextLine" />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useCompareQuoteStore } from '../stores/compareQuote'
import TheNavbar from '../components/TheNavbar.vue'
import CompareQuoteLines from '../components/CompareQuoteLines.vue'
import CompareQuoteLineDetail from '../components/CompareQuoteLineDetail.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dropdown from 'primevue/dropdown'

const compareStore = useCompareQuoteStore()
const searchQuery = ref('')
const linesSearchQuery = ref('')
const selectedQuote = ref(null)
const selectedLine = ref(null)

const totalPages = computed(() => {
    const total = compareStore.totalElements || 0
    const size = compareStore.pageSize || 10
    return Math.max(1, Math.ceil(total / size))
})

onMounted(async () => {
    await compareStore.fetchCompareQuotes()
    if (compareStore.quotes.length > 0) {
        selectedQuote.value = compareStore.quotes[0]
    }
})

const handleSearch = () => {
    compareStore.fetchCompareQuotes(0, searchQuery.value)
}

const handleLinesSearch = () => {
    // The search is handled by passing the prop to CompareQuoteLines
}

const onRowSelect = (event) => {
    selectedQuote.value = event.data
}

const onRowUnselect = () => {
    selectedQuote.value = null
}

const selectQuote = (quote) => {
    selectedQuote.value = quote
    selectedLine.value = null // Reset selected line when changing quote
}

const handleLineSelected = (line) => {
    selectedLine.value = line
}

const handlePrevLine = () => {
    if (!selectedLine.value) return
    const lines = compareStore.selectedQuoteLines
    const currentIndex = lines.findIndex(l => l.itemNo === selectedLine.value.itemNo)
    
    if (currentIndex > 0) {
        selectedLine.value = lines[currentIndex - 1]
    }
}

const handleNextLine = () => {
    if (!selectedLine.value) return
    const lines = compareStore.selectedQuoteLines
    const currentIndex = lines.findIndex(l => l.itemNo === selectedLine.value.itemNo)
    
    if (currentIndex < lines.length - 1) {
        selectedLine.value = lines[currentIndex + 1]
    }
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

/* Tailwind-like utilities for width transition */
.w-2\/3 {
    width: 66.666667%;
}

.w-1\/3 {
    width: 33.333333%;
}

.flex-1 {
    flex: 1 1 0%;
}

.h-full {
    height: 100%;
}

.flex-col {
    flex-direction: column;
}

.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

.animate-slide-in-right {
    animation: slideInRight 0.3s ease-out forwards;
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}
</style>
