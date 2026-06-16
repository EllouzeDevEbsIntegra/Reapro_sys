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
                    <div class="w-right-panel flex items-center h-full" style="padding: 1rem 1.5rem 1rem 0; gap: 1rem;">
                        <div style="width: 1px; height: 28px; background-color: rgba(255, 255, 255, 0.16); border-radius: 2px; flex-shrink: 0;"></div>
                        <h1>Lignes</h1>

                        <IconField iconPosition="left" class="search-field" style="width: 215px;">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="linesSearchQuery" placeholder="Article..."
                                @input="handleLinesSearch" />
                        </IconField>

                        <!-- Spacer gauche : centre le groupe pagination entre la recherche et le switch -->
                        <div class="spacer"></div>

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
                                    style="width: 58px !important; height: 32px;"
                                    @keydown.enter="handlePageInput" @blur="handlePageInput" />
                            </div>

                            <Button icon="pi pi-angle-right" text rounded size="small"
                                :disabled="compareStore.currentLinesPage >= totalLinesPages - 1"
                                @click="loadQuoteLines(compareStore.currentLinesPage + 1, compareStore.linesPageSize)" />
                            <Button icon="pi pi-angle-double-right" text rounded size="small"
                                :disabled="compareStore.currentLinesPage >= totalLinesPages - 1"
                                @click="loadQuoteLines(totalLinesPages - 1, compareStore.linesPageSize)" />

                            <Select :modelValue="compareStore.linesPageSize" :options="[10, 20, 50, 100]"
                                class="rows-dropdown-sm w-[70px]" panelClass="c2-dropdown-panel"
                                @update:modelValue="(val) => loadQuoteLines(0, val)" />
                        </div>

                        <div class="spacer"></div>

                        <div class="flex items-center gap-2 flex-shrink-0" style="min-width: max-content;">
                            <span class="text-sm font-medium text-slate-200 inline-block text-left whitespace-nowrap">
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

                <div class="flex cmp-body">
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
                                    <span style="font-weight: 700; color: var(--c2-select-accent);">
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

                <!-- Footer de page (concept charte C2) : pagination Comparateurs -->
                <footer class="cmp-footer">
                    <span class="cmp-footer-label">Comparateurs</span>
                    <div class="cmp-pagination">
                        <Button icon="pi pi-angle-double-left" text rounded size="small"
                            :disabled="compareStore.currentPage === 0"
                            @click="compareStore.fetchCompareQuotes(0, searchQuery)" />
                        <Button icon="pi pi-angle-left" text rounded size="small"
                            :disabled="compareStore.currentPage === 0"
                            @click="compareStore.fetchCompareQuotes(compareStore.currentPage - 1, searchQuery)" />
                        <span class="cmp-page-box">{{ compareStore.currentPage + 1 }}</span>
                        <Button icon="pi pi-angle-right" text rounded size="small"
                            :disabled="compareStore.currentPage >= totalPages - 1"
                            @click="compareStore.fetchCompareQuotes(compareStore.currentPage + 1, searchQuery)" />
                        <Button icon="pi pi-angle-double-right" text rounded size="small"
                            :disabled="compareStore.currentPage >= totalPages - 1"
                            @click="compareStore.fetchCompareQuotes(totalPages - 1, searchQuery)" />
                        <Select v-model="compareStore.pageSize" :options="[10, 20, 50, 100]"
                            class="rows-dropdown-sm" panelClass="c2-dropdown-panel" @change="handleSearch" />
                    </div>
                </footer>
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
    padding: var(--c2-page-pad) var(--c2-page-pad);
}

.header-bar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0 1.5rem;
    position: sticky;
    top: var(--c2-head-sticky-top);
    z-index: var(--c2-head-z);
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius);
    box-shadow: var(--c2-head-shadow);
    margin-bottom: var(--c2-head-gap);
    height: var(--c2-head-h);
    box-sizing: border-box;
}

.header-bar h1 {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--c2-head-title);
    margin: 0;
    white-space: nowrap;
}

/* Largeur pilotée par le style inline de chaque champ (Comparateur 300px / Lignes 140px),
   sans !important → recherche Lignes compacte et alignée avec les autres contrôles. */
.search-field {
    max-width: 100%;
}

/* Zone de recherche STANDARD = fond blanc (identique à B2B .search-input).
   Règle de charte : les champs de recherche sont blancs sur fond clair ET sur header navy. */
.search-field :deep(.p-inputtext) {
    width: 100% !important;
    height: 36px;
    background: #ffffff !important;
    border: 1.5px solid #e2e8f0 !important;
    border-radius: 8px;
    color: #1e293b !important;
    -webkit-text-fill-color: #1e293b !important;   /* texte saisi visible (override thème PrimeVue + autofill) */
    caret-color: #1e293b;
    /* Police identique à B2B (.search-input) : on neutralise la police propre du thème PrimeVue */
    font-family: inherit !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    transition: border-color .15s ease, box-shadow .15s ease;
}

/* Placeholder gris (comme B2B). Redéclarer -webkit-text-fill-color : sinon celui du texte saisi (#1e293b)
   teinte aussi le placeholder en foncé sous Chrome/WebKit. */
.search-field :deep(.p-inputtext)::placeholder {
    color: #94a3b8 !important;
    -webkit-text-fill-color: #94a3b8 !important;
    font-style: italic;
    opacity: 1;
}
.search-field :deep(.p-inputtext:hover) { border-color: #cbd5e1 !important; }
.search-field :deep(.p-inputtext:focus) { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12); }
.search-field :deep(.p-inputicon),
.search-field :deep(.p-iconfield .pi) { color: #94a3b8; }
.search-field:focus-within :deep(.p-inputicon),
.search-field:focus-within :deep(.p-iconfield .pi) { color: #3b82f6; }

/* ── Contrôles du header "Lignes" harmonisés sur navy (charte C2) ── */
/* Pagination : boutons flèches en clair, survol discret, désactivé estompé */
.w-right-panel :deep(.p-button.p-button-text) {
    width: 30px; height: 30px; color: #cbd5e1;
    transition: background .15s ease, color .15s ease;
}
.w-right-panel :deep(.p-button.p-button-text:not(:disabled):hover) { background: rgba(255, 255, 255, .12); color: #fff; }
.w-right-panel :deep(.p-button.p-button-text:not(:disabled):hover .p-button-icon) { color: #fff; }
.w-right-panel :deep(.p-button.p-button-text:disabled) { color: rgba(203, 213, 225, .32); opacity: 1; }

/* Champ "page courante" */
:deep(.page-input) {
    height: 32px !important;
    background: rgba(255, 255, 255, .08) !important;
    border: 1px solid rgba(255, 255, 255, .16) !important;
    border-radius: 8px !important;
    color: #e2e8f0 !important;
    font-weight: 600;
}
:deep(.page-input:focus) { border-color: var(--c2-focus) !important; box-shadow: 0 0 0 2px rgba(125, 211, 252, .22) !important; }

/* Select taille de page (FERMÉ) — PrimeVue applique un fond clair via son thème :
   on force le rendu navy avec !important sur les classes PrimeVue exactes.
   Limité à .rows-dropdown-sm → n'impacte aucun autre select. */
.w-right-panel :deep(.rows-dropdown-sm.p-select) {
    height: 32px !important; min-height: 32px !important;
    margin-left: .5rem !important;   /* respire entre ">>" et le select */
    display: inline-flex !important; align-items: center;
    background: rgba(255, 255, 255, .08) !important;
    border: 1px solid rgba(255, 255, 255, .16) !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.w-right-panel :deep(.rows-dropdown-sm.p-select:hover) { background: rgba(255, 255, 255, .12) !important; border-color: rgba(255, 255, 255, .28) !important; }
.w-right-panel :deep(.rows-dropdown-sm.p-select.p-focus) { border-color: var(--c2-focus) !important; box-shadow: 0 0 0 2px rgba(125, 211, 252, .22) !important; }
.w-right-panel :deep(.rows-dropdown-sm .p-select-label) {
    color: #e2e8f0 !important; background: transparent !important;
    font-size: .82rem !important; font-weight: 600 !important;
    padding: 0 .15rem 0 .6rem !important; display: flex; align-items: center;
}
.w-right-panel :deep(.rows-dropdown-sm .p-select-dropdown) {
    color: #cbd5e1 !important; background: transparent !important; width: 1.7rem !important;
}
.w-right-panel :deep(.rows-dropdown-sm .p-select-dropdown-icon),
.w-right-panel :deep(.rows-dropdown-sm .p-select-dropdown svg),
.w-right-panel :deep(.rows-dropdown-sm .p-select-dropdown .p-icon) {
    color: #cbd5e1 !important; fill: currentColor !important;
    width: .8rem !important; height: .8rem !important;
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

/* ── Corps Comparateur : hauteur stable pilotée par les tokens charte C2 →
   les tables remplissent l'espace ENTRE header et footer (pas de grand vide, pas de chevauchement).
   = 100vh - header - 2×gap (sous header + au-dessus footer) - footer - (padding haut + bas). ── */
.cmp-body {
    height: calc(100vh - var(--c2-head-h) - (var(--c2-head-gap) * 2) - var(--cmp-footer-h) - (var(--c2-page-pad) * 2));
    gap: var(--c2-page-pad);   /* gap entre panneaux = padding top compact ; centre aligné sur le séparateur header (55%) */
}

/* ── Footer de page (concept charte C2, test Comparateur) : navy, compact, sticky bas ── */
.cmp-footer {
    --cmp-footer-h: 48px;   /* = hauteur du footer sidebar (uniformisé) */
    flex-shrink: 0;
    height: var(--cmp-footer-h);
    margin-top: var(--c2-head-gap);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 1.5rem;
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius);
    box-shadow: var(--c2-head-shadow);
    position: sticky;
    bottom: var(--c2-page-pad);
    z-index: var(--c2-head-z);
}
.main-content { --cmp-footer-h: 48px; }   /* consommé par .cmp-body (hauteur) */
.cmp-footer-label { color: #cbd5e1; font-size: .8rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
.cmp-pagination { display: flex; align-items: center; gap: .35rem; }

/* Flèches pagination — claires, hover discret, disabled estompé */
.cmp-pagination :deep(.p-button.p-button-text) {
    width: 30px; height: 30px; color: #cbd5e1;
    transition: background .15s ease, color .15s ease;
}
.cmp-pagination :deep(.p-button.p-button-text:not(:disabled):hover) { background: rgba(255, 255, 255, .12); color: #fff; }
.cmp-pagination :deep(.p-button.p-button-text:not(:disabled):hover .p-button-icon) { color: #fff; }
.cmp-pagination :deep(.p-button.p-button-text:disabled) { color: rgba(203, 213, 225, .32); opacity: 1; }

/* Boîte n° page (lisible 3-4 chiffres) */
.cmp-page-box {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 46px; height: 30px; padding: 0 8px; margin: 0 .25rem;
    background: rgba(255, 255, 255, .08);
    border: 1px solid rgba(255, 255, 255, .16);
    border-radius: 8px;
    color: #fff; font-weight: 700; font-size: .82rem; font-variant-numeric: tabular-nums;
}

/* Select page-size (fermé) lisible sur navy — réutilise le panneau ouvert .rows-dropdown-panel */
.cmp-pagination :deep(.rows-dropdown-sm.p-select) {
    height: 32px !important; min-height: 32px !important; margin-left: .4rem !important;
    display: inline-flex !important; align-items: center;
    background: rgba(255, 255, 255, .08) !important;
    border: 1px solid rgba(255, 255, 255, .16) !important;
    border-radius: 8px !important; box-shadow: none !important;
}
.cmp-pagination :deep(.rows-dropdown-sm.p-select:hover) { background: rgba(255, 255, 255, .12) !important; border-color: rgba(255, 255, 255, .28) !important; }
.cmp-pagination :deep(.rows-dropdown-sm.p-select.p-focus) { border-color: var(--c2-focus) !important; box-shadow: 0 0 0 2px rgba(125, 211, 252, .22) !important; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-label) { color: #e2e8f0 !important; background: transparent !important; font-size: .82rem !important; font-weight: 600 !important; padding: 0 .15rem 0 .6rem !important; display: flex; align-items: center; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown) { color: #cbd5e1 !important; background: transparent !important; width: 1.7rem !important; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown-icon),
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown svg),
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown .p-icon) { color: #cbd5e1 !important; fill: currentColor !important; width: .8rem !important; height: .8rem !important; }

/* Cartes harmonisées charte C2 (scoped → n'impacte pas les autres pages) */
.glass-card {
    background: #fff !important;
    border: 1px solid #e8edf3 !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 3px rgba(16, 24, 40, .05) !important;
    backdrop-filter: none !important;
    overflow: hidden !important;   /* clippe les coins de la table aux angles arrondis de la carte */
}

/* La DataTable interne ne doit PAS dessiner son propre conteneur (bordure/rayon/fond)
   → évite l'effet "rectangle dans carte arrondie" ; la carte est le seul conteneur. */
:deep(.midone-table.p-datatable),
:deep(.midone-table .p-datatable-header),
:deep(.midone-table .p-datatable-table-container),
:deep(.midone-table .p-datatable-wrapper) {
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
}

/* ── Tables (gauche + droite) — STYLE C2 fidèle (réf. ConfirmationAchatDetailC2).
   :deep atteint les deux .midone-table. Tokens C2 : --line #e8edf3, --line-soft #f1f5f9,
   --p #2563eb, --p-soft #eff6ff. PAS de text-align imposé (colonnes texte = gauche). ── */
:deep(.midone-table .p-datatable-thead > tr > th) {
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
    text-transform: uppercase;
    padding: 10px 10px;
    white-space: nowrap;
    border-bottom: 1.5px solid #e8edf3;       /* horizontal fin */
    border-right: 1px solid #f1f5f9;           /* séparateur vertical C2 */
}
:deep(.midone-table .p-datatable-thead > tr > th:last-child) { border-right: none; }
:deep(.midone-table .p-datatable-tbody > tr > td) {
    padding: 8px 10px;
    color: #334155;
    font-size: 13.5px;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;           /* séparateur vertical C2 */
}
:deep(.midone-table .p-datatable-tbody > tr > td:last-child) { border-right: none; }
:deep(.midone-table .p-datatable-tbody > tr:nth-child(even)) { background: #fcfdfe; }   /* zebra C2 */
:deep(.midone-table .p-datatable-tbody > tr:not([data-p-selected="true"]):not(.p-datatable-row-selected):hover) {
    background: #f5f9ff;                        /* hover doux bleuté C2 */
    cursor: pointer;
}
:deep(.midone-table .p-datatable-tbody > tr[data-p-selected="true"]),
:deep(.midone-table .p-datatable-tbody > tr.p-datatable-row-selected) {
    background: #eff6ff;                        /* ligne sélectionnée C2 */
    box-shadow: inset 3px 0 0 var(--c2-select-accent);
    outline: 1px solid #bfdbfe;
    outline-offset: -1px;
}
:deep(.midone-table .p-datatable-tbody > tr[data-p-selected="true"] > td),
:deep(.midone-table .p-datatable-tbody > tr.p-datatable-row-selected > td) {
    border-bottom-color: #dbeafe;
}

/* Statut → badge pilule style C2 (donnée/logique inchangées) */
:deep(.midone-table .badge) {
    display: inline-flex; align-items: center;
    padding: 2px 9px; border-radius: 999px;
    font-size: .66rem; font-weight: 800; letter-spacing: .02em; text-transform: uppercase;
    line-height: 1.6; border: 1px solid transparent;
}
:deep(.midone-table .badge-info) { color: var(--c2-select-accent); background: #eff6ff; border-color: #dbeafe; }
:deep(.midone-table .badge-warning) { color: #c2410c; background: #fff7ed; border-color: #fed7aa; }
:deep(.midone-table .badge-success) { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }

/* Icône action (chevron) → cohérente C2 : neutre, hover bleu doux, taille alignée */
:deep(.midone-table .p-datatable-tbody .p-button.p-button-text) {
    width: 30px; height: 30px; color: #94a3b8;
}
:deep(.midone-table .p-datatable-tbody .p-button.p-button-text:hover) {
    background: #eff6ff; color: #2563eb;
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
    /* OFF : translucide subtil sur navy + fausse bordure/ombre interne discrète */
    background-color: rgba(255, 255, 255, .14);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22), inset 0 1px 2px rgba(0, 0, 0, .18);
    transition: background-color .25s ease, box-shadow .25s ease;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: #f1f5f9;            /* thumb propre, off-white (pas blanc cru) */
    transition: transform .25s ease, background-color .25s ease;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .35);
}

input:checked+.slider {
    /* ON : bleu charte C2 */
    background-color: #2563eb;
    box-shadow: inset 0 0 0 1px #2563eb, 0 1px 3px rgba(37, 99, 235, .4);
}

input:focus+.slider {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .26), 0 0 0 2px rgba(125, 211, 252, .3);
}

input:checked+.slider:before {
    transform: translateX(16px);
    background-color: #fff;
}
</style>

<!-- Panneau déroulant du select "lignes par page" — NON scoped car PrimeVue téléporte
     l'overlay dans <body> (hors sous-arbre scoped). Ciblé via panelClass="rows-dropdown-panel"
     → n'affecte AUCUN autre select. Surface claire charte C2. -->
<style>
.rows-dropdown-panel.p-select-overlay {
    background: #fff;
    border: 1px solid #e8edf3;
    border-radius: 10px;
    box-shadow: 0 18px 44px rgba(15, 23, 42, .22);
    margin-top: 6px;
    overflow: hidden;
}
.rows-dropdown-panel .p-select-list { padding: 5px; display: flex; flex-direction: column; gap: 2px; }
.rows-dropdown-panel .p-select-option {
    padding: 8px 12px;
    border-radius: 7px;
    font-size: .84rem;
    font-weight: 600;
    color: #334155;
    transition: background .12s ease, color .12s ease;
}
.rows-dropdown-panel .p-select-option:not(.p-select-option-selected):hover,
.rows-dropdown-panel .p-select-option.p-focus {
    background: #f1f5f9;
    color: #1e40af;
}
.rows-dropdown-panel .p-select-option.p-select-option-selected {
    background: #eff6ff;
    color: #1d4ed8;
}
.rows-dropdown-panel .p-select-option.p-select-option-selected.p-focus {
    background: #e0ecff;
}
</style>
