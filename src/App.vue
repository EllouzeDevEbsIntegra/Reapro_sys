<template>
  <div class="app-shell">
    <main class="app-content">
      <router-view />
    </main>
  </div>
  <Toast class="custom-toast" />
  <!-- Mini-jeu de pause global (discret, optionnel, sans backend) -->
  <ReaproPauseGameDialog />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import ReaproPauseGameDialog from './components/game/ReaproPauseGameDialog.vue'
import { useReaproPausePrompt } from './composables/useReaproPausePrompt'

// Suivi d'activité + déclenchement de la proposition de pause (60 min d'activité).
const route = useRoute()
const pause = useReaproPausePrompt()

// Erreur réseau globale (serveur injoignable) → toast doux, throttlé pour éviter le spam
// quand plusieurs requêtes échouent en même temps. Émis par l'intercepteur axios.
const toast = useToast()
let lastNetworkToast = 0
const onNetworkError = () => {
  const now = Date.now()
  if (now - lastNetworkToast < 5000) return
  lastNetworkToast = now
  toast.add({ severity: 'error', summary: 'Connexion', detail: 'Connexion au serveur impossible.', life: 4000 })
}

onMounted(() => {
  pause.init(() => route.name)
  window.addEventListener('reapro:network-error', onNetworkError)
})
onUnmounted(() => window.removeEventListener('reapro:network-error', onNetworkError))
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}
</style>
