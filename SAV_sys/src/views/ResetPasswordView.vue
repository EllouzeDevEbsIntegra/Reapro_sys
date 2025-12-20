<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import AuthLeftSidebar from '../components/AuthLeftSidebar.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const email = ref('');
const tempPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

onMounted(() => {
    if (route.query.email) {
        email.value = route.query.email;
    }
});

const handleResetPassword = async () => {
    if (newPassword.value !== confirmPassword.value) {
        error.value = 'Les mots de passe ne correspondent pas';
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        await authStore.changePassword(
            email.value,
            tempPassword.value,
            newPassword.value,
            confirmPassword.value
        );
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Mot de passe réinitialisé avec succès ! Veuillez vous connecter.', life: 3000 });
        router.push('/login');
    } catch (err) {
        const responseData = err.response?.data;
        if (responseData && typeof responseData === 'object' && responseData.message) {
            error.value = responseData.message;
        } else if (typeof responseData === 'string') {
            error.value = responseData;
        } else {
            error.value = 'La réinitialisation a échoué';
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
        <!-- Left Side: Illustration/Branding -->
        <AuthLeftSidebar />

        <!-- Right Side: Form -->

        <!-- Right Side: Form -->
        <div class="auth-right">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Réinitialisation</h2>
                    <p class="subtitle">Définissez votre nouveau mot de passe</p>
                </div>

                <form @submit.prevent="handleResetPassword" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <InputText id="email" v-model="email" type="email" class="w-full" disabled />
                    </div>

                    <div class="form-group">
                        <label for="tempPassword">Mot de passe temporaire (reçu par email)</label>
                        <Password id="tempPassword" v-model="tempPassword" :feedback="false" toggleMask
                            placeholder="••••••••" inputClass="w-full" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="newPassword">Nouveau mot de passe</label>
                        <Password id="newPassword" v-model="newPassword" :feedback="true" toggleMask
                            placeholder="••••••••" inputClass="w-full" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Confirmer le mot de passe</label>
                        <Password id="confirmPassword" v-model="confirmPassword" :feedback="false" toggleMask
                            placeholder="••••••••" inputClass="w-full" class="w-full" />
                    </div>

                    <div v-if="error" class="error-message">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>{{ error }}</span>
                    </div>

                    <Button type="submit" label="Changer le mot de passe" :loading="loading"
                        class="w-full auth-button" />

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

:deep(.p-password-input) {
    width: 100%;
}

:deep(.p-password) {
    width: 100%;
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
