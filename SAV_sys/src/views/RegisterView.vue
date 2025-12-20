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

const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const agreeToTerms = ref(false);
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  if (!agreeToTerms.value) {
    error.value = 'You must agree to the privacy policy';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.register(form.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Code sent to your email', life: 3000 });
    router.push({
      path: '/verify-code',
      query: { email: form.value.email, type: 'register' }
    });
  } catch (err) {
    error.value = typeof err.response?.data === 'string' ? err.response.data : 'Registration failed';
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 3000 });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <!-- Left Side: Illustration/Branding -->
    <AuthLeftSidebar />

    <!-- Right Side: Register Form -->

    <!-- Right Side: Register Form -->
    <div class="auth-right">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Inscription</h2>
          <p class="subtitle">Créez un nouveau compte pour commencer</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-row">
            <div class="form-group w-full">
              <label for="firstname">Prénom</label>
              <InputText id="firstname" v-model="form.firstname" placeholder="John" class="w-full" />
            </div>
            <div class="form-group w-full">
              <label for="lastname">Nom</label>
              <InputText id="lastname" v-model="form.lastname" placeholder="Doe" class="w-full" />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" type="email" placeholder="midone@left4code.com" class="w-full" />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <Password id="password" v-model="form.password" :feedback="true" toggleMask placeholder="••••••••"
              inputClass="w-full" class="w-full" />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmation du mot de passe</label>
            <Password id="confirmPassword" v-model="form.confirmPassword" :feedback="false" toggleMask
              placeholder="••••••••" inputClass="w-full" class="w-full" />
          </div>

          <div class="form-actions">
            <div class="terms-check">
              <Checkbox v-model="agreeToTerms" :binary="true" inputId="terms" />
              <label for="terms" class="ml-2">J'accepte la <a href="#" class="link">Politique de
                  confidentialité</a></label>
            </div>
          </div>

          <div v-if="error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>

          <Button type="submit" label="S'inscrire" :loading="loading" class="w-full auth-button" />

          <div class="login-link">
            <Button label="Se connecter" class="p-button-outlined w-full mt-3" @click="router.push('/login')" />
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
  max-width: 450px;
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

.form-row {
  display: flex;
  gap: 1rem;
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
  align-items: center;
  font-size: 0.875rem;
}

.terms-check {
  display: flex;
  align-items: center;
  color: #64748b;
}

.link {
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

.ml-2 {
  margin-left: 0.5rem;
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
