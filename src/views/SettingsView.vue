<template>
  <div class="page-layout">
    <TheNavbar />

    <!-- Toast Notification -->
    <Transition name="toast-slide">
      <div v-if="toast.visible" class="so-toast" :class="toast.type">
        <i class="pi" :class="toast.type === 'success' ? 'pi-check-circle' : 'pi-exclamation-circle'"></i>
        <span>{{ toast.message }}</span>
        <button class="toast-dismiss" @click="toast.visible = false">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </Transition>

    <main class="main-content">
      <!-- Header Bar -->
      <div class="header-bar mb-5">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Paramètres d'Analyse</h1>
            <button class="so-refresh-btn" @click="loadCurrentTab" :disabled="loading">
              <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              Actualiser
            </button>
          </div>
          <div v-if="isExclusionsTab" class="header-right">
            <span class="count-badge">{{ exclusions.length }} exclusion(s)</span>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid -->
      <div class="settings-grid">
        <!-- Sidebar Navigation (Left Tab Selectors) -->
        <aside class="settings-sidebar">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'diagnostic' }"
            @click="switchTab('diagnostic')"
          >
            <i class="pi pi-file-edit"></i>
            <span>Statuts Diagnostic</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'action' }"
            @click="switchTab('action')"
          >
            <i class="pi pi-directions"></i>
            <span>Types d'Action</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'exclusions' }"
            @click="switchTab('exclusions')"
          >
            <i class="pi pi-ban"></i>
            <span>Exclusions B2B</span>
          </button>
        </aside>

        <!-- Right Content Column -->
        <section class="settings-body">
          <template v-if="!isExclusionsTab">
            <!-- Card for Add or Edit Option -->
            <div class="option-form-card mb-5">
              <div class="card-header">
                <i class="pi" :class="editingItem ? 'pi-pencil' : 'pi-plus-circle'"></i>
                <h3>
                  {{ editingItem ? ("Modifier l'option (" + activeTabTitle + ")") : ("Ajouter une option (" + activeTabTitle + ")") }}
                </h3>
                <button v-if="editingItem" @click="cancelEdit" class="btn-cancel-edit">
                  Annuler la modification
                </button>
              </div>
              <form @submit.prevent="onSubmitForm" class="add-form">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label required">Code unique *</label>
                    <input
                      type="text"
                      v-model="form.code"
                      class="form-input"
                      placeholder="Ex: MA_NOUVELLE_OPTION (lettres majuscules, chiffres et tirets bas)"
                      :disabled="!!editingItem"
                      required
                    />
                  </div>
                  <div class="form-group flex-2">
                    <label class="form-label required">Libellé (Affiché) *</label>
                    <input
                      type="text"
                      v-model="form.label"
                      class="form-input"
                      placeholder="Ex: Ma nouvelle option de clôture..."
                      required
                    />
                  </div>
                  <div class="form-group action-group">
                    <button type="submit" class="btn-save" :disabled="submitting || !form.code || !form.label">
                      <i class="pi" :class="submitting ? 'pi-spin pi-spinner' : 'pi-check'"></i>
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Options List Table -->
            <div class="so-table-wrapper">
              <div class="table-header-title">
                <i class="pi pi-list"></i>
                <span>Liste des options configurées ({{ items.length }})</span>
              </div>
              <div class="so-table-scroll">
                <table class="so-table">
                  <thead>
                    <tr>
                      <th>Code Unique</th>
                      <th>Libellé / Affichage</th>
                      <th class="text-center" style="width: 150px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading" v-for="n in 3" :key="n" class="skeleton-row">
                      <td v-for="c in 3" :key="c">
                        <div class="skeleton-cell"></div>
                      </td>
                    </tr>

                    <tr v-else-if="items.length === 0">
                      <td colspan="3" class="so-empty-state text-center">
                        <div class="empty-inner">
                          <i class="pi pi-sliders-h" style="font-size: 2.2rem; color: #94a3b8;"></i>
                          <span class="empty-title">Aucune option configurée</span>
                          <span class="empty-sub">Créez une option ci-dessus pour commencer.</span>
                        </div>
                      </td>
                    </tr>

                    <tr
                      v-else
                      v-for="item in items"
                      :key="item.id"
                      class="so-row"
                      :class="{ 'editing-row': editingItem && editingItem.id === item.id }"
                    >
                      <td>
                        <span class="code-badge">{{ item.code }}</span>
                      </td>
                      <td>
                        <span class="label-text">{{ item.label }}</span>
                      </td>
                      <td class="text-center">
                        <div class="row-actions">
                          <button
                            class="act-btn act-edit"
                            @click="startEdit(item)"
                            title="Modifier le libellé"
                          >
                            <i class="pi pi-pencil"></i>
                          </button>
                          <button
                            class="act-btn act-delete"
                            @click="confirmDelete(item)"
                            title="Supprimer l'option"
                            :disabled="deletingId === item.id"
                          >
                            <i class="pi" :class="deletingId === item.id ? 'pi-spin pi-spinner' : 'pi-trash'"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="option-form-card mb-5">
              <div class="card-header">
                <i class="pi pi-plus-circle"></i>
                <h3>Ajouter une exclusion manuellement</h3>
              </div>
              <form @submit.prevent="onAddExclusion" class="add-form">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label required">Référence normalisée *</label>
                    <input
                      type="text"
                      v-model="newExclusion.normalizedFilter"
                      class="form-input"
                      placeholder="Ex: ABC123"
                      required
                    />
                  </div>
                  <div class="form-group flex-2">
                    <label class="form-label required">Motif de l'exclusion *</label>
                    <input
                      type="text"
                      v-model="newExclusion.reason"
                      class="form-input"
                      placeholder="Ex: Erreur de frappe récurrente..."
                      required
                    />
                  </div>
                  <div class="form-group action-group">
                    <button type="submit" class="btn-save" :disabled="addingExclusion || !newExclusion.normalizedFilter || !newExclusion.reason">
                      <i class="pi" :class="addingExclusion ? 'pi-spin pi-spinner' : 'pi-plus'"></i>
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div class="so-table-wrapper">
              <div class="table-header-title">
                <i class="pi pi-list"></i>
                <span>Liste des exclusions ({{ exclusions.length }})</span>
              </div>
              <div class="so-table-scroll">
                <table class="so-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Motif de l'exclusion</th>
                      <th>Exclu par</th>
                      <th>Date d'exclusion</th>
                      <th class="text-center" style="width: 120px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading" v-for="n in 4" :key="'sk-ex-' + n" class="skeleton-row">
                      <td v-for="c in 5" :key="c">
                        <div class="skeleton-cell"></div>
                      </td>
                    </tr>

                    <tr v-else-if="exclusions.length === 0">
                      <td colspan="5" class="so-empty-state text-center">
                        <div class="empty-inner">
                          <i class="pi pi-ban" style="font-size: 2.2rem; color: #94a3b8;"></i>
                          <span class="empty-title">Aucune exclusion</span>
                          <span class="empty-sub">Aucune référence n'a encore été exclue.</span>
                        </div>
                      </td>
                    </tr>

                    <tr v-else v-for="item in exclusions" :key="item.id" class="so-row">
                      <td><span class="code-badge">{{ item.normalizedFilter }}</span></td>
                      <td><span class="label-text">{{ item.reason }}</span></td>
                      <td><span class="user-text">{{ item.createdBy }}</span></td>
                      <td class="date-cell">{{ formatDate(item.createdAt) }}</td>
                      <td class="text-center">
                        <div class="row-actions">
                          <button
                            class="act-btn act-delete"
                            @click="confirmDeleteExclusion(item)"
                            title="Supprimer l'exclusion"
                            :disabled="deletingExclusionId === item.id"
                          >
                            <i class="pi" :class="deletingExclusionId === item.id ? 'pi-spin pi-spinner' : 'pi-trash'"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </section>
      </div>

      <!-- Footer de page (charte C2, structure standard §8.9) — discret, libellé structurel -->
      <footer class="set-footer">
        <span class="set-footer-label">Paramètres d'Analyse</span>
        <span class="set-footer-sub">Administration</span>
      </footer>
    </main>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="confirmModal.visible" class="so-modal-overlay" @click.self="confirmModal.visible = false">
        <div class="so-modal so-delete-modal">
          <div class="so-modal-header">
            <div class="modal-title-wrap">
              <div class="modal-icon-wrap red">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div>
                <h3 class="modal-title">{{ confirmModal.mode === 'exclusion' ? "Supprimer l'exclusion" : "Supprimer l'option" }}</h3>
                <div class="modal-subtitle">
                  <span class="ref-chip">{{ confirmModal.mode === 'exclusion' ? confirmModal.item?.normalizedFilter : confirmModal.item?.code }}</span>
                </div>
              </div>
            </div>
            <button class="modal-close-btn" @click="confirmModal.visible = false">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="so-modal-body">
            <p class="modal-warning-text">
              <template v-if="confirmModal.mode === 'exclusion'">
                Êtes-vous sûr de vouloir retirer cette référence de la liste d'exclusion ?
                Elle réapparaîtra dans les analyses futures si elle est recherchée à nouveau.
              </template>
              <template v-else>
                Êtes-vous sûr de vouloir supprimer cette option ?
                <br /><br />
                <strong>Attention :</strong> La suppression échouera si cette option a déjà été sélectionnée lors de la clôture d'opportunités passées.
              </template>
            </p>
          </div>
          <div class="so-modal-footer">
            <button class="btn-secondary" @click="confirmModal.visible = false">Annuler</button>
            <button class="btn-danger" @click="onConfirmDelete">
              <i class="pi pi-trash"></i> {{ confirmModal.mode === 'exclusion' ? 'Supprimer' : 'Supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TheNavbar from '@/components/TheNavbar.vue'

// Import API Services
import {
  getDiagnosticOptions,
  createDiagnosticOption,
  updateDiagnosticOption,
  deleteDiagnosticOption
} from '@/api/diagnosticOptionService'

import {
  getActionOptions,
  createActionOption,
  updateActionOption,
  deleteActionOption
} from '@/api/actionOptionService'
import {
  getSearchExclusions,
  createSearchExclusion,
  deleteSearchExclusion
} from '@/api/searchExclusionService'

const router = useRouter()
const authStore = useAuthStore()

// Access Control - Restricted to admin
if (!authStore.user) {
  router.push('/')
} else if (!authStore.isAdmin) {
  router.push('/search-opportunities')
}

// Tabs state
const activeTab = ref('diagnostic') // 'diagnostic' | 'action' | 'exclusions'
const activeTabTitle = computed(() => {
  if (activeTab.value === 'diagnostic') return 'Diagnostic'
  if (activeTab.value === 'action') return 'Action'
  return 'Exclusions'
})
const isExclusionsTab = computed(() => activeTab.value === 'exclusions')

// Options List Data
const items = ref([])
const loading = ref(false)
const submitting = ref(false)
const deletingId = ref(null)
const exclusions = ref([])
const addingExclusion = ref(false)
const deletingExclusionId = ref(null)
const newExclusion = reactive({
  normalizedFilter: '',
  reason: ''
})

// Form state
const form = reactive({
  code: '',
  label: ''
})
const editingItem = ref(null)

// Modal Confirmation state
const confirmModal = reactive({
  visible: false,
  item: null,
  mode: 'option'
})

// Toast notification state
const toast = reactive({
  visible: false,
  message: '',
  type: 'success'
})
let toastTimer = null

function showToast(message, type = 'success') {
  clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 4500)
}

// Switch tabs and load items
function switchTab(tab) {
  activeTab.value = tab
  cancelEdit()
  loadCurrentTab()
}

// Load current tab data from API
async function loadCurrentTab() {
  loading.value = true
  try {
    if (isExclusionsTab.value) {
      const res = await getSearchExclusions()
      exclusions.value = Array.isArray(res.data) ? res.data : []
    } else {
      const apiCall = activeTab.value === 'diagnostic' ? getDiagnosticOptions : getActionOptions
      const res = await apiCall()
      items.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.error('[Settings] load error', e)
    showToast(isExclusionsTab.value
      ? 'Erreur lors du chargement des exclusions.'
      : 'Erreur lors du chargement des options.', 'error')
  } finally {
    loading.value = false
  }
}

// Submit Form (Create or Update)
async function onSubmitForm() {
  if (isExclusionsTab.value) return
  if (!form.code.trim() || !form.label.trim()) return

  // Format code validation: alphanumeric and underscore only, uppercase
  const cleanCode = form.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const cleanLabel = form.label.trim()

  submitting.value = true
  try {
    if (editingItem.value) {
      // Update Mode (only update label)
      const apiUpdate = activeTab.value === 'diagnostic' ? updateDiagnosticOption : updateActionOption
      await apiUpdate(editingItem.value.id, { label: cleanLabel })
      showToast('Option modifiée avec succès.', 'success')
    } else {
      // Create Mode
      const apiCreate = activeTab.value === 'diagnostic' ? createDiagnosticOption : createActionOption
      await apiCreate({
        code: cleanCode,
        label: cleanLabel
      })
      showToast('Option créée avec succès.', 'success')
    }
    cancelEdit()
    await loadCurrentTab()
  } catch (e) {
    console.error('[Settings] submit error', e)
    const errorMsg = e.response?.data?.message || "Erreur lors de l'enregistrement."
    showToast(errorMsg, 'error')
  } finally {
    submitting.value = false
  }
}

// Start editing an option
function startEdit(item) {
  editingItem.value = item
  form.code = item.code
  form.label = item.label
}

// Cancel edit mode
function cancelEdit() {
  editingItem.value = null
  form.code = ''
  form.label = ''
}

// Confirm Delete Dialog
function confirmDelete(item) {
  confirmModal.mode = 'option'
  confirmModal.item = item
  confirmModal.visible = true
}

// Perform option deletion on API
async function onDeleteOption() {
  const item = confirmModal.item
  if (!item) return
  confirmModal.visible = false
  deletingId.value = item.id

  try {
    const apiDelete = activeTab.value === 'diagnostic' ? deleteDiagnosticOption : deleteActionOption
    await apiDelete(item.id)
    showToast(`Option "${item.code}" supprimée avec succès.`, 'success')
    cancelEdit()
    await loadCurrentTab()
  } catch (e) {
    console.error('[Settings] delete error', e)
    const errorMsg = e.response?.data?.message || "Erreur lors de la suppression de l'option."
    showToast(errorMsg, 'error')
  } finally {
    deletingId.value = null
  }
}

function confirmDeleteExclusion(item) {
  confirmModal.mode = 'exclusion'
  confirmModal.item = item
  confirmModal.visible = true
}

async function onDeleteExclusion() {
  const item = confirmModal.item
  if (!item) return
  confirmModal.visible = false
  deletingExclusionId.value = item.id
  try {
    await deleteSearchExclusion(item.id)
    showToast(`Exclusion pour "${item.normalizedFilter}" supprimée avec succès.`, 'success')
    await loadCurrentTab()
  } catch (e) {
    console.error('[Settings] exclusion delete error', e)
    const errorMsg = e.response?.data?.message || "Erreur lors de la suppression de l'exclusion."
    showToast(errorMsg, 'error')
  } finally {
    deletingExclusionId.value = null
  }
}

async function onAddExclusion() {
  if (!newExclusion.normalizedFilter.trim() || !newExclusion.reason.trim()) return
  addingExclusion.value = true
  try {
    await createSearchExclusion({
      normalizedFilter: newExclusion.normalizedFilter.trim(),
      reason: newExclusion.reason.trim()
    })
    newExclusion.normalizedFilter = ''
    newExclusion.reason = ''
    showToast('Exclusion ajoutée avec succès.', 'success')
    await loadCurrentTab()
  } catch (e) {
    console.error('[Settings] exclusion add error', e)
    const errorMsg = e.response?.data?.message || "Erreur lors de l'ajout de l'exclusion."
    showToast(errorMsg, 'error')
  } finally {
    addingExclusion.value = false
  }
}

function onConfirmDelete() {
  if (confirmModal.mode === 'exclusion') {
    return onDeleteExclusion()
  }
  return onDeleteOption()
}

function formatDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  if (authStore.isAdmin) {
    loadCurrentTab()
  }
})
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
/* Shell charte C2 (§12) : flex column plein viewport → header + corps (grid, body scroll
   interne) + footer 48px toujours visible. */
.main-content {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--c2-page-pad) var(--c2-page-pad);
  --set-footer-h: 48px;
}

@media (max-width: 768px) {
  .main-content {
    height: auto;
    min-height: 100vh;
    padding: 1rem;
  }
}

/* Header bar styling */
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
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.header-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.header-right {
  display: flex;
  align-items: center;

}
.count-badge {
  background: #f1f5f9;
  color: #475569;
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
}
.header-bar h1 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--c2-head-title);
  margin: 0;
  white-space: nowrap;
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
}
.so-refresh-btn:hover:not(:disabled) {
  border-color: #1e40af;
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.08);
}
.so-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Grid Layout for vertical sidebar + main panel */
.settings-grid {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Barre d'onglets HORIZONTALE (fixe en haut) + contenu pleine largeur qui scrolle EN INTERNE (charte §12). */
.settings-sidebar { flex-shrink: 0; }
.settings-body { flex: 1; min-height: 0; overflow-y: auto; }

/* Footer de page standard C2 (§8/§8.9) — navy 48px, aligné footer sidebar, discret. */
.set-footer {
  flex-shrink: 0;
  height: var(--set-footer-h);
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
.set-footer-label { color: #e2e8f0; font-size: .82rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
.set-footer-sub { color: #94a3b8; font-size: .76rem; font-weight: 600; white-space: nowrap; }

/* Barre d'onglets HORIZONTALE (carte blanche, tabs en ligne) */
.settings-sidebar {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0.5rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  width: auto;
  padding: 0.6rem 1.1rem;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.tab-btn.active {
  background: #eff6ff;
  color: var(--c2-select-accent);   /* Cobalt (charte §4/§11) au lieu du bleu en dur */
}

.tab-btn .pi {
  font-size: 1rem;
}

/* Form Card */
.option-form-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  padding: 1.2rem;
  transition: border-color 0.20s;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}
.card-header .pi {
  color: #3b82f6;
  font-size: 1.1rem;
}
.card-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-cancel-edit {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.btn-cancel-edit:hover {
  color: #b91c1c;
}

.add-form { width: 100%; }
.form-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 220px;
}
.form-group.flex-2 { flex: 2; }
.form-group.action-group {
  flex: 0 0 auto;
  min-width: unset;
}
.form-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.form-input {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: all 0.15s;
  height: 38px;
}
.form-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  background: #fff;
}
.form-input:disabled {
  background: #e2e8f0;
  color: #64748b;
  cursor: not-allowed;
}
.field-hint {
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 1px;
}

/* Bouton d'action principale = modèle « Rechercher » du panneau filtres B2B
   (charte §10.1, réf. .filter-btn-search). À réutiliser pour tout bouton de ce sens. */
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  padding: 0 1.25rem;
  background: var(--c2-primary);
  color: #fff;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: .01em;
  cursor: pointer;
  transition: background .15s ease, box-shadow .15s ease, transform .15s ease;
}
.btn-save .pi { font-size: .85rem; }
.btn-save:hover:not(:disabled) {
  background: var(--c2-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 89, 179, 0.30);
}
.btn-save:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 6px rgba(24, 89, 179, 0.24); }
.btn-save:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.btn-save:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Options List Table */
.so-table-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.2rem;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.88rem;
}
.table-header-title .pi {
  color: #64748b;
}

.so-table-scroll { overflow-x: auto; }
.so-table {
  width: 100%;
  border-collapse: collapse;
}
.so-table thead tr {
  background: #f8fafc;
}
.so-table th {
  padding: 0.75rem 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
}
.so-table td {
  padding: 0.75rem 1rem;
  font-size: 0.825rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.editing-row td {
  background: #fefbeb !important;
}

/* Alternating Row Colors */
.so-row { transition: background 0.12s; }
.so-row:nth-child(odd) td { background: #ffffff; }
.so-row:nth-child(even) td { background: #f4f8fd; }
.so-row:hover td { background: #e2effe !important; }

.code-badge {
  font-family: var(--c2-font-sans);   /* §14.8 : code métier en sans + tabular-nums, jamais mono */
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #0f172a;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.label-text {
  font-weight: 600;
  color: #334155;
}
.user-text {
  color: #334155;
  font-weight: 500;
}
.date-cell {
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.act-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.act-edit { background: #eff6ff; color: #1d4ed8; }
.act-edit:hover { background: #1d4ed8; color: #fff; transform: translateY(-1px); }

.act-delete { background: #fef2f2; color: #dc2626; }
.act-delete:hover:not(:disabled) {
  background: #dc2626;
  color: #fff;
  transform: translateY(-1px);
}
.act-delete:disabled { opacity: 0.5; cursor: not-allowed; }

/* Empty state */
.so-empty-state { padding: 4rem 1rem; }
.empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.empty-title { font-size: 1rem; font-weight: 600; color: #475569; margin-top: 0.5rem; }
.empty-sub { font-size: 0.85rem; color: #94a3b8; }

/* Skeleton */
.skeleton-row td { padding: 0.9rem 1rem; }
.skeleton-cell {
  height: 14px;
  border-radius: 6px;
  background: #e2e8f0;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
}

/* Modal Overlay & Delete Modal styling */
.so-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1001;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.18s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.so-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.22s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.so-delete-modal { width: 500px; max-width: 95vw; }

.so-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}
.modal-title-wrap { display: flex; align-items: center; gap: 1rem; }
.modal-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.modal-icon-wrap.red { background: linear-gradient(135deg, #ef4444, #b91c1c); }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
.modal-subtitle { margin-top: 2px; }
.ref-chip {
  background: #fef2f2; color: #ef4444; border: 1px solid #fca5a5;
  border-radius: 20px; padding: 2px 12px; font-size: 0.8rem; font-weight: 700;
  font-family: var(--c2-font-sans);   /* §14.8 : réf métier en sans + tabular-nums */
  font-variant-numeric: tabular-nums;
}
.modal-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.modal-close-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

.so-modal-body {
  padding: 1.5rem;
}
.modal-warning-text {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.so-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}
.btn-secondary {
  padding: 0.55rem 1.2rem;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-danger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.4rem;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}
.btn-danger:hover { opacity: 0.9; transform: translateY(-1px); }

/* Toast Style */
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
.so-toast .pi { font-size: 1.1rem; flex-shrink: 0; }
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
  transition: opacity 0.15s;
}
.toast-dismiss:hover { opacity: 1; }

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-slide-enter-from { opacity: 0; transform: translateX(30px); }
.toast-slide-leave-to { opacity: 0; transform: translateX(30px); }

.text-center { text-align: center; }
.mb-5 { margin-bottom: 1.25rem; }
</style>

