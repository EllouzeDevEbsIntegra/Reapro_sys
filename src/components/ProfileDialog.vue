<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal :header="null"
        :style="{ width: '900px', maxWidth: '90vw' }" class="p-fluid profile-dialog-modern"
        :breakpoints="{ '960px': '95vw' }" :showHeader="false" :contentStyle="{ padding: '0', borderRadius: '16px' }" dismissableMask>

        <div class="profile-container">
            <!-- Header Section -->
            <div class="profile-header-modern">
                <!-- Close Button -->
                <button @click="emit('update:visible', false)" class="dialog-close-btn" type="button">
                    <i class="pi pi-times"></i>
                </button>

                <div class="header-content">
                    <div class="identity">
                        <Avatar icon="pi pi-user" shape="circle" class="profile-avatar" />
                        <div class="identity-text">
                            <h2 class="user-name">{{ profileForm.firstname }} {{ profileForm.lastname }}</h2>
                            <span class="user-role">{{ profileForm.role === 'ROLE_ADMIN' ? 'Administrateur' :
                                (profileForm.role === 'ROLE_USER' ? 'Utilisateur' : profileForm.role) }}</span>
                        </div>
                    </div>
                    <div class="header-meta">
                        <span class="meta-chip">
                            <i class="pi pi-envelope"></i><span>{{ profileForm.email }}</span>
                        </span>
                        <span class="meta-chip" v-if="authStore.user?.bcCompanyName">
                            <i class="pi pi-building"></i><span>{{ authStore.user.bcCompanyName }}</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Barre d'onglets à fond clair (hors du header navy → header plus bas) -->
            <div class="profile-tabbar">
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
                            <div class="form-group">
                                <label>Rôle</label>
                                <InputText :value="profileForm.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Utilisateur'"
                                    disabled class="bg-gray-50" />
                            </div>
                            <div class="form-group">
                                <label>Société</label>
                                <!-- ⛔ RBAC : la société n'est plus modifiable par l'utilisateur (lecture seule).
                                     Affectation réservée au SUPER ADMIN via Paramètres > Utilisateurs. -->
                                <InputText :value="companyDisplay" disabled class="bg-gray-50" />
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
                                    placeholder="••••••••" inputClass="w-full" autocomplete="current-password" />
                            </div>
                            <div class="form-group">
                                <label>Nouveau mot de passe</label>
                                <Password v-model="passwordForm.newPassword" toggleMask placeholder="••••••••"
                                    inputClass="w-full" autocomplete="new-password">
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
                                    placeholder="••••••••" inputClass="w-full" autocomplete="new-password" />
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
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Divider from 'primevue/divider';
import Avatar from 'primevue/avatar';
import { computed } from 'vue';

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

// Société en lecture seule (affectée par le super-admin ; non modifiable ici).
const companyDisplay = computed(() => authStore.user?.bcCompanyName || '—');

const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const loadingProfile = ref(false);
const loadingPassword = ref(false);

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
        // Mise à jour des infos de base uniquement (la société n'est plus modifiable ici).
        await authStore.updateProfile({
            firstname: profileForm.value.firstname,
            lastname: profileForm.value.lastname,
            email: profileForm.value.email
        });

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
    background: var(--c2-head-bg);   /* Deep Ocean (charte §11/§16 : header de dialog navy) */
    padding: 0.9rem 2rem;            /* navy compact : juste la ligne d'identité */
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
    background-color: rgba(255, 255, 255, 0.12);
}

.dialog-close-btn i {
    color: #cbd5e1;
    font-size: 1.2rem;
}

.dialog-close-btn:hover i {
    color: #ffffff;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 0;
    padding-right: 2.5rem;
    /* Space for close button */
}

.identity {
    display: flex;
    gap: 0.9rem;
    align-items: center;
    min-width: 0;
}

.profile-avatar {
    width: 48px !important;
    height: 48px !important;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    border: 2px solid rgba(130, 201, 229, 0.55);   /* anneau Frozen */
    color: #ffffff;
    font-size: 1.2rem;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.profile-avatar :deep(.p-avatar-icon),
.profile-avatar i {
    color: #ffffff;
}

.identity-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}

/* Email / société → chips translucides alignés à droite (équilibre le header) */
.header-meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    max-width: 55%;
}

.meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    max-width: 280px;
    padding: 0.32rem 0.75rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    color: #cbd5e1;
    font-size: 0.8rem;
    font-weight: 500;
}

.meta-chip i {
    color: var(--c2-head-accent);
    font-size: 0.85rem;
    flex-shrink: 0;
}

.meta-chip span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-role {
    color: var(--c2-head-accent);   /* Frozen — accent sky sur navy */
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.user-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
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

/* Barre d'onglets à FOND CLAIR (sortie du header navy → header bleu plus bas) */
.profile-tabbar {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 2rem;
    flex-shrink: 0;
}

/* Onglets soulignés sur fond clair — actif = Cobalt (sélection, charte §4/§11) */
.custom-tabs {
    display: flex;
    gap: 1.75rem;
}

.tab-btn {
    background: none;
    border: none;
    padding: 0.8rem 0;
    font-size: 0.9rem;
    color: #64748b;
    cursor: pointer;
    position: relative;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;   /* le soulignement chevauche la bordure de la barre */
    transition: color 0.15s ease, border-color 0.15s ease;
}

.tab-btn:hover {
    color: #334155;
}

.tab-btn.active {
    color: var(--c2-select-accent);
    border-bottom-color: var(--c2-select-accent);
    font-weight: 700;
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
    height: 48px !important;
    display: flex;
    align-items: center;
}

/* Specific fix for company dropdown */
.form-group :deep(.company-dropdown) {
    border-radius: 8px;
    padding: 0;
    border: 1px solid #ced4da;
    background-color: white;
    height: 48px !important;
    display: flex !important;
    align-items: center !important;
    box-sizing: border-box !important;
}

.form-group :deep(.company-dropdown .p-select-label) {
    padding: 0 1rem;
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
    line-height: normal !important;
}

.form-group :deep(.company-dropdown .p-select-dropdown) {
    width: 3rem;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.form-group input:focus,
.form-group :deep(.p-inputtext:focus) {
    border-color: var(--c2-focus);
    box-shadow: 0 0 0 3px rgba(130, 201, 229, 0.22);   /* anneau Frozen (charte §10/§11) */
}

.form-actions {
    margin-top: 1rem;
}

.update-btn {
    background-color: var(--c2-primary);   /* Cobalt — bouton principal (charte §10/§11) */
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.update-btn:hover {
    background-color: var(--c2-primary-hover);
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
