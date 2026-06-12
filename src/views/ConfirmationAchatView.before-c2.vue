<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- ═══════════════════════════════════════════════════════════════
           ÉCRAN 1 : LISTE DES COMPARATEURS
      ════════════════════════════════════════════════════════════════ -->
      <template v-if="!selectedQuote">
        <!-- ─── HEADER BAR ──────────────────────────────────────────── -->
        <div class="header-bar mb-5">
          <div class="header-main-row">
            <div class="header-left">
              <h1>Confirmation Achat</h1>

              <IconField iconPosition="left" class="search-field" style="width: 300px;">
                <InputIcon class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Rechercher (N°, Description)..."
                  @input="handleSearch" />
              </IconField>
            </div>

            <div class="header-right"></div>
          </div>
        </div>

        <!-- ─── LISTE DES COMPARATEURS (pleine largeur) ─────────────── -->
        <div class="list-card glass-card p-0 flex flex-col overflow-hidden">
          <DataTable :value="compareStore.quotes" :loading="compareStore.isLoading" responsiveLayout="scroll"
            class="p-datatable-hover flex-1 midone-table quote-list-table" :rowHover="true" scrollable
            scrollHeight="flex" @row-click="onQuoteRowClick">

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
              <Select v-model="compareStore.pageSize" :options="[10, 20, 50, 100]" class="rows-dropdown"
                @change="handleSearch" />
            </div>
          </div>
        </div>
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
// Version active : REFONTE V2. Pour comparer, remplacer le chemin ci-dessous par :
//   '../components/ConfirmationAchatDetail.vue'         -> version originale
//   '../components/ConfirmationAchatDetailRefonte.vue'  -> refonte V1
//   '../components/ConfirmationAchatDetailRefonteV2.vue' -> refonte V2 (active)
import ConfirmationAchatDetail from '../components/ConfirmationAchatDetailRefonteV2.vue'
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
.page-layout {
  min-height: 100vh;
  background-color: #f1f5f9;
}

.main-content {
  width: 100%;
  padding: 0.5rem 2rem 3rem;
}

.header-bar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 1.5rem;
  min-height: 90px;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-left h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-field :deep(.p-inputtext) {
  width: 100% !important;
}

.list-card {
  height: calc(100vh - 220px);
}

.quote-list-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

/* Header détail */
.detail-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.detail-no { font-weight: 700; color: #1e40af; }
.detail-sep { color: #cbd5e1; }
.detail-desc { color: #475569; }

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}
</style>
