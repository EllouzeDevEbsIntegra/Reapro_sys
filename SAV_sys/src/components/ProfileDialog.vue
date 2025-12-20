<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal :header="null"
        :style="{ width: '900px', maxWidth: '90vw' }" class="p-fluid profile-dialog-modern"
        :breakpoints="{ '960px': '95vw' }" :showHeader="false" :contentStyle="{ padding: '0', borderRadius: '16px' }">

        <div class="profile-container">
            <!-- Header Section -->
            <div class="profile-header-modern">
                <!-- Close Button -->
                <button @click="emit('update:visible', false)" class="dialog-close-btn" type="button">
                    <i class="pi pi-times"></i>
                </button>

                <div class="header-content">
                    <div class="avatar-section">
                        <Avatar icon="pi pi-user" size="xlarge" shape="circle" class="profile-avatar" />
                        <div class="user-info">
                            <h2 class="user-name">{{ profileForm.firstname }} {{ profileForm.lastname }}</h2>
                            <span class="user-role">{{ profileForm.role === 'ROLE_ADMIN' ? 'Administrateur' :
                                (profileForm.role === 'ROLE_USER' ? 'Utilisateur' : profileForm.role) }}</span>
                            <div class="user-meta">
                                <i class="pi pi-envelope"></i> {{ profileForm.email }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Custom Tabs Navigation -->
                <div class="custom-tabs">
                    <button v-for="tab in ['Account', 'Security']" :key="tab" @click="activeTab = tab"
                        :class="['tab-btn', { active: activeTab === tab }]">
                        {{ tab === 'Account' ? 'Compte' : 'Sécurité' }}
                    </button>
                </div>
            </div>

            <!-- Content Section -->
            <div class="profile-content">
                <!-- Account Tab -->
                <div v-if="activeTab === 'Account'" class="tab-content-anim">
                    <div class="content-header">
                        <h3>Modifier le Profil</h3>
                    </div>

                    <form @submit.prevent="handleUpdateProfile">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Prénom</label>
                                <InputText v-model="profileForm.firstname" placeholder="Votre prénom" />
                            </div>
                            <div class="form-group">
                                <label>Nom</label>
                                <InputText v-model="profileForm.lastname" placeholder="Votre nom" />
                            </div>
                            <div class="form-group full-width">
                                <label>Email</label>
                                <InputText v-model="profileForm.email" placeholder="votre@email.com" />
                            </div>
                            <div class="form-group full-width">
                                <label>Rôle</label>
                                <InputText :value="profileForm.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Utilisateur'"
                                    disabled class="bg-gray-50" />
                            </div>
                        </div>

                        <div class="form-actions">
                            <Button type="submit" label="Mettre à jour le profil" :loading="loadingProfile"
                                class="update-btn" />
                        </div>
                    </form>
                </div>

                <!-- Security Tab -->
                <div v-if="activeTab === 'Security'" class="tab-content-anim">
                    <div class="content-header">
                        <h3>Sécurité</h3>
                    </div>

                    <form @submit.prevent="handleChangePassword">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label>Mot de passe actuel</label>
                                <Password v-model="passwordForm.oldPassword" :feedback="false" toggleMask
                                    placeholder="••••••••" inputClass="w-full" />
                            </div>
                            <div class="form-group">
                                <label>Nouveau mot de passe</label>
                                <Password v-model="passwordForm.newPassword" toggleMask placeholder="••••••••"
                                    inputClass="w-full">
                                    <template #header>
                                        <h6 class="mb-2">Suggestions</h6>
                                    </template>
                                    <template #footer>
                                        <Divider />
                                        <ul class="pl-2 ml-2 mt-0 text-sm" style="line-height: 1.5">
                                            <li>Minimum 8 caractères</li>
                                            <li>Au moins un chiffre</li>
                                        </ul>
                                    </template>
                                </Password>
                            </div>
                            <div class="form-group">
                                <label>Confirmer le mot de passe</label>
                                <Password v-model="passwordForm.confirmPassword" :feedback="false" toggleMask
                                    placeholder="••••••••" inputClass="w-full" />
                            </div>
                        </div>

                        <div class="form-actions">
                            <Button type="submit" label="Changer le mot de passe" :loading="loadingPassword"
                                class="update-btn" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Divider from 'primevue/divider';
import Avatar from 'primevue/avatar';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['update:visible']);

const authStore = useAuthStore();
const toast = useToast();
const activeTab = ref('Account');

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

// Update local state when dialog opens or user changes
// Update local state when dialog opens or user changes
watch(() => props.visible, async (newVal) => {
    if (newVal) {
        // 1. Populate from store immediately (cached data)
        if (authStore.user) {
            profileForm.value = {
                firstname: authStore.user.firstname || '',
                lastname: authStore.user.lastname || '',
                email: authStore.user.email || '',
                role: authStore.user.role || ''
            };
        }

        // 2. Try to refresh from API
        try {
            const userData = await authStore.fetchUser();
            if (userData) {
                profileForm.value = {
                    firstname: userData.firstname || '',
                    lastname: userData.lastname || '',
                    email: userData.email || '',
                    role: userData.role || ''
                };
            }
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
            // Only show error if we have NO data at all
            if (!authStore.user) {
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le profil', life: 3000 });
            }
        }

        // Reset password form
        passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
        activeTab.value = 'Account';
    }
});

const handleUpdateProfile = async () => {
    loadingProfile.value = true;
    try {
        await authStore.updateProfile(profileForm.value);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour avec succès', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour du profil', life: 3000 });
    } finally {
        loadingProfile.value = false;
    }
};

const handleChangePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Les nouveaux mots de passe ne correspondent pas', life: 3000 });
        return;
    }

    loadingPassword.value = true;
    try {
        await authStore.changeMyPassword(passwordForm.value);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Mot de passe modifié avec succès', life: 3000 });
        passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du changement de mot de passe', life: 3000 });
    } finally {
        loadingPassword.value = false;
    }
};
</script>

<style scoped>
.profile-container {
    background-color: #f8f9fa;
    min-height: 600px;
    display: flex;
    flex-direction: column;
}

.profile-header-modern {
    background-color: white;
    padding: 2rem 2rem 0 2rem;
    border-bottom: 1px solid #e9ecef;
    position: relative;
}

.dialog-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
    z-index: 10;
}

.dialog-close-btn:hover {
    background-color: #f1f3f5;
}

.dialog-close-btn i {
    color: #6c757d;
    font-size: 1.2rem;
}

.dialog-close-btn:hover i {
    color: #212529;
}

.header-content {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-right: 3rem;
    /* Space for close button */
}

.avatar-section {
    display: flex;
    gap: 1.5rem;
    align-items: center;
}

.profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #e9ecef;
    color: #495057;
    font-size: 2rem;
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.user-name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #212529;
}

.user-role {
    color: #6c757d;
    font-size: 0.95rem;
}

.user-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #adb5bd;
    font-size: 0.85rem;
    margin-top: 0.25rem;
}

.header-stats {
    display: flex;
    gap: 2rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-weight: 700;
    font-size: 1.1rem;
    color: #212529;
}

.stat-label {
    font-size: 0.8rem;
    color: #adb5bd;
}

/* Custom Tabs */
.custom-tabs {
    display: flex;
    gap: 2rem;
}

.tab-btn {
    background: none;
    border: none;
    padding: 1rem 0;
    font-size: 0.95rem;
    color: #6c757d;
    cursor: pointer;
    position: relative;
    font-weight: 500;
    transition: color 0.2s;
}

.tab-btn:hover {
    color: #495057;
}

.tab-btn.active {
    color: #6366f1;
    /* Purple/Blue like reference */
    font-weight: 600;
}

.tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #6366f1;
}

/* Content Section */
.profile-content {
    padding: 2rem;
    background-color: #f8f9fa;
    flex: 1;
}

.content-header {
    margin-bottom: 2rem;
}

.content-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #212529;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.full-width {
    grid-column: 1 / -1;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #495057;
}

.form-group input,
.form-group :deep(.p-inputtext) {
    border-radius: 8px;
    padding: 0.75rem 1rem;
    border: 1px solid #ced4da;
    background-color: white;
}

.form-group input:focus,
.form-group :deep(.p-inputtext:focus) {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.form-actions {
    margin-top: 1rem;
}

.update-btn {
    background-color: #6366f1;
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.update-btn:hover {
    background-color: #4f46e5;
}

.tab-content-anim {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
    }
}
</style>
