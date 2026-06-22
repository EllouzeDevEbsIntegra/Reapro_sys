<template>
  <div class="page-layout">
    <TheNavbar />
    <main class="main-content">
      <div class="fb-wrap">
        <div class="fb-card">
          <div class="fb-icon"><i class="pi pi-lock"></i></div>
          <h1>Accès non autorisé</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <p v-if="fromPath" class="fb-muted">Page demandée : <code>{{ fromPath }}</code></p>
          <button type="button" class="fb-btn" @click="goHome">
            <i class="pi pi-home"></i> Retour à l'accueil
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TheNavbar from '../components/TheNavbar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const fromPath = computed(() => (typeof route.query.from === 'string' ? route.query.from : ''))
const goHome = () => router.push(authStore.landingRoute || '/')
</script>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
.main-content {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--c2-page-pad);
}
.fb-wrap { width: 100%; display: flex; justify-content: center; }
.fb-card {
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: var(--c2-head-radius);
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05);
  padding: 2.5rem 2rem;
  max-width: 460px;
  text-align: center;
  font-family: var(--c2-font-sans);
}
.fb-icon {
  width: 64px; height: 64px; margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #fef2f2; color: #b91c1c;
}
.fb-icon i { font-size: 1.8rem; }
.fb-card h1 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0 0 .5rem; }
.fb-card p { color: #475569; font-size: .9rem; margin: .25rem 0; }
.fb-muted { color: #94a3b8; font-size: .8rem; }
.fb-muted code { font-family: var(--c2-font-mono); }
.fb-btn {
  margin-top: 1.25rem;
  background: var(--c2-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: .6rem 1.25rem;
  font-weight: 600;
  font-family: var(--c2-font-sans);
  cursor: pointer;
  display: inline-flex; align-items: center; gap: .5rem;
}
.fb-btn:hover { background: var(--c2-primary-hover); }
.fb-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
</style>
