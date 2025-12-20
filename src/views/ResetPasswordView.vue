<template>
  <div class="login-container">
    <AuthLeftSidebar />

    <div class="login-right animate-fade-in">
      <div class="login-card">
        <div class="login-header">
          <h2>Réinitialisation</h2>
          <p class="subtitle">Entrez le code reçu pour obtenir un mot de passe temporaire</p>
        </div>

        <form @submit.prevent="handleVerifyReset" class="login-form">
          <div v-if="authStore.error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ authStore.error }}</span>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="email" readonly class="w-full opacity-70" />
          </div>

          <div class="form-group">
            <label for="code">Code de réinitialisation</label>
            <InputText id="code" v-model="code" placeholder="1234" required maxlength="4" class="w-full text-center text-xl tracking-widest" />
          </div>

          <Button type="submit" label="Vérifier le code" :loading="authStore.isLoading" class="w-full" />
          
          <Button label="Retour" class="p-button-text w-full mt-2" @click="router.push('/forgot-password')" />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const code = ref('')

onMounted(() => {
  email.value = route.query.email || ''
})

const handleVerifyReset = async () => {
  try {
    await authStore.verifyResetCode({
      email: email.value,
      code: code.value
    })
    alert('Un mot de passe temporaire a été envoyé à votre email.')
    router.push('/')
  } catch (error) {
    console.error('Reset verification failed', error)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: white;
}

.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-header {
  margin-bottom: 2rem;
}

.login-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #334155;
  font-weight: 500;
  font-size: 0.875rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  background-color: #fef2f2;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.opacity-70 { opacity: 0.7; }
.text-center { text-align: center; }
.text-xl { font-size: 1.25rem; }
.tracking-widest { letter-spacing: 0.1em; }
</style>
