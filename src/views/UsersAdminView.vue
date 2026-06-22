<template>
  <div class="page-layout">
    <TheNavbar />
    <main class="main-content">
      <!-- Header sticky navy -->
      <div class="header-bar">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Utilisateurs</h1>
            <div class="rbac-search">
              <i class="pi pi-search"></i>
              <input
                v-model="search"
                type="text"
                placeholder="Rechercher (email, nom)…"
                @keyup.enter="reload(0)"
              />
            </div>
          </div>
          <div class="header-right">
            <button type="button" class="rbac-btn primary" @click="openCreate">
              <i class="pi pi-plus"></i> Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      <!-- Corps : table -->
      <div class="rbac-body">
        <div class="rbac-card">
          <DataTable :value="rows" :loading="loading" dataKey="id" class="rbac-table" scrollable scrollHeight="flex">
            <Column field="email" header="Email" />
            <Column header="Nom">
              <template #body="{ data }">{{ fullName(data) }}</template>
            </Column>
            <Column header="Rôle">
              <template #body="{ data }">
                <span class="rbac-badge" :class="data.superAdmin ? 'badge-super' : 'badge-role'">
                  {{ data.superAdmin ? 'Super-admin' : (data.role || '—') }}
                </span>
              </template>
            </Column>
            <Column header="Statut">
              <template #body="{ data }">
                <span class="rbac-badge" :class="data.active ? 'badge-active' : 'badge-inactive'">
                  {{ data.active ? 'Actif' : 'Inactif' }}
                </span>
              </template>
            </Column>
            <Column header="Société">
              <template #body="{ data }">{{ data.bcCompanyName || '—' }}</template>
            </Column>
            <Column header="Actions">
              <template #body="{ data }">
                <div class="rbac-acts">
                  <button type="button" class="act" title="Modifier"
                    :disabled="isProtectedTarget(data)" @click="openEdit(data)">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button type="button" class="act"
                    :title="data.active ? 'Désactiver' : 'Activer'"
                    :disabled="isProtectedTarget(data) || isSelf(data)"
                    @click="askToggle(data)">
                    <i :class="data.active ? 'pi pi-ban' : 'pi pi-check-circle'"></i>
                  </button>
                  <button type="button" class="act" title="Réinitialiser le mot de passe"
                    :disabled="isProtectedTarget(data)" @click="askReset(data)">
                    <i class="pi pi-key"></i>
                  </button>
                </div>
              </template>
            </Column>
            <template #empty>
              <div class="rbac-empty">Aucun utilisateur.</div>
            </template>
          </DataTable>
        </div>
      </div>

      <!-- Footer page : pagination harmonisée charte C2 (réf. Comparateur) -->
      <footer class="rbac-footer">
        <span class="rbac-footer-label">Utilisateurs</span>
        <div class="users-pagination">
          <Button icon="pi pi-angle-double-left" text rounded size="small"
            :disabled="page === 0" @click="goToPage(0)" />
          <Button icon="pi pi-angle-left" text rounded size="small"
            :disabled="page === 0" @click="goToPage(page - 1)" />
          <span class="users-page-box">{{ page + 1 }}</span>
          <Button icon="pi pi-angle-right" text rounded size="small"
            :disabled="page >= totalPages - 1" @click="goToPage(page + 1)" />
          <Button icon="pi pi-angle-double-right" text rounded size="small"
            :disabled="page >= totalPages - 1" @click="goToPage(totalPages - 1)" />
          <Select v-model="size" :options="[10, 20, 50, 100]"
            class="rows-dropdown-sm" panelClass="c2-dropdown-panel" @change="onSizeChange" />
        </div>
      </footer>
    </main>

    <!-- Modal créer / modifier (teleport body) -->
    <teleport to="body">
      <div v-if="formOpen" class="rbac-overlay" @click.self="closeForm">
        <div class="rbac-modal">
          <div class="rbac-modal-head">
            <h2>{{ editId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</h2>
            <button type="button" class="rbac-x" @click="closeForm"><i class="pi pi-times"></i></button>
          </div>
          <div class="rbac-modal-body">
            <label>Prénom</label>
            <input v-model="form.firstname" type="text" class="rbac-input" />
            <label>Nom</label>
            <input v-model="form.lastname" type="text" class="rbac-input" />
            <label>Email</label>
            <input v-model="form.email" type="email" class="rbac-input" />
            <template v-if="!editId">
              <label>Mot de passe</label>
              <input v-model="form.password" type="password" class="rbac-input" autocomplete="new-password" />
              <small class="rbac-hint">8–20 caractères, majuscule, minuscule, chiffre et symbole.</small>
            </template>

            <!-- Société : éditable UNIQUEMENT par le super-admin (obligatoire) ; lecture seule sinon (RBAC). -->
            <template v-if="isSuperAdmin || editId">
              <label>Société <span v-if="isSuperAdmin" class="rbac-req">*</span></label>
              <Select
                v-if="isSuperAdmin"
                v-model="form.bcCompanyId"
                :options="companies"
                optionLabel="displayName"
                optionValue="id"
                filter
                placeholder="Sélectionner une société…"
                class="rbac-company-select"
                :class="{ 'rbac-invalid': companyError }"
                panelClass="c2-dropdown-panel rbac-company-panel"
                @change="companyError = false"
              />
              <input v-else :value="editCompanyName || '—'" type="text" class="rbac-input" disabled />
              <small v-if="isSuperAdmin && companyError" class="rbac-err">La société est obligatoire.</small>
              <small v-if="!isSuperAdmin" class="rbac-hint">Seul un super-administrateur peut modifier la société.</small>
            </template>
          </div>
          <div class="rbac-modal-foot">
            <button type="button" class="rbac-btn ghost" @click="closeForm">Annuler</button>
            <button type="button" class="rbac-btn primary" :disabled="saving" @click="submitForm">
              {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Modal confirmation (teleport body) -->
    <teleport to="body">
      <div v-if="confirm.open" class="rbac-overlay" @click.self="confirm.open = false">
        <div class="rbac-modal small">
          <div class="rbac-modal-head">
            <h2>{{ confirm.title }}</h2>
            <button type="button" class="rbac-x" @click="confirm.open = false"><i class="pi pi-times"></i></button>
          </div>
          <div class="rbac-modal-body"><p>{{ confirm.message }}</p></div>
          <div class="rbac-modal-foot">
            <button type="button" class="rbac-btn ghost" @click="confirm.open = false">Annuler</button>
            <button type="button" class="rbac-btn primary" @click="confirm.action && confirm.action()">Confirmer</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import { useAuthStore } from '../stores/auth'
import { rbacService } from '../api/rbacService'
import TheNavbar from '../components/TheNavbar.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Garde-fou composant (le router protège déjà via meta.permissions).
if (!(authStore.isSuperAdmin || authStore.hasPermission('USER_MANAGEMENT_ACCESS'))) {
  router.replace('/acces-refuse')
}

const rows = ref([])
const loading = ref(false)
const search = ref('')
const page = ref(0)
const size = ref(10)
const totalRecords = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / size.value)))

const isSuperAdmin = computed(() => authStore.isSuperAdmin)
const companies = ref([])           // liste sociétés BC (chargée pour le super-admin)
const editCompanyName = ref('')     // société courante de l'utilisateur édité (affichage lecture seule)
let editOriginalCompanyId = null    // pour détecter un changement de société

const fullName = (u) => [u.firstname, u.lastname].filter(Boolean).join(' ') || '—'
const isSelf = (u) => u.email && authStore.user?.email && u.email.toLowerCase() === authStore.user.email.toLowerCase()
// On masque les actions sur un super-admin si l'acteur n'est pas lui-même super-admin (le backend renverrait 403).
const isProtectedTarget = (u) => u.superAdmin && !authStore.isSuperAdmin

const notifyError = (e, fallback) => {
  const msg = e?.response?.data?.message || (e?.isForbidden ? 'Accès non autorisé.' : fallback)
  toast.add({ severity: e?.isForbidden ? 'warn' : 'error', summary: e?.isForbidden ? 'Accès refusé' : 'Erreur', detail: msg, life: 5000 })
}

async function reload(toPage) {
  if (typeof toPage === 'number') page.value = toPage
  loading.value = true
  try {
    const data = await rbacService.listUsers({ page: page.value, size: size.value, search: search.value || undefined })
    rows.value = data.content || []
    totalRecords.value = data.totalElements ?? rows.value.length
  } catch (e) {
    notifyError(e, 'Impossible de charger les utilisateurs.')
  } finally {
    loading.value = false
  }
}

function goToPage(p) {
  const target = Math.min(Math.max(0, p), totalPages.value - 1)
  if (target !== page.value) reload(target)
}
function onSizeChange() {
  // Changement de taille de page → on revient à la 1re page.
  reload(0)
}

// ── Formulaire créer / modifier ──
const formOpen = ref(false)
const saving = ref(false)
const editId = ref(null)
const companyError = ref(false)
const form = reactive({ firstname: '', lastname: '', email: '', password: '', bcCompanyId: '' })

function openCreate() {
  editId.value = null
  Object.assign(form, { firstname: '', lastname: '', email: '', password: '', bcCompanyId: null })
  editCompanyName.value = ''
  editOriginalCompanyId = null
  companyError.value = false
  formOpen.value = true
}
function openEdit(u) {
  editId.value = u.id
  Object.assign(form, { firstname: u.firstname || '', lastname: u.lastname || '', email: u.email || '', password: '', bcCompanyId: u.bcCompanyId || null })
  editCompanyName.value = u.bcCompanyName || ''
  editOriginalCompanyId = u.bcCompanyId || null
  companyError.value = false
  formOpen.value = true
}
function closeForm() { formOpen.value = false }

async function submitForm() {
  // Société obligatoire : applicable au super-admin (seul habilité à l'affecter).
  if (isSuperAdmin.value && !form.bcCompanyId) {
    companyError.value = true
    toast.add({ severity: 'warn', summary: 'Champ obligatoire', detail: 'La société est obligatoire.', life: 4000 })
    return
  }
  saving.value = true
  try {
    if (editId.value) {
      await rbacService.updateUser(editId.value, { firstname: form.firstname, lastname: form.lastname, email: form.email })
      // Société : action sensible réservée au super-admin, appelée séparément si modifiée.
      if (isSuperAdmin.value && form.bcCompanyId && form.bcCompanyId !== editOriginalCompanyId) {
        await rbacService.setUserCompany(editId.value, form.bcCompanyId)
      }
      toast.add({ severity: 'success', summary: 'Utilisateur', detail: 'Utilisateur mis à jour.', life: 3500 })
    } else {
      const created = await rbacService.createUser({ firstname: form.firstname, lastname: form.lastname, email: form.email, password: form.password })
      // Affectation société obligatoire à la création (super-admin uniquement).
      if (isSuperAdmin.value && form.bcCompanyId && created?.id) {
        await rbacService.setUserCompany(created.id, form.bcCompanyId)
      }
      toast.add({ severity: 'success', summary: 'Utilisateur', detail: 'Utilisateur créé.', life: 3500 })
    }
    formOpen.value = false
    reload()
  } catch (e) {
    notifyError(e, 'Échec de l\'enregistrement.')
  } finally {
    saving.value = false
  }
}

// ── Confirmations (toggle actif / reset password) ──
const confirm = reactive({ open: false, title: '', message: '', action: null })

function askToggle(u) {
  confirm.title = u.active ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'
  confirm.message = `${u.active ? 'Désactiver' : 'Activer'} le compte « ${u.email} » ?`
  confirm.action = () => doToggle(u)
  confirm.open = true
}
async function doToggle(u) {
  confirm.open = false
  try {
    await rbacService.setActive(u.id, !u.active)
    toast.add({ severity: 'success', summary: 'Statut', detail: !u.active ? 'Utilisateur activé.' : 'Utilisateur désactivé.', life: 3500 })
    reload()
  } catch (e) {
    notifyError(e, 'Échec du changement de statut.')
  }
}

function askReset(u) {
  confirm.title = 'Réinitialiser le mot de passe'
  confirm.message = `Envoyer un mot de passe temporaire à « ${u.email} » ?`
  confirm.action = () => doReset(u)
  confirm.open = true
}
async function doReset(u) {
  confirm.open = false
  try {
    await rbacService.resetPassword(u.id)
    toast.add({ severity: 'success', summary: 'Mot de passe', detail: 'Mot de passe temporaire envoyé à l\'utilisateur.', life: 4000 })
  } catch (e) {
    notifyError(e, 'Échec de la réinitialisation.')
  }
}

async function loadCompanies() {
  // Réservé au super-admin (seul autorisé à affecter une société) → évite un appel BC inutile sinon.
  if (!isSuperAdmin.value) return
  try {
    companies.value = await rbacService.listCompanies()
  } catch (e) {
    // Non bloquant : on n'empêche pas la gestion des utilisateurs si la liste BC échoue.
    console.error('Impossible de charger les sociétés BC')
  }
}

onMounted(() => {
  reload(0)
  loadCompanies()
})
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
.main-content {
  width: 100%; height: 100vh; box-sizing: border-box;
  display: flex; flex-direction: column; padding: var(--c2-page-pad);
  font-family: var(--c2-font-sans);
}

.header-bar {
  flex-shrink: 0; position: sticky; top: var(--c2-head-sticky-top); z-index: var(--c2-head-z);
  background: var(--c2-head-bg); border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius); box-shadow: var(--c2-head-shadow);
  height: var(--c2-head-h); box-sizing: border-box; margin-bottom: var(--c2-head-gap); overflow: hidden;
}
.header-main-row { display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 1.5rem; gap: 1rem; }
.header-left { display: flex; align-items: center; gap: 1.25rem; min-width: 0; }
.header-left h1 { color: var(--c2-head-title); font-size: 1.1rem; font-weight: 800; margin: 0; white-space: nowrap; }

.rbac-search { position: relative; display: flex; align-items: center; }
.rbac-search i { position: absolute; left: 10px; color: #94a3b8; font-size: .85rem; }
.rbac-search input {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px;
  padding: .45rem .6rem .45rem 2rem; font-size: .875rem; font-weight: 500;
  color: #1e293b; font-family: var(--c2-font-sans); min-width: 240px;
}
.rbac-search input::placeholder { color: #94a3b8; font-style: italic; }
.rbac-search input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12); }

.rbac-body { flex: 1; min-height: 0; display: flex; }
.rbac-card {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  background: #fff; border: 1px solid #e8edf3; border-radius: var(--c2-head-radius);
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05); overflow: hidden;
}
.rbac-table { flex: 1; min-height: 0; }
.rbac-empty { padding: 1.25rem; text-align: center; color: #94a3b8; }

.rbac-badge { display: inline-block; border-radius: 999px; font-size: .66rem; font-weight: 800; text-transform: uppercase; padding: .15rem .5rem; }
.badge-active { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; }
.badge-inactive { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
.badge-super { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.badge-role { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }

.rbac-acts { display: flex; gap: 2px; }
.rbac-acts .act {
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px; color: #64748b; cursor: pointer;
}
.rbac-acts .act:hover:not(:disabled) { background: #f5f9ff; color: var(--c2-select-accent); }
.rbac-acts .act:disabled { color: #cbd5e1; cursor: not-allowed; }

.rbac-footer {
  flex-shrink: 0; height: 48px; margin-top: var(--c2-head-gap); box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; padding: 0 1rem 0 1.5rem;
  background: var(--c2-head-bg); border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius); box-shadow: var(--c2-head-shadow);
}
.rbac-footer-label { color: #cbd5e1; font-size: .8rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }

/* ── Pagination footer harmonisée charte C2 (réf. Comparateur) ── */
.users-pagination { display: flex; align-items: center; gap: .35rem; }

/* Flèches : claires, hover discret, disabled estompé */
.users-pagination :deep(.p-button.p-button-text) {
  width: 30px; height: 30px; color: #cbd5e1;
  transition: background .15s ease, color .15s ease;
}
.users-pagination :deep(.p-button.p-button-text:not(:disabled):hover) { background: rgba(255, 255, 255, .12); color: #fff; }
.users-pagination :deep(.p-button.p-button-text:not(:disabled):hover .p-button-icon) { color: #fff; }
.users-pagination :deep(.p-button.p-button-text:disabled) { color: rgba(203, 213, 225, .32); opacity: 1; }

/* Boîte n° page (lisible 3-4 chiffres) */
.users-page-box {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 46px; height: 30px; padding: 0 8px; margin: 0 .25rem;
  background: rgba(255, 255, 255, .08);
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 8px;
  color: #fff; font-weight: 700; font-size: .82rem; font-variant-numeric: tabular-nums;
}

/* Select page-size (fermé) lisible sur navy — panneau ouvert via panelClass="c2-dropdown-panel" */
.users-pagination :deep(.rows-dropdown-sm.p-select) {
  height: 32px !important; min-height: 32px !important; margin-left: .4rem !important;
  display: inline-flex !important; align-items: center;
  background: rgba(255, 255, 255, .08) !important;
  border: 1px solid rgba(255, 255, 255, .16) !important;
  border-radius: 8px !important; box-shadow: none !important;
}
.users-pagination :deep(.rows-dropdown-sm.p-select:hover) { background: rgba(255, 255, 255, .12) !important; border-color: rgba(255, 255, 255, .28) !important; }
.users-pagination :deep(.rows-dropdown-sm.p-select.p-focus) { border-color: var(--c2-focus) !important; box-shadow: 0 0 0 2px rgba(125, 211, 252, .22) !important; }
.users-pagination :deep(.rows-dropdown-sm .p-select-label) { color: #e2e8f0 !important; background: transparent !important; font-size: .82rem !important; font-weight: 600 !important; padding: 0 .15rem 0 .6rem !important; display: flex; align-items: center; }
.users-pagination :deep(.rows-dropdown-sm .p-select-dropdown) { color: #cbd5e1 !important; background: transparent !important; width: 1.7rem !important; }
.users-pagination :deep(.rows-dropdown-sm .p-select-dropdown-icon),
.users-pagination :deep(.rows-dropdown-sm .p-select-dropdown svg),
.users-pagination :deep(.rows-dropdown-sm .p-select-dropdown .p-icon) { color: #cbd5e1 !important; fill: currentColor !important; width: .8rem !important; height: .8rem !important; }

.rbac-btn {
  border-radius: 8px; padding: .5rem 1rem; font-weight: 600; font-size: .85rem;
  font-family: var(--c2-font-sans); cursor: pointer; border: 1px solid transparent;
  display: inline-flex; align-items: center; gap: .4rem;
}
.rbac-btn.primary { background: var(--c2-primary); color: #fff; }
.rbac-btn.primary:hover:not(:disabled) { background: var(--c2-primary-hover); }
.rbac-btn.primary:disabled { background: #cbd5e1; cursor: not-allowed; }
.rbac-btn.ghost { background: #fff; border-color: #e2e8f0; color: #475569; }
.rbac-btn.ghost:hover { background: #f1f5f9; }
.rbac-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }

/* Modals */
.rbac-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, .45);
  display: flex; align-items: center; justify-content: center; z-index: 1200;
}
.rbac-modal {
  background: #fff; border-radius: 12px; width: min(460px, 94vw);
  box-shadow: 0 20px 50px rgba(15, 23, 42, .3); font-family: var(--c2-font-sans); overflow: hidden;
}
.rbac-modal.small { width: min(420px, 94vw); }
.rbac-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; background: var(--c2-head-bg); border-bottom: 1px solid var(--c2-head-border);
}
.rbac-modal-head h2 { color: #fff; font-size: 1rem; font-weight: 800; margin: 0; }
.rbac-x { background: transparent; border: none; color: #cbd5e1; cursor: pointer; font-size: 1rem; }
.rbac-x:hover { color: #fff; }
.rbac-modal-body { padding: 1.25rem; display: flex; flex-direction: column; }
.rbac-modal-body label { font-size: .8rem; font-weight: 700; color: #475569; margin: .5rem 0 .25rem; }
.rbac-modal-body p { color: #475569; font-size: .9rem; margin: 0; }
.rbac-input {
  border: 1.5px solid #e2e8f0; border-radius: 8px; padding: .5rem .6rem; font-size: .875rem;
  color: #1e293b; font-family: var(--c2-font-sans);
}
.rbac-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12); }
.rbac-hint { color: #94a3b8; font-size: .74rem; margin-top: .25rem; }
.rbac-req { color: #dc2626; font-weight: 800; }
.rbac-err { color: #dc2626; font-size: .74rem; margin-top: .25rem; }
:deep(.rbac-company-select.rbac-invalid.p-select) { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220, 38, 38, .12) !important; }
/* La classe est posée SUR le .p-select lui-même → sélecteur compound (pas descendant). Réf. B2B. */
:deep(.rbac-company-select.p-select) {
  width: 100% !important; height: 40px !important; background: #fff !important;
  border: 1.5px solid #e2e8f0 !important; border-radius: 8px !important;
  display: flex !important; align-items: center !important;
  transition: border-color .2s, box-shadow .2s !important; cursor: pointer !important;
}
:deep(.rbac-company-select.p-select:hover) { border-color: #cbd5e1 !important; }
:deep(.rbac-company-select.p-select.p-focus) { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12) !important; outline: none !important; }
:deep(.rbac-company-select .p-select-label) {
  font-size: .875rem !important; color: #1e293b !important; font-weight: 500 !important;
  display: flex !important; align-items: center !important; padding: 0 .75rem !important; height: 100% !important;
}
:deep(.rbac-company-select .p-select-label.p-placeholder) { color: #94a3b8 !important; font-style: italic !important; }
:deep(.rbac-company-select .p-select-dropdown) { color: #94a3b8 !important; width: 2rem !important; display: flex !important; align-items: center !important; justify-content: center !important; }
:deep(.rbac-company-select .p-select-clear-icon) { color: #94a3b8 !important; }
.rbac-modal-foot { display: flex; justify-content: flex-end; gap: .6rem; padding: 1rem 1.25rem; border-top: 1px solid #f1f5f9; }
</style>

<!-- Non-scopé : le panneau du Select est téléporté dans <body> (hors DOM scopé).
     La modale a z-index 1200 → on force le panneau société AU-DESSUS pour qu'il
     ne s'affiche plus sous le dialog (cf. capture). -->
<style>
.rbac-company-panel.p-select-overlay { z-index: 2000 !important; }
</style>
