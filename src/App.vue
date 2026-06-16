<template>
  <div class="app-shell">
    <main class="app-content">
      <router-view />
    </main>
  </div>
  <Toast class="custom-toast" />
</template>

<script setup>
import Toast from 'primevue/toast'
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
