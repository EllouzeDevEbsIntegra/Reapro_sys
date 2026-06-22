<template>
  <div class="page-layout">
    <TheNavbar />
    <main class="main-content">
      <!-- Header -->
      <div class="header-bar">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Autorisations</h1>
            <!-- Sélecteur utilisateur harmonisé (réf. sélecteur client B2B) -->
            <div class="user-select-wrapper">
              <i class="pi pi-user select-icon"></i>
              <Select
                v-model="selectedUserId"
                :options="users"
                :optionLabel="userFilterLabel"
                optionValue="id"
                placeholder="Choisir un utilisateur…"
                filter
                autoFilterFocus
                filterPlaceholder="Rechercher par email ou nom…"
                showClear
                class="user-select"
                panelClass="c2-dropdown-panel"
                @change="onSelectUser"
              >
                <template #option="{ option }">
                  <div class="option-row">
                    <span class="option-code">{{ roleShort(option) }}</span>
                    <span class="option-sep">—</span>
                    <span class="option-name">{{ option.email }}</span>
                  </div>
                </template>
                <template #value="{ value }">
                  <div v-if="value" class="selected-row">
                    <span class="option-code">{{ roleShort(selectedUser) }}</span>
                    <span class="option-sep">—</span>
                    <span class="selected-name">{{ selectedUser?.email }}</span>
                  </div>
                  <span v-else class="select-ph">Choisir un utilisateur…</span>
                </template>
              </Select>
            </div>
          </div>
          <div class="header-right">
            <span v-if="!isSuperActor" class="rbac-note-head">
              <i class="pi pi-info-circle"></i> Permissions sensibles réservées au super-administrateur
            </span>
          </div>
        </div>
      </div>

      <!-- Corps -->
      <div class="rbac-body">
        <div class="rbac-card">
          <div v-if="!selectedUserId" class="rbac-placeholder">
            Sélectionnez un utilisateur pour gérer ses autorisations.
          </div>

          <div v-else class="rbac-perm-scroll">
            <div v-if="targetSuperAdmin" class="rbac-super-note">
              <i class="pi pi-shield"></i>
              Cet utilisateur est <b>super-administrateur</b> : il possède automatiquement toutes les permissions.
            </div>

            <div v-for="group in groupedPermissions" :key="group.name" class="rbac-group">
              <div class="rbac-group-title">{{ group.name }}</div>
              <div class="rbac-perm-list">
                <label
                  v-for="p in group.items"
                  :key="p.code"
                  class="rbac-perm"
                  :class="{ disabled: !canEdit(p) }"
                >
                  <input
                    type="checkbox"
                    :checked="hasPerm(p.code)"
                    :disabled="!canEdit(p) || busy"
                    @change="onToggle(p, $event.target.checked)"
                  />
                  <span class="rbac-perm-main">
                    <span class="rbac-perm-label">
                      {{ p.label || p.code }}
                      <span v-if="p.sensitive || p.type === 'ADMIN'" class="rbac-tag-sensitive">sensible</span>
                    </span>
                    <span class="rbac-perm-code">{{ p.code }}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="rbac-footer">
        <span class="rbac-footer-label">Autorisations</span>
        <span class="rbac-footer-sub">{{ selectedUserLabel || 'Aucun utilisateur sélectionné' }}</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import { useAuthStore } from '../stores/auth'
import { rbacService } from '../api/rbacService'
import TheNavbar from '../components/TheNavbar.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

if (!(authStore.isSuperAdmin || authStore.hasPermission('PERMISSION_ASSIGNMENT_ACCESS'))) {
  router.replace('/acces-refuse')
}

const isSuperActor = computed(() => authStore.isSuperAdmin)

const users = ref([])
const permissions = ref([])
const selectedUserId = ref(null)
const userPerms = ref(new Set())
const busy = ref(false)

// Libellé utilisé par le filtre du Select (recherche par email + nom).
const userFilterLabel = (u) => `${u.email || ''} ${u.firstname || ''} ${u.lastname || ''}`.trim()
// Code court affiché en chip (façon code client B2B) : SUPER / ADMIN / USER.
const roleShort = (u) => {
  if (!u) return ''
  if (u.superAdmin) return 'SUPER'
  return (u.role || '').replace('ROLE_', '') || 'USER'
}
const selectedUser = computed(() => users.value.find((u) => u.id === selectedUserId.value) || null)
const selectedUserLabel = computed(() => (selectedUser.value ? selectedUser.value.email : ''))
const targetSuperAdmin = computed(() => !!selectedUser.value?.superAdmin)

const groupedPermissions = computed(() => {
  const map = new Map()
  for (const p of permissions.value) {
    const g = p.group || 'Autres'
    if (!map.has(g)) map.set(g, [])
    map.get(g).push(p)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

const isSensitive = (p) => p.sensitive || p.type === 'ADMIN'
const hasPerm = (code) => targetSuperAdmin.value || userPerms.value.has(code)
// Un permission manager non super-admin ne peut pas cocher les permissions sensibles ;
// et personne (hors super-admin) ne modifie un compte super-admin.
const canEdit = (p) => {
  if (targetSuperAdmin.value) return false
  if (isSensitive(p) && !isSuperActor.value) return false
  return true
}

const notifyError = (e, fallback) => {
  const msg = e?.response?.data?.message || (e?.isForbidden ? 'Permission sensible : action réservée au super-administrateur.' : fallback)
  toast.add({ severity: e?.isForbidden ? 'warn' : 'error', summary: e?.isForbidden ? 'Accès refusé' : 'Erreur', detail: msg, life: 5000 })
}

async function loadUsers() {
  try {
    const data = await rbacService.listUsers({ page: 0, size: 200 })
    users.value = data.content || []
  } catch (e) {
    notifyError(e, 'Impossible de charger les utilisateurs.')
  }
}
async function loadPermissions() {
  try {
    permissions.value = await rbacService.listPermissions()
  } catch (e) {
    notifyError(e, 'Impossible de charger les permissions.')
  }
}
async function onSelectUser() {
  if (!selectedUserId.value) {
    userPerms.value = new Set()
    return
  }
  try {
    const codes = await rbacService.getUserPermissions(selectedUserId.value)
    userPerms.value = new Set(codes || [])
  } catch (e) {
    notifyError(e, 'Impossible de charger les permissions de l\'utilisateur.')
  }
}

async function onToggle(p, checked) {
  if (busy.value) return
  busy.value = true
  try {
    const detail = checked
      ? await rbacService.assignPermissions(selectedUserId.value, [p.code])
      : await rbacService.revokePermissions(selectedUserId.value, [p.code])
    // Recale l'état local sur la réponse backend (source de vérité).
    userPerms.value = new Set(detail?.permissions || [])
    toast.add({
      severity: 'success',
      summary: 'Autorisations',
      detail: checked ? `Permission « ${p.code} » attribuée.` : `Permission « ${p.code} » retirée.`,
      life: 3000
    })
  } catch (e) {
    notifyError(e, 'Échec de la mise à jour de la permission.')
    // En cas d'échec, on resynchronise depuis le backend pour rétablir l'état réel des cases.
    await onSelectUser()
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadPermissions()])
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
.rbac-note-head { color: #cbd5e1; font-size: .78rem; display: inline-flex; align-items: center; gap: .35rem; }

/* ── Sélecteur utilisateur harmonisé (réf. sélecteur client B2B) ── */
.user-select-wrapper { position: relative; display: flex; align-items: center; min-width: 320px; }
.select-icon {
  position: absolute; left: 0.85rem; z-index: 2;
  color: #94a3b8; font-size: 0.85rem; pointer-events: none; transition: color 0.2s;
}
.user-select-wrapper:focus-within .select-icon { color: #3b82f6; }
.user-select { width: 100% !important; }

:deep(.p-select) {
  width: 100% !important; height: 40px !important; background: #fff !important;
  border: 1.5px solid #e2e8f0 !important; border-radius: 8px !important;
  display: flex !important; align-items: center !important;
  transition: border-color 0.2s, box-shadow 0.2s !important; cursor: pointer !important;
}
:deep(.p-select:hover) { border-color: #cbd5e1 !important; }
:deep(.p-select.p-focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important; outline: none !important;
}
:deep(.p-select-label) {
  padding: 0 0.75rem 0 2.25rem !important; font-size: 0.875rem !important;
  color: #1e293b !important; font-weight: 500 !important; flex: 1 !important;
  min-width: 0 !important; display: flex !important; align-items: center !important;
  height: 100% !important; overflow: hidden !important;
}
:deep(.p-select-dropdown) {
  width: 2rem !important; color: #94a3b8 !important;
  display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;
}
:deep(.p-select-clear-icon) { color: #94a3b8 !important; right: 2.2rem !important; }

/* Valeur sélectionnée (boîte fermée) — atomes alignés sur B2B */
.selected-row { display: flex; align-items: center; gap: 0.45rem; overflow: hidden; width: 100%; }
.selected-name { font-size: 0.875rem; color: #1e293b; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-ph { color: #94a3b8; font-size: 0.875rem; font-style: italic; }
.option-code {
  font-size: 0.72rem; font-weight: 700; color: #3b82f6; background: #eff6ff;
  border-radius: 4px; padding: 0.1rem 0.45rem; white-space: nowrap; flex-shrink: 0;
  letter-spacing: 0.04em; font-family: var(--c2-font-mono);
}
.option-sep { color: #d1d5db; font-size: 0.8rem; flex-shrink: 0; }

.rbac-body { flex: 1; min-height: 0; display: flex; }
.rbac-card {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  background: #fff; border: 1px solid #e8edf3; border-radius: var(--c2-head-radius);
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05); overflow: hidden;
}
.rbac-placeholder { padding: 2rem; text-align: center; color: #94a3b8; }
.rbac-perm-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 1rem 1.25rem; }

.rbac-super-note {
  background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c;
  border-radius: 8px; padding: .6rem .8rem; font-size: .85rem; margin-bottom: 1rem;
  display: flex; align-items: center; gap: .5rem;
}
.rbac-group { margin-bottom: 1.25rem; }
.rbac-group-title {
  font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .03em;
  color: #475569; padding-bottom: .4rem; border-bottom: 1.5px solid #e8edf3; margin-bottom: .6rem;
}
.rbac-perm-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: .5rem; }
.rbac-perm {
  display: flex; align-items: flex-start; gap: .6rem; padding: .5rem .6rem;
  border: 1px solid #eef2f7; border-radius: 8px; cursor: pointer; background: #fff;
}
.rbac-perm:hover:not(.disabled) { background: #f8fafc; }
.rbac-perm.disabled { opacity: .55; cursor: not-allowed; }
.rbac-perm input { margin-top: .15rem; accent-color: var(--c2-select-accent); }
.rbac-perm-main { display: flex; flex-direction: column; min-width: 0; }
.rbac-perm-label { font-size: .85rem; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: .4rem; }
.rbac-perm-code { font-size: .72rem; color: #94a3b8; font-variant-numeric: tabular-nums; }
.rbac-tag-sensitive {
  font-size: .6rem; font-weight: 800; text-transform: uppercase; color: #c2410c;
  background: #fff7ed; border: 1px solid #fed7aa; border-radius: 999px; padding: .05rem .4rem;
}

.rbac-footer {
  flex-shrink: 0; height: 48px; margin-top: var(--c2-head-gap); box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem;
  background: var(--c2-head-bg); border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius); box-shadow: var(--c2-head-shadow);
}
.rbac-footer-label { color: #e2e8f0; font-size: .82rem; font-weight: 700; }
.rbac-footer-sub { color: #94a3b8; font-size: .76rem; font-weight: 600; }
</style>
