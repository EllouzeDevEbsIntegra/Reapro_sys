<template>
  <div class="login-container">
    <AuthLeftSidebar />

    <div class="login-right animate-fade-in">
      <div class="login-card">
        <div class="login-header">
          <h2>{{ isVerifying ? 'Vérification' : 'Inscription' }}</h2>
          <p class="subtitle">
            {{ isVerifying ? 'Entrez le code envoyé à votre email' : 'Créez votre compte administrateur' }}
          </p>
        </div>

        <!-- Registration Form -->
        <form v-if="!isVerifying" @submit.prevent="handleRegister" class="login-form">
          <div class="row">
            <div class="form-group">
              <label for="firstname">Prénom</label>
              <InputText id="firstname" v-model="form.firstname" required class="w-full" />
            </div>
            <div class="form-group">
              <label for="lastname">Nom</label>
              <InputText id="lastname" v-model="form.lastname" required class="w-full" />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" type="email" required class="w-full" />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <Password id="password" v-model="form.password" toggleMask class="w-full" inputClass="w-full" required />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <Password id="confirmPassword" v-model="form.confirmPassword" :feedback="false" toggleMask class="w-full" inputClass="w-full" required />
          </div>

          <div v-if="authStore.error" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ authStore.error }}</span>
          </div>

          <Button type="submit" label="S'inscrire" :loading="authStore.isLoading" class="w-full" />

          <div class="login-link">
            <p class="text-center mt-3">
              Déjà un compte ? <router-link to="/" class="font-semibold text-primary">Se connecter</router-link>
            </p>
          </div>
        </form>

        <!-- Verification Form -->
        <form v-else @submit.prevent="handleVerify" class="login-form">
          <p class="info-text">Un code a été envoyé à <strong>{{ form.email }}</strong></p>
          
          <div class="form-group">
            <label for="code">Code de vérification</label>
            <InputText id="code" v-model="verificationCode" placeholder="1234" required maxlength="4" class="w-full text-center text-xl tracking-widest" />
          </div>

          <Button type="submit" label="Vérifier le compte" :loading="authStore.isLoading" class="w-full" />
          
          <Button label="Retour" class="p-button-text w-full mt-2" @click="isVerifying = false" />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue'

const authStore = useAuthStore()
const router = useRouter()

const isVerifying = ref(false)
const verificationCode = ref('')

const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    authStore.error = 'Les mots de passe ne correspondent pas'
    return
  }

  try {
    await authStore.register(form)
    isVerifying.value = true
  } catch (error) {
    console.error('Registration failed', error)
  }
}

const handleVerify = async () => {
  try {
    await authStore.verifyRegisterCode({
      email: form.email,
      code: verificationCode.value
    })
    alert('Compte vérifié avec succès !')
    router.push('/')
  } catch (error) {
    console.error('Verification failed', error)
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
  max-width: 450px;
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

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.info-text {
  color: #64748b;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
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

.text-center { text-align: center; }
.text-primary { color: #1e3a8a; }
.font-semibold { font-weight: 600; }
</style>
