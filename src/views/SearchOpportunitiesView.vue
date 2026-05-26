<template>
  <div class="page-layout">
    <TheNavbar />

    <!-- Toast notification -->
    <Transition name="toast-slide">
      <div v-if="toast.visible" class="so-toast" :class="toast.type">
        <i class="pi" :class="toast.type === 'success' ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
        <span>{{ toast.message }}</span>
        <button class="toast-dismiss" @click="toast.visible = false">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </Transition>

    <main class="main-content">
      <!-- Header Bar -->
      <div class="header-bar mb-5" :class="{ 'expanded': isFiltersExpanded }">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Analyse Recherches B2B</h1>
            <button class="so-refresh-btn" @click="loadAll" :disabled="loadingOpportunities">
              <i class="pi" :class="loadingOpportunities ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              Actualiser
            </button>
            <button
              class="so-toggle-filters-btn"
              :class="{ 'active': isFiltersExpanded }"
              @click="toggleFilters"
              title="Filtres"
              type="button"
            >
              <i class="pi pi-sliders-h"></i>
            </button>
          </div>
          <div class="header-right">
            <div class="header-divider"></div>
            <SearchOpportunityStats :stats="stats" :loading="loadingStats" :error="statsError" />
          </div>
        </div>

        <!-- Section Filtres (Expand/Collapse) -->
        <div class="advanced-filters-panel" :class="{ 'expanded': isFiltersExpanded }">
          <SearchOpportunityFilters
            :model-value="filters"
            @update:model-value="Object.assign(filters, $event)"
            @search="onSearch"
            @reset="onReset"
          />
        </div>
      </div>

      <!-- Table -->
      <SearchOpportunityTable :items="opportunities" :loading="loadingOpportunities" :current-page="pagination.page"
        :total-pages="pagination.totalPages" :total-elements="pagination.totalElements" :page-size="pagination.size"
        @detail="openDetailModal" @close="openCloseModal" @page-change="onPageChange" @size-change="onSizeChange" />
    </main>

    <!-- Detail Modal -->
    <SearchOpportunityDetailsModal :visible="detailModal.visible" :normalized-filter="detailModal.normalizedFilter"
      :details="detailModal.details" :loading="detailModal.loading" :error="detailModal.error"
      @close="detailModal.visible = false" @open-close="onOpenCloseFromDetail" />

    <!-- Close Modal -->
    <CloseSearchOpportunityModal :visible="closeModal.visible" :normalized-filter="closeModal.normalizedFilter"
      :closed-by="closedByUser" :submitting="closeModal.submitting" @close="closeModal.visible = false"
      @submit="onSubmitClose" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TheNavbar from '@/components/TheNavbar.vue'
import SearchOpportunityStats from '@/components/search-opportunities/SearchOpportunityStats.vue'
import SearchOpportunityFilters from '@/components/search-opportunities/SearchOpportunityFilters.vue'
import SearchOpportunityTable from '@/components/search-opportunities/SearchOpportunityTable.vue'
import SearchOpportunityDetailsModal from '@/components/search-opportunities/SearchOpportunityDetailsModal.vue'
import CloseSearchOpportunityModal from '@/components/search-opportunities/CloseSearchOpportunityModal.vue'

import {
  getSearchOpportunities,
  getSearchOpportunityDetails,
  closeSearchOpportunity,
  getSearchOpportunityStats
} from '@/api/searchOpportunityService'

const authStore = useAuthStore()

// â”€â”€â”€ Resolved "closed by" user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const closedByUser = computed(() => {
  const u = authStore.user
  if (!u) return 'admin'
  return u.username || u.email || u.lastname || u.nom || u.name || 'admin'
})

// â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const toast = reactive({ visible: false, type: 'success', message: '' })
let toastTimer = null

function showToast(message, type = 'success') {
  clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 4500)
}

// â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const stats = ref(null)
const loadingStats = ref(false)
const statsError = ref(false)

async function loadStats() {
  loadingStats.value = true
  statsError.value = false
  try {
    const res = await getSearchOpportunityStats()
    stats.value = res.data
  } catch (e) {
    statsError.value = true
    console.error('[SearchOpportunities] stats error', e)
  } finally {
    loadingStats.value = false
  }
}

// â”€â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const isFiltersExpanded = ref(false)
function toggleFilters() {
  isFiltersExpanded.value = !isFiltersExpanded.value
}

const filters = reactive({
  fromDate: '',
  toDate: '',
  extId: '',
  companyName: '',
  type: '',
  minAttempts: null,
  minDistinctCustomers: null,
  onlyZeroResults: false,
  onlyNoStock: false,
  includeExistingInErp: false
})

// â”€â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const pagination = reactive({
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0
})

// â”€â”€â”€ Opportunities list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const opportunities = ref([])
const loadingOpportunities = ref(false)

function buildParams() {
  const p = { page: pagination.page, size: pagination.size }
  if (filters.fromDate) p.fromDate = filters.fromDate
  if (filters.toDate) p.toDate = filters.toDate
  if (filters.extId?.trim()) p.extId = filters.extId.trim()
  if (filters.companyName?.trim()) p.companyName = filters.companyName.trim()
  if (filters.type) p.type = filters.type
  if (filters.minAttempts > 0) p.minAttempts = filters.minAttempts
  if (filters.minDistinctCustomers > 0) p.minDistinctCustomers = filters.minDistinctCustomers
  if (filters.onlyZeroResults) p.onlyZeroResults = true
  if (filters.onlyNoStock) p.onlyNoStock = true
  p.includeExistingInErp = !!filters.includeExistingInErp
  return p
}

async function loadOpportunities() {
  loadingOpportunities.value = true
  try {
    const res = await getSearchOpportunities(buildParams())
    const data = res.data
    opportunities.value = data.content || []
    pagination.totalPages = data.page?.totalPages ?? data.totalPages ?? 0
    pagination.totalElements = data.page?.totalElements ?? data.totalElements ?? 0
  } catch (e) {
    console.error('[SearchOpportunities] list error', e)
    showToast('Erreur lors du chargement des opportunit\u00E9s.', 'error')
  } finally {
    loadingOpportunities.value = false
  }
}

function onSearch(nextFilters) {
  if (nextFilters && typeof nextFilters === 'object') {
    Object.assign(filters, nextFilters)
  }
  pagination.page = 0
  loadOpportunities()
}

function onReset(nextFilters) {
  if (nextFilters && typeof nextFilters === 'object') {
    Object.assign(filters, nextFilters)
  }
  pagination.page = 0
  loadOpportunities()
}

function onPageChange(page) {
  const targetPage = Number(page)
  if (isNaN(targetPage) || targetPage < 0 || (pagination.totalPages > 0 && targetPage >= Number(pagination.totalPages))) return
  pagination.page = targetPage
  loadOpportunities()
}

function onSizeChange(size) {
  const targetSize = Number(size)
  if (isNaN(targetSize) || targetSize <= 0) return
  pagination.size = targetSize
  pagination.page = 0
  loadOpportunities()
}

// â”€â”€â”€ Load all â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadAll() {
  await Promise.all([loadStats(), loadOpportunities()])
}

onMounted(() => loadAll())

// â”€â”€â”€ Detail modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const detailModal = reactive({
  visible: false,
  normalizedFilter: '',
  details: [],
  loading: false,
  error: false
})

async function openDetailModal(item) {
  detailModal.normalizedFilter = item.normalizedFilter
  detailModal.details = []
  detailModal.error = false
  detailModal.loading = true
  detailModal.visible = true
  try {
    const res = await getSearchOpportunityDetails(item.normalizedFilter)
    detailModal.details = Array.isArray(res.data) ? res.data : [res.data]
  } catch (e) {
    detailModal.error = true
    console.error('[SearchOpportunities] detail error', e)
  } finally {
    detailModal.loading = false
  }
}

function onOpenCloseFromDetail(normalizedFilter) {
  detailModal.visible = false
  openCloseModal({ normalizedFilter })
}

// â”€â”€â”€ Close modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const closeModal = reactive({
  visible: false,
  normalizedFilter: '',
  submitting: false
})

function openCloseModal(item) {
  closeModal.normalizedFilter = item.normalizedFilter
  closeModal.submitting = false
  closeModal.visible = true
}

async function onSubmitClose(payload) {
  closeModal.submitting = true
  try {
    await closeSearchOpportunity(closeModal.normalizedFilter, payload)
    closeModal.visible = false
    showToast('Opportunit\u00E9 "' + closeModal.normalizedFilter + '" cl\u00F4tur\u00E9e avec succ\u00E8s.', 'success')
    // Refresh both stats and list
    await Promise.all([loadStats(), loadOpportunities()])
  } catch (e) {
    console.error('[SearchOpportunities] close error', e)
    const status = e?.response?.status
    const message = String(e?.response?.data?.message || '')

    if (status === 404 && /Aucune recherche active/i.test(message)) {
      closeModal.visible = false
      opportunities.value = opportunities.value.filter(
        x => x.normalizedFilter !== closeModal.normalizedFilter
      )
      showToast('Opportunit\u00E9 "' + closeModal.normalizedFilter + '" d\u00E9j\u00E0 cl\u00F4tur\u00E9e. Liste synchronis\u00E9e.', 'success')
      await Promise.all([loadStats(), loadOpportunities()])
      return
    }

    showToast('Erreur lors de la cl\u00F4ture. Veuillez r\u00E9essayer.', 'error')
  } finally {
    closeModal.submitting = false
  }
}
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 0.5rem 2rem 3rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}

/* Header */
.header-bar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.header-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.5rem;
  min-height: 90px;
  box-sizing: border-box;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;

  flex-shrink: 0;
}
.header-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-grow: 1;

  padding-left: 2rem;
  justify-content: flex-end;
}
.header-bar h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
}
.header-divider {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1px;
  height: 36px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.so-refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  border-radius: 8px;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.so-refresh-btn:hover:not(:disabled) {
  border-color: #1e40af;
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.08);
}

.so-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filter Toggler Button */
.so-toggle-filters-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease-in-out;
  font-size: 0.95rem;
}
.so-toggle-filters-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-1px);
}
.so-toggle-filters-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Advanced Filters Panel */
.advanced-filters-panel {
  border-top: none;
  background: #f8fafc;
  padding: 0 1.5rem;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s ease-in-out,
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.advanced-filters-panel.expanded {
  border-top: 1px solid #f1f5f9;
  padding: 1.25rem 1.5rem;
  max-height: 500px;
  opacity: 1;
}

/* Flatten filters nested inside header panel */
.advanced-filters-panel :deep(.so-filters-panel) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
}

/* â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.so-toast {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.2rem;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  font-weight: 500;
  max-width: 420px;
  pointer-events: all;
}

.so-toast.success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #86efac;
}

.so-toast.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.so-toast .pi {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  padding: 0;
  transition: opacity 0.15s;
}

.toast-dismiss:hover {
  opacity: 1;
}

/* Toast animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

