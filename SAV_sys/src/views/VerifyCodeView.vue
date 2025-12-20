<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import InputOtp from 'primevue/inputotp';
import Button from 'primevue/button';
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const email = ref('');
const code = ref('');
const type = ref('register'); // 'register' or 'reset'
const loading = ref(false);
const error = ref('');

onMounted(() => {
  if (route.query.email) {
    email.value = route.query.email;
  }
  if (route.query.type) {
    type.value = route.query.type;
  }
});

const handleVerify = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (type.value === 'register') {
      await authStore.verifyRegisterCode(email.value, code.value);
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Compte vérifié ! Veuillez vous connecter.', life: 3000 });
      router.push('/login');
    } else {
      await authStore.verifyResetCode(email.value, code.value);
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Code vérifié. Veuillez définir votre nouveau mot de passe.', life: 3000 });
      router.push({
        path: '/reset-password',
        query: { email: email.value }
      });
    }
  } catch (err) {
    const responseData = err.response?.data;
    if (responseData && typeof responseData === 'object' && responseData.message) {
      error.value = responseData.message;
    } else if (typeof responseData === 'string') {
      error.value = responseData;
    } else {
      error.value = 'Échec de la vérification';
    }
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
          <h2>Vérification du code</h2>
          <p class="subtitle">Entrez le code envoyé à {{ email }}</p>
        </div>

        <form @submit.prevent="handleVerify" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="email" type="email" class="w-full" :disabled="!!route.query.email" />
          </div>

          <div class="form-group">
            <label for="code">Code de vérification</label>
            <div class="otp-container">
              <InputOtp v-model="code" :length="4" integerOnly />
            </div>
          </div>

          <div v-if="error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>

          <Button type="submit" label="Vérifier" :loading="loading" class="w-full auth-button" />

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

.otp-container {
  display: flex;
  justify-content: center;
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

:deep(.p-inputotp) {
  gap: 0.5rem;
}

:deep(.p-inputotp-input) {
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  text-align: center;
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
