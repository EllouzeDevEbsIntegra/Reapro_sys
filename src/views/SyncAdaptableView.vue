<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- ─── HEADER BAR ──────────────────────────────────────────────── -->
      <div class="header-bar mb-5">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Synchronisation Adaptable</h1>
            <button class="so-sync-btn" @click="triggerSyncData" :disabled="syncing || loading">
              <i class="pi" :class="syncing ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              {{ syncing ? 'Synchronisation...' : 'Synchroniser' }}
            </button>
            <button
              class="adv-search-btn"
              :class="{ 'active': isFiltersVisible }"
              @click="isFiltersVisible = !isFiltersVisible"
              title="Filtres"
              type="button"
            >
              <i class="pi pi-sliders-h"></i>
            </button>
          </div>

          <div class="header-right">
            <!-- KPI chips -->
            <div class="header-kpis">
              
              <!-- 1er KPI : Nombre Total d'articles -->
              <div class="kpi-card kpi-blue-theme" title="Nombre total d'articles">
                <div class="kpi-card-inner">
                  <!-- Left: Icon Badge -->
                  <div class="kpi-icon-container blue">
                    <i class="pi pi-box"></i>
                  </div>
                  
                  <!-- Divider -->
                  <div class="kpi-divider blue"></div>
                  
                  <!-- Right: Main Content -->
                  <div class="kpi-main-content">
                    <div class="kpi-val-row">
                      <span class="kpi-main-value blue">
                        {{ formatNumber(totalArticles) }}
                      </span>
                    </div>
                    <span class="kpi-label">Total Articles</span>
                  </div>
                </div>
              </div>

              <!-- 2ème KPI : Nombre total de Master détectés -->
              <div class="kpi-card kpi-amber-theme" title="Nombre total de Master détectés">
                <div class="kpi-card-inner">
                  <!-- Left: Icon Badge -->
                  <div class="kpi-icon-container amber">
                    <i class="pi pi-bookmark-fill"></i>
                  </div>
                  
                  <!-- Divider -->
                  <div class="kpi-divider amber"></div>
                  
                  <!-- Right: Main Content -->
                  <div class="kpi-main-content">
                    <div class="kpi-val-row">
                      <span class="kpi-main-value amber">
                        {{ formatNumber(totalMasters) }}
                      </span>
                    </div>
                    <span class="kpi-label">Master Détectés</span>
                  </div>
                </div>
              </div>

              <!-- KPI supplémentaire : Nombre total de Groupes -->
              <div class="kpi-card kpi-teal-theme" title="Nombre total de groupes">
                <div class="kpi-card-inner">
                  <!-- Left: Icon Badge -->
                  <div class="kpi-icon-container teal">
                    <i class="pi pi-tags"></i>
                  </div>
                  
                  <!-- Divider -->
                  <div class="kpi-divider teal"></div>
                  
                  <!-- Right: Main Content -->
                  <div class="kpi-main-content">
                    <div class="kpi-val-row">
                      <span class="kpi-main-value teal">
                        {{ formatNumber(totalGroups) }}
                      </span>
                    </div>
                    <span class="kpi-label">Groupes</span>
                  </div>
                </div>
              </div>

              <!-- 3ème KPI : Nombre Total de Subgroup -->
              <div class="kpi-card kpi-emerald-theme" title="Nombre total de sous-groupes">
                <div class="kpi-card-inner">
                  <!-- Left: Icon Badge -->
                  <div class="kpi-icon-container emerald">
                    <i class="pi pi-sitemap"></i>
                  </div>
                  
                  <!-- Divider -->
                  <div class="kpi-divider emerald"></div>
                  
                  <!-- Right: Main Content -->
                  <div class="kpi-main-content">
                    <div class="kpi-val-row">
                      <span class="kpi-main-value emerald">
                        {{ formatNumber(totalSubGroups) }}
                      </span>
                    </div>
                    <span class="kpi-label">Sous-Groupes</span>
                  </div>
                </div>
              </div>

              <!-- 4ème KPI : Nombre total de Marque -->
              <div class="kpi-card kpi-purple-theme" title="Nombre total de marques">
                <div class="kpi-card-inner">
                  <!-- Left: Icon Badge -->
                  <div class="kpi-icon-container purple">
                    <i class="pi pi-tag"></i>
                  </div>
                  
                  <!-- Divider -->
                  <div class="kpi-divider purple"></div>
                  
                  <!-- Right: Main Content -->
                  <div class="kpi-main-content">
                    <div class="kpi-val-row">
                      <span class="kpi-main-value purple">
                        {{ formatNumber(totalBrands) }}
                      </span>
                    </div>
                    <span class="kpi-label">Marques</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Section Filtres Avancés (Expand/Collapse) -->
        <div class="advanced-filters-panel" :class="{ 'expanded': isFiltersVisible }">
          <div class="filter-row">
            <div class="filter-group">
              <label class="filter-label">Marque</label>
              <Select
                v-model="selectedBrand"
                :options="brands"
                optionLabel="displayName"
                optionValue="label"
                filter
                autoFilterFocus
                showClear
                placeholder="Toutes les marques"
                class="filter-select"
                panelClass="b2b-client-panel"
                @change="fetchData(1)"
              >
                <template #option="{ option }">
                  <div class="option-row">
                    <span class="option-code">{{ option.code }}</span>
                    <span class="option-sep">—</span>
                    <span class="option-name">{{ option.label }}</span>
                  </div>
                </template>
              </Select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Groupe</label>
              <Select
                v-model="selectedGroup"
                :options="groups"
                optionLabel="displayName"
                optionValue="code"
                filter
                autoFilterFocus
                showClear
                placeholder="Tous les groupes"
                class="filter-select"
                panelClass="b2b-client-panel"
                @change="onGroupChange"
              >
                <template #option="{ option }">
                  <div class="option-row">
                    <span class="option-code">{{ option.code }}</span>
                    <span class="option-sep">—</span>
                    <span class="option-name">{{ option.label }}</span>
                  </div>
                </template>
              </Select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Sous-Groupe</label>
              <Select
                v-model="selectedSubGroup"
                :options="filteredSubGroups"
                optionLabel="displayName"
                optionValue="code"
                filter
                autoFilterFocus
                showClear
                :disabled="!selectedGroup"
                placeholder="Tous les sous-groupes"
                class="filter-select"
                panelClass="b2b-client-panel"
                @change="fetchData(1)"
              >
                <template #option="{ option }">
                  <div class="option-row">
                    <span class="option-code">{{ option.code }}</span>
                    <span class="option-sep">—</span>
                    <span class="option-name">{{ option.label }}</span>
                  </div>
                </template>
              </Select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Référence Master</label>
              <input
                type="text"
                v-model="searchMaster"
                class="filter-input w-full"
                placeholder="Rechercher par master..."
                @input="onSearchInput"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <DataTable
          :value="syncData"
          :lazy="true"
          :paginator="true"
          :rows="pageSize"
          :totalRecords="totalRecords"
          :first="first"
          @page="onPage"
          :loading="loading"
          dataKey="id"
          class="p-datatable-sm custom-datatable"
          responsiveLayout="scroll"
          stripedRows
        >
          <Column field="oem" header="OEM" style="font-weight: 600; color: #1e293b; min-width: 120px;"></Column>
          <Column field="description" header="Description Structurée" style="min-width: 300px; color: #475569;"></Column>
          <Column field="master" header="Réf Origine" style="min-width: 160px;"></Column>
          <Column field="tdRef" header="Référence" style="min-width: 140px;"></Column>
          <Column field="tdBrandName" header="Marque" style="font-weight: 600;"></Column>
          <Column field="tdDescription" header="Description Tec Doc" style="min-width: 250px;"></Column>
          <Column header="Action" style="width: 130px; text-align: center;">
            <template #body="{ data }">
              <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <button class="add-am-btn" @click="openCreateArticleMaster(data)">
                  <i class="pi pi-plus"></i>
                  AM
                </button>
                <i class="pi pi-info-circle info-icon-btn" @click="showTecdocDetails(data)"></i>
              </div>
            </template>
          </Column>
          
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox text-4xl mb-3 text-gray-400"></i>
              <p>Aucune donnée de synchronisation trouvée.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </main>

    <TecDocArticleDialog 
      v-model:visible="isTecdocDialogVisible"
      :article-ref="selectedTecdocRef"
      :manufacturer-id="selectedTecdocBrandId"
      :description-structured="selectedTecdocDesc"
      :manufacturer-name="selectedTecdocBrandName"
    />

    <!-- Create Article Master Dialog -->
    <CreateArticleMasterDialog
      v-model:visible="showCreateArticleMasterDialog"
      :candidate="selectedArticleMasterCandidate"
      @success="fetchData(currentPage)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import Select from 'primevue/select'
import { getSyncAdaptableData, triggerSync, getSyncStatus } from '@/api/syncAdaptableService'
import { useToast } from 'primevue/usetoast'
import { useCompareQuoteStore } from '@/stores/compareQuote'
import TecDocArticleDialog from '@/components/TecDocArticleDialog.vue'
import CreateArticleMasterDialog from '@/components/CreateArticleMasterDialog.vue'

const syncData = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const pageSize = ref(20)
const first = ref(0)
const currentPage = ref(1)

// KPIs states
const totalArticles = ref(0)
const totalMasters = ref(0)
const totalGroups = ref(0)
const totalSubGroups = ref(0)
const totalBrands = ref(0)
const isFiltersVisible = ref(false)

// Filters states
const selectedBrand = ref(null)
const selectedGroup = ref(null)
const selectedSubGroup = ref(null)
const searchMaster = ref('')

const brands = ref([])
const groups = ref([])
const subGroups = ref([])

const filteredSubGroups = computed(() => {
  if (!selectedGroup.value) return []
  return subGroups.value.filter(sg => sg.parentCode === selectedGroup.value)
})

const onGroupChange = () => {
  selectedSubGroup.value = null
  fetchData(1)
}

let debounceTimeout = null
const onSearchInput = () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    fetchData(1)
  }, 300)
}

// Sync states
const syncing = ref(false)
let statusPollInterval = null

const store = useCompareQuoteStore()
const toast = useToast()

const triggerSyncData = async () => {
  try {
    await triggerSync()
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Synchronisation démarrée en arrière-plan.', life: 3000 })
    syncing.value = true
    startPollingStatus()
  } catch (error) {
    console.error('Error starting sync:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du démarrage de la synchronisation.', life: 3000 })
  }
}

const startPollingStatus = () => {
  clearInterval(statusPollInterval)
  statusPollInterval = setInterval(async () => {
    try {
      const res = await getSyncStatus()
      if (!res.isSyncing) {
        clearInterval(statusPollInterval)
        syncing.value = false
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Synchronisation terminée. Données à jour.', life: 4000 })
        fetchData(1)
      }
    } catch (error) {
      console.error('Error checking sync status:', error)
    }
  }, 3000)
}

// TecDoc Dialog details states
const isTecdocDialogVisible = ref(false)
const selectedTecdocRef = ref('')
const selectedTecdocBrandId = ref(null)
const selectedTecdocDesc = ref('')
const selectedTecdocBrandName = ref('')

const showTecdocDetails = (row) => {
  selectedTecdocRef.value = row.tdRef
  selectedTecdocBrandId.value = row.tdBrandId
  selectedTecdocDesc.value = row.description
  selectedTecdocBrandName.value = row.tdBrandName
  isTecdocDialogVisible.value = true
}

// Create Article Master Dialog states
const showCreateArticleMasterDialog = ref(false)
const selectedArticleMasterCandidate = ref(null)
const vendors = ref([])

const openCreateArticleMaster = async (row) => {
  if (vendors.value.length === 0) {
    try {
      const fetchedVendors = await store.fetchVendors()
      vendors.value = fetchedVendors.map(v => ({
        ...v,
        fullLabel: `${v.number} - ${v.displayName}`
      }))
    } catch (error) {
      console.error('Error loading vendors initial data:', error)
    }
  }

  let initialVendor = ''
  if (row.navFrs) {
    const foundVendor = vendors.value.find(v => v.number === row.navFrs)
    if (foundVendor) {
      initialVendor = foundVendor.number
    }
  }

  selectedArticleMasterCandidate.value = {
    masterItemNo: row.master || '',
    masterDescription: row.description || '',
    groupName: row.partGroupName || row.partGroup || '',
    subGroupName: row.partSubGroupName || row.partSubGroup || '',
    makeCode: row.partMakeCode || '',
    champsLibre: row.freeField || '',

    manufacturerName: row.tdBrandName || '',
    articleNumber: row.tdRef || '',
    bcReference: row.tdRef || '',
    vendorNo: initialVendor,
    groupCode: row.partGroup || '',
    subGroupCode: row.partSubGroup || '',
    manufacturerCode: row.tdBrandId || null,
  }

  showCreateArticleMasterDialog.value = true
}

const fetchData = async (page = 1) => {
  loading.value = true
  currentPage.value = page
  try {
    const data = await getSyncAdaptableData({
      page: page,
      pageSize: pageSize.value,
      tdBrandName: selectedBrand.value || undefined,
      partGroup: selectedGroup.value || undefined,
      partSubGroup: selectedSubGroup.value || undefined,
      master: searchMaster.value || undefined
    })
    
    syncData.value = data.list || []
    totalRecords.value = data.total || 0
    totalArticles.value = data.totalArticles || 0
    totalMasters.value = data.totalMasters || 0
    totalGroups.value = data.totalGroups || 0
    totalSubGroups.value = data.totalSubGroups || 0
    totalBrands.value = data.totalBrands || 0

    if (data.filterBrands) brands.value = data.filterBrands
    if (data.filterGroups) groups.value = data.filterGroups
    if (data.filterSubGroups) subGroups.value = data.filterSubGroups
  } catch (error) {
    console.error('Error fetching sync data:', error)
  } finally {
    loading.value = false
  }
}

const onPage = (event) => {
  first.value = event.first
  // PrimeVue paginator is 0-indexed for pages, API is 1-indexed
  const newPage = event.page + 1
  fetchData(newPage)
}

const formatNumber = (val) => {
  if (val === null || val === undefined) return '0'
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

onMounted(async () => {
  fetchData(1)
  try {
    const res = await getSyncStatus()
    if (res.isSyncing) {
      syncing.value = true
      startPollingStatus()
    }
  } catch (error) {
    console.error('Error checking sync status on mount:', error)
  }
})
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

.so-sync-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  border: 1px solid #2563eb;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.so-sync-btn:hover:not(:disabled) {
  background: #2563eb;
}

.so-sync-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Advanced Search Toggler */
.adv-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease-in-out;
  font-size: 1rem;
}

.adv-search-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-1px);
}

.adv-search-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Header KPIs styling matching B2BView */
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-kpis {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  gap: 0.75rem;
}

.kpi-card {
  min-width: 140px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.25rem 0.6rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
  min-height: 52px;
}

.kpi-card.kpi-blue-theme:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.kpi-card.kpi-amber-theme:hover {
  border-color: #fde047;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
}

.kpi-card.kpi-emerald-theme:hover {
  border-color: #6ee7b7;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
}

.kpi-card.kpi-teal-theme:hover {
  border-color: #5eead4;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08);
}

.kpi-card.kpi-purple-theme:hover {
  border-color: #d8b4fe;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.08);
}

.kpi-card-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
}

.kpi-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.kpi-card:hover .kpi-icon-container {
  transform: scale(1.05);
}

.kpi-icon-container.blue {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.kpi-icon-container.amber {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fef3c7;
}

.kpi-icon-container.emerald {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #dcfce7;
}

.kpi-icon-container.teal {
  background: #f0fdfa;
  color: #0d9488;
  border: 1px solid #ccfbf1;
}

.kpi-icon-container.purple {
  background: #faf5ff;
  color: #9333ea;
  border: 1px solid #f3e8ff;
}

.kpi-icon-container i {
  font-size: 0.85rem;
}

.kpi-divider {
  width: 2px;
  height: 24px;
  border-radius: 99px;
  flex-shrink: 0;
}

.kpi-divider.blue {
  background: linear-gradient(180deg, #3b82f6, #60a5fa);
}

.kpi-divider.amber {
  background: linear-gradient(180deg, #f59e0b, #fbbf24);
}

.kpi-divider.emerald {
  background: linear-gradient(180deg, #10b981, #34d399);
}

.kpi-divider.teal {
  background: linear-gradient(180deg, #0d9488, #2dd4bf);
}

.kpi-divider.purple {
  background: linear-gradient(180deg, #a855f7, #c084fc);
}

.kpi-main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.18rem;
  min-width: 0;
}

.kpi-val-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.kpi-main-value {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

.kpi-main-value.blue { color: #1e3a8a; }
.kpi-main-value.amber { color: #78350f; }
.kpi-main-value.emerald { color: #064e3b; }
.kpi-main-value.teal { color: #115e59; }
.kpi-main-value.purple { color: #581c87; }

.kpi-label {
  font-size: 0.55rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

/* Advanced Filters Panel matching B2BView */
.advanced-filters-panel {
  border-top: none;
  background: #f8fafc;
  padding: 0 1.5rem;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s ease-in-out,
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.advanced-filters-panel.expanded {
  border-top: 1px solid #f1f5f9;
  padding: 1.25rem 1.5rem;
  max-height: 250px;
  opacity: 1;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.filter-select {
  width: 100% !important;
}

.filter-input {
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 8px !important;
  height: 40px !important;
  padding: 0 0.85rem !important;
  font-size: 0.875rem !important;
  color: #1e293b !important;
  background: #ffffff !important;
  outline: none !important;
  box-sizing: border-box;
  transition: all 0.2s ease !important;
}

.filter-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.advanced-filters-panel :deep(.p-select) {
  width: 100% !important;
  height: 40px !important;
  background: white !important;
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  transition: border-color 0.2s, box-shadow 0.2s !important;
  cursor: pointer !important;
}

.advanced-filters-panel :deep(.p-select:hover) {
  border-color: #cbd5e1 !important;
}

.advanced-filters-panel :deep(.p-select.p-focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
  outline: none !important;
}

.advanced-filters-panel :deep(.p-select-label) {
  padding: 0 0.75rem 0 2.25rem !important;
  font-size: 0.875rem !important;
  color: #1e293b !important;
  font-weight: 500 !important;
  flex: 1 !important;
  min-width: 0 !important;
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
  overflow: hidden !important;
}

.advanced-filters-panel :deep(.p-select-label.p-placeholder),
.advanced-filters-panel :deep(.p-select-placeholder) {
  color: #94a3b8 !important;
  font-size: 0.875rem !important;
}

.advanced-filters-panel :deep(.p-select-dropdown) {
  width: 2rem !important;
  color: #94a3b8 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

/* Option custom design identical to B2BView */
.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  overflow: hidden;
}

.option-code {
  font-size: 0.72rem;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  border-radius: 4px;
  padding: 0.1rem 0.45rem;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.04em;
  font-family: 'Courier New', monospace;
}

.option-sep {
  color: #d1d5db;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.option-name {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.p-select-option) {
  padding: 0 !important;
  border-radius: 7px !important;
  background: transparent !important;
  cursor: pointer !important;
  transition: background 0.13s !important;
  margin-bottom: 1px !important;
}

:deep(.p-select-option .option-row) {
  padding: 0.6rem 0.75rem !important;
  border-radius: 7px !important;
  transition: background 0.13s !important;
}

:deep(.p-select-option:not(.p-select-option-selected):hover .option-row) {
  background: #f0f7ff !important;
}

:deep(.p-select-option:not(.p-select-option-selected):hover .option-name) {
  color: #1e293b !important;
}

:deep(.p-select-option.p-select-option-selected .option-row) {
  background: #eff6ff !important;
}

:deep(.p-select-option.p-select-option-selected .option-code) {
  background: #dbeafe !important;
  color: #1d4ed8 !important;
}

:deep(.p-select-option.p-select-option-selected .option-name) {
  color: #1e40af !important;
  font-weight: 600 !important;
}

:deep(.p-select-option.p-select-option-selected .option-sep) {
  color: #93c5fd !important;
}

.add-am-btn {
  background-color: #ffffff;
  color: #3b82f6;
  border: 1.5px solid #3b82f6;
  border-radius: 8px;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.add-am-btn:hover {
  background-color: #eff6ff;
}

.info-icon-btn {
  color: #3b82f6;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.info-icon-btn:hover {
  color: #2563eb;
  transform: scale(1.05);
}

.table-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

.custom-datatable {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.text-gray-400 {
  color: #94a3b8;
}

.text-4xl {
  font-size: 2.25rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}
</style>
