<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- ─── HEADER BAR ──────────────────────────────────────────────── -->
      <div class="header-bar mb-5" :class="{ 'expanded': isFiltersVisible }">
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
                panelClass="c2-dropdown-panel"
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
                panelClass="c2-dropdown-panel"
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
                panelClass="c2-dropdown-panel"
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

            <div class="filter-actions">
              <button class="filter-reset-btn" :disabled="!hasActiveFilters" @click="resetFilters" type="button"
                title="Réinitialiser les filtres">
                <i class="pi pi-filter-slash"></i>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <DataTable
          :value="syncData"
          scrollable
          scrollHeight="flex"
          :lazy="true"
          :paginator="false"
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

      <!-- Footer de page (charte C2, §8.5/§8.9) — libellé + pagination (style /comparateur) -->
      <footer class="sync-footer">
        <span class="sync-footer-label">Synchronisation Adaptable</span>
        <div class="cmp-pagination">
          <Button icon="pi pi-angle-double-left" text rounded size="small"
            :disabled="currentPage <= 1" @click="goToPage(1)" />
          <Button icon="pi pi-angle-left" text rounded size="small"
            :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)" />
          <span class="cmp-page-box">{{ currentPage }}</span>
          <Button icon="pi pi-angle-right" text rounded size="small"
            :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)" />
          <Button icon="pi pi-angle-double-right" text rounded size="small"
            :disabled="currentPage >= totalPages" @click="goToPage(totalPages)" />
          <Select v-model="pageSize" :options="[10, 20, 50, 100]"
            class="rows-dropdown-sm" panelClass="c2-dropdown-panel" @change="onPageSizeChange" />
        </div>
      </footer>
    </main>

    <!-- Dialog Info Article TecDoc — composant PARTAGÉ unique (charte §15) -->
    <TecDocArticleInfoDialog
      v-model:visible="showInfoDialog"
      :item="selectedInfoItem"
      :loading="selectedInfoItem?.isLoading"
      :is-master="false"
      @load-vehicle-models="fetchVehiclesForBrand"
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
import Button from 'primevue/button'
import { getSyncAdaptableData, triggerSync, getSyncStatus } from '@/api/syncAdaptableService'
import { useToast } from 'primevue/usetoast'
import { useCompareQuoteStore } from '@/stores/compareQuote'
import TecDocArticleInfoDialog from '@/components/tecdoc/TecDocArticleInfoDialog.vue'
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

// Réinitialiser les filtres (marque / groupe / sous-groupe / réf master) puis recharger
const hasActiveFilters = computed(() =>
  !!selectedBrand.value || !!selectedGroup.value || !!selectedSubGroup.value || !!(searchMaster.value && searchMaster.value.trim())
)
const resetFilters = () => {
  selectedBrand.value = null
  selectedGroup.value = null
  selectedSubGroup.value = null
  searchMaster.value = ''
  fetchData(1)
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

// Dialog Info Article — composant PARTAGÉ (charte §15) : le PARENT récupère les
// données TecDoc et les passe via `item` ; le dialog est purement présentationnel.
const showInfoDialog = ref(false)
const selectedInfoItem = ref(null)

const formatConstructionDate = (dateNum) => {
  if (!dateNum) return '...'
  const str = dateNum.toString()
  if (str.length !== 6) return str
  return `${str.substring(4, 6)}.${str.substring(0, 4)}`
}

const showTecdocDetails = async (row) => {
  showInfoDialog.value = true
  // État initial (chargement) — formes de champs lues par le dialog partagé
  selectedInfoItem.value = {
    no: row.tdRef,
    articleNumber: row.tdRef,
    descriptionStructured: row.description,
    description: row.description,
    brand: row.tdBrandName || '',
    isLoading: true,
    brandLogo: '', thumbnails: [], images360: [], specs: [],
    oemNumbers: [], vehicles: [], pdfs: [], articleParts: [], gtins: []
  }
  try {
    const articleRef = row.tdRef
    const manufacturerId = row.tdBrandId
    if (!articleRef || !manufacturerId) { selectedInfoItem.value.isLoading = false; return }

    const response = await store.fetchTecdocArticleDetails(articleRef, manufacturerId)
    if (response && response.articles && response.articles.length > 0) {
      const article = response.articles[0]
      const thumbnails = [], images360 = []
      ;(article.images || []).forEach(img => {
        if (img.fileName && img.fileName.toUpperCase().endsWith('.ZIP')) images360.push(img.imageURL800)
        else thumbnails.push(img.imageURL800)
      })
      const specs = article.articleCriteria?.map(c => ({ label: c.criteriaDescription, value: c.formattedValue })) || []
      const oemNumbers = article.oemNumbers?.map(o => ({ mfrName: o.mfrName, articleNumber: o.articleNumber })) || []
      selectedInfoItem.value = {
        ...selectedInfoItem.value,
        articleId: article.genericArticles?.[0]?.legacyArticleId,
        isLoading: false,
        brand: article.mfrName || row.tdBrandName || '',
        brandLogo: article.supplierLogoUrl || '/images/articles/febi_logo.png',
        thumbnails,
        images360,
        mainImage: thumbnails[0] || '',
        specs,
        oemNumbers,
        pdfs: article.pdfs || [],
        genericDescription: article.genericArticles?.[0]?.genericArticleDescription || row.description,
        vehicles: article.linkedVehicles?.map(v => ({ brand: v.manuName, id: v.manuId, models: [] })) || [],
        gtins: article.gtins || [],
        articleParts: article.articleParts || []
      }
    } else {
      selectedInfoItem.value.isLoading = false
    }
  } catch (error) {
    console.error('Erreur récupération détails TecDoc:', error)
    selectedInfoItem.value.isLoading = false
  }
}

// load-vehicle-models : le parent garde l'appel API véhicules (charte §15)
const fetchVehiclesForBrand = async (brandGroup) => {
  if (!selectedInfoItem.value?.articleId || !brandGroup.id) return
  brandGroup.isLoading = true
  try {
    const vehicles = await store.fetchArticleVehicles(selectedInfoItem.value.articleId, brandGroup.id)
    const groupedModels = {}
    vehicles.forEach(v => {
      if (!groupedModels[v.modelDesc]) {
        groupedModels[v.modelDesc] = {
          manuDesc: v.manuDesc, modelDesc: v.modelDesc,
          minYear: v.yearOfConstructionFrom, maxYear: v.yearOfConstructionTo,
          minHp: v.powerHpFrom, maxHp: v.powerHpFrom, count: 0
        }
      }
      const group = groupedModels[v.modelDesc]
      group.count++
      if (v.yearOfConstructionFrom < group.minYear) group.minYear = v.yearOfConstructionFrom
      if (v.yearOfConstructionTo > group.maxYear) group.maxYear = v.yearOfConstructionTo
      if (v.powerHpFrom < group.minHp) group.minHp = v.powerHpFrom
      if (v.powerHpFrom > group.maxHp) group.maxHp = v.powerHpFrom
    })
    brandGroup.models = Object.values(groupedModels).map(g => {
      const minDate = formatConstructionDate(g.minYear)
      const maxDate = g.maxYear ? formatConstructionDate(g.maxYear) : '...'
      return `${g.manuDesc} ${g.modelDesc} ( ${minDate} - ${maxDate} , ${g.minHp} - ${g.maxHp} CH)`
    })
  } catch (error) {
    console.error('Erreur récupération véhicules:', error)
  } finally {
    brandGroup.isLoading = false
  }
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

// Pagination déplacée dans le footer (style /comparateur). currentPage = 1-indexé.
const totalPages = computed(() => Math.max(1, Math.ceil((totalRecords.value || 0) / (pageSize.value || 1))))
const goToPage = (p) => {
  const target = Math.min(Math.max(1, p), totalPages.value)
  if (target !== currentPage.value) fetchData(target)
}
const onPageSizeChange = () => { fetchData(1) }

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

/* Shell charte C2 (§12, réf. B2B) : flex column plein viewport → header (grandit avec
   les filtres) + corps (flex:1, scroll interne table) + footer 48px toujours visible. */
.main-content {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--c2-page-pad) var(--c2-page-pad);
  --sync-footer-h: 48px;
}

.header-bar {
  flex-shrink: 0;
  position: sticky;
  top: var(--c2-head-sticky-top);
  z-index: var(--c2-head-z);
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius);
  box-shadow: var(--c2-head-shadow);
  height: var(--c2-head-h);
  box-sizing: border-box;
  margin-bottom: var(--c2-head-gap);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Filtres ouverts : le header grandit pour révéler .advanced-filters-panel (fix régression) */
.header-bar.expanded {
  height: auto;
  overflow: hidden;   /* clippe les coins du panneau filtres aux angles arrondis du header */
}
.header-bar.expanded .header-main-row {
  height: var(--c2-head-h);
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 1.5rem;
  height: 100%;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-left h1 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--c2-head-title);
  margin: 0;
  white-space: nowrap;
}

/* Même style que le bouton « Actualiser » de Search Opportunities (.so-refresh-btn) :
   bouton blanc neutre, bordure grise, texte slate, accent Cobalt au survol. */
.so-sync-btn {
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

.so-sync-btn:hover:not(:disabled) {
  border-color: var(--c2-primary);
  color: var(--c2-primary);
  box-shadow: 0 2px 8px rgba(24, 89, 179, 0.10);
}

.so-sync-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }

.so-sync-btn:disabled {
  opacity: 0.5;
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
  width: 250px;            /* largeur KPI uniforme (= Search Opportunities) */
  flex: 0 0 250px;
  box-sizing: border-box;
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
  /* Hauteur RÉELLE animée via grid-rows 0fr→1fr : fluide et exact (pas d'overshoot de max-height) */
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  overflow: hidden;
  transition: grid-template-rows 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.16s ease;
}
.advanced-filters-panel > * { overflow: hidden; min-height: 0; }

.advanced-filters-panel.expanded {
  border-top: 1px solid #f1f5f9;
  padding: 1.25rem 1.5rem;
  grid-template-rows: 1fr;
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

/* Bouton Réinitialiser — secondaire neutre (charte §10.2), aligné avec les champs (40px) */
.filter-actions { flex: 0 0 auto; display: flex; align-items: flex-end; }
.filter-reset-btn {
  display: inline-flex; align-items: center; gap: 0.45rem;
  height: 40px; padding: 0 1.1rem; box-sizing: border-box;
  background: #ffffff; border: 1.5px solid #e2e8f0; color: #475569;
  border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all 0.15s;
}
.filter-reset-btn .pi { font-size: 0.85rem; }
.filter-reset-btn:hover:not(:disabled) { border-color: var(--c2-primary); color: var(--c2-primary); background: #f8fafc; }
.filter-reset-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.filter-reset-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
  font-family: var(--c2-font-mono);
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

/* Bouton secondaire « +AM » — charte §10.2 : outline Cobalt (tokens) → rempli au survol */
.add-am-btn {
  background-color: #ffffff;
  color: var(--c2-primary);
  border: 1px solid var(--c2-primary);
  border-radius: 8px;
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.add-am-btn .pi { font-size: 0.78rem; }
.add-am-btn:hover {
  background-color: var(--c2-primary);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(24, 89, 179, 0.25);
}
.add-am-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }

/* Icône d'action « i » — charte §12.5 : icône-bouton gris au repos, Cobalt + fond doux au survol */
.info-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  background: transparent;
  transition: background 0.15s ease, color 0.15s ease;
}
.info-icon-btn:hover {
  background: #f5f9ff;
  color: var(--c2-primary);
}

/* Corps = espace restant entre header (variable) et footer ; la table scrolle EN INTERNE. */
.table-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.custom-datatable {
  flex: 1;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

/* Footer de page standard C2 (§8/§8.9) — navy 48px, aligné avec le footer sidebar, discret. */
.sync-footer {
  flex-shrink: 0;
  height: var(--sync-footer-h);
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
.sync-footer-label { color: #e2e8f0; font-size: .82rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }

/* Pagination dans le footer — style identique à /comparateur & Confirmation Achat (§8.5) */
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

<!-- Panneau déroulant du select "lignes par page" — NON scoped (PrimeVue téléporte
     l'overlay dans <body>, hors sous-arbre scoped). Ciblé via panelClass="rows-dropdown-panel"
     → identique à la pagination du Comparateur. N'affecte aucun autre select. -->
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
