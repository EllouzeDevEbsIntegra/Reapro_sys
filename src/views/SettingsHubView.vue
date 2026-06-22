<template>
  <div class="page-layout">
    <TheNavbar />
    <main class="main-content">
      <!-- Header sticky navy (charte C2) -->
      <div class="header-bar">
        <div class="header-main-row">
          <div class="header-left">
            <h1>Paramètres</h1>
          </div>
        </div>
      </div>

      <!-- Corps : cartes d'accès aux sous-sections (selon permissions) -->
      <div class="hub-body">
        <div class="hub-grid">
          <button
            v-for="card in visibleCards"
            :key="card.route"
            type="button"
            class="hub-card"
            @click="goTo(card.route)"
          >
            <span class="hub-card-icon"><i :class="card.icon"></i></span>
            <span class="hub-card-title">{{ card.title }}</span>
            <span class="hub-card-desc">{{ card.desc }}</span>
          </button>
        </div>

        <p v-if="visibleCards.length === 0" class="hub-empty">
          Aucune section de paramètres disponible pour votre compte.
        </p>
      </div>

      <!-- Footer page (charte C2) -->
      <footer class="hub-footer">
        <span class="hub-footer-label">Paramètres</span>
        <span class="hub-footer-sub">Administration</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TheNavbar from '../components/TheNavbar.vue'

const router = useRouter()
const authStore = useAuthStore()

const cards = [
  {
    title: 'Utilisateurs', desc: 'Créer, activer/désactiver, réinitialiser, modifier les comptes',
    icon: 'pi pi-users', route: '/admin/users', perm: 'USER_MANAGEMENT_ACCESS'
  },
  {
    title: 'Autorisations', desc: 'Attribuer ou retirer les permissions métier des utilisateurs',
    icon: 'pi pi-key', route: '/admin/autorisations', perm: 'PERMISSION_ASSIGNMENT_ACCESS'
  },
  {
    title: 'Paramètres système', desc: "Options d'analyse, exclusions de recherche",
    icon: 'pi pi-sliders-h', route: '/admin/settings', perm: 'SYSTEM_SETTINGS_ACCESS'
  }
]

const visibleCards = computed(() => cards.filter((c) => authStore.hasPermission(c.perm)))

const goTo = (route) => router.push(route)
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
.main-content {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--c2-page-pad);
  font-family: var(--c2-font-sans);
}

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
}
.header-main-row { display: flex; align-items: center; height: 100%; padding: 0 1.5rem; }
.header-left h1 { color: var(--c2-head-title); font-size: 1.1rem; font-weight: 800; margin: 0; }

.hub-body { flex: 1; min-height: 0; overflow-y: auto; }
.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.hub-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .4rem;
  text-align: left;
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: var(--c2-head-radius);
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05);
  padding: 1.25rem;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s, transform .15s;
  font-family: var(--c2-font-sans);
}
.hub-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 14px rgba(15, 23, 42, .08);
  transform: translateY(-1px);
}
.hub-card:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.hub-card-icon {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: #eff6ff; color: var(--c2-select-accent);
  margin-bottom: .25rem;
}
.hub-card-icon i { font-size: 1.2rem; }
.hub-card-title { font-size: .98rem; font-weight: 800; color: #1e293b; }
.hub-card-desc { font-size: .82rem; color: #64748b; }
.hub-empty { color: #94a3b8; font-size: .9rem; padding: 1rem; }

.hub-footer {
  flex-shrink: 0;
  height: 48px;
  margin-top: var(--c2-head-gap);
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem;
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius);
  box-shadow: var(--c2-head-shadow);
}
.hub-footer-label { color: #e2e8f0; font-size: .82rem; font-weight: 700; }
.hub-footer-sub { color: #94a3b8; font-size: .76rem; font-weight: 600; }
</style>
