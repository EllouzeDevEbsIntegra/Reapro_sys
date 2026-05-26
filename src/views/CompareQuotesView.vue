<template>
    <div class="page-layout">
        <TheNavbar />
        <ConfirmDialog />

        <main class="main-content">
            <template v-if="!selectedLine">
                <!-- Unified Dual Headers -->
                <div class="header-bar w-full" style="padding: 0; gap: 0;">
                    <!-- Left Section: Comparateur -->
                    <div class="w-left-panel flex items-center h-full" style="padding: 1rem 1.5rem; gap: 1.5rem;">
                        <h1>Comparateur</h1>

                        <IconField iconPosition="left" class="search-field" style="width: 300px;">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Rechercher (N°, Description)..."
                                @input="handleSearch" />
                        </IconField>

                        <div class="spacer"></div>
                    </div>

                    <!-- Right Section: Lignes -->
                    <div class="w-right-panel flex items-center h-full" style="padding: 1rem 1.5rem; gap: 1.5rem;">
                        <div style="width: 2px; height: 40px; background-color: #e2e8f0; border-radius: 2px; flex-shrink: 0;"></div>
                        <h1>Lignes</h1>

                        <IconField iconPosition="left" class="search-field" style="width: 140px;">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="linesSearchQuery" placeholder="Article..."
                                @input="handleLinesSearch" />
                        </IconField>

                        <!-- Lignes Pagination Controls -->
                        <div class="flex items-center gap-1">
                            <Button icon="pi pi-angle-double-left" text rounded size="small"
                                :disabled="compareStore.currentLinesPage === 0"
                                @click="loadQuoteLines(0, compareStore.linesPageSize)" />
                            <Button icon="pi pi-angle-left" text rounded size="small"
                                :disabled="compareStore.currentLinesPage === 0"
                                @click="loadQuoteLines(compareStore.currentLinesPage - 1, compareStore.linesPageSize)" />

                            <div class="flex items-center gap-1 mx-1">
                                <InputText v-model="manualPage" class="text-center p-1 text-sm page-input"
                                    style="width: 40px !important; height: 32px;"
                                    @keydown.enter="handlePageInput" @blur="handlePageInput" />
                            </div>

                            <Button icon="pi pi-angle-right" text rounded size="small"
                                :disabled="compareStore.currentLinesPage >= totalLinesPages - 1"
                                @click="loadQuoteLines(compareStore.currentLinesPage + 1, compareStore.linesPageSize)" />
                            <Button icon="pi pi-angle-double-right" text rounded size="small"
                                :disabled="compareStore.currentLinesPage >= totalLinesPages - 1"
                                @click="loadQuoteLines(totalLinesPages - 1, compareStore.linesPageSize)" />

                            <Select :modelValue="compareStore.linesPageSize" :options="[10, 20, 50, 100]"
                                class="rows-dropdown-sm w-[70px]"
                                @update:modelValue="(val) => loadQuoteLines(0, val)" />
                        </div>

                        <div class="spacer"></div>

                        <div class="flex items-center gap-2 flex-shrink-0" style="min-width: max-content;">
                            <span class="text-sm font-medium text-slate-700 inline-block text-left whitespace-nowrap">
                                {{ linesTreatedFilter === false ? 'Non Traité' : 'Tous' }}
                            </span>
                            <label class="switch">
                                <input type="checkbox" v-model="linesTreatedFilter" :true-value="false"
                                    :false-value="null">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="flex gap-6 h-[calc(100vh-220px)]">
                    <!-- Left Panel: List (2/3 width) -->
                    <div
                        class="w-left-panel transition-all duration-300 ease-in-out flex flex-col gap-0 overflow-hidden glass-card p-0">
                        <DataTable :value="compareStore.quotes" :loading="compareStore.isLoading"
                            v-model:selection="selectedQuote" selectionMode="single" @row-select="onRowSelect"
                            @row-unselect="onRowUnselect" responsiveLayout="scroll"
                            class="p-datatable-hover flex-1 midone-table" :rowHover="true" scrollable
                            scrollHeight="flex">

                            <Column field="no" header="N°" sortable style="min-width: 150px">
                                <template #body="slotProps">
                                    <span style="font-weight: 600; color: var(--primary-color);">
                                        {{ slotProps.data.no }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="description" header="Description" sortable style="min-width: 250px">
                            </Column>

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
                                    <p style="margin-top: 1rem; color: var(--text-muted);">Aucune comparaison
                                        trouvée
                                    </p>
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
                                    <Button :label="(compareStore.currentPage + 1).toString()" size="small"
                                        class="page-num-btn active-page" />
                                </div>

                                <Button icon="pi pi-angle-right" text rounded size="small"
                                    :disabled="compareStore.currentPage >= totalPages - 1"
                                    @click="compareStore.fetchCompareQuotes(compareStore.currentPage + 1, searchQuery)" />
                                <Button icon="pi pi-angle-double-right" text rounded size="small"
                                    :disabled="compareStore.currentPage >= totalPages - 1"
                                    @click="compareStore.fetchCompareQuotes(totalPages - 1, searchQuery)" />
                            </div>

                            <div class="flex items-center gap-3">
                                <Select v-model="compareStore.pageSize" :options="[10, 20, 50, 100]"
                                    class="rows-dropdown" @change="handleSearch" />
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Details (45% width) -->
                    <div class="w-right-panel animate-slide-in-right" style="width: 45%;">
                        <div class="glass-card h-full overflow-hidden p-0 flex flex-col">
                            <div v-if="!selectedQuote"
                                class="h-full flex flex-col items-center justify-center text-gray-400">
                                <i class="pi pi-arrow-left text-4xl mb-4"></i>
                                <p>Sélectionnez une comparaison pour voir les détails</p>
                            </div>
                            <CompareQuoteLines v-else :compareQuoteNo="selectedQuote.no" :search="linesSearchQuery"
                                :treatedFilter="linesTreatedFilter" @close="selectedQuote = null"
                                @line-selected="handleLineSelected" />
                        </div>
                    </div>
                </div>
            </template>

            <!-- Line Detail View -->
            <CompareQuoteLineDetail v-else :line="selectedLine" :totalElements="compareStore.totalLinesElements"
                :currentIndex="compareStore.currentLineGlobalIndex" @back="handleBackFromDetail" @prev="handlePrevLine"
                @next="handleNextLine" />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useCompareQuoteStore } from '../stores/compareQuote'
import { useConfirm } from 'primevue/useconfirm'
import TheNavbar from '../components/TheNavbar.vue'
import CompareQuoteLines from '../components/CompareQuoteLines.vue'
import CompareQuoteLineDetail from '../components/CompareQuoteLineDetail.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputSwitch from 'primevue/inputswitch'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'

const compareStore = useCompareQuoteStore()
const confirm = useConfirm()
const searchQuery = ref('')
const linesSearchQuery = ref('')
const linesTreatedFilter = ref(null)  // null = all, false = only non-treated
const selectedQuote = ref(null)
const selectedLine = ref(null)
const manualPage = ref(1)

const totalPages = computed(() => {
    const total = compareStore.totalElements || 0
    const size = compareStore.pageSize || 10
    return Math.max(1, Math.ceil(total / size))
})

const totalLinesPages = computed(() => {
    const total = compareStore.totalLinesElements || 0
    const size = compareStore.linesPageSize || 20
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
    loadQuoteLines(0, compareStore.linesPageSize)
}

const handlePageInput = () => {
    let page = parseInt(manualPage.value)
    if (isNaN(page) || page < 1) {
        page = 1
    } else if (page > totalLinesPages.value) {
        page = totalLinesPages.value
    }

    manualPage.value = page
    if (page - 1 !== compareStore.currentLinesPage) {
        loadQuoteLines(page - 1, compareStore.linesPageSize)
    }
}

const loadQuoteLines = (page = 0, size = 20) => {
    if (!selectedQuote.value) return

    const apiFilters = {
        page,
        size,
        search: linesSearchQuery.value
    }

    if (linesTreatedFilter.value === false) {
        apiFilters.treated = false
    }

    compareStore.fetchCompareQuoteLines(selectedQuote.value.no, apiFilters)
}

// Watchers for lines filter/search
watch([linesSearchQuery, linesTreatedFilter], () => {
    loadQuoteLines(0, compareStore.linesPageSize)
})

watch(() => compareStore.currentLinesPage, (newPage) => {
    manualPage.value = newPage + 1
})

// Watch selectedQuote to load its lines
watch(selectedQuote, (newQuote) => {
    if (newQuote) {
        // Reset to page 0 when changing quote
        loadQuoteLines(0, compareStore.linesPageSize)
    } else {
        compareStore.selectedQuoteLines = []
    }
}, { immediate: true })

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
    // Calculate global index based on current page
    const currentPageLines = compareStore.selectedQuoteLines
    const indexInPage = currentPageLines.findIndex(l => l.itemNo === line.itemNo)

    if (indexInPage !== -1) {
        // Get current lines page from filters in CompareQuoteLines component
        // We'll use the store's currentLinesPage which is updated by fetchCompareQuoteLines
        const globalIndex = (compareStore.currentLinesPage * compareStore.linesPageSize) + indexInPage
        compareStore.setCurrentLineGlobalIndex(globalIndex)
    }

    selectedLine.value = line
}

const handleBackFromDetail = () => {
    confirm.require({
        message: 'Voulez-vous vraiment quitter cette page ?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        acceptClass: 'p-button-success',
        rejectClass: 'p-button-secondary',
        accept: () => {
            selectedLine.value = null
        },
        reject: () => {
            // Stay on page
        }
    })
}

const handlePrevLine = async () => {
    if (!selectedLine.value || compareStore.currentLineGlobalIndex === null) return

    // Calculate target global index
    const targetGlobalIndex = compareStore.currentLineGlobalIndex - 1

    // Check if we're at the first line
    if (targetGlobalIndex < 0) {
        console.log('Already at first line')
        return
    }

    // Calculate which page the target line is on
    const currentPageSize = compareStore.linesPageSize
    const targetPage = compareStore.getPageForLineIndex(targetGlobalIndex, currentPageSize)
    const currentPage = compareStore.currentLinesPage

    // Check if we need to load a different page
    if (targetPage !== currentPage) {
        // Load the previous page
        try {
            const apiFilters = {
                page: targetPage,
                size: currentPageSize,
                search: linesSearchQuery.value
            }

            if (linesTreatedFilter.value === false) {
                apiFilters.treated = false
            }

            await compareStore.fetchCompareQuoteLines(selectedQuote.value.no, apiFilters)

            // After loading, select the last line of the newly loaded page
            const lines = compareStore.selectedQuoteLines
            if (lines && lines.length > 0) {
                const indexInPage = targetGlobalIndex % currentPageSize
                selectedLine.value = lines[indexInPage]
                compareStore.setCurrentLineGlobalIndex(targetGlobalIndex)
            }
        } catch (error) {
            console.error('Error loading previous page:', error)
        }
    } else {
        // Same page, just navigate to previous line
        const lines = compareStore.selectedQuoteLines
        const currentIndex = lines.findIndex(l => l.itemNo === selectedLine.value.itemNo)

        if (currentIndex > 0) {
            selectedLine.value = lines[currentIndex - 1]
            compareStore.setCurrentLineGlobalIndex(targetGlobalIndex)
        }
    }
}

const handleNextLine = async () => {
    if (!selectedLine.value || compareStore.currentLineGlobalIndex === null) return

    // Calculate target global index
    const targetGlobalIndex = compareStore.currentLineGlobalIndex + 1

    // Check if we're at the last line
    if (targetGlobalIndex >= compareStore.totalLinesElements) {
        console.log('Already at last line')
        return
    }

    // Calculate which page the target line is on
    const currentPageSize = compareStore.linesPageSize
    const targetPage = compareStore.getPageForLineIndex(targetGlobalIndex, currentPageSize)
    const currentPage = compareStore.currentLinesPage

    // Check if we need to load a different page
    if (targetPage !== currentPage) {
        // Load the next page
        try {
            const apiFilters = {
                page: targetPage,
                size: currentPageSize,
                search: linesSearchQuery.value
            }

            if (linesTreatedFilter.value === false) {
                apiFilters.treated = false
            }

            await compareStore.fetchCompareQuoteLines(selectedQuote.value.no, apiFilters)

            // After loading, select the first line of the newly loaded page
            const lines = compareStore.selectedQuoteLines
            if (lines && lines.length > 0) {
                const indexInPage = targetGlobalIndex % currentPageSize
                selectedLine.value = lines[indexInPage]
                compareStore.setCurrentLineGlobalIndex(targetGlobalIndex)
            }
        } catch (error) {
            console.error('Error loading next page:', error)
        }
    } else {
        // Same page, just navigate to next line
        const lines = compareStore.selectedQuoteLines
        const currentIndex = lines.findIndex(l => l.itemNo === selectedLine.value.itemNo)

        if (currentIndex < lines.length - 1) {
            selectedLine.value = lines[currentIndex + 1]
            compareStore.setCurrentLineGlobalIndex(targetGlobalIndex)
        }
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

/* Layout panel widths */
.w-left-panel {
    width: 55%;
}

.w-right-panel {
    width: 45%;
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

/* Custom Toggle Switch */
.switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
    flex-shrink: 0;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    /* slate-300 */
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input:checked+.slider {
    background-color: #3b82f6;
    /* blue-500 */
}

input:focus+.slider {
    box-shadow: 0 0 1px #3b82f6;
}

input:checked+.slider:before {
    transform: translateX(16px);
}
</style>
