<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- Header -->
      <div class="header-bar mb-5">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Portail Partslink24</h1>
            <span class="header-subtitle">Sélection de catalogue, recherche de VIN et consultation de pièces</span>
          </div>
          <div class="header-right">
            <div 
              class="status-indicator" 
              :class="sessionActive ? 'status-indicator--active' : 'status-indicator--inactive'"
              :title="sessionActive ? 'Session Partslink24 Active' : 'Session Partslink24 Inactive'"
            >
              <span class="status-dot"></span>
              <span class="status-text">{{ sessionActive ? 'Session Connectée' : 'Session Déconnectée' }}</span>
            </div>
            <button class="action-btn" @click="resetToBrands" :disabled="loading">
              <i class="pi pi-home"></i> Accueil
            </button>
          </div>
        </div>
      </div>

      <!-- STEP 1: Selection de la marque -->
      <div v-if="step === 'brands'" class="content-container animate-fade-in">
        <div class="search-filter-row mb-4">
          <div class="filter-input-wrap">
            <i class="pi pi-search search-icon"></i>
            <input 
              v-model="brandSearch" 
              type="text" 
              placeholder="Filtrer les marques (ex: BMW, Audi...)"
              class="filter-input"
            />
          </div>
          <button class="refresh-btn" @click="fetchBrands" :disabled="loading">
            <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
            Actualiser
          </button>
        </div>

        <div v-if="loading && brands.length === 0" class="spinner-container">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p class="mt-2 text-gray-500">Chargement des marques depuis Partslink...</p>
        </div>

        <div v-else class="brands-grid">
          <div 
            v-for="brand in filteredBrands" 
            :key="brand.id" 
            class="brand-card"
            @click="selectBrand(brand)"
          >
            <div class="brand-logo-wrap">
              <img :src="getAbsoluteUrl(brand.logo)" :alt="brand.name" class="brand-logo-img" />
            </div>
            <div class="brand-name">{{ brand.name }}</div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Saisie du VIN -->
      <div v-if="step === 'vin-search'" class="content-container animate-fade-in">
        <div class="back-link mb-4" @click="step = 'brands'">
          <i class="pi pi-arrow-left"></i> Retour aux marques
        </div>

        <div class="vin-search-card">
          <div class="vin-card-header mb-4">
            <img :src="getAbsoluteUrl(selectedBrand.logo)" :alt="selectedBrand.name" class="selected-brand-logo" />
            <h2>Recherche de VIN - {{ selectedBrand.name }}</h2>
          </div>
          
          <div class="vin-form-group">
            <label for="vin-input">Saisissez le numéro de châssis (VIN) du véhicule :</label>
            <div class="vin-input-wrapper">
              <input 
                id="vin-input" 
                v-model="vin" 
                type="text" 
                placeholder="Ex : WBA1T91090J883134" 
                class="vin-input"
                @keyup.enter="handleVinSearch"
              />
              <button class="search-btn" @click="handleVinSearch" :disabled="loading || !vin || !sessionActive">
                <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-search'"></i> Rechercher
              </button>
            </div>
          </div>
          
          <div v-if="loading" class="spinner-container mt-4">
            <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
            <p class="mt-2 text-gray-500">Recherche et authentification en arrière-plan sur Partslink24...</p>
          </div>
        </div>
      </div>

      <!-- STEP 3: Fiche Véhicule & Groupes -->
      <div v-if="step === 'catalog'" class="content-container animate-fade-in">
        <div class="back-link mb-4" @click="step = 'vin-search'">
          <i class="pi pi-arrow-left"></i> Retour à la saisie du VIN
        </div>

        <div class="catalog-layout">
          <!-- Left Column: Vehicle Details -->
          <div class="vehicle-sidebar">
            <div class="vehicle-card mb-4">
              <div class="vehicle-card-header">
                <img :src="getAbsoluteUrl(selectedBrand.logo)" :alt="selectedBrand.name" class="small-brand-logo" />
                <h3>{{ vehicle['Désignation de modèle'] || 'Véhicule Identifié' }}</h3>
              </div>
              <div class="vehicle-info-list">
                <div v-for="(val, label) in vehicle" :key="label" class="info-row">
                  <span class="info-label">{{ label }}</span>
                  <span class="info-value font-bold">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- Main Groups List -->
            <div class="groups-card">
              <h3>Groupes Principaux</h3>
              <div class="groups-list">
                <div 
                  v-for="group in groups" 
                  :key="group.code" 
                  class="group-item-row"
                  :class="{ 'group-item-row--active': selectedGroup && selectedGroup.code === group.code }"
                  @click="selectGroup(group)"
                >
                  <span class="group-code">{{ group.code }}</span>
                  <span class="group-name">{{ group.name }}</span>
                  <i class="pi pi-chevron-right arrow-icon"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Subgroups & Parts -->
          <div class="details-pane">

            <!-- Loading group subgroups -->
            <div v-if="loadingGroup" class="spinner-container flex-grow">
              <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
              <p class="mt-2 text-gray-500">Chargement des sous-groupes...</p>
            </div>

            <!-- No group selected -->
            <div v-else-if="!selectedGroup" class="empty-detail-state flex-grow">
              <i class="pi pi-compass text-5xl mb-3 text-gray-300"></i>
              <p>Sélectionnez un groupe principal à gauche pour afficher les sous-groupes.</p>
            </div>

            <!-- Subgroups list (before subgroup selected) -->
            <div v-else-if="subgroups.length > 0 && !selectedSubgroup" class="group-details-content animate-fade-in">
              <div class="details-header mb-4">
                <h2><i class="pi pi-th-large mr-2"></i>{{ selectedGroup.code }} - {{ selectedGroup.name }}</h2>
                <span class="subheader-hint">Sélectionnez un sous-groupe pour voir les pièces</span>
              </div>
              <div class="subgroups-grid">
                <div
                  v-for="sg in subgroups"
                  :key="sg.code"
                  class="subgroup-card"
                  @click="selectSubgroup(sg)"
                >
                  <span class="sg-code">{{ sg.code }}</span>
                  <span class="sg-name">{{ sg.designation || sg.name }}</span>
                  <i class="pi pi-chevron-right sg-arrow"></i>
                </div>
              </div>
            </div>

            <!-- Parts BOM view -->
            <div v-else-if="selectedGroup" class="group-details-content animate-fade-in">
              <!-- Breadcrumb -->
              <div class="details-breadcrumb mb-3">
                <span class="bc-link" @click="selectedSubgroup = null; parts = []; diagrams = []" v-if="selectedSubgroup">
                  <i class="pi pi-arrow-left mr-1"></i>{{ selectedGroup.code }} - {{ selectedGroup.name }}
                </span>
                <span v-if="selectedSubgroup" class="bc-sep">›</span>
                <span class="bc-current">{{ selectedSubgroup?.designation || selectedSubgroup?.name || selectedGroup.name }}</span>
              </div>

              <!-- Loading parts -->
              <div v-if="loadingParts" class="spinner-container">
                <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
                <p class="mt-2 text-gray-500">Chargement des pièces...</p>
              </div>

              <template v-else>
                <!-- Diagram/Illustration -->
                <div v-if="diagrams.length > 0" class="diagrams-gallery mb-4">
                  <div v-for="(diag, idx) in diagrams" :key="idx" class="diagram-wrap">
                    <img :src="getAbsoluteUrl(diag)" alt="Schéma technique" class="diagram-img" />
                  </div>
                </div>

                <!-- Parts Table -->
                <div class="parts-table-wrap">
                  <table class="parts-table">
                    <thead>
                      <tr>
                        <th style="width:10%">Pos.</th>
                        <th style="width:25%">Réf. Pièce</th>
                        <th style="width:45%">Désignation</th>
                        <th style="width:10%">Qté</th>
                        <th style="width:10%">Remarque</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(part, idx) in parts" :key="idx" class="parts-table-row">
                        <td class="text-gray-500">{{ part.pos || idx + 1 }}</td>
                        <td class="font-bold text-primary ref-cell">{{ part.partNumber || part.code || '-' }}</td>
                        <td>{{ part.designation || part.description || '-' }}</td>
                        <td class="text-center">{{ part.quantity || part.qty || '-' }}</td>
                        <td class="text-gray-400 text-sm">{{ part.remark || '-' }}</td>
                      </tr>
                      <tr v-if="parts.length === 0 && !loadingParts">
                        <td colspan="5" class="text-center text-gray-400 py-6">
                          <i class="pi pi-info-circle mr-2"></i>
                          Aucune pièce trouvée pour ce sous-groupe.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import * as partslinkService from '@/api/partslinkService'

const step = ref('brands') // 'brands', 'vin-search', 'catalog'
const loading = ref(false)
const loadingGroup = ref(false)
const sessionActive = ref(false)

// State
const brands = ref([])
const brandSearch = ref('')
const selectedBrand = ref(null)
const vin = ref('')

const vehicle = ref({})
const groups = ref([])
const selectedGroup = ref(null)
const subgroups = ref([])
const selectedSubgroup = ref(null)

const parts = ref([])
const diagrams = ref([])
const loadingParts = ref(false)

// Computed
const filteredBrands = computed(() => {
  if (!brandSearch.value) return brands.value
  const query = brandSearch.value.toLowerCase()
  return brands.value.filter(b => b.name.toLowerCase().includes(query))
})

// Methods
const getAbsoluteUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `https://www.partslink24.com${path}`
}

const fetchBrands = async () => {
  loading.value = true
  try {
    const response = await partslinkService.getBrands()
    brands.value = response.data || []
  } catch (error) {
    console.error('Error fetching Partslink brands:', error)
  } finally {
    loading.value = false
  }
}

const selectBrand = (brand) => {
  selectedBrand.value = brand
  step.value = 'vin-search'
}

const handleVinSearch = async () => {
  if (!vin.value) return
  await checkSessionStatus()
  if (!sessionActive.value) {
    alert('Session Partslink24 non active. Veuillez patienter quelques secondes puis rÃ©essayer.')
    return
  }
  loading.value = true
  try {
    const response = await partslinkService.searchVin(selectedBrand.value.id, vin.value)
    if (response.data && !response.data.error) {
      vehicle.value = response.data.vehicle || {}
      groups.value = response.data.groups || []
      selectedGroup.value = null
      parts.value = []
      diagrams.value = []
      step.value = 'catalog'
    } else {
      alert('Erreur lors de la recherche du VIN : ' + (response.data?.error || 'Inconnu'))
    }
  } catch (error) {
    console.error('Error searching VIN:', error)
    alert('Erreur technique lors de la recherche du VIN.')
  } finally {
    loading.value = false
  }
}

const selectGroup = async (group) => {
  selectedGroup.value = group
  selectedSubgroup.value = null
  parts.value = []
  diagrams.value = []
  subgroups.value = []
  loadingGroup.value = true
  try {
    const response = await partslinkService.getGroupDetails(
      selectedBrand.value.id,
      vin.value,
      group.code
    )
    // New API returns subgroups
    subgroups.value = response.data?.subgroups || response.data?.parts || []
    // Backward compat: if old API returned parts directly
    if (!response.data?.subgroups && response.data?.parts?.length) {
      parts.value = response.data.parts
      diagrams.value = response.data.diagrams || []
    }
  } catch (error) {
    console.error('Error loading group details:', error)
  } finally {
    loadingGroup.value = false
  }
}

const selectSubgroup = async (subgroup) => {
  selectedSubgroup.value = subgroup
  loadingParts.value = true
  parts.value = []
  diagrams.value = []
  try {
    const response = await partslinkService.getSubgroupParts(
      selectedBrand.value.id,
      vin.value,
      selectedGroup.value.code,
      subgroup.code
    )
    parts.value = response.data?.parts || []
    diagrams.value = response.data?.diagrams || []
  } catch (error) {
    console.error('Error loading subgroup parts:', error)
  } finally {
    loadingParts.value = false
  }
}

const resetToBrands = () => {
  step.value = 'brands'
  selectedBrand.value = null
  vin.value = ''
  vehicle.value = {}
  groups.value = []
  selectedGroup.value = null
  subgroups.value = []
  selectedSubgroup.value = null
  parts.value = []
  diagrams.value = []
}

const checkSessionStatus = async () => {
  try {
    const response = await partslinkService.getSessionStatus()
    sessionActive.value = response.data?.active === true
  } catch (error) {
    console.error('Error checking Partslink session status:', error)
    sessionActive.value = false
  }
  return sessionActive.value
}

let statusInterval = null

onMounted(() => {
  fetchBrands()
  checkSessionStatus()
  statusInterval = setInterval(checkSessionStatus, 10000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
/* Page Layout */
.page-layout {
  min-height: 100vh;
  background-color: #f1f5f9;
}

.main-content {
  width: 100%;
  padding: 0.5rem 2rem 3rem;
}

/* Header */
.header-bar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
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
  flex-direction: column;
  gap: 0.25rem;
}

.header-left h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
}

.header-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.status-indicator--active {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.status-indicator--inactive {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: relative;
  display: inline-block;
}

.status-indicator--active .status-dot {
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.status-indicator--inactive .status-dot {
  background-color: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #2563eb;
}

/* Search Filters & Buttons */
.search-filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.filter-input-wrap {
  position: relative;
  flex-grow: 1;
  max-width: 400px;
}

.filter-input {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.filter-input:focus {
  border-color: #3b82f6;
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #1e293b;
  border-color: #94a3b8;
}

/* Brands Grid */
.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1.25rem;
}

.brand-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1.5px solid transparent;
}

.brand-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.brand-logo-wrap {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.brand-logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.brand-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  text-align: center;
}

/* Back Link */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #3b82f6;
}

/* VIN Search Card */
.vin-search-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  padding: 2rem;
  max-width: 600px;
  margin: 2rem auto;
}

.vin-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
}

.selected-brand-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.vin-card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.vin-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vin-form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.vin-input-wrapper {
  display: flex;
  gap: 0.75rem;
}

.vin-input {
  flex-grow: 1;
  padding: 0.75rem 1rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  font-family: monospace;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s ease;
}

.vin-input:focus {
  border-color: #3b82f6;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: #2563eb;
}

.search-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* Spinner & Loading */
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

/* Catalog View Layout */
.catalog-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* Sidebar Vehicle Card */
.vehicle-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.vehicle-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.small-brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.vehicle-card-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.vehicle-info-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  border-bottom: 1px dashed #f1f5f9;
  padding-bottom: 0.4rem;
}

.info-label {
  color: #64748b;
}

.info-value {
  color: #334155;
  text-align: right;
}

/* Groups Card */
.groups-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.groups-card h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.5rem;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 480px;
  overflow-y: auto;
}

.group-item-row {
  display: flex;
  align-items: center;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.group-item-row:hover {
  background: #f8fafc;
  color: #3b82f6;
}

.group-item-row--active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 600;
}

.group-code {
  font-weight: 700;
  min-width: 32px;
  color: #64748b;
}

.group-item-row--active .group-code {
  color: #3b82f6;
}

.group-name {
  flex-grow: 1;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  font-size: 0.75rem;
  color: #cbd5e1;
}

/* Details Pane */
.details-pane {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.empty-detail-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  padding: 4rem 1rem;
}

.group-details-content h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 0;
}

/* Diagrams */
.diagrams-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.diagram-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  background: #f8fafc;
  max-width: 100%;
}

.diagram-img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* Parts Table */
.parts-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.parts-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.parts-table th,
.parts-table td {
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.82rem;
}

.parts-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
  position: sticky;
  top: 0;
}

.parts-table-row:hover {
  background-color: #f0f9ff;
}

.parts-table tr:last-child td {
  border-bottom: none;
}

.ref-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #2563eb;
  letter-spacing: 0.5px;
}

/* Subgroups Grid */
.subgroups-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subgroup-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subgroup-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateX(4px);
}

.sg-code {
  font-weight: 700;
  font-size: 0.8rem;
  color: #64748b;
  min-width: 50px;
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  text-align: center;
}

.sg-name {
  flex-grow: 1;
  font-size: 0.875rem;
  color: #1e293b;
}

.sg-arrow {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Breadcrumb */
.details-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #475569;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.bc-link {
  cursor: pointer;
  color: #3b82f6;
  font-weight: 600;
  transition: color 0.2s;
}

.bc-link:hover { color: #1d4ed8; }

.bc-sep {
  color: #cbd5e1;
  font-size: 1.1rem;
}

.bc-current {
  color: #1e293b;
  font-weight: 600;
}

.subheader-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 400;
  display: block;
  margin-top: 0.25rem;
}

.details-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }
}
</style>
