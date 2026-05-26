<template>
  <Dialog
      v-model:visible="internalVisible"
      modal
      :style="{ width: '50vw' }"
      class="create-am-dialog"
      :showHeader="false"
      dismissableMask
      :pt="{
        root: { style: 'border-radius: 16px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.18);' },
        content: { style: 'padding: 0; border-radius: 0; background-color: #f8fafc;' }
      }"
  >
      <div class="dialog-content-wrapper">
          <div class="dialog-top-header">
              <div class="header-actions">
                  <button class="history-btn">Créer Article Adaptable</button>
                  <Button icon="pi pi-times" text rounded @click="internalVisible = false"
                      class="close-dialog-btn" />
              </div>
          </div>

          <div class="info-dialog-body" v-if="localCandidate">
              <!-- Master Info Section -->
              <div class="info-section">
                  <div class="info-section-header">
                      <i class="pi pi-box"></i>
                      <span>Informations Master</span>
                  </div>
                  <div class="info-section-content">
                      <div class="specs-table">
                          <div class="spec-row">
                              <div class="spec-label">Référence Master</div>
                              <div class="spec-value">{{ localCandidate.masterItemNo }}</div>
                          </div>
                          <div class="spec-row">
                              <div class="spec-label">Description</div>
                              <div class="spec-value">{{ localCandidate.masterDescription }}</div>
                          </div>
                           <div class="spec-row">
                              <div class="spec-label">Groupe</div>
                              <div class="spec-value">
                                  <Select v-model="localCandidate.groupCode" :options="groups"
                                      optionLabel="displayName" optionValue="code" filter autoFilterFocus
                                      placeholder="Sélectionner un groupe" class="w-full vendor-dropdown-custom"
                                      panelClass="b2b-client-panel"
                                      @change="onGroupChange"
                                  >
                                      <template #option="{ option }">
                                          <div class="option-row">
                                              <span class="option-code">{{ option.code }}</span>
                                              <span class="option-sep">—</span>
                                              <span class="option-name">{{ option.displayName }}</span>
                                          </div>
                                      </template>
                                  </Select>
                              </div>
                          </div>
                          <div class="spec-row">
                              <div class="spec-label">Sous-Groupe</div>
                              <div class="spec-value">
                                  <Select v-model="localCandidate.subGroupCode"
                                      :options="subGroups" optionLabel="displayName" optionValue="code" filter autoFilterFocus
                                      placeholder="Sélectionner un sous-groupe"
                                      panelClass="b2b-client-panel"
                                      class="w-full vendor-dropdown-custom"
                                  >
                                      <template #option="{ option }">
                                          <div class="option-row">
                                              <span class="option-code">{{ option.code }}</span>
                                              <span class="option-sep">—</span>
                                              <span class="option-name">{{ option.displayName }}</span>
                                          </div>
                                      </template>
                                  </Select>
                              </div>
                          </div>
                          <div class="spec-row">
                              <div class="spec-label">Marque (MakeCode)</div>
                              <div class="spec-value">{{ localCandidate.makeCode }}</div>
                          </div>
                          <div class="spec-row">
                              <div class="spec-label">Champ Libre</div>
                              <div class="spec-value">
                                  <input type="text" v-model="localCandidate.champsLibre"
                                      class="qty-input w-full" placeholder="Champ Libre" />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Candidate Info Section -->
              <div class="info-section">
                  <div class="info-section-header">
                      <i class="pi pi-plus-circle"></i>
                      <span>Nouvel Article</span>
                  </div>
                  <div class="info-section-content">
                      <div class="specs-table">
                          <div class="spec-row">
                              <div class="spec-label">Fabricant</div>
                              <div class="spec-value">{{ localCandidate.manufacturerName }}</div>
                          </div>
                          <div class="spec-row">
                              <div class="spec-label">Référence Fournisseur</div>
                              <div class="spec-value">{{ localCandidate.articleNumber }}</div>
                          </div>
                          <div class="spec-row" style="align-items: center;">
                              <div class="spec-label">Référence BC <span style="color: red;">*</span></div>
                              <div class="spec-value">
                                  <input type="text" v-model="localCandidate.bcReference"
                                      class="qty-input w-full" placeholder="Référence BC" />
                              </div>
                          </div>
                          <div class="spec-row" style="align-items: center;">
                              <div class="spec-label">Code Fournisseur (VendorNo) <span
                                      style="color: red;">*</span></div>
                              <div class="spec-value">
                                  <Select v-model="localCandidate.vendorNo" :options="vendors"
                                      optionLabel="fullLabel" optionValue="number" filter autoFilterFocus scrollHeight="400px"
                                      placeholder="Sélectionner un fournisseur"
                                      panelClass="b2b-client-panel"
                                      class="w-full vendor-dropdown-custom"
                                      :class="{ 'p-invalid': !localCandidate.vendorNo }"
                                  >
                                      <template #option="{ option }">
                                          <div class="option-row">
                                              <span class="option-code">{{ option.number }}</span>
                                              <span class="option-sep">—</span>
                                              <span class="option-name">{{ option.displayName }}</span>
                                          </div>
                                      </template>
                                  </Select>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div class="dialog-footer">
              <Button label="Annuler" icon="pi pi-times" class="p-button-text p-button-secondary dialog-btn"
                  @click="internalVisible = false" />
              <Button label="Valider la création" icon="pi pi-check" class="p-button-primary dialog-btn"
                  @click="confirmCreateArticleMaster"
                  :disabled="!localCandidate?.vendorNo || !localCandidate?.bcReference || isCreating"
                  :loading="isCreating" />
          </div>
      </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { useCompareQuoteStore } from '@/stores/compareQuote'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  candidate: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'success'])

const store = useCompareQuoteStore()
const toast = useToast()

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const localCandidate = ref(null)
const vendors = ref([])
const groups = ref([])
const subGroups = ref([])
const isCreating = ref(false)

const fetchGroups = async () => {
  try {
    const fetchedGroups = await store.fetchCategories(1, 'PR')
    groups.value = fetchedGroups
  } catch (error) {
    console.error('Error fetching groups:', error)
  }
}

const fetchSubGroups = async (parentGroupCode) => {
  if (!parentGroupCode) {
    subGroups.value = []
    return
  }
  try {
    const fetchedSubGroups = await store.fetchCategories(2, parentGroupCode)
    subGroups.value = fetchedSubGroups
  } catch (error) {
    console.error('Error fetching sub-groups:', error)
  }
}

const onGroupChange = async () => {
  if (localCandidate.value) {
    localCandidate.value.subGroupCode = null
    await fetchSubGroups(localCandidate.value.groupCode)
  }
}

onMounted(async () => {
  try {
    const fetchedVendors = await store.fetchVendors()
    vendors.value = fetchedVendors.map(v => ({
      ...v,
      fullLabel: `${v.number} - ${v.displayName}`
    }))
    await fetchGroups()
  } catch (error) {
    console.error('Error fetching initial data in CreateArticleMasterDialog:', error)
  }
})

watch(() => props.visible, async (newVal) => {
  if (newVal && props.candidate) {
    localCandidate.value = JSON.parse(JSON.stringify(props.candidate))
    if (localCandidate.value.groupCode) {
      await fetchSubGroups(localCandidate.value.groupCode)
    } else {
      subGroups.value = []
    }
  }
})

const confirmCreateArticleMaster = async () => {
  if (!localCandidate.value) return

  const candidate = localCandidate.value
  const payload = {
    ref: candidate.bcReference,
    frs: candidate.vendorNo,
    refTecdoc: candidate.articleNumber,
    refMaster: candidate.masterItemNo,
    group: candidate.groupCode,
    subGroup: candidate.subGroupCode,
    champsLibre: candidate.champsLibre,
    manufacturer: candidate.manufacturerCode,
    marque: candidate.makeCode
  }

  isCreating.value = true
  try {
    await store.createArticleMaster(payload)
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Article Master créé avec succès', life: 3000 })
    internalVisible.value = false
    emit('success')
  } catch (error) {
    console.error('Failed to create article master:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Échec de la création de l'Article Master", life: 3000 })
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
/* .p-dialog and .p-dialog-content are controlled via :pt prop on the component (teleport-safe) */
/* Only override .p-dialog-content here as a fallback */
:deep(.p-dialog-content) {
  padding: 0 !important;
  background-color: #f8fafc !important;
  border-radius: 0 !important;
  overflow: hidden !important;
}

.dialog-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
  background-color: #f8fafc;
}

/* Top header that naturally fills the rounded top of the dialog */
.dialog-top-header {
  background-color: #ffffff;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.history-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 200px;
  text-align: center;
  cursor: default;
}

.close-dialog-btn {
  color: #64748b !important;
}

.info-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 20px 0 20px;
}
.info-section {
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.info-section-header {
  background: #f8fafc;
  padding: 12px 15px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}
.info-section-header i {
  color: #3b82f6;
  font-size: 1.1rem;
}
.info-section-content {
  padding: 15px;
}
.specs-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 350px;
  overflow-y: auto;
  padding-right: 5px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 6px 0;
  min-height: 44px; /* consistent vertical height for all lines, list or text */
  box-sizing: border-box;
  border-bottom: 1px solid #f1f5f9;
}
.spec-row:last-child {
  border-bottom: none;
}
.spec-row:nth-child(even) {
  background-color: #f8fafc;
}
.spec-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: 35%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-top: 2px;
}
.spec-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.9rem;
  flex: 1;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.spec-row:has(.vendor-dropdown-custom) .spec-value {
  width: 65%;
  flex: unset;
}
/* ── Inputs (text fields) – B2B filter-input design ───────────────── */
.qty-input {
  width: 100%;
  flex: 1;
  min-width: 0;
  height: 36px !important; /* matches the height of select elements */
  padding: 0 0.7rem; /* only horizontal padding to respect fixed height */
  box-sizing: border-box;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  text-align: right; /* Align value text to the right */
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.qty-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  background: #ffffff;
}

/* ── Select (PrimeVue) – B2B filter-input design ──────────────────── */
.vendor-dropdown-custom {
  width: 100% !important;
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 8px !important;
  background-color: #f8fafc !important;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s !important;
  box-shadow: none !important;
  height: 36px !important;
  display: flex !important;
  align-items: center !important;
}

.vendor-dropdown-custom:hover {
  border-color: #cbd5e1 !important;
  background-color: #fff !important;
}

.vendor-dropdown-custom.p-focus,
.vendor-dropdown-custom:focus-within {
  border-color: #1e40af !important;
  background-color: #ffffff !important;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1) !important;
}

.vendor-dropdown-custom :deep(.p-select-label),
.vendor-dropdown-custom :deep(.p-dropdown-label) {
  padding: 0 0.7rem !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  color: #1e293b !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important; /* Right align the selected item text */
  text-align: right !important;
  line-height: 1 !important;
}

.vendor-dropdown-custom :deep(.p-select-dropdown),
.vendor-dropdown-custom :deep(.p-dropdown-trigger),
.vendor-dropdown-custom :deep(.p-select-trigger) {
  width: 2.2rem !important;
  color: #64748b !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px 20px 20px;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
  margin-top: 4px;
}

.dialog-btn {
  padding: 10px 20px !important;
  font-size: 1rem !important;
  min-width: 120px !important;
}
.dialog-btn :deep(.p-button-icon) {
  font-size: 1.1rem !important;
}

/* ── Shared dropdown option styles (matching B2BView) ───────────────── */
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
</style>
