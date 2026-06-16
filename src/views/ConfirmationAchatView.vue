<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- ═══════════════════════════════════════════════════════════════
           ÉCRAN 1 : LISTE DES COMPARATEURS
      ════════════════════════════════════════════════════════════════ -->
      <template v-if="!selectedQuote">
        <!-- ─── HEADER BAR (C2 Deep Ocean, single panel) ────────────── -->
        <div class="header-bar">
          <h1>Confirmation Achat</h1>

          <IconField iconPosition="left" class="search-field" style="width: 300px;">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher (N°, Description)..."
              @input="handleSearch" />
          </IconField>

          <div class="spacer"></div>
        </div>

        <!-- ─── CORPS : single panel pleine largeur (pas de right panel) ─ -->
        <div class="ca-body">
          <div class="glass-card single-panel">
            <DataTable :value="compareStore.quotes" :loading="compareStore.isLoading" responsiveLayout="scroll"
              class="p-datatable-hover flex-1 midone-table quote-list-table" :rowHover="true" scrollable
              scrollHeight="flex" @row-click="onQuoteRowClick">

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
                    <i class="pi pi-calendar" style="color: var(--text-muted); font-size: 0.875rem;"></i>
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

              <template #empty>
                <div style="text-align: center; padding: 3rem;">
                  <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-muted);"></i>
                  <p style="margin-top: 1rem; color: var(--text-muted);">Aucune comparaison trouvée</p>
                </div>
              </template>
            </DataTable>
          </div>
        </div>

        <!-- ─── FOOTER page standard C2 (48px, navy) : pagination ───── -->
        <footer class="cmp-footer">
          <span class="cmp-footer-label">Confirmation Achat</span>
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

      <!-- ═══════════════════════════════════════════════════════════════
           ÉCRAN 2 : DÉTAIL "CONFIRMATION COMMANDES ACHAT"
      ════════════════════════════════════════════════════════════════ -->
      <template v-else>
        <!-- ─── Détail FRS / EQV / KIT / Historique (header unifié inclus dans le composant) ─ -->
        <ConfirmationAchatDetail :key="selectedQuote.no" :compareQuoteNo="selectedQuote.no"
          :compareQuoteDescription="selectedQuote.description" @back="goBackToList" />
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCompareQuoteStore } from '../stores/compareQuote'
import TheNavbar from '../components/TheNavbar.vue'
// ─────────────────────────────────────────────────────────────────────────
// Version active : C2 (vraie intégration de la charte « Design C2 · Data grid premium »
// sur la logique réelle). Pour revenir à une autre version, changer UNIQUEMENT ce chemin :
//
//   import ConfirmationAchatDetail from '../components/ConfirmationAchatDetailC2.vue'        // C2 (active)
//   // import ConfirmationAchatDetail from '../components/ConfirmationAchatDetail.vue'        // version originale (rollback)
//   // import ConfirmationAchatDetail from '../components/ConfirmationAchatDetailRefonte.vue'  // refonte V1
//   // import ConfirmationAchatDetail from '../components/ConfirmationAchatDetailRefonteV2.vue' // refonte V2
// ─────────────────────────────────────────────────────────────────────────
import ConfirmationAchatDetail from '../components/ConfirmationAchatDetailC2.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'

const compareStore = useCompareQuoteStore()
const searchQuery = ref('')
const selectedQuote = ref(null)

const totalPages = computed(() => {
  const total = compareStore.totalElements || 0
  const size = compareStore.pageSize || 10
  return Math.max(1, Math.ceil(total / size))
})

onMounted(async () => {
  await compareStore.fetchCompareQuotes()
})

const handleSearch = () => {
  compareStore.fetchCompareQuotes(0, searchQuery.value)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
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

const onQuoteRowClick = (event) => {
  selectedQuote.value = event.data
}

const goBackToList = () => {
  selectedQuote.value = null
}
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }

/* Shell C2 single-panel : padding compact + footer 48px consommé par .ca-body */
.main-content { width: 100%; padding: var(--c2-page-pad) var(--c2-page-pad); --cmp-footer-h: 48px; }

/* ── Header C2 (Deep Ocean, sticky 76px) — identique à /comparateur ── */
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
.header-bar h1 { font-size: 1.25rem; font-weight: 800; color: var(--c2-head-title); margin: 0; white-space: nowrap; }
.spacer { flex-grow: 1; }

/* ── Zone de recherche blanche (charte §13) ── */
.search-field { max-width: 100%; }
.search-field :deep(.p-inputtext) {
  width: 100% !important; height: 36px;
  background: #ffffff !important; border: 1.5px solid #e2e8f0 !important; border-radius: 8px;
  color: #1e293b !important; -webkit-text-fill-color: #1e293b !important; caret-color: #1e293b;
  font-family: inherit !important; font-size: 0.875rem !important; font-weight: 500 !important;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.search-field :deep(.p-inputtext)::placeholder { color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important; font-style: italic; opacity: 1; }
.search-field :deep(.p-inputtext:hover) { border-color: #cbd5e1 !important; }
.search-field :deep(.p-inputtext:focus) { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12); }
.search-field :deep(.p-inputicon), .search-field :deep(.p-iconfield .pi) { color: #94a3b8; }
.search-field:focus-within :deep(.p-inputicon), .search-field:focus-within :deep(.p-iconfield .pi) { color: #3b82f6; }

/* ── Corps single panel : hauteur stable pilotée par les tokens (= /comparateur sans right panel).
   = 100vh - header - 2×gap - footer - 2×padding → table remplit entre header et footer, sans chevauchement. ── */
.ca-body {
  height: calc(100vh - var(--c2-head-h) - (var(--c2-head-gap) * 2) - var(--cmp-footer-h) - (var(--c2-page-pad) * 2));
  display: flex;
}
.single-panel { width: 100%; display: flex; flex-direction: column; min-width: 0; }
.quote-list-table :deep(.p-datatable-tbody > tr) { cursor: pointer; }

/* Carte C2 = seul conteneur (clippe la table) */
.glass-card {
  background: #fff !important;
  border: 1px solid #e8edf3 !important;
  border-radius: 12px !important;
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05) !important;
  backdrop-filter: none !important;
  overflow: hidden !important;
}

/* La DataTable interne ne dessine pas son propre conteneur (pas de double radius/border) */
:deep(.midone-table.p-datatable),
:deep(.midone-table .p-datatable-header),
:deep(.midone-table .p-datatable-table-container),
:deep(.midone-table .p-datatable-wrapper) { border: none !important; border-radius: 0 !important; background: transparent !important; }

/* ── Table — STYLE C2 fidèle (réf. /comparateur) ── */
:deep(.midone-table .p-datatable-thead > tr > th) {
  background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase;
  padding: 10px 10px; white-space: nowrap; border-bottom: 1.5px solid #e8edf3; border-right: 1px solid #f1f5f9;
}
:deep(.midone-table .p-datatable-thead > tr > th:last-child) { border-right: none; }
:deep(.midone-table .p-datatable-tbody > tr > td) {
  padding: 8px 10px; color: #334155; font-size: 13.5px; vertical-align: middle;
  border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9;
}
:deep(.midone-table .p-datatable-tbody > tr > td:last-child) { border-right: none; }
:deep(.midone-table .p-datatable-tbody > tr:nth-child(even)) { background: #fcfdfe; }
:deep(.midone-table .p-datatable-tbody > tr:not([data-p-selected="true"]):not(.p-datatable-row-selected):hover) { background: #f5f9ff; cursor: pointer; }
:deep(.midone-table .p-datatable-tbody > tr[data-p-selected="true"]),
:deep(.midone-table .p-datatable-tbody > tr.p-datatable-row-selected) {
  background: #eff6ff; box-shadow: inset 3px 0 0 var(--c2-select-accent); outline: 1px solid #bfdbfe; outline-offset: -1px;
}
:deep(.midone-table .p-datatable-tbody > tr[data-p-selected="true"] > td),
:deep(.midone-table .p-datatable-tbody > tr.p-datatable-row-selected > td) { border-bottom-color: #dbeafe; }

/* Statut → badge pilule C2 */
:deep(.midone-table .badge) {
  display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px;
  font-size: .66rem; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; line-height: 1.6; border: 1px solid transparent;
}
:deep(.midone-table .badge-info) { color: var(--c2-select-accent); background: #eff6ff; border-color: #dbeafe; }
:deep(.midone-table .badge-warning) { color: #c2410c; background: #fff7ed; border-color: #fed7aa; }
:deep(.midone-table .badge-success) { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }

/* ── Footer de page standard C2 (48px, navy, sticky bas) — = /comparateur ── */
.cmp-footer {
  flex-shrink: 0; height: var(--cmp-footer-h); margin-top: var(--c2-head-gap); box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 1.5rem;
  background: var(--c2-head-bg); border: 1px solid var(--c2-head-border); border-radius: var(--c2-head-radius); box-shadow: var(--c2-head-shadow);
  position: sticky; bottom: var(--c2-page-pad); z-index: var(--c2-head-z);
}
.cmp-footer-label { color: #cbd5e1; font-size: .8rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
.cmp-pagination { display: flex; align-items: center; gap: .35rem; }
.cmp-pagination :deep(.p-button.p-button-text) { width: 30px; height: 30px; color: #cbd5e1; transition: background .15s ease, color .15s ease; }
.cmp-pagination :deep(.p-button.p-button-text:not(:disabled):hover) { background: rgba(255, 255, 255, .12); color: #fff; }
.cmp-pagination :deep(.p-button.p-button-text:not(:disabled):hover .p-button-icon) { color: #fff; }
.cmp-pagination :deep(.p-button.p-button-text:disabled) { color: rgba(203, 213, 225, .32); opacity: 1; }
.cmp-page-box {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 46px; height: 30px; padding: 0 8px; margin: 0 .25rem;
  background: rgba(255, 255, 255, .08); border: 1px solid rgba(255, 255, 255, .16); border-radius: 8px;
  color: #fff; font-weight: 700; font-size: .82rem; font-variant-numeric: tabular-nums;
}
.cmp-pagination :deep(.rows-dropdown-sm.p-select) {
  height: 32px !important; min-height: 32px !important; margin-left: .4rem !important;
  display: inline-flex !important; align-items: center;
  background: rgba(255, 255, 255, .08) !important; border: 1px solid rgba(255, 255, 255, .16) !important;
  border-radius: 8px !important; box-shadow: none !important;
}
.cmp-pagination :deep(.rows-dropdown-sm.p-select:hover) { background: rgba(255, 255, 255, .12) !important; border-color: rgba(255, 255, 255, .28) !important; }
.cmp-pagination :deep(.rows-dropdown-sm.p-select.p-focus) { border-color: var(--c2-focus) !important; box-shadow: 0 0 0 2px rgba(125, 211, 252, .22) !important; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-label) { color: #e2e8f0 !important; background: transparent !important; font-size: .82rem !important; font-weight: 600 !important; padding: 0 .15rem 0 .6rem !important; display: flex; align-items: center; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown) { color: #cbd5e1 !important; background: transparent !important; width: 1.7rem !important; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown-icon),
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown svg),
.cmp-pagination :deep(.rows-dropdown-sm .p-select-dropdown .p-icon) { color: #cbd5e1 !important; fill: currentColor !important; width: .8rem !important; height: .8rem !important; }

.flex-1 { flex: 1 1 0%; }
</style>

<!-- Panneau déroulant du select "lignes par page" — NON scoped (PrimeVue téléporte l'overlay dans <body>).
     Ciblé via panelClass="rows-dropdown-panel" → n'affecte aucun autre select. -->
<style>
.rows-dropdown-panel.p-select-overlay {
  background: #fff; border: 1px solid #e8edf3; border-radius: 10px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, .22); margin-top: 6px; overflow: hidden;
}
.rows-dropdown-panel .p-select-list { padding: 5px; display: flex; flex-direction: column; gap: 2px; }
.rows-dropdown-panel .p-select-option { padding: 8px 12px; border-radius: 7px; font-size: .84rem; font-weight: 600; color: #334155; transition: background .12s ease, color .12s ease; }
.rows-dropdown-panel .p-select-option:not(.p-select-option-selected):hover,
.rows-dropdown-panel .p-select-option.p-focus { background: #f1f5f9; color: #1e40af; }
.rows-dropdown-panel .p-select-option.p-select-option-selected { background: #eff6ff; color: #1d4ed8; }
.rows-dropdown-panel .p-select-option.p-select-option-selected.p-focus { background: #e0ecff; }
</style>
