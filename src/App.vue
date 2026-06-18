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
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ReaproPauseGameDialog from './components/game/ReaproPauseGameDialog.vue'
import { useReaproPausePrompt } from './composables/useReaproPausePrompt'

// Suivi d'activité + déclenchement de la proposition de pause (60 min d'activité).
const route = useRoute()
const pause = useReaproPausePrompt()
onMounted(() => pause.init(() => route.name))
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
