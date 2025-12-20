<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    console.log('Tentative de login avec:', username.value);
    const result = await authStore.login(username.value, password.value);
    console.log('Login réussi! Token:', result);
    toast.add({ severity: 'success', summary: 'Connexion réussie', detail: 'Bienvenue !', life: 3000 });
    router.push('/dashboard');
  } catch (err) {
    console.error('ERREUR DE LOGIN:', err);
    error.value = 'Identifiants incorrects';
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.message || 'Identifiants incorrects', life: 3000 });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <!-- Left Side: Illustration/Branding -->
    <AuthLeftSidebar />

    <!-- Right Side: Login Form -->
    <div class="login-right">
      <div class="login-card">
        <div class="login-header">
          <h2>Connexion</h2>
          <p class="subtitle">Connectez-vous à votre compte pour continuer</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="username" type="email" placeholder="midone@left4code.com" class="w-full"
              :class="{ 'p-invalid': error }" />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <Password id="password" v-model="password" :feedback="false" toggleMask placeholder="••••••••"
              inputClass="w-full" class="w-full" :class="{ 'p-invalid': error }" />
          </div>

          <div class="form-actions">
            <div class="remember-me">
              <Checkbox v-model="rememberMe" :binary="true" inputId="remember" />
              <label for="remember" class="ml-2">Se souvenir de moi</label>
            </div>
            <router-link to="/forgot-password" class="forgot-password">Mot de passe oublié ?</router-link>
          </div>

          <div v-if="error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>

          <Button type="submit" label="Se connecter" :loading="loading" class="w-full login-button" />

          <div class="register-link">
            <Button label="S'inscrire" class="p-button-outlined w-full mt-3" @click="router.push('/register')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background: white;
}

/* Left Side Styling - Moved to AuthLeftSidebar component */

/* Right Side Styling */
.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
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
  gap: 1.25rem;
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

:deep(.p-inputtext) {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

:deep(.p-password-input) {
  width: 100%;
}

:deep(.p-password) {
  width: 100%;
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
  font-weight: 500;
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
  background-color: #1e3a8a;
  border: none;
  padding: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
}

.login-button:hover {
  background-color: #1e40af;
}

.w-full {
  width: 100%;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-left {
    display: none;
    /* Hide illustration on mobile for cleaner look, or reduce height */
  }
}
</style>
