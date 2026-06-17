<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- Search Bar & Header -->
      <header class="viewer-header-bar">
        <div class="title-section">
          <h1>Catalogue Pièces</h1>
        </div>

        <div class="header-controls">
          <!-- Disponibilité du catalogue (pool de sessions isolées, auto-géré) -->
          <div class="session-status-container">
            <span v-if="checkingSession" class="checking-text">
              <i class="pi pi-spin pi-spinner mr-1"></i> Vérification...
            </span>
            <span v-else-if="sessionState && sessionState.active" class="badge badge-success cursor-pointer" @click="checkSession" title="Cliquez pour rafraîchir">
              <i class="pi pi-circle-fill status-dot mr-1 text-xs"></i> Catalogue prêt
            </span>
            <span v-else class="badge badge-danger">
              <i class="pi pi-circle-fill status-dot mr-1 text-xs"></i> Catalogue indisponible
            </span>
          </div>

          <Button 
            v-if="selectedBrand && !loading"
            label="Changer de marque" 
            icon="pi pi-arrow-left" 
            class="p-button-text p-button-sm mr-2" 
            @click="resetBrand" 
          />

          <div v-if="selectedBrand" class="search-form">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="vinInput"
                placeholder="Saisir un VIN..."
                class="vin-search-input"
                maxLength="17"
                :disabled="loading || !isSessionActive"
                @keyup.enter="handleVinSearch"
              />
            </IconField>
            <Button
              label="Rechercher"
              icon="pi pi-search"
              class="p-button-primary search-btn"
              :loading="loading"
              :disabled="vinInput.trim().length !== 17 || loading || !isSessionActive"
              @click="handleVinSearch"
            />
          </div>
        </div>
      </header>

      <!-- Loading / File d'attente -->
      <section v-if="loading" class="loading-panel card">
        <i class="pi pi-spin pi-spinner spinner-icon"></i>
        <h2 v-if="jobStatus === 'QUEUED'">En file d'attente…</h2>
        <h2 v-else>Identification du véhicule en cours…</h2>
        <span v-if="jobStatus === 'QUEUED' && queuePosition > 0" class="badge-queue">
          <i class="pi pi-clock mr-1 text-xs"></i> Position {{ queuePosition }} dans la file
        </span>
        <p class="loading-sub">
          {{ currentStep || "Connexion à la session sécurisée Partslink et extraction des données..." }}
        </p>
        <div class="loading-progress-bar">
          <div class="progress-fill"></div>
        </div>
        <Button
          label="Annuler"
          icon="pi pi-times"
          class="p-button-outlined p-button-sm mt-3 cancel-search-btn"
          @click="handleCancelSearch"
        />
      </section>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="error-panel card">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <h3>Une erreur est survenue</h3>
        <p>{{ errorMessage }}</p>
        <Button label="Réessayer" icon="pi pi-refresh" class="p-button-outlined p-button-danger mt-3" @click="handleVinSearch" />
      </div>

      <!-- Main Layout -->
      <section v-else-if="vehicle" class="vehicle-workspace">
        <div v-if="isDetailMode" class="selection-breadcrumb card">
          <button class="crumb-button" @click="backToVehicleOverview">
            <span class="crumb-label">VIN</span>
            <span class="crumb-value">{{ vehicle.vin }}</span>
          </button>
          <i class="pi pi-angle-right crumb-separator"></i>
          <button class="crumb-button" @click="backToGroupOverview">
            <span class="crumb-label">Groupe</span>
            <span class="crumb-value">{{ currentGroupName }}</span>
          </button>
          <i class="pi pi-angle-right crumb-separator"></i>
          <div class="crumb-current">
            <span class="crumb-label">Sous-groupe</span>
            <span class="crumb-value">{{ currentSubgroupName }}</span>
          </div>
        </div>
        <div class="layout-grid" :class="isDetailMode ? 'detail-mode' : 'explore-mode'">
        <!-- Panel 1: Vehicle Identification (Left) -->
        <article v-if="!isDetailMode" class="panel panel-vehicle card">
          <div class="panel-header">
            <i class="pi pi-car panel-icon"></i>
            <h2>Véhicule</h2>
          </div>
          <div class="vehicle-details-list">
            <div class="details-card-vin">
              <span class="label">Numéro de châssis</span>
              <span class="vin-badge">{{ vehicle.vin }}</span>
            </div>
            
            <div class="detail-item" v-if="vehicle.model">
              <span class="label">Modèle</span>
              <span class="value">{{ vehicle.model }}</span>
            </div>
            <div class="detail-item" v-if="vehicle.modelDesignation">
              <span class="label">Désignation</span>
              <span class="value">{{ vehicle.modelDesignation }}</span>
            </div>
            <div class="detail-item" v-if="vehicle.productionDate">
              <span class="label">Date Production</span>
              <span class="value">{{ vehicle.productionDate }}</span>
            </div>
            <div class="detail-item" v-if="vehicle.color">
              <span class="label">Couleur</span>
              <span class="value">{{ vehicle.color }}</span>
            </div>
            <div class="detail-item" v-if="vehicle.upholstery">
              <span class="label">Sellerie / Intérieur</span>
              <span class="value">{{ vehicle.upholstery }}</span>
            </div>
            <div class="detail-item" v-if="vehicle.transmission">
              <span class="label">Transmission</span>
              <span class="value">{{ vehicle.transmission }}</span>
            </div>
            <div class="detail-item" v-if="vehicle.modelCode">
              <span class="label">Code Modèle</span>
              <span class="value">{{ vehicle.modelCode }}</span>
            </div>
          </div>
        </article>

        <!-- Panel 2: Main Groups (Middle Left) -->
        <article v-if="!isDetailMode" class="panel panel-groups card">
          <div class="panel-header">
            <i class="pi pi-folder panel-icon"></i>
            <h2>Groupe Principal</h2>
          </div>
          <div class="panel-filter">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-filter" />
              <InputText v-model="groupFilter" placeholder="Filtrer les groupes..." class="w-full filter-input" />
            </IconField>
          </div>
          <div class="panel-list scrollable">
            <button
              v-for="group in filteredGroups"
              :key="group.id"
              class="list-item-btn"
              :class="{ active: selectedGroupId === group.id }"
              @click="selectGroup(group.id)"
            >
              <span class="item-code">{{ group.code }}</span>
              <span class="item-name">{{ group.name }}</span>
              <i class="pi pi-chevron-right arrow-icon"></i>
            </button>
          </div>
        </article>

        <!-- Panel 3: Subgroups (Middle Right) -->
        <article class="panel panel-subgroups card">
          <div class="panel-header">
            <i class="pi pi-folder-open panel-icon"></i>
            <h2>Sous-groupe</h2>
          </div>
          <div class="panel-filter">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-filter" />
              <InputText
                v-model="subgroupFilter"
                placeholder="Filtrer les sous-groupes..."
                class="w-full filter-input"
                :disabled="!selectedGroupId"
              />
            </IconField>
          </div>
          
          <div v-if="refreshingVin" class="panel-loader">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Rafraîchissement du VIN…</span>
          </div>
          <div v-else-if="loadingSubgroups" class="panel-loader">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Chargement...</span>
          </div>
          <div v-else-if="subgroupError" class="panel-subgroup-error">
            <i class="pi pi-exclamation-triangle"></i>
            <p>{{ subgroupError }}</p>
            <Button
              v-if="subgroupRefreshNeeded"
              label="Rafraîchir ce VIN"
              icon="pi pi-refresh"
              class="p-button-outlined p-button-sm"
              @click="handleRefreshVin"
            />
          </div>
          <div v-else-if="!selectedGroupId" class="panel-placeholder">
            <span>Sélectionnez un groupe principal pour afficher ses sous-groupes.</span>
          </div>
          <div v-else class="panel-list scrollable">
            <button
              v-for="subgroup in filteredSubgroups"
              :key="subgroup.id"
              class="list-item-btn"
              :class="{ active: selectedSubgroupId === subgroup.id }"
              @click="selectSubgroup(subgroup.id)"
            >
              <span class="item-code">{{ subgroup.code.replace(/_/g, ' ') }}</span>
              <span class="item-name">{{ subgroup.name }}</span>
              <i class="pi pi-chevron-right arrow-icon"></i>
            </button>
          </div>
        </article>

        <!-- Panel 4: Schematic Render & Parts Table (Right Column) -->
        <article v-if="isDetailMode" class="panel panel-render card">
          <div v-if="loadingDetails" class="render-loader">
            <i class="pi pi-spin pi-spinner spinner-icon"></i>
            <h3>Chargement du schéma et des pièces...</h3>
          </div>
          <div v-else-if="false" class="render-placeholder">
            <i class="pi pi-images placeholder-icon"></i>
            <h3>Aucun sous-groupe sélectionné</h3>
            <p>Veuillez sélectionner un groupe puis un sous-groupe pour afficher les détails techniques.</p>
          </div>
          <div v-else class="render-content scrollable">
            <!-- Schematic Visualizer Section -->
            <div class="schematic-section">
              <div class="schematic-header">
                <h3>Schéma Éclaté - {{ currentSubgroupName }}</h3>
                <div class="zoom-controls">
                  <Button icon="pi pi-plus" class="p-button-outlined p-button-sm" @click="zoomIn" />
                  <Button icon="pi pi-minus" class="p-button-outlined p-button-sm" @click="zoomOut" />
                  <Button icon="pi pi-refresh" class="p-button-outlined p-button-sm" @click="zoomReset" />
                </div>
              </div>
              <div
                class="image-viewport"
                @mousedown="startPan"
                @mousemove="pan"
                @mouseup="endPan"
                @mouseleave="endPan"
              >
                <img
                  v-if="details && details.imagePath"
                  :src="getSchematicImageUrl(details.imagePath)"
                  alt="Schéma Éclaté"
                  class="schematic-img"
                  :style="imageStyle"
                  draggable="false"
                />
                <div v-else class="no-image">
                  <i class="pi pi-image"></i>
                  <span>Schéma non disponible pour ce sous-groupe.</span>
                </div>
              </div>
            </div>

            <!-- Parts Table Section -->
            <div class="parts-section">
              <h3>Liste des pièces</h3>
              <div class="parts-table-wrapper">
                <table class="parts-table">
                  <thead>
                    <tr>
                      <th class="w-10">Pos</th>
                      <th class="w-25">Numéro de pièce</th>
                      <th class="w-35">Désignation</th>
                      <th class="w-15">Info suppl.</th>
                      <th class="w-10 text-center">Qté</th>
                      <th class="w-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="part in details.parts" :key="part.partNumber + '-' + part.position">
                      <td class="pos-cell">{{ part.position || '--' }}</td>
                      <td class="part-number-cell">
                        <span class="part-no-copy" @click="copyToClipboard(part.partNumber)">
                          {{ part.partNumber }}
                          <i class="pi pi-copy copy-icon"></i>
                        </span>
                      </td>
                      <td class="designation-cell">{{ part.designation }}</td>
                      <td class="info-cell">{{ part.infoSuppl || '--' }}</td>
                      <td class="qty-cell text-center">{{ part.quantity || '1' }}</td>
                      <td class="action-cell text-center">
                        <Button
                          icon="pi pi-plus"
                          class="p-button-rounded p-button-success p-button-sm"
                          v-tooltip.top="'Ajouter au devis'"
                          @click="addPartToQuote(part)"
                        />
                      </td>
                    </tr>
                    <tr v-if="!details.parts || details.parts.length === 0">
                      <td colspan="6" class="text-center no-parts">Aucune pièce trouvée pour ce sous-groupe.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </article>
        </div>
      </section>

      <!-- Welcome / Selection Panel -->
      <section v-else class="brands-state">
        <!-- Grille de sélection des marques -->
        <div v-if="!selectedBrand" class="brands-selection-container animate-fade-in">
          <div class="brands-header-card card">
            <i class="pi pi-car header-icon"></i>
            <h2>Sélectionnez une Marque</h2>
            <p>Choisissez la marque du véhicule pour accéder à son catalogue de pièces détachées.</p>
            <div class="brand-search-wrapper">
              <IconField iconPosition="left" class="w-full max-w-md">
                <InputIcon class="pi pi-filter" />
                <InputText
                  v-model="brandSearchQuery"
                  placeholder="Rechercher une marque (ex: BMW, Audi...)"
                  class="brand-filter-input w-full"
                />
              </IconField>
            </div>
          </div>

          <div class="brands-grid">
            <button
              v-for="brand in filteredBrands"
              :key="brand.code"
              class="brand-card card"
              :class="{ 'recommended-card': brand.code === 'bmw_parts' }"
              @click="selectBrand(brand)"
            >
              <div class="brand-logo-wrapper">
                <img
                  v-if="!brand.imageFailed"
                  :src="brand.logo"
                  :alt="brand.name"
                  @error="handleImageError(brand)"
                  class="brand-img"
                />
                <div v-else class="brand-fallback-logo">
                  {{ brand.name.substring(0, 2).toUpperCase() }}
                </div>
              </div>
              <span class="brand-card-name">{{ brand.name }}</span>
              <span v-if="brand.code === 'bmw_parts'" class="badge-recommended">Testé / Stable</span>
            </button>
          </div>
        </div>

        <!-- Saisie du VIN pour la marque sélectionnée -->
        <div v-else class="vin-selection-container card animate-fade-in">
          <div class="vin-card-header">
            <button class="btn-back-text" @click="resetBrand">
              <i class="pi pi-arrow-left"></i> Retour aux marques
            </button>
            <div class="active-brand-banner">
              <img
                v-if="!selectedBrand.imageFailed"
                :src="selectedBrand.logo"
                :alt="selectedBrand.name"
                class="brand-banner-logo"
              />
              <span class="brand-banner-name">{{ selectedBrand.name }}</span>
            </div>
          </div>

          <div class="vin-card-body">
            <h2>Recherche par Numéro de Châssis (VIN)</h2>
            <p class="vin-info-text">
              Saisissez le code VIN à 17 caractères de votre véhicule {{ selectedBrand.name }} pour décoder ses pièces d'origine.
            </p>

            <div class="vin-search-box-large">
              <InputText
                v-model="vinInput"
                placeholder="Entrez le VIN (17 caractères)..."
                class="vin-input-large"
                maxLength="17"
                :disabled="loading || !isSessionActive"
                @keyup.enter="handleVinSearch"
              />
              <Button
                label="Lancer l'identification"
                icon="pi pi-search"
                class="p-button-primary search-btn-large"
                :loading="loading"
                :disabled="vinInput.trim().length !== 17 || loading || !isSessionActive"
                @click="handleVinSearch"
              />
            </div>

            <div v-if="!isSessionActive" class="session-warning-card">
              <i class="pi pi-exclamation-circle"></i>
              <span>Le catalogue Partslink est momentanément indisponible. Réessayez dans quelques instants.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer de page (charte C2, structure standard §8.9) — discret, libellé structurel -->
      <footer class="pl-footer">
        <span class="pl-footer-label">Catalogue Partslink</span>
        <span class="pl-footer-sub" v-if="vehicle && vehicle.vin">VIN {{ vehicle.vin }}</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, onMounted } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import {
  searchVehicleByVin,
  getSubgroups,
  getSubgroupDetails,
  getSearchStatus,
  getSessionStatus,
  cancelSearch
} from '@/api/partslinkNativeService'

const vinInput = ref('')
const loading = ref(false)
const loadingSubgroups = ref(false)
const loadingDetails = ref(false)
const errorMessage = ref('')
const currentStep = ref('')

const brandSearchQuery = ref('')
const selectedBrand = ref(null)

const brandsList = ref([
  { name: 'BMW', code: 'bmw_parts', logo: 'https://www.partslink24.com/carbrands/bmw/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'MINI', code: 'mini_parts', logo: 'https://www.partslink24.com/carbrands/mini/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Mercedes-Benz', code: 'mercedes_parts', logo: 'https://www.partslink24.com/carbrands/mercedes/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Audi', code: 'audi_parts', logo: 'https://www.partslink24.com/carbrands/audi/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Volkswagen', code: 'vw_parts', logo: 'https://www.partslink24.com/carbrands/vw/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Porsche', code: 'porsche_parts', logo: 'https://www.partslink24.com/carbrands/porsche/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Renault', code: 'renault_parts', logo: 'https://www.partslink24.com/carbrands/renault/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Peugeot', code: 'peugeot_parts', logo: 'https://www.partslink24.com/carbrands/peugeot/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Citroën', code: 'citroen_parts', logo: 'https://www.partslink24.com/carbrands/citroen/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Ford', code: 'fordp_parts', logo: 'https://www.partslink24.com/carbrands/ford/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Fiat', code: 'fiatp_parts', logo: 'https://www.partslink24.com/carbrands/fiat/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Opel', code: 'opel_parts', logo: 'https://www.partslink24.com/carbrands/opel_legacy/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Volvo', code: 'volvo_parts', logo: 'https://www.partslink24.com/carbrands/volvo/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Toyota', code: 'toyota_parts', logo: 'https://www.partslink24.com/carbrands/toyota/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Hyundai', code: 'hyundai_parts', logo: 'https://www.partslink24.com/carbrands/hyundai/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Kia', code: 'kia_parts', logo: 'https://www.partslink24.com/carbrands/kia/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Nissan', code: 'nissan_parts', logo: 'https://www.partslink24.com/carbrands/nissan/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Dacia', code: 'dacia_parts', logo: 'https://www.partslink24.com/carbrands/dacia/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Alfa Romeo', code: 'alfa_parts', logo: 'https://www.partslink24.com/carbrands/alfa/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Cupra', code: 'cupra_parts', logo: 'https://www.partslink24.com/carbrands/cupra/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'SEAT', code: 'seat_parts', logo: 'https://www.partslink24.com/carbrands/seat/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Škoda', code: 'skoda_parts', logo: 'https://www.partslink24.com/carbrands/skoda/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Land Rover', code: 'landrover_parts', logo: 'https://www.partslink24.com/carbrands/landrover/pl24_portal_logo_v2.png', imageFailed: false },
  { name: 'Jaguar', code: 'jaguar_parts', logo: 'https://www.partslink24.com/carbrands/jaguar/pl24_portal_logo_v2.png', imageFailed: false }
])

const filteredBrands = computed(() => {
  if (!brandSearchQuery.value.trim()) return brandsList.value
  const query = brandSearchQuery.value.toLowerCase()
  return brandsList.value.filter(b => b.name.toLowerCase().includes(query))
})

const selectBrand = (brand) => {
  selectedBrand.value = brand
  vinInput.value = ''
  errorMessage.value = ''
}

const resetBrand = () => {
  selectedBrand.value = null
  vehicle.value = null
  groups.value = []
  subgroups.value = []
  details.value = null
  selectedGroupId.value = null
  selectedSubgroupId.value = null
  vinInput.value = ''
  errorMessage.value = ''
}

const handleImageError = (brand) => {
  brand.imageFailed = true
}

const sessionState = ref(null)
const checkingSession = ref(false)

// État du job de recherche (file d'attente isolée par utilisateur)
const currentJobId = ref(null)
const jobStatus = ref('')        // QUEUED | RUNNING | COMPLETED | FAILED | CANCELLED
const queuePosition = ref(0)

const vehicle = ref(null)
const groups = ref([])
const subgroups = ref([])
const details = ref(null)

const selectedGroupId = ref(null)
const selectedSubgroupId = ref(null)

const groupFilter = ref('')
const subgroupFilter = ref('')

// Récupération ciblée quand le cache du groupe est incohérent (HTTP 409 GROUP_REFRESH_NEEDED)
const subgroupError = ref('')
const subgroupRefreshNeeded = ref(false)
const refreshingVin = ref(false)

const normalizeGroups = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((g) => {
    const code = String(g?.code ?? g?.id ?? '').trim()
    const id = String(g?.id ?? code).trim()
    const name = String(g?.name ?? g?.label ?? '').trim()
    return { ...g, id, code, name }
  }).filter((g) => g.code || g.name)
}

const normalizeSubgroups = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((sg) => {
    const code = String(sg?.code ?? sg?.id ?? '').trim()
    const id = String(sg?.id ?? code).trim()
    const name = String(sg?.name ?? sg?.label ?? '').trim()
    return { ...sg, id, code, name }
  }).filter((sg) => sg.code || sg.name)
}

const filteredGroups = computed(() => {
  const query = groupFilter.value.trim().toLowerCase()
  const list = normalizeGroups(groups.value)
  if (!query) return list
  return list.filter((g) => (`${g.code} ${g.name}`).toLowerCase().includes(query))
})

const filteredSubgroups = computed(() => {
  const query = subgroupFilter.value.trim().toLowerCase()
  const list = normalizeSubgroups(subgroups.value)
  if (!query) return list
  return list.filter((sg) => (`${sg.code} ${sg.name}`).toLowerCase().includes(query))
})

const currentGroupName = computed(() => {
  if (!selectedGroupId.value) return 'Aucun groupe'
  const id = String(selectedGroupId.value)
  const found = normalizeGroups(groups.value).find((group) => String(group.id) === id)
  return found?.name || found?.code || id
})

const currentSubgroupName = computed(() => {
  if (!selectedSubgroupId.value) return ''
  const id = String(selectedSubgroupId.value)
  const found = normalizeSubgroups(subgroups.value).find((sg) => String(sg.id) === id)
  return found?.name || found?.code || id
})

const isDetailMode = computed(() => Boolean(selectedSubgroupId.value))

const imageStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  transformOrigin: 'center center',
  cursor: isPanning.value ? 'grabbing' : 'grab'
}))

// Image Zoom & Pan State
const scale = ref(1.0)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanning = ref(false)
const startX = ref(0)
const startY = ref(0)

let pollInterval = null

const isSessionActive = computed(() => sessionState.value?.active === true)

const checkSession = async () => {
  checkingSession.value = true
  try {
    const status = await getSessionStatus()
    sessionState.value = status
  } catch (err) {
    console.error("Erreur de récupération du statut de session:", err)
  } finally {
    checkingSession.value = false
  }
}

const handleCancelSearch = async () => {
  if (!currentJobId.value) {
    clearPolling()
    loading.value = false
    return
  }
  try {
    await cancelSearch(currentJobId.value)
  } catch (err) {
    // annulation best-effort : on arrête le polling quoi qu'il arrive
  } finally {
    clearPolling()
    loading.value = false
    jobStatus.value = 'CANCELLED'
    errorMessage.value = 'Recherche annulée.'
    currentJobId.value = null
  }
}

const clearPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  checkSession()
  // Poll session status every 15s to keep UI updated
  const statusInterval = setInterval(checkSession, 15000)
  onUnmounted(() => {
    clearInterval(statusInterval)
    clearPolling()
  })
})

const handleVinSearch = async () => {
  const vin = vinInput.value.trim().toUpperCase()
  if (vin.length !== 17) {
    errorMessage.value = 'Le VIN doit comporter exactement 17 caractères.'
    return
  }

  clearPolling()
  loading.value = true
  errorMessage.value = ''
  currentStep.value = 'Vérification du cache de données...'
  vehicle.value = null
  groups.value = []
  subgroups.value = []
  details.value = null
  selectedGroupId.value = null
  selectedSubgroupId.value = null
  subgroupError.value = ''
  subgroupRefreshNeeded.value = false
  currentJobId.value = null
  jobStatus.value = ''
  queuePosition.value = 0

  try {
    const data = await searchVehicleByVin(vin, selectedBrand.value?.code)
    currentJobId.value = data.jobId || null
    jobStatus.value = data.status || ''

    // Fast-Path : cache hit → résultat instantané (aucune session navigateur réservée)
    if (data.completed || data.status === 'COMPLETED') {
      vehicle.value = data.vehicle
      groups.value = normalizeGroups(data.groups)
      loading.value = false
    } else {
      // Slow-Path : cache miss → job dans la file isolée, on suit son avancement
      currentStep.value = data.step || 'En file d\'attente...'
      pollInterval = setInterval(async () => {
        try {
          const progress = await getSearchStatus(data.jobId)
          jobStatus.value = progress.status || ''
          queuePosition.value = progress.queuePosition || 0
          if (progress.status === 'QUEUED') {
            currentStep.value = queuePosition.value > 0
              ? `En file d'attente — position ${queuePosition.value}`
              : 'En file d\'attente...'
          } else {
            currentStep.value = progress.step || 'Chargement...'
          }

          if (progress.completed) {
            clearPolling()
            if (progress.status === 'COMPLETED') {
              vehicle.value = progress.vehicle
              groups.value = normalizeGroups(progress.groups)
              loading.value = false
            } else if (progress.status === 'CANCELLED') {
              errorMessage.value = 'Recherche annulée.'
              loading.value = false
            } else {
              errorMessage.value = progress.error || 'Erreur lors de la recherche du véhicule.'
              loading.value = false
            }
          }
        } catch (err) {
          clearPolling()
          logError(err, 'Erreur lors du suivi de la recherche.')
          loading.value = false
        }
      }, 1500)
    }
  } catch (err) {
    clearPolling()
    logError(err, 'Impossible d\'initier la recherche.')
    loading.value = false
  }
}

const selectGroup = async (groupId) => {
  selectedGroupId.value = groupId
  selectedSubgroupId.value = null
  subgroups.value = []
  details.value = null
  subgroupError.value = ''
  subgroupRefreshNeeded.value = false
  loadingSubgroups.value = true

  try {
    const data = await getSubgroups(vehicle.value.vin, groupId)
    subgroups.value = normalizeSubgroups(Array.isArray(data) ? data : data?.subgroups)
  } catch (err) {
    // Erreur ciblée sous-groupe : on garde l'espace de travail (pas d'écran d'erreur global)
    const code = err.response?.data?.code
    if (err.response?.status === 409 && code === 'GROUP_REFRESH_NEEDED') {
      subgroupRefreshNeeded.value = true
      subgroupError.value = err.response?.data?.message || 'Données de ce groupe à rafraîchir pour ce véhicule.'
    } else if (err.response?.status === 503 && err.response?.data?.busy) {
      subgroupError.value = 'Toutes les sessions Partslink sont occupées. Réessayez dans un instant.'
    } else {
      subgroupError.value = err.response?.data?.message || 'Impossible de charger les sous-groupes.'
    }
  } finally {
    loadingSubgroups.value = false
  }
}

const handleRefreshVin = async () => {
  if (!vehicle.value?.vin) return
  refreshingVin.value = true
  subgroupError.value = ''
  try {
    // Re-déclenche la recherche VIN : complète le brand_code côté serveur (self-heal) puis on retente le groupe
    await searchVehicleByVin(vehicle.value.vin, selectedBrand.value?.code)
    subgroupRefreshNeeded.value = false
    if (selectedGroupId.value) {
      await selectGroup(selectedGroupId.value)
    }
  } catch (err) {
    subgroupError.value = 'Le rafraîchissement a échoué. Réessayez.'
  } finally {
    refreshingVin.value = false
  }
}

const selectSubgroup = async (subgroupId) => {
  selectedSubgroupId.value = subgroupId
  details.value = null
  loadingDetails.value = true
  zoomReset()

  try {
    const data = await getSubgroupDetails(vehicle.value.vin, subgroupId)
    details.value = data
  } catch (err) {
    logError(err, 'Impossible de charger les pièces et schémas.')
  } finally {
    loadingDetails.value = false
  }
}

const backToGroupOverview = () => {
  selectedSubgroupId.value = null
  details.value = null
  loadingDetails.value = false
  zoomReset()
}

const backToVehicleOverview = () => {
  selectedGroupId.value = null
  selectedSubgroupId.value = null
  subgroups.value = []
  details.value = null
  loadingSubgroups.value = false
  loadingDetails.value = false
  groupFilter.value = ''
  subgroupFilter.value = ''
  subgroupError.value = ''
  subgroupRefreshNeeded.value = false
  zoomReset()
}

// Zoom & Pan Actions
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 4.0)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

const zoomReset = () => {
  scale.value = 1.0
  offsetX.value = 0
  offsetY.value = 0
}

const startPan = (e) => {
  isPanning.value = true
  startX.value = e.clientX - offsetX.value
  startY.value = e.clientY - offsetY.value
}

const pan = (e) => {
  if (!isPanning.value) return
  offsetX.value = e.clientX - startX.value
  offsetY.value = e.clientY - startY.value
}

const endPan = () => {
  isPanning.value = false
}

// Global Actions
const getBackendOrigin = () => {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()

  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return apiBaseUrl.replace(/\/api\/?$/i, '').replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '')
  }

  return ''
}

const getSchematicImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${getBackendOrigin()}${normalizedPath}`
}

const copyToClipboard = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text)
}

const addPartToQuote = (part) => {
  console.log('[Partslink] Adding part to quote:', part)
  const customEvent = new CustomEvent('partslink-import-part', { detail: part })
  window.dispatchEvent(customEvent)
}

const logError = (err, fallback) => {
  const msg = err.response?.data?.message || err.message || fallback
  errorMessage.value = msg
}
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* Shell charte C2 (§12) : flex column plein viewport → header + corps (grid flex:1,
   panneaux à scroll interne) + footer 48px toujours visible. Plus de calc(100vh-Npx) figé. */
.main-content {
  height: 100vh;
  min-height: 0;
  box-sizing: border-box;
  padding: var(--c2-page-pad) var(--c2-page-pad);   /* padding page harmonisé (token commun) */
  display: flex;
  flex-direction: column;
  gap: var(--c2-head-gap);       /* espace sous header harmonisé */
  --pl-footer-h: 48px;
}

.viewer-header-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 1.5rem;
  position: sticky;
  top: var(--c2-head-sticky-top);
  z-index: var(--c2-head-z);
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius);
  padding: 0 1.8rem;
  height: var(--c2-head-h);
  box-sizing: border-box;
  box-shadow: var(--c2-head-shadow);
}

.title-section h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--c2-head-title);
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #cbd5e1;
  font-size: 0.88rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.session-status-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checking-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.start-session-btn {
  border-radius: 8px !important;
  font-size: 0.8rem !important;
  padding: 0.4rem 0.8rem !important;
}

.search-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.vin-search-input {
  width: 320px;
  background-color: #ffffff !important;
  border-color: #cbd5e1 !important;
  color: var(--text-primary) !important;
  border-radius: 10px !important;
  font-family: var(--c2-font-mono);
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  padding: 0.6rem 0.9rem;
}

.vin-search-input:focus {
  border-color: var(--primary-blue) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.search-btn {
  border-radius: 10px !important;
  padding: 0.6rem 1.2rem;
  font-weight: 700;
}

/* Panel Layout styling */
.vehicle-workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selection-breadcrumb {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
}

.crumb-button,
.crumb-current {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
}

.crumb-button {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: var(--primary-blue-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.crumb-button:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.crumb-current {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: var(--text-primary);
}

.crumb-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.75;
}

.crumb-value {
  font-size: 0.88rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crumb-separator {
  color: #94a3b8;
  font-size: 0.8rem;
}

.layout-grid {
  display: grid;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

/* État sélection marque : remplit le corps + scroll interne (charte §12). */
.brands-state { flex: 1; min-height: 0; overflow-y: auto; }

/* Footer de page standard C2 (§8/§8.9) — navy 48px, aligné footer sidebar, discret.
   Pas de margin-top : .main-content a déjà gap var(--c2-head-gap). */
.pl-footer {
  flex-shrink: 0;
  height: var(--pl-footer-h);
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
.pl-footer-label { color: #e2e8f0; font-size: .82rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
.pl-footer-sub { color: #94a3b8; font-size: .76rem; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; }

.layout-grid.explore-mode {
  grid-template-columns: minmax(220px, 20%) minmax(260px, 30%) minmax(360px, 50%);
}

.layout-grid.detail-mode {
  grid-template-columns: minmax(340px, 50%) minmax(380px, 50%);
}

.panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  padding: 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.panel-icon {
  color: var(--primary-blue);
  font-size: 1.1rem;
}

.panel-filter {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.filter-input {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  font-size: 0.88rem;
  padding: 0.45rem 0.75rem;
}

.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.scrollable::-webkit-scrollbar {
  width: 6px;
}
.scrollable::-webkit-scrollbar-track {
  background: transparent;
}
.scrollable::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.list-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.list-item-btn:hover {
  background: #f8fafc;
  color: var(--text-primary);
}

.list-item-btn.active {
  background: #eff6ff;
  color: var(--primary-blue-dark);
  border-color: #bfdbfe;
}

.item-code {
  font-family: var(--c2-font-mono);
  font-weight: 700;
  font-size: 0.82rem;
  background: #f1f5f9;
  color: var(--primary-blue-dark);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.list-item-btn.active .item-code {
  background: #dbeafe;
  color: var(--primary-blue-dark);
}

.item-name {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.25;
}

.arrow-icon {
  font-size: 0.75rem;
  opacity: 0.5;
  transition: transform 0.2s;
}

.list-item-btn:hover .arrow-icon {
  transform: translateX(2px);
  opacity: 1;
}

/* Vehicle Panel Specifics */
.vehicle-details-list {
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.details-card-vin {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.vin-badge {
  font-family: var(--c2-font-mono);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--primary-blue-dark);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-item .label {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-item .value {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Subgroups Loader & Placeholders */
.panel-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex: 1;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.panel-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  flex: 1;
  color: var(--text-secondary);
  font-size: 0.88rem;
  text-align: center;
}

/* Erreur ciblée sous-groupe (cache à rafraîchir) — discrète, charte C2, ne casse pas l'espace de travail */
.panel-subgroup-error {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
}
.panel-subgroup-error i {
  font-size: 1.75rem;
  color: #ea580c;
}
.panel-subgroup-error p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
}

/* Panel 4 Render area */
.panel-render {
  grid-column: span 1;
}

.render-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  flex: 1;
  color: var(--text-secondary);
  text-align: center;
  gap: 0.75rem;
}

.placeholder-icon {
  font-size: 3rem;
  color: #e2e8f0;
}

.render-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 1rem;
  color: var(--text-secondary);
}

.render-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.25rem;
}

/* Schematic Section Styling */
.schematic-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.schematic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.schematic-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.zoom-controls {
  display: flex;
  gap: 0.35rem;
}

.image-viewport {
  height: 380px;
  overflow: hidden;
  position: relative;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.schematic-img {
  display: block;
  max-height: 100%;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  user-select: none;
}

.no-image {
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* Parts Table Styling */
.parts-section h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.parts-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow-y: auto;
  max-height: 400px;
}

/* Custom Scrollbar for parts table wrapper */
.parts-table-wrapper::-webkit-scrollbar {
  width: 6px;
}
.parts-table-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
.parts-table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.parts-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
  background: #ffffff;
}

.parts-table th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8fafc;
  color: var(--text-secondary);
  padding: 0.75rem;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
}

.parts-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: var(--text-primary);
}

.parts-table tbody tr:hover {
  background: #f8fafc;
}

.pos-cell {
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--c2-font-mono);
}

.part-number-cell {
  font-family: var(--c2-font-mono);
}

.part-no-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  color: var(--primary-blue);
  font-weight: 700;
}

.part-no-copy:hover {
  color: var(--primary-blue-dark);
  text-decoration: underline;
}

.copy-icon {
  font-size: 0.75rem;
  opacity: 0.6;
}

.designation-cell {
  font-weight: 500;
}

.no-parts {
  color: var(--text-secondary);
  padding: 2rem !important;
}

/* Universal Spinner & State Panels */
.spinner-icon {
  font-size: 3rem;
  color: var(--primary-blue);
  margin-bottom: 1.5rem;
}

.loading-panel,
.error-panel,
.welcome-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-top: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.loading-panel h2,
.welcome-panel h2 {
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
}

.loading-sub {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.loading-progress-bar {
  width: 400px;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 2rem;
}

.progress-fill {
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), #60a5fa);
  border-radius: 3px;
  animation: progressPulse 1.5s infinite ease-in-out;
}

@keyframes progressPulse {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.welcome-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 1.5rem;
}

.welcome-panel p {
  color: var(--text-secondary);
  max-width: 600px;
  line-height: 1.5;
  margin: 0;
}

/* Sizing Helpers */
.w-10 { width: 10%; }
.w-15 { width: 15%; }
.w-25 { width: 25%; }
.w-35 { width: 35%; }
.w-5 { width: 5%; }
.text-center { text-align: center; }

.mr-1 {
  margin-right: 0.25rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

/* Badge "file d'attente" — pilule info charte C2 (cobalt sur bleu clair) */
.badge-queue {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #eff6ff;
  color: var(--c2-select-accent, #1d4ed8);
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin: 0.75rem 0;
}

.cancel-search-btn {
  font-weight: 600;
}

.text-xs {
  font-size: 0.75rem;
}

.cursor-pointer {
  cursor: pointer;
}

@media (max-width: 1200px) {
  .layout-grid {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
  .panel {
    height: 400px;
  }
  .panel-render {
    height: auto;
  }
}

/* Brands Selection Grid CSS */
.brands-selection-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.brands-header-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.brands-header-card h2 {
  margin: 0.5rem 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.brands-header-card p {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.brand-search-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.brand-filter-input {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
  color: var(--text-primary) !important;
  border-radius: 10px !important;
  padding: 0.6rem 1rem !important;
}

.brand-filter-input:focus {
  border-color: var(--primary-blue) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.25rem;
}

.brand-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  height: 140px;
}

.brand-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  border-color: #bfdbfe;
}

.recommended-card {
  border-color: rgba(59, 130, 246, 0.4);
  background: linear-gradient(180deg, #ffffff, #eff6ff);
}

.recommended-card:hover {
  border-color: var(--primary-blue);
}

.brand-logo-wrapper {
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.brand-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  filter: grayscale(15%);
  transition: filter 0.2s;
}

.brand-card:hover .brand-img {
  filter: grayscale(0%);
}

.brand-fallback-logo {
  width: 50px;
  height: 50px;
  background: #e2e8f0;
  color: var(--text-secondary);
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.brand-card-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-recommended {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #dbeafe;
  color: var(--primary-blue-dark);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

/* VIN Selection Layout CSS */
.vin-selection-container {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-top: 1rem;
}

.vin-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1.2rem;
  margin-bottom: 2rem;
}

.btn-back-text {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-back-text:hover {
  color: var(--primary-blue-dark);
  background: #f8fafc;
}

.active-brand-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.brand-banner-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
}

.brand-banner-name {
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.vin-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 650px;
  margin: 0 auto;
  padding: 1rem 0;
}

.vin-card-body h2 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.vin-info-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.vin-search-box-large {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1.5rem;
}

.vin-input-large {
  flex: 1;
  background-color: #ffffff !important;
  border-color: #cbd5e1 !important;
  color: var(--text-primary) !important;
  border-radius: 12px !important;
  font-family: var(--c2-font-mono);
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  padding: 0.8rem 1.2rem !important;
  text-transform: uppercase;
}

.vin-input-large:focus {
  border-color: var(--primary-blue) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

.search-btn-large {
  border-radius: 12px !important;
  padding: 0.8rem 1.8rem !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
}

.session-warning-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
  font-size: 0.88rem;
  text-align: left;
  line-height: 1.5;
}

.session-warning-card i {
  font-size: 1.2rem;
  flex-shrink: 0;
}
</style>
