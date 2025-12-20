<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

const authStore = useAuthStore();
const toast = useToast();

const profileForm = ref({
    firstname: '',
    lastname: '',
    email: '',
    role: ''
});

const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const loadingProfile = ref(false);
const loadingPassword = ref(false);

onMounted(async () => {
    if (!authStore.user) {
        await authStore.fetchUser();
    }
    if (authStore.user) {
        profileForm.value = {
            firstname: authStore.user.firstname,
            lastname: authStore.user.lastname,
            email: authStore.user.email,
            role: authStore.user.role
        };
    }
});

const handleUpdateProfile = async () => {
    loadingProfile.value = true;
    try {
        await authStore.updateProfile(profileForm.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 3000 });
    } finally {
        loadingProfile.value = false;
    }
};

const handleChangePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'New passwords do not match', life: 3000 });
        return;
    }

    loadingPassword.value = true;
    try {
        await authStore.changeMyPassword(passwordForm.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully', life: 3000 });
        passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to change password', life: 3000 });
    } finally {
        loadingPassword.value = false;
    }
};
</script>

<template>
    <Toast />
    <div class="page-layout">
        <TheNavbar />
        
        <div class="profile-container">
            <div class="profile-header-card">
                <div class="header-content">
                    <Avatar icon="pi pi-user" size="xlarge" shape="circle" class="profile-avatar" />
                    <div class="header-text">
                        <h1>Mon Profil</h1>
                        <p>Gérez vos informations personnelles et votre sécurité</p>
                    </div>
                </div>
            </div>

            <div class="profile-grid">
                <!-- Profile Info Card -->
                <div class="card profile-card">
                    <div class="card-header">
                        <h2>Informations Personnelles</h2>
                    </div>
                    <form @submit.prevent="handleUpdateProfile" class="profile-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Prénom</label>
                                <InputText v-model="profileForm.firstname" required />
                            </div>
                            <div class="form-group">
                                <label>Nom</label>
                                <InputText v-model="profileForm.lastname" required />
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Email</label>
                            <InputText v-model="profileForm.email" type="email" required />
                        </div>

                        <div class="form-group">
                            <label>Rôle</label>
                            <InputText v-model="profileForm.role" disabled class="disabled-input" />
                        </div>

                        <div class="form-actions">
                            <Button type="submit" :loading="loadingProfile" label="Enregistrer les modifications" />
                        </div>
                    </form>
                </div>

                <!-- Change Password Card -->
                <div class="card profile-card">
                    <div class="card-header">
                        <h2>Changer le mot de passe</h2>
                    </div>
                    <form @submit.prevent="handleChangePassword" class="profile-form">
                        <div class="form-group">
                            <label>Mot de passe actuel</label>
                            <Password v-model="passwordForm.oldPassword" :feedback="false" toggleMask required />
                        </div>
                        
                        <div class="form-group">
                            <label>Nouveau mot de passe</label>
                            <Password v-model="passwordForm.newPassword" toggleMask required>
                                <template #header>
                                    <h6>Saisissez un mot de passe</h6>
                                </template>
                                <template #footer>
                                    <Divider />
                                    <p class="mt-2">Suggestions</p>
                                    <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
                                        <li>Au moins une minuscule</li>
                                        <li>Au moins une majuscule</li>
                                        <li>Au moins un chiffre</li>
                                        <li>Minimum 8 caractères</li>
                                    </ul>
                                </template>
                            </Password>
                        </div>

                        <div class="form-group">
                            <label>Confirmer le mot de passe</label>
                            <Password v-model="passwordForm.confirmPassword" :feedback="false" toggleMask required />
                        </div>

                        <div class="form-actions">
                            <Button type="submit" :loading="loadingPassword" label="Mettre à jour le mot de passe" severity="warning" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-layout {
    min-height: 100vh;
    background-color: var(--color-background-soft);
    color: var(--color-text);
}

.profile-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.profile-header-card {
    background: var(--color-background);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
    border: 1px solid var(--color-border);
}

.header-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.profile-avatar {
    background-color: var(--vt-c-indigo);
    color: white;
}

.header-text h1 {
    margin: 0;
    font-size: 1.75rem;
    color: var(--color-heading);
}

.header-text p {
    margin: 0.5rem 0 0;
    color: var(--color-text);
    opacity: 0.8;
}

.profile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 2rem;
}

.profile-card {
    background: var(--color-background);
    padding: 0;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid var(--color-border);
}

.card-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-background-mute);
}

.card-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-heading);
}

.profile-form {
    padding: 2rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text);
    font-weight: 500;
}

.form-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
    width: 100%;
    background-color: var(--color-background);
    color: var(--color-text);
    border-color: var(--color-border);
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-password-input:enabled:focus) {
    border-color: var(--vt-c-indigo);
}

:deep(.p-password) {
    width: 100%;
}

@media (max-width: 768px) {
    .profile-grid {
        grid-template-columns: 1fr;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
}
</style>
