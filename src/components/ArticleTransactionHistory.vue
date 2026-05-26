<template>
  <div class="transaction-history-container">
    <template v-if="selectedItem">
      <!-- En-tête -->
      <div class="history-header">
        <div class="header-top">
          <!-- Colonne 1 : Titre -->
          <div class="title-area">
            <h2>Transaction Article</h2>
          </div>

          <!-- Colonne 2 : Sélecteur d'année centré -->
          <div class="year-center">
            <transition name="fade-slide">
              <div class="year-pill" v-if="!filterByClient">
                <button class="year-nav-btn" @click="changeYear(-1)" type="button" title="Année précédente">
                  <i class="pi pi-angle-left"></i>
                </button>
                <span class="year-value">{{ selectedYear }}</span>
                <button class="year-nav-btn" @click="changeYear(1)" type="button" title="Année suivante">
                  <i class="pi pi-angle-right"></i>
                </button>
              </div>
            </transition>
          </div>

          <!-- Colonne 3 : Switch Client -->
          <div class="header-controls">
            <label
              class="client-toggle"
              :class="{ 'is-active': filterByClient }"
              :title="filterByClient ? 'Toutes les années ‒ Client actuel' : 'Filtrer par client actuel'"
            >
              <input type="checkbox" v-model="filterByClient" />
              <span class="toggle-pill">
                <i class="pi pi-user"></i>
                <span class="toggle-text">Client</span>
                <span class="toggle-knob"></span>
              </span>
            </label>
          </div>
        </div>

        <div class="item-info-row">
          <span class="ref-badge">
            {{ formatReference(selectedItem.no || selectedItem.itemNo) }}
            <i v-if="isProductItem(selectedItem)" class="pi pi-bookmark-fill product-flag" title="Référence Master"></i>
          </span>
          <span class="desc-text" :title="selectedItem.descriptionStructured || selectedItem.description">
            {{ selectedItem.descriptionStructured || selectedItem.structuredDescription || selectedItem.description || '—' }}
          </span>
        </div>
      </div>

      <!-- KPIs Stats -->
      <div class="stats-bar">
        <div class="stats-card">
          <span class="stats-label">Stock</span>
          <span class="stats-value">{{ historyKpis.stock }}</span>
        </div>
        <div class="stats-card">
          <span class="stats-label">Achat</span>
          <span class="stats-value">{{ historyKpis.achat }}</span>
        </div>
        <div class="stats-card">
          <span class="stats-label">Vente</span>
          <span class="stats-value">{{ Math.abs(historyKpis.vente) }}</span>
        </div>
        <div class="stats-card">
          <span class="stats-label">Rupt</span>
          <span class="stats-value">{{ historyKpis.rupt }}</span>
        </div>
      </div>

      <!-- Tableau des transactions -->
      <div class="table-wrapper" ref="tableWrapper" @scroll="onScroll">
        <table class="modern-table">
          <thead>
            <tr>
              <th :style="{ width: isExpanded ? '14%' : '18%' }">Date</th>
              <th :style="{ width: isExpanded ? '6%' : '10%' }">Type</th>
              <template v-if="isExpanded">
                <th style="width: 12%">Type Doc</th>
                <th style="width: 12%">N° Doc</th>
              </template>
              <th :style="{ width: isExpanded ? '12%' : '18%' }">Client/Frs</th>
              <th :style="{ width: isExpanded ? '30%' : '38%' }">Nom</th>
              <th :style="{ width: isExpanded ? '8%' : '12%' }" class="text-right">Qte</th>
              <template v-if="isExpanded">
                <th style="width: 8%">Magasin</th>
              </template>
              <th :style="{ width: isExpanded ? '10%' : '14%' }" class="text-right">PU</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading && historyEntries.length === 0">
              <td :colspan="isExpanded ? 8 : 5" class="text-center p-4">
                <i class="pi pi-spin pi-spinner mr-2"></i>Chargement...
              </td>
            </tr>
            <tr v-else-if="historyEntries.length === 0">
              <td :colspan="isExpanded ? 8 : 5" class="text-center p-4">
                Aucune transaction pour cette année.
              </td>
            </tr>
            <template v-else>
              <tr v-for="(entry, index) in historyEntries" :key="index" :class="{ 'rupture-row': entry.entryType === 'Rupture' }">
                <td>{{ formatDate(entry.postingDate) }}</td>
                <td>
                  <div class="type-indicator-circle" :class="getEntryTypeClass(entry.entryType)" :title="entry.entryType">
                    {{ getEntryTypeLetter(entry.entryType) }}
                  </div>
                </td>
                <template v-if="isExpanded">
                  <td>{{ entry.documentType || '—' }}</td>
                  <td>{{ entry.documentNo || '—' }}</td>
                </template>
                <td>{{ entry.sourceNo || '—' }}</td>
                <td :title="entry.sourceName">{{ entry.sourceName || '—' }}</td>
                <td class="text-right">{{ entry.quantity }}</td>
                <template v-if="isExpanded">
                  <td>{{ entry.locationCode || '—' }}</td>
                </template>
                <td class="text-right">{{ formatNumber(calculatePU(entry), 2) }}</td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="isLoading && historyEntries.length > 0" class="loading-more">
          <i class="pi pi-spin pi-spinner"></i> Chargement...
        </div>
      </div>
    </template>

    <template v-else>
      <div class="empty-state">
        <i class="pi pi-chart-line"></i>
        <p>Sélectionnez un article pour afficher ses transactions historiques.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCompareQuoteStore } from '@/stores/compareQuote'
import { useSalesOrderStore } from '@/stores/salesOrderStore'

const compareStore = useCompareQuoteStore()
const salesOrderStore = useSalesOrderStore()

const selectedItem = computed(() => salesOrderStore.selectedTransactionItem)
const isExpanded = computed(() => salesOrderStore.isExpanded)
const currentClientId = computed(() => salesOrderStore.clientId)

const selectedYear = ref(new Date().getFullYear())
const filterByClient = ref(false)
const historyEntries = ref([])
const isLoading = ref(false)

const historyPagination = ref({
  page: 0,
  size: 20,
  totalPages: 1,
  totalElements: 0
})

const historyKpis = ref({
  stock: 0,
  achat: 0,
  vente: 0,
  rupt: 0
})

const tableWrapper = ref(null)

// Formatage de la référence sans le terme MASTER
const formatReference = (refVal) => {
  if (!refVal) return ''
  return refVal.toString().replace(/MASTER/gi, '').trim()
}

// Vérifier si c'est un produit
const isProductItem = (item) => {
  if (!item) return false
  const p = item.produit
  return p === true || p === 'true' || p === 1 || p === '1'
}

const changeYear = (delta) => {
  selectedYear.value += delta
  fetchHistory(0)
}

const getEntryTypeLetter = (entryType) => {
  if (!entryType) return ''
  if (entryType === 'Sale') return 'S'
  if (entryType === 'Purchase') return 'P'
  if (entryType === 'Transfer') return 'T'
  if (entryType === 'Rupture') return 'R'
  return entryType.charAt(0).toUpperCase()
}

const getEntryTypeClass = (entryType) => {
  if (!entryType) return ''
  if (entryType === 'Sale') return 'type-s'
  if (entryType === 'Purchase') return 'type-p'
  if (entryType === 'Transfer') return 'type-t'
  if (entryType === 'Rupture') return 'type-r'
  return 'type-t'
}

const calculatePU = (entry) => {
  if (!entry) return 0
  const qty = Math.abs(entry.quantity) || 1
  if (entry.entryType === 'Sale') {
    const amount = entry.salesAmountActual || entry.salesAmountExpected || 0
    return amount / qty
  } else if (entry.entryType === 'Purchase') {
    const amount = entry.costAmountActual || entry.costAmountExpected || 0
    return amount / qty
  }
  return 0
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return Number(num).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const fetchHistory = async (page = 0) => {
  if (!selectedItem.value || !selectedItem.value.no) return
  if (isLoading.value) return

  isLoading.value = true
  try {
    const sourceNo = filterByClient.value && currentClientId.value ? currentClientId.value : null
    const allYears = filterByClient.value
    const yearToUse = filterByClient.value ? 0 : selectedYear.value

    const data = await compareStore.fetchItemLedgerEntries(
      selectedItem.value.no,
      yearToUse,
      page,
      historyPagination.value.size,
      null,
      sourceNo,
      allYears
    )

    if (data && data.content) {
      if (page === 0) {
        historyEntries.value = data.content
      } else {
        historyEntries.value = [...historyEntries.value, ...data.content]
      }

      historyPagination.value = {
        ...historyPagination.value,
        page: data.page !== undefined ? data.page : (data.number !== undefined ? data.number : 0),
        totalElements: data.totalElements !== undefined ? data.totalElements : 0,
        totalPages: data.totalPages !== undefined ? data.totalPages : 1
      }

      if (data.quantityByEntryType) {
        historyKpis.value = {
          stock: data.quantityByEntryType.Stock || 0,
          vente: data.quantityByEntryType.Sale || 0,
          achat: data.quantityByEntryType.Purchase || 0,
          rupt: data.quantityByEntryType.Rupture || 0
        }
      }
    } else {
      const items = Array.isArray(data) ? data : []
      if (page === 0) {
        historyEntries.value = items
      } else {
        historyEntries.value = [...historyEntries.value, ...items]
      }
      historyPagination.value.totalElements = historyEntries.value.length
      historyPagination.value.page = 0
      historyPagination.value.totalPages = 1
    }
  } catch (error) {
    console.error('Error fetching B2B history:', error)
    if (page === 0) historyEntries.value = []
  } finally {
    isLoading.value = false
  }
}

const onScroll = () => {
  const el = tableWrapper.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollHeight - scrollTop - clientHeight < 20) {
    if (historyPagination.value.page < historyPagination.value.totalPages - 1 && !isLoading.value) {
      fetchHistory(historyPagination.value.page + 1)
    }
  }
}

watch(selectedItem, (newVal) => {
  if (newVal) {
    selectedYear.value = new Date().getFullYear()
    filterByClient.value = false
    fetchHistory(0)
  } else {
    historyEntries.value = []
    historyKpis.value = { stock: 0, achat: 0, vente: 0, rupt: 0 }
  }
}, { immediate: true })

watch(filterByClient, () => {
  fetchHistory(0)
})
</script>

<style scoped>
.transaction-history-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.history-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.header-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.year-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* ── Year pill premium ───────────────────────────────────── */
.year-pill {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1.5px solid #bfdbfe;
  border-radius: 24px;
  padding: 3px 5px;
  box-shadow: 0 2px 6px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
}

.year-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 700;
  transition: background 0.18s, color 0.18s, transform 0.12s;
  flex-shrink: 0;
}

.year-nav-btn:hover {
  background: rgba(59,130,246,0.12);
  color: #1d4ed8;
  transform: scale(1.1);
}

.year-nav-btn:active {
  transform: scale(0.95);
}

.year-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #1d4ed8;
  min-width: 40px;
  text-align: center;
  justify-content: center;
  letter-spacing: 0.8px;
  padding: 0 4px;
}

.year-icon {
  font-size: 0.65rem;
  color: #60a5fa;
  opacity: 0.85;
}

/* ── Client toggle pill ───────────────────────────────────────── */
.client-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.client-toggle input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  box-sizing: border-box;
  padding: 0 12px 0 9px;
  border-radius: 24px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.78rem;
  font-weight: 700;
  color: #94a3b8;
  transition: all 0.22s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.toggle-pill i {
  font-size: 0.75rem;
  transition: color 0.22s;
}

.toggle-text {
  transition: color 0.22s;
  letter-spacing: 0.2px;
}

.toggle-knob {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  margin-left: 3px;
  transition: background 0.22s, box-shadow 0.22s;
  flex-shrink: 0;
}

/* Active state */
.client-toggle.is-active .toggle-pill {
  border-color: #f97316;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #ea6c00;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

.client-toggle.is-active .toggle-knob {
  background: #f97316;
  box-shadow: 0 0 4px rgba(249, 115, 22, 0.5);
}

/* Fade-slide transition for year pill */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.title-area h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.item-info-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.82rem;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.ref-badge {
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
}

.desc-text {
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  min-width: 0;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 6px;
}

.year-arrow {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 0.7rem;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.year-arrow:hover {
  color: #0f172a;
}

.year-display {
  font-weight: 700;
  font-size: 0.8rem;
  color: #334155;
  min-width: 36px;
  text-align: center;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.stats-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 4px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stats-label {
  font-size: 0.62rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.stats-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.table-wrapper {
  flex: 1;
  min-height: 675px; /* ~15 lignes × 1.5 */
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
  text-align: left;
}

.modern-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  padding: 5px 8px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modern-table td {
  padding: 5px 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.modern-table tr:hover {
  background: #f8fafc;
}

.modern-table tr.rupture-row {
  background-color: #fef2f2;
}

.modern-table tr.rupture-row:hover {
  background-color: #fee2e2;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.type-indicator-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
}

.type-s {
  background: #ef4444;
}

.type-p {
  background: #10b981;
}

.type-t {
  background: #3b82f6;
}

.type-r {
  background: #f59e0b;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: #64748b;
  font-size: 0.8rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 250px;
  padding: 24px;
  text-align: center;
  color: #94a3b8;
}

.empty-state i {
  font-size: 2.2rem;
  margin-bottom: 12px;
  color: #cbd5e1;
}

.empty-state p {
  font-size: 0.82rem;
  margin: 0;
  max-width: 220px;
  line-height: 1.4;
}

.product-flag {
  color: #3b82f6;
  margin-left: 4px;
  font-size: 0.75rem;
  vertical-align: middle;
  display: inline-block;
}
</style>
