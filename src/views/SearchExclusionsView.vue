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
            <h1>Exclusions Recherches B2B</h1>
            <button class="so-refresh-btn" @click="loadExclusions" :disabled="loading">
              <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              Actualiser
            </button>
          </div>
          <div class="header-right">
            <span class="exclusions-count-badge">
              {{ exclusions.length }} exclusion(s)
            </span>
          </div>
        </div>
      </div>

      <!-- Add Manual Exclusion Form -->
      <div class="add-exclusion-card mb-5">
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
              <button type="submit" class="btn-add" :disabled="adding || !newExclusion.normalizedFilter || !newExclusion.reason">
                <i class="pi" :class="adding ? 'pi-spin pi-spinner' : 'pi-plus'"></i>
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Exclusions Table -->
      <div class="so-table-wrapper">
        <div class="so-table-scroll">
          <table class="so-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Motif de l'exclusion</th>
                <th>Exclu par</th>
                <th>Date d'exclusion</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading Skeletons -->
              <tr v-if="loading" v-for="n in 5" :key="n" class="skeleton-row">
                <td v-for="c in 5" :key="c">
                  <div class="skeleton-cell"></div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-else-if="exclusions.length === 0">
                <td colspan="5" class="so-empty-state text-center">
                  <div class="empty-inner">
                    <i class="pi pi-ban" style="font-size: 2.2rem; color: #94a3b8;"></i>
                    <span class="empty-title">Aucune exclusion</span>
                    <span class="empty-sub">Aucune référence n'a encore été exclue des analyses.</span>
                  </div>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr
                v-else
                v-for="item in exclusions"
                :key="item.id"
                class="so-row"
              >
                <td>
                  <span class="ref-text">{{ item.normalizedFilter }}</span>
                </td>
                <td>
                  <span class="reason-text">{{ item.reason }}</span>
                </td>
                <td>
                  <span class="user-text">{{ item.createdBy }}</span>
                </td>
                <td class="date-cell">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="text-center">
                  <button
                    class="act-btn act-delete"
                    @click="confirmDelete(item)"
                    title="Supprimer l'exclusion"
                    :disabled="deletingId === item.id"
                  >
                    <i class="pi" :class="deletingId === item.id ? 'pi-spin pi-spinner' : 'pi-trash'"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
                <h3 class="modal-title">Supprimer l'exclusion</h3>
                <div class="modal-subtitle">
                  <span class="ref-chip">{{ confirmModal.item?.normalizedFilter }}</span>
                </div>
              </div>
            </div>
            <button class="modal-close-btn" @click="confirmModal.visible = false">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="so-modal-body">
            <p class="modal-warning-text">
              Êtes-vous sûr de vouloir retirer cette référence de la liste d'exclusion ?
              Elle réapparaîtra dans les analyses futures si elle est recherchée à nouveau.
            </p>
          </div>
          <div class="so-modal-footer">
            <button class="btn-secondary" @click="confirmModal.visible = false">Annuler</button>
            <button class="btn-danger" @click="onDeleteExclusion">
              <i class="pi pi-trash"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TheNavbar from '@/components/TheNavbar.vue'
import {
  getSearchExclusions,
  createSearchExclusion,
  deleteSearchExclusion
} from '@/api/searchExclusionService'

const router = useRouter()
const authStore = useAuthStore()

// Access Control
if (!authStore.user) {
  router.push('/')
} else if (!authStore.isAdmin) {
  router.push('/search-opportunities')
}

// State
const exclusions = ref([])
const loading = ref(false)
const adding = ref(false)
const deletingId = ref(null)

const newExclusion = reactive({
  normalizedFilter: '',
  reason: ''
})

const confirmModal = reactive({
  visible: false,
  item: null
})

// Toast
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

// Load List
async function loadExclusions() {
  loading.value = true
  try {
    const res = await getSearchExclusions()
    exclusions.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('[SearchExclusions] load error', e)
    showToast('Erreur lors de la récupération des exclusions.', 'error')
  } finally {
    loading.value = false
  }
}

// Add Exclusion
async function onAddExclusion() {
  if (!newExclusion.normalizedFilter.trim() || !newExclusion.reason.trim()) return
  adding.value = true
  try {
    await createSearchExclusion({
      normalizedFilter: newExclusion.normalizedFilter.trim(),
      reason: newExclusion.reason.trim()
    })
    newExclusion.normalizedFilter = ''
    newExclusion.reason = ''
    showToast('Exclusion ajoutée avec succès.', 'success')
    await loadExclusions()
  } catch (e) {
    console.error('[SearchExclusions] add error', e)
    showToast("Erreur lors de l'ajout de l'exclusion.", 'error')
  } finally {
    adding.value = false
  }
}

// Delete Exclusion
function confirmDelete(item) {
  confirmModal.item = item
  confirmModal.visible = true
}

async function onDeleteExclusion() {
  const item = confirmModal.item
  if (!item) return
  confirmModal.visible = false
  deletingId.value = item.id
  try {
    await deleteSearchExclusion(item.id)
    showToast(`Exclusion pour "${item.normalizedFilter}" supprimée avec succès.`, 'success')
    await loadExclusions()
  } catch (e) {
    console.error('[SearchExclusions] delete error', e)
    showToast("Erreur lors de la suppression de l'exclusion.", 'error')
  } finally {
    deletingId.value = null
  }
}

// Format date helper
function formatDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  if (authStore.isAdmin) {
    loadExclusions()
  }
})
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
.main-content {
  width: 100%;
  padding: 0.5rem 2rem 3rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}

/* Header styling matching opportunities page */
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
  display: flex;
  align-items: center;

}
.header-bar h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
}
.exclusions-count-badge {
  background: #f1f5f9;
  color: #475569;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 600;
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

/* Add Manual Exclusion Card styling */
.add-exclusion-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  padding: 1.2rem;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
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
  min-width: 200px;
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
.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 38px;
  padding: 0 1.25rem;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.12);
}
.btn-add:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-add:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

/* Table Style matching opportunities page */
.so-table-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.so-table-scroll { overflow-x: auto; }
.so-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
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

/* Alternating Row Colors & Hover matching B2B layout */
.so-row { transition: background 0.12s; }
.so-row:nth-child(odd) td { background: #ffffff; }
.so-row:nth-child(even) td { background: #f4f8fd; }
.so-row:hover td { background: #e2effe !important; }

.ref-text {
  font-weight: 700;
  color: #1e3a8a;
  font-family: monospace;
  font-size: 0.85rem;
}
.reason-text { font-weight: 500; color: #334155; }
.user-text { font-size: 0.78rem; color: #475569; font-weight: 500; }
.date-cell { font-size: 0.78rem; color: #64748b; white-space: nowrap; }

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
.act-delete { background: #fef2f2; color: #dc2626; margin: 0 auto; }
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
  font-family: monospace;
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

/* Toast Style matching opportunities page */
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
