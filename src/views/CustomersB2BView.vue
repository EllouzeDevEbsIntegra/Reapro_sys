<template>
  <div class="customers-layout">
    <TheNavbar />

    <div class="main-content animate-fade-in">
      <!-- Header Section -->
      <div class="header-bar mb-6">
        <div class="header-title-section">
          <h1>Customers B2B</h1>
          <p class="subtitle">Liste des clients depuis la base de données B2BNAV</p>
        </div>

        <div class="flex items-center gap-4 flex-wrap">
          <!-- Search Bar -->
          <IconField iconPosition="left" class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher un client (Nom, ID, Tel)..." />
          </IconField>

          <Button icon="pi pi-refresh" text rounded @click="fetchCustomers" :loading="isLoading" title="Actualiser" />
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpis-grid mb-6">
        <div class="kpi-card-custom animate-scale-in">
          <div class="kpi-icon-wrapper blue-gradient">
            <i class="pi pi-users text-white text-xl"></i>
          </div>
          <div class="kpi-details">
            <span class="kpi-label-custom">Total Clients</span>
            <span class="kpi-value-custom">{{ customers.length }}</span>
          </div>
        </div>

        <div class="kpi-card-custom animate-scale-in" style="animation-delay: 0.1s">
          <div class="kpi-icon-wrapper green-gradient">
            <i class="pi pi-filter text-white text-xl"></i>
          </div>
          <div class="kpi-details">
            <span class="kpi-label-custom">Résultats Filtrés</span>
            <span class="kpi-value-custom">{{ filteredCustomers.length }}</span>
          </div>
        </div>
      </div>

      <!-- Error Alerts -->
      <div v-if="error" class="error-container glass-card p-6 mb-6">
        <div class="flex items-start gap-4">
          <div class="error-icon-wrapper">
            <i class="pi pi-exclamation-triangle text-red-500 text-3xl"></i>
          </div>
          <div class="error-details flex-1">
            <h3 class="error-title text-red-600 font-bold mb-2">Erreur lors de la récupération des clients</h3>
            <p class="error-message text-slate-700 leading-relaxed mb-4">{{ errorMessage }}</p>
            
            <div v-if="isSshTunnelError" class="ssh-actions bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 mb-4">
              <div class="font-bold text-slate-800 mb-1">Tunnel SSH inactif</div>
              <p class="mb-2">Le serveur backend n'arrive pas à contacter la base de données B2BNAV. La raison la plus probable est que le tunnel SSH sur le serveur n'est pas actif.</p>
              <div class="mt-2 text-indigo-700 font-semibold">
                Action : Contacter l'équipe backend pour vérifier le statut du service <code>b2bnav-tunnel.service</code> sur le serveur d'application.
              </div>
            </div>

            <Button label="Réessayer" icon="pi pi-refresh" @click="fetchCustomers" severity="danger" class="retry-btn" />
          </div>
        </div>
      </div>

      <!-- Customers Table Card -->
      <div v-else class="glass-card overflow-hidden flex flex-col p-0 table-card">
        <DataTable :value="filteredCustomers" :loading="isLoading" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]"
          responsiveLayout="scroll" class="p-datatable-hover flex-1" scrollable scrollHeight="60vh"
          currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} clients"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown">
          
          <Column field="extId" header="ID Client (B2BNAV)" sortable style="min-width: 150px">
            <template #body="slotProps">
              <span class="font-semibold text-blue-600">{{ slotProps.data.extId }}</span>
            </template>
          </Column>

          <Column field="companyName" header="Raison Sociale" sortable style="min-width: 250px">
            <template #body="slotProps">
              <span class="font-bold text-slate-800">{{ slotProps.data.companyName }}</span>
            </template>
          </Column>

          <Column field="phone" header="Téléphone" sortable style="min-width: 150px">
            <template #body="slotProps">
              <span class="text-slate-600">
                <i class="pi pi-phone text-slate-400 mr-2 text-xs"></i>{{ slotProps.data.phone || 'Non renseigné' }}
              </span>
            </template>
          </Column>

          <Column field="address" header="Adresse" sortable style="min-width: 300px">
            <template #body="slotProps">
              <span class="text-slate-600">
                <i class="pi pi-map-marker text-slate-400 mr-2 text-xs"></i>{{ slotProps.data.address || 'Non renseignée' }}
              </span>
            </template>
          </Column>

          <template #empty>
            <div class="empty-state p-8 text-center">
              <i class="pi pi-users text-slate-300 text-5xl mb-4"></i>
              <p class="text-slate-500 font-medium">Aucun client trouvé</p>
              <p class="text-slate-400 text-sm mt-1" v-if="searchQuery">Essayez d'ajuster vos critères de recherche</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import apiClient from '../api/axios'
import TheNavbar from '../components/TheNavbar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const router = useRouter()
const toast = useToast()

const customers = ref([])
const isLoading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const isSshTunnelError = ref(false)
const searchQuery = ref('')

const fetchCustomers = async () => {
  isLoading.value = true
  error.value = false
  errorMessage.value = ''
  isSshTunnelError.value = false
  
  try {
    const response = await apiClient.get('/api/customers')
    customers.value = response.data
  } catch (err) {
    error.value = true
    const status = err.response?.status
    
    if (status === 500) {
      isSshTunnelError.value = true
      errorMessage.value = "Le serveur backend n'arrive pas à contacter la base de données B2BNAV. La raison la plus probable est que le tunnel SSH sur le serveur n'est pas actif."
      
      toast.add({
        severity: 'error',
        summary: 'Erreur Serveur (B2BNAV)',
        detail: "Le tunnel SSH sur le serveur n'est pas actif. Veuillez contacter l'équipe backend.",
        life: 10000
      })
    } else if (status === 401) {
      errorMessage.value = "Session expirée ou non autorisée. Vous allez être redirigé vers la page de connexion."
      toast.add({
        severity: 'warn',
        summary: 'Non autorisé',
        detail: 'Session expirée. Veuillez vous reconnecter.',
        life: 5000
      })
      // The axios.js interceptor handles logging out and redirecting,
      // but we add a safety timeout here.
      setTimeout(() => {
        router.push('/?sessionExpired=true')
      }, 2000)
    } else {
      errorMessage.value = err.response?.data?.message || "Impossible de récupérer la liste des clients. Veuillez réessayer plus tard."
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: errorMessage.value,
        life: 5000
      })
    }
    console.error('Fetch customers error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  
  const query = searchQuery.value.toLowerCase().trim()
  return customers.value.filter(customer => {
    const extId = (customer.extId || '').toLowerCase()
    const companyName = (customer.companyName || '').toLowerCase()
    const phone = (customer.phone || '').toLowerCase()
    const address = (customer.address || '').toLowerCase()
    
    return extId.includes(query) ||
           companyName.includes(query) ||
           phone.includes(query) ||
           address.includes(query)
  })
})
</script>

<style scoped>
.customers-layout {
  min-height: 100vh;
  background-color: #f8fafc;
}

.main-content {
  width: 100%;
  padding: 0.5rem 2rem 3rem;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  min-height: 90px;
  box-sizing: border-box;
}

.header-title-section h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
}

.subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.search-field {
  width: 320px !important;
}

.search-field :deep(.p-inputtext) {
  width: 100% !important;
}

/* KPI Summary Cards */
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.kpi-card-custom {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-card-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-details {
  display: flex;
  flex-direction: column;
}

.kpi-label-custom {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.kpi-value-custom {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

/* Error Container */
.error-container {
  border-left: 4px solid #ef4444 !important;
  background: white !important;
  border-radius: 12px !important;
}

.error-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fef2f2;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.error-title {
  font-size: 1.1rem;
}

.ssh-actions {
  border-radius: 8px;
}

.ssh-actions code {
  background-color: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  color: #0f172a;
  font-weight: 600;
}

.retry-btn {
  background-color: #ef4444 !important;
  border-color: #ef4444 !important;
}

.retry-btn:hover {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
}

/* Table Card Container */
.table-card {
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  background: white !important;
}

:deep(.p-datatable) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc !important;
  border-bottom: 2px solid #e2e8f0 !important;
}

:deep(.p-datatable-loading-overlay) {
  background-color: rgba(255, 255, 255, 0.7) !important;
}

.empty-state {
  padding: 4rem 2rem;
}
</style>
