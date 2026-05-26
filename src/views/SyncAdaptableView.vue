<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <div class="header-bar mb-5">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Synchronisation Adaptable</h1>
            <button class="so-refresh-btn" @click="fetchData(currentPage)" :disabled="loading">
              <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              Actualiser
            </button>
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
import { ref, onMounted } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import { getSyncAdaptableData } from '@/api/syncAdaptableService'
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

const store = useCompareQuoteStore()
const toast = useToast()

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
    groupName: row.partGroup || '',
    subGroupName: row.partSubGroup || '',
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
      pageSize: pageSize.value
    })
    
    syncData.value = data.list || []
    totalRecords.value = data.total || 0
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

onMounted(() => {
  fetchData(1)
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

.so-refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
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

.so-refresh-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #1e293b;
  border-color: #94a3b8;
}

.so-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
