<template>
  <div class="login-container">
    <AuthLeftSidebar />

    <div class="login-right animate-fade-in">
      <div class="login-card">
        <div class="login-header">
          <h2>Mot de passe oublié</h2>
          <p class="subtitle">Entrez votre email pour recevoir un code de réinitialisation</p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="login-form">
          <div v-if="authStore.error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ authStore.error }}</span>
          </div>
          
          <div v-if="successMessage" class="success-message">
            <i class="pi pi-check-circle"></i>
            <span>{{ successMessage }}</span>
          </div>

          <div class="form-group">
            <label for="email">Adresse Email</label>
            <InputText id="email" v-model="email" type="email" placeholder="admin@reapro.tn" required class="w-full" />
          </div>

          <Button type="submit" label="Envoyer le code" :loading="authStore.isLoading" class="w-full" />
          
          <Button label="Retour à la connexion" class="p-button-text w-full mt-2" @click="router.push('/')" />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const successMessage = ref('')

const handleForgotPassword = async () => {
  try {
    await authStore.forgotPassword(email.value)
    successMessage.value = 'Un code de réinitialisation a été envoyé.'
    setTimeout(() => {
      router.push({ name: 'reset-password', query: { email: email.value } })
    }, 2000)
  } catch (error) {
    console.error('Forgot password failed', error)
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

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  background-color: #ecfdf5;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

/* Bouton principal (PrimeVue solide) → cobalt charte ; le bouton « Retour » (text) reste inchangé */
:deep(.p-button:not(.p-button-text):not(.p-button-outlined)) {
  background: var(--c2-primary, #1859B3);
  border-color: var(--c2-primary, #1859B3);
}
:deep(.p-button:not(.p-button-text):not(.p-button-outlined):hover) {
  background: var(--c2-primary-hover, #12468f);
  border-color: var(--c2-primary-hover, #12468f);
}
</style>
