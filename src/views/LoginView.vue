<template>
  <div class="login-container">
    <!-- Left Side: Illustration/Branding -->
    <AuthLeftSidebar />

    <!-- Right Side: Login Form -->
    <div class="login-right animate-fade-in">
      <div class="login-card">
        <div class="login-header">
          <h2>Connexion</h2>
          <p class="subtitle">Connectez-vous à votre compte pour continuer</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" type="email" placeholder="admin@reapro.tn" class="w-full"
              :class="{ 'p-invalid': authStore.error }" autocomplete="username" />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <Password id="password" v-model="form.password" :feedback="false" toggleMask placeholder="••••••••"
              inputClass="w-full" class="w-full" :class="{ 'p-invalid': authStore.error }" :inputProps="{ autocomplete: 'current-password' }" />
          </div>

          <div class="form-actions">
            <div class="remember-me">
              <Checkbox v-model="form.remember" :binary="true" inputId="remember" />
              <label for="remember" class="ml-2">Se souvenir de moi</label>
            </div>
            <router-link to="/forgot-password" class="forgot-password">Mot de passe oublié ?</router-link>
          </div>

          <div v-if="authStore.error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ authStore.error }}</span>
          </div>

          <Button type="submit" label="Se connecter" :loading="authStore.isLoading" class="w-full login-button" />

          <div class="register-link">
            <Button label="S'inscrire" class="p-button-outlined w-full mt-3 register-button"
              @click="router.push('/register')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const form = reactive({
  email: '',
  password: '',
  remember: false
})

onMounted(() => {
  if (route.query.sessionExpired === 'true') {
    toast.add({ severity: 'warn', summary: 'Session expirée', detail: 'Votre session a expiré. Veuillez vous reconnecter.', life: 5000 })
    // Clean up the URL
    router.replace({ query: {} })
  }
})

const handleLogin = async () => {
  if (!form.email || !form.password) {
    authStore.error = 'Veuillez remplir tous les champs'
    return
  }

  try {
    await authStore.login({
      email: form.email,
      password: form.password
    })
    router.push('/comparateur')
  } catch (error) {
    console.error('Login failed', error)
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
  margin-bottom: 2.5rem;
}

.login-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
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

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.remember-me {
  display: flex;
  align-items: center;
  color: #64748b;
}

.forgot-password {
  color: #1e3a8a;
  text-decoration: none;
  font-weight: 600;
}

.forgot-password:hover {
  text-decoration: underline;
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

.login-button {
  padding: 0.875rem;
}

.register-button {
  height: 48px;
  font-weight: 700;
  color: white !important;
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

@media (max-width: 768px) {
  .login-right {
    padding: 1.5rem;
  }
}

:deep(.p-password) {
  position: relative;
}

:deep(.p-password .p-icon) {
  top: 50%;
  transform: translateY(-50%);
  right: 0.75rem;
  position: absolute;
  cursor: pointer;
}
</style>
