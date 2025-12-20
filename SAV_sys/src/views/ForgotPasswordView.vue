<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const email = ref('');
const loading = ref(false);
const error = ref('');

const handleForgotPassword = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.forgotPassword(email.value);
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Code de réinitialisation envoyé à votre email', life: 3000 });
    router.push({
      path: '/verify-code',
      query: { email: email.value, type: 'reset' }
    });
  } catch (err) {
    error.value = typeof err.response?.data === 'string' ? err.response.data : 'La demande a échoué';
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.value, life: 3000 });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <!-- Left Side: Illustration/Branding -->
    <AuthLeftSidebar />

    <!-- Right Side: Form -->

    <!-- Right Side: Form -->
    <div class="auth-right">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Mot de passe oublié</h2>
          <p class="subtitle">Entrez votre email pour réinitialiser le mot de passe</p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="email" type="email" placeholder="midone@left4code.com" class="w-full"
              :class="{ 'p-invalid': error }" />
          </div>

          <div v-if="error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>

          <Button type="submit" label="Envoyer le code" :loading="loading" class="w-full auth-button" />

          <div class="login-link">
            <Button label="Retour à la connexion" class="p-button-outlined w-full mt-3"
              @click="router.push('/login')" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background: white;
}

/* Left Side Styling - Moved to AuthLeftSidebar component */

/* Right Side Styling */
.auth-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-header {
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
}

.auth-form {
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

.auth-button {
  background-color: #1e3a8a;
  border: none;
  padding: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
}

.auth-button:hover {
  background-color: #1e40af;
}

.w-full {
  width: 100%;
}

.mt-3 {
  margin-top: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
  }

  .auth-left {
    display: none;
  }
}
</style>
