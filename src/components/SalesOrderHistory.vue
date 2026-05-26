<template>
  <section class="order-history glass-card p-3 animate-fade-in">


    <!-- Sleek Filters Bar -->
    <div class="history-filters-bar mb-3">
      <div class="history-filters-group">
        <div class="history-filter-col-status">
          <Select v-model="filters.status" :options="statusOptions" placeholder="Statut"
            class="history-custom-select" panelClass="history-status-dropdown-panel" showClear />
        </div>
        <div class="history-filter-col-date">
          <DatePicker v-model="filters.dateFrom" placeholder="Début" dateFormat="yy-mm-dd"
            class="history-custom-calendar" :showIcon="true" showClear />
        </div>
        <div class="history-filter-col-date">
          <DatePicker v-model="filters.dateTo" placeholder="Fin" dateFormat="yy-mm-dd" class="history-custom-calendar"
            :showIcon="true" :minDate="filters.dateFrom || undefined" showClear />
        </div>
        <button v-if="hasActiveFilters" class="history-btn-clear-filters" @click="clearFilters" title="Réinitialiser"
          type="button">
          <i class="pi pi-refresh"></i>
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-wrapper" @scroll="handleScroll">
      <DataTable :value="history.content" :responsiveLayout="'scroll'" :loading="history.loading && !isLoadingMore" class="history-table"
        stripedRows>
        <Column field="id" header="N° Interne" class="col-num">
          <template #body="slotProps">
            <span class="order-num">#{{ slotProps.data.id }}</span>
          </template>
        </Column>
        <Column field="businessCentralOrderNumber" header="N° Commande BC" class="col-bc-num">
          <template #body="slotProps">
            <span class="bc-num" v-if="slotProps.data.businessCentralOrderNumber">
              {{ slotProps.data.businessCentralOrderNumber }}
            </span>
            <span class="no-bc" v-else>—</span>
          </template>
        </Column>
        <Column field="status" header="Statut" class="col-status">
          <template #body="slotProps">
            <span class="status-badge" :class="'status-' + slotProps.data.status?.toLowerCase()">
              {{ slotProps.data.status }}
            </span>
          </template>
        </Column>
        <Column field="totalIncludingTax" header="Total TTC" class="col-total">
          <template #body="slotProps">
            <span class="price-val">{{ formatPrice(slotProps.data.totalIncludingTax) }} DT</span>
          </template>
        </Column>
        <Column header="Action" class="col-action">
          <template #body="slotProps">
            <button class="btn-view" @click="viewDetail(slotProps.data.id)" title="Charger cette commande"
              type="button">
              <i class="pi pi-eye"></i> Ouvrir
            </button>
          </template>
        </Column>
      </DataTable>
      <div v-if="isLoadingMore" class="loading-more py-2 text-center text-xs text-slate-400">
        <i class="pi pi-spin pi-spinner mr-1"></i> Chargement...
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator from 'primevue/paginator'
import { useSalesOrderStore } from '@/stores/salesOrderStore'
import { useToast } from 'primevue/usetoast'

const store = useSalesOrderStore()
const toast = useToast()

const statusOptions = ['DRAFT', 'VALIDATED', 'CANCELLED']
const filters = ref({
  status: null,
  dateFrom: null,
  dateTo: null,
})

const history = computed(() => store.history)

const hasActiveFilters = computed(() => {
  return filters.value.status !== null || filters.value.dateFrom !== null || filters.value.dateTo !== null
})

function clearFilters() {
  filters.value.status = null
  filters.value.dateFrom = null
  filters.value.dateTo = null
}

// Watch filters for reactive loading on change
watch(filters, (newFilters) => {
  if (newFilters.dateFrom && newFilters.dateTo) {
    const fromTime = new Date(newFilters.dateFrom).setHours(0, 0, 0, 0)
    const toTime = new Date(newFilters.dateTo).setHours(0, 0, 0, 0)
    if (toTime < fromTime) {
      toast.add({
        severity: 'warn',
        summary: 'Date invalide',
        detail: 'La date de fin doit être supérieure ou égale à la date de début.',
        life: 3000
      })
      filters.value.dateTo = null
      return
    }
  }
  store.history.number = 0
  load()
}, { deep: true })

const isLoadingMore = ref(false)

const handleScroll = (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  if (scrollHeight - scrollTop - clientHeight < 40) {
    loadMore()
  }
}

async function loadMore() {
  if (isLoadingMore.value || history.value.loading || history.value.number >= history.value.totalPages - 1) return
  
  isLoadingMore.value = true
  try {
    const nextPage = history.value.number + 1
    const params = {
      page: nextPage,
      size: history.value.size,
      clientId: store.clientId,
      status: filters.value.status || undefined,
      dateFrom: filters.value.dateFrom ? filters.value.dateFrom.toISOString() : undefined,
      dateTo: filters.value.dateTo ? filters.value.dateTo.toISOString() : undefined,
    }
    await store.loadHistory(params, true)
  } finally {
    isLoadingMore.value = false
  }
}

function load() {
  if (!store.clientId) return

  const params = {
    page: 0,
    size: history.value.size,
    clientId: store.clientId,
    status: filters.value.status || undefined,
    dateFrom: filters.value.dateFrom ? filters.value.dateFrom.toISOString() : undefined,
    dateTo: filters.value.dateTo ? filters.value.dateTo.toISOString() : undefined,
  }
  store.loadHistory(params, false)
}

function formatPrice(val) {
  if (val == null || isNaN(val)) return '—'
  return Number(val).toLocaleString('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

async function viewDetail(orderId) {
  try {
    await store.loadOrderDetail(orderId)
    toast.add({
      severity: 'success',
      summary: 'Commande chargée',
      detail: `La commande #${orderId} a été ouverte dans le panier.`,
      life: 3000
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: e.response?.data?.message || 'Impossible de charger les détails',
      life: 4000
    })
  }
}

// Watch client change to reload
watch(() => store.clientId, (newClient) => {
  if (newClient) {
    store.history.number = 0
    load()
  }
})

// Initial load on mount if client exists
onMounted(() => {
  if (store.clientId) {
    load()
  }
})
</script>

<style scoped>
.order-history {
  background: white;
  border-radius: 8px;
}

/* --- Sleek Filters Bar --- */
.history-filters-bar {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 6px 8px !important;
  margin-bottom: 12px !important;
  display: block !important;
}

.history-filters-group {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 6px !important;
  width: 100% !important;
  flex-wrap: nowrap !important;
}

.history-filter-col-status {
  flex: 0.85 1 0% !important;
  min-width: 0 !important;
}

.history-filter-col-date {
  flex: 1.15 1 0% !important;
  min-width: 0 !important;
}

/* Custom Select Styling */
.history-custom-select {
  width: 100% !important;
  height: 34px !important;
  font-size: 0.78rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: white;
  display: inline-flex !important;
  align-items: center !important;
  transition: all 0.2s ease;
}

.history-custom-select:hover {
  border-color: #94a3b8;
}

.history-custom-select:focus,
.history-custom-select:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
}

:deep(.p-dropdown .p-dropdown-label),
:deep(.p-select .p-select-label) {
  padding: 6px 8px !important;
  font-size: 0.78rem;
  display: flex !important;
  align-items: center !important;
}

/* DatePicker custom layout to keep input and icon button side by side */
.history-custom-calendar {
  width: 100% !important;
  height: 34px !important;
  display: inline-flex !important;
}

:deep(.p-datepicker),
:deep(.p-calendar) {
  position: relative !important;
  width: 100% !important;
  height: 34px !important;
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: stretch !important;
  flex-wrap: nowrap !important;
}

/* Center clear icon (X) vertically and position it left of the calendar trigger */
:deep(.p-datepicker-clear-icon),
:deep(.p-calendar-clear-icon),
:deep(.p-inputwrapper-clear-icon),
:deep(.p-datepicker .p-inputwriter-clear-icon),
:deep(.p-datepicker .pi-times) {
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  right: 44px !important;
  margin: 0 !important;
  color: #94a3b8 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 0.75rem !important;
  z-index: 2 !important;
  height: auto !important;
  transition: color 0.15s ease !important;
}

:deep(.p-datepicker-clear-icon:hover),
:deep(.p-calendar-clear-icon:hover),
:deep(.p-inputwrapper-clear-icon:hover),
:deep(.p-datepicker .p-inputwriter-clear-icon:hover),
:deep(.p-datepicker .pi-times:hover) {
  color: #ef4444 !important;
}

:deep(.p-datepicker .p-inputtext),
:deep(.p-datepicker-input),
:deep(.p-calendar .p-inputtext) {
  flex: 1 !important;
  min-width: 0 !important;
  height: 34px !important;
  padding: 6px 8px !important;
  font-size: 0.76rem !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px 0 0 6px !important;
  background: white !important;
  transition: all 0.2s ease !important;
}

:deep(.p-datepicker-input::placeholder),
:deep(.p-datepicker .p-inputtext::placeholder),
:deep(.p-calendar .p-inputtext::placeholder) {
  font-size: 0.74rem !important;
  color: #94a3b8 !important;
}

:deep(.p-datepicker-input:hover),
:deep(.p-datepicker .p-inputtext:hover),
:deep(.p-calendar .p-inputtext:hover) {
  border-color: #94a3b8 !important;
}

:deep(.p-datepicker-input:focus),
:deep(.p-datepicker .p-inputtext:focus),
:deep(.p-calendar .p-inputtext:focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08) !important;
}

/* Calendar Button Trigger styling to blend with input */
:deep(.p-datepicker-trigger),
:deep(.p-calendar .p-datepicker-trigger),
:deep(.p-datepicker-button) {
  background: #f1f5f9 !important;
  border: 1px solid #cbd5e1 !important;
  border-left: none !important;
  color: #64748b !important;
  border-radius: 0 6px 6px 0 !important;
  width: 28px !important;
  height: 34px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
}

:deep(.p-datepicker-trigger:hover),
:deep(.p-calendar .p-datepicker-trigger:hover),
:deep(.p-datepicker-button:hover) {
  background: #e2e8f0 !important;
  color: #475569 !important;
}

/* Styling for dropdown options inside panel/overlay list */
:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item),
:deep(.p-select-overlay .p-select-list .p-select-option) {
  padding: 12px 16px !important;
  font-size: 0.85rem !important;
  color: #334155 !important;
  transition: all 0.15s ease !important;
}

:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover),
:deep(.p-select-overlay .p-select-list .p-select-option:hover) {
  background: #f1f5f9 !important;
  color: #1e3a8a !important;
}

.history-btn-clear-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.history-btn-clear-filters:hover {
  background: #cbd5e1;
  color: #1e293b;
}

/* --- Table Styles --- */
.table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 720px;
  overflow-y: auto;
  position: relative;
}

.history-table :deep(.p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 8px 10px;
  font-size: 0.78rem;
  border-bottom: 1px solid #f1f5f9;
}

.order-num {
  font-family: monospace;
  font-weight: 700;
  color: #1e3a8a;
}

.bc-num {
  font-family: monospace;
  font-weight: 700;
  color: #0284c7;
}

.no-bc {
  color: #94a3b8;
  font-weight: 500;
}

.price-val {
  font-weight: 600;
  color: #334155;
}

/* --- Status badges --- */
.status-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  display: inline-block;
}

.status-draft {
  background: #fef3c7;
  color: #d97706;
}

.status-validated {
  background: #d1fae5;
  color: #059669;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* --- Actions --- */
.btn-view {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}

.btn-view:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}
</style>

<!-- Global overrides for History Dropdown Panel (since it is appended to body) -->
<style>
.history-status-dropdown-panel {
  border: 1px solid #cbd5e1 !important;
  border-radius: 10px !important;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04) !important;
  background: white !important;
  padding: 4px !important;
  min-width: 120px !important;
  z-index: 999999 !important;
}

.history-status-dropdown-panel .p-select-list,
.history-status-dropdown-panel .p-dropdown-items {
  padding: 0 !important;
  margin: 0 !important;
  list-style-type: none !important;
}

.history-status-dropdown-panel .p-select-option,
.history-status-dropdown-panel .p-dropdown-item {
  padding: 6px 10px !important;
  font-size: 0.8rem !important;
  color: #334155 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  transition: all 0.12s ease !important;
  margin-bottom: 2px !important;
  display: flex !important;
  align-items: center !important;
}

/* Hover state matching b2b client selector list style */
.history-status-dropdown-panel .p-select-option:not(.p-select-option-selected):hover,
.history-status-dropdown-panel .p-dropdown-item:not(.p-highlight):hover {
  background: #f0f7ff !important;
  color: #1d4ed8 !important;
}

/* Selected state matching b2b client selector list style */
.history-status-dropdown-panel .p-select-option-selected,
.history-status-dropdown-panel .p-highlight {
  background: #eff6ff !important;
  color: #1e40af !important;
  font-weight: 600 !important;
}
</style>
