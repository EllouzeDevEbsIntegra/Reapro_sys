<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <!-- ─── HEADER (Deep Ocean, sticky 76px) ─── -->
      <div class="header-bar">
        <div class="header-titles">
          <h1>Gestion Articles</h1>
          <span class="header-sub">Consultation et préparation de la gestion article</span>
        </div>

        <div class="spacer"></div>

        <IconField iconPosition="left" class="search-field">
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" placeholder="Rechercher (réf, description, fabricant, fournisseur)…"
            @input="onSearchInput" />
        </IconField>
      </div>

      <!-- ─── CORPS : single panel pleine largeur ─── -->
      <div class="am-body">
        <div class="glass-card single-panel">
          <DataTable :value="items" :loading="loading" dataKey="itemNo"
            class="midone-table am-table" :rowHover="true" scrollable scrollHeight="flex"
            @row-click="onRowClick">

            <Column field="itemNo" header="Référence" style="min-width: 120px">
              <template #body="{ data }">
                <span class="am-ref">{{ data.itemNo }}</span>
              </template>
            </Column>
            <Column field="descriptionStructured" header="Description" style="min-width: 220px">
              <template #body="{ data }">{{ data.descriptionStructured || data.description || '—' }}</template>
            </Column>
            <Column field="groupName" header="Groupe" style="min-width: 120px">
              <template #body="{ data }">{{ data.groupName || '—' }}</template>
            </Column>
            <Column field="subGroupName" header="Sous-groupe" style="min-width: 120px">
              <template #body="{ data }">{{ data.subGroupName || '—' }}</template>
            </Column>
            <Column field="inventory" header="Stock" style="min-width: 90px">
              <template #body="{ data }">
                <span class="am-badge" :class="toNum(data.inventory) > 0 ? 'ok' : 'muted'">{{ num(data.inventory, 0) }}</span>
              </template>
            </Column>
            <Column field="unitPrice" header="Prix U." style="min-width: 100px">
              <template #body="{ data }"><span class="am-numcell">{{ num(data.unitPrice, 3) }}</span></template>
            </Column>
            <Column field="qtyImport" header="Qté import" style="min-width: 100px">
              <template #body="{ data }">
                <span v-if="toNum(data.qtyImport) > 0" class="am-badge import">{{ num(data.qtyImport, 0) }}</span>
                <span v-else class="am-numcell">{{ num(data.qtyImport, 0) }}</span>
              </template>
            </Column>
            <Column field="masterReference" header="Master" style="min-width: 120px">
              <template #body="{ data }">{{ data.masterReference || '—' }}</template>
            </Column>
            <Column field="oemCount" header="OEM" style="min-width: 80px">
              <template #body="{ data }">
                <span class="am-badge" :class="(data.oemCount || 0) > 0 ? 'info' : 'muted'">{{ data.oemCount || 0 }}</span>
              </template>
            </Column>
            <Column field="unitCost" header="Coût U." style="min-width: 100px">
              <template #body="{ data }"><span class="am-numcell">{{ num(data.unitCost, 3) }}</span></template>
            </Column>
            <Column field="manufacturerCode" header="Code fab." style="min-width: 110px">
              <template #body="{ data }">{{ data.manufacturerCode || '—' }}</template>
            </Column>
            <Column field="vendorNo" header="N° FRS" style="min-width: 100px">
              <template #body="{ data }">{{ data.vendorNo || '—' }}</template>
            </Column>

            <template #empty>
              <div class="am-empty" v-if="!loading">
                <i class="pi pi-inbox"></i>
                <p>Aucun article trouvé.</p>
              </div>
            </template>
          </DataTable>
        </div>
      </div>

      <!-- ─── FOOTER page C2 (48px, navy) ─── -->
      <footer class="cmp-footer">
        <span class="cmp-footer-label">Gestion Articles · {{ totalElements }} article(s)</span>
        <div class="cmp-pagination">
          <Button icon="pi pi-angle-double-left" text rounded size="small" :disabled="page === 0" @click="goPage(0)" />
          <Button icon="pi pi-angle-left" text rounded size="small" :disabled="page === 0" @click="goPage(page - 1)" />
          <span class="cmp-page-box">{{ page + 1 }} / {{ Math.max(totalPages, 1) }}</span>
          <Button icon="pi pi-angle-right" text rounded size="small" :disabled="page >= totalPages - 1" @click="goPage(page + 1)" />
          <Button icon="pi pi-angle-double-right" text rounded size="small" :disabled="page >= totalPages - 1" @click="goPage(totalPages - 1)" />
          <Select v-model="size" :options="[20, 50, 100]" class="rows-dropdown-sm" panelClass="c2-dropdown-panel"
            @change="goPage(0)" />
        </div>
      </footer>
    </main>

    <!-- Dialog détail article -->
    <ArticleManagementDetailDialog
      v-model:visible="dialogVisible"
      :article="selectedArticle"
      :tecdoc-image-url="image.tecdocUrl"
      :bc-picture-url="image.bcUrl"
      :image-loading="image.loading"
      :last-purchase-date="extra.lastPurchaseDate"
      :extra-loading="extra.loading"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import TheNavbar from '../components/TheNavbar.vue'
import ArticleManagementDetailDialog from '../components/article/ArticleManagementDetailDialog.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import articleManagementService from '../api/articleManagementService'
import { useCompareQuoteStore } from '../stores/compareQuote'

const compareStore = useCompareQuoteStore()

/* ── État liste ── */
const items = ref([])
const loading = ref(false)
const page = ref(0)
const size = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const search = ref('')
let searchTimer = null
let reqSeq = 0 // garde anti-réponses obsolètes (recherche rapide / pagination)

const fetchItems = async () => {
  const seq = ++reqSeq
  loading.value = true
  try {
    const data = await articleManagementService.fetchItems({
      page: page.value, size: size.value, search: search.value.trim()
    })
    if (seq !== reqSeq) return // une requête plus récente est partie → on ignore celle-ci
    items.value = data.content || []
    totalElements.value = data.totalElements || 0
    totalPages.value = data.totalPages || 0
  } catch (e) {
    if (seq !== reqSeq) return
    console.error('[GestionArticles] Erreur chargement:', e)
    items.value = []
    totalElements.value = 0
    totalPages.value = 0
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

const goPage = (p) => {
  if (p < 0) return
  page.value = p
  fetchItems()
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 0; fetchItems() }, 350)
}

/* ── Dialog détail + image (TecDoc prioritaire, fallback BC) ── */
const dialogVisible = ref(false)
const selectedArticle = ref(null)
const image = ref({ tecdocUrl: null, bcUrl: null, loading: false })
// Données lourdes chargées à l'ouverture (hors liste) : dernier achat
const extra = ref({ lastPurchaseDate: null, loading: false })

const loadExtra = async (itemNo) => {
  extra.value = { lastPurchaseDate: null, loading: true }
  try {
    const data = await articleManagementService.fetchExtra(itemNo)
    extra.value = { lastPurchaseDate: data?.lastPurchaseDate || null, loading: false }
  } catch (e) {
    console.error('[GestionArticles] Extra:', e)
    extra.value = { lastPurchaseDate: null, loading: false }
  }
}

const revokeBcUrl = () => {
  if (image.value.bcUrl) URL.revokeObjectURL(image.value.bcUrl)
  image.value = { tecdocUrl: null, bcUrl: null, loading: false }
}

const loadArticleImage = async (article) => {
  revokeBcUrl()
  image.value.loading = true
  try {
    // 1) TecDoc prioritaire (si réf fournisseur + id fabricant TecDoc présents)
    if (article?.vendorItemNo && article?.tecdocIdFabricant) {
      try {
        const resp = await compareStore.fetchTecdocArticleDetails(article.vendorItemNo, article.tecdocIdFabricant)
        const art = resp?.articles?.[0]
        const firstImg = (art?.images || []).find(i => i.imageURL800 && !(i.fileName && i.fileName.toUpperCase().endsWith('.ZIP')))
        if (firstImg) { image.value.tecdocUrl = firstImg.imageURL800; image.value.loading = false; return }
      } catch (e) { /* TecDoc indisponible → fallback BC */ }
    }
    // 2) Fallback photo Business Central
    const blob = await compareStore.fetchBcItemPicture(article.itemNo)
    image.value.bcUrl = blob ? URL.createObjectURL(blob) : null
  } catch (e) {
    console.error('[GestionArticles] Image article:', e)
  } finally {
    image.value.loading = false
  }
}

const onRowClick = (event) => {
  selectedArticle.value = event.data
  dialogVisible.value = true
  loadArticleImage(event.data)        // image TecDoc → BC (au clic uniquement)
  loadExtra(event.data.itemNo)        // dernier achat (hors liste)
}

// Révoque le blob BC à la fermeture du dialog
watch(dialogVisible, (open) => { if (!open) revokeBcUrl() })

onMounted(fetchItems)
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer); revokeBcUrl() })

/* ── Helpers d'affichage ── */
const toNum = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? 0 : Number(v)
const num = (v, decimals = 2) => {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—'
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v))
}
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
.main-content { width: 100%; padding: var(--c2-page-pad); --cmp-footer-h: 48px; display: flex; flex-direction: column; height: 100vh; box-sizing: border-box; }

.header-bar {
  display: flex; align-items: center; gap: 1.5rem; padding: 0 1.5rem;
  position: sticky; top: var(--c2-head-sticky-top); z-index: var(--c2-head-z);
  background: var(--c2-head-bg); border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius); box-shadow: var(--c2-head-shadow);
  margin-bottom: var(--c2-head-gap); height: var(--c2-head-h); box-sizing: border-box; flex-shrink: 0;
}
.header-titles { display: flex; flex-direction: column; min-width: 0; }
.header-bar h1 { font-size: 1.25rem; font-weight: 800; color: var(--c2-head-title); margin: 0; white-space: nowrap; }
.header-sub { font-size: 0.74rem; color: var(--c2-head-muted); margin-top: 2px; white-space: nowrap; }
.spacer { flex-grow: 1; }

.search-field { width: 360px; max-width: 42vw; }
.search-field :deep(.p-inputtext) {
  width: 100% !important; height: 38px;
  background: #ffffff !important; border: 1.5px solid #e2e8f0 !important; border-radius: 8px;
  color: #1e293b !important; -webkit-text-fill-color: #1e293b !important; caret-color: #1e293b;
  font-family: inherit !important; font-size: 0.875rem !important; font-weight: 500 !important;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.search-field :deep(.p-inputtext)::placeholder { color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important; font-style: italic; opacity: 1; }
.search-field :deep(.p-inputtext:hover) { border-color: #cbd5e1 !important; }
.search-field :deep(.p-inputtext:focus) { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12); }
.search-field :deep(.p-inputicon), .search-field :deep(.p-iconfield .pi) { color: #94a3b8; }
.search-field:focus-within :deep(.p-inputicon), .search-field:focus-within :deep(.p-iconfield .pi) { color: #3b82f6; }

.am-body { flex: 1; min-height: 0; display: flex; }
.single-panel { width: 100%; display: flex; flex-direction: column; min-width: 0; }
.glass-card {
  background: #fff !important; border: 1px solid #e8edf3 !important; border-radius: 12px !important;
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05) !important; overflow: hidden !important; flex: 1; min-height: 0;
}

:deep(.midone-table.p-datatable),
:deep(.midone-table .p-datatable-header),
:deep(.midone-table .p-datatable-table-container),
:deep(.midone-table .p-datatable-wrapper) { border: none !important; border-radius: 0 !important; background: transparent !important; }
:deep(.midone-table .p-datatable-thead > tr > th) {
  background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; letter-spacing: .02em;
  text-transform: uppercase; padding: 9px 10px; white-space: nowrap; border-bottom: 1.5px solid #e8edf3; border-right: 1px solid #f1f5f9;
}
:deep(.midone-table .p-datatable-thead > tr > th:last-child) { border-right: none; }
:deep(.midone-table .p-datatable-tbody > tr > td) {
  padding: 7px 10px; color: #334155; font-size: 13px; vertical-align: middle;
  border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; white-space: nowrap;
}
:deep(.midone-table .p-datatable-tbody > tr > td:last-child) { border-right: none; }
:deep(.midone-table .p-datatable-tbody > tr:nth-child(even)) { background: #fcfdfe; }
:deep(.midone-table .p-datatable-tbody > tr:hover) { background: #f5f9ff; cursor: pointer; }

.am-ref { font-weight: 700; color: var(--c2-select-accent); font-variant-numeric: tabular-nums; }
.am-numcell { font-variant-numeric: tabular-nums; }
.am-badge {
  display: inline-flex; align-items: center; justify-content: center; min-width: 34px; padding: 1px 8px;
  border-radius: 999px; font-size: .72rem; font-weight: 800; font-variant-numeric: tabular-nums;
}
.am-badge.ok { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; }
.am-badge.muted { color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; }
.am-badge.import { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.am-badge.info { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }

.am-empty { text-align: center; padding: 3rem; color: #94a3b8; }
.am-empty i { font-size: 2.6rem; }
.am-empty p { margin-top: .75rem; }

.cmp-footer {
  flex-shrink: 0; height: var(--cmp-footer-h); margin-top: var(--c2-head-gap); box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 1.5rem;
  background: var(--c2-head-bg); border: 1px solid var(--c2-head-border); border-radius: var(--c2-head-radius);
  box-shadow: var(--c2-head-shadow);
}
.cmp-footer-label { color: #cbd5e1; font-size: .8rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
.cmp-pagination { display: flex; align-items: center; gap: .35rem; }
.cmp-pagination :deep(.p-button.p-button-text) { width: 30px; height: 30px; color: #cbd5e1; transition: background .15s ease, color .15s ease; }
.cmp-pagination :deep(.p-button.p-button-text:not(:disabled):hover) { background: rgba(255, 255, 255, .12); color: #fff; }
.cmp-pagination :deep(.p-button.p-button-text:disabled) { color: rgba(203, 213, 225, .32); opacity: 1; }
.cmp-page-box {
  display: inline-flex; align-items: center; justify-content: center; min-width: 66px; height: 30px; padding: 0 8px; margin: 0 .25rem;
  background: rgba(255, 255, 255, .08); border: 1px solid rgba(255, 255, 255, .16); border-radius: 8px;
  color: #fff; font-weight: 700; font-size: .82rem; font-variant-numeric: tabular-nums;
}
.cmp-pagination :deep(.rows-dropdown-sm.p-select) {
  height: 32px !important; min-height: 32px !important; margin-left: .4rem !important; display: inline-flex !important; align-items: center;
  background: rgba(255, 255, 255, .08) !important; border: 1px solid rgba(255, 255, 255, .16) !important; border-radius: 8px !important; box-shadow: none !important;
}
.cmp-pagination :deep(.rows-dropdown-sm.p-select:hover) { background: rgba(255, 255, 255, .12) !important; border-color: rgba(255, 255, 255, .28) !important; }
.cmp-pagination :deep(.rows-dropdown-sm .p-select-label) { color: #e2e8f0 !important; background: transparent !important; font-size: .82rem !important; font-weight: 600 !important; padding: 0 .15rem 0 .6rem !important; display: flex; align-items: center; }
</style>
