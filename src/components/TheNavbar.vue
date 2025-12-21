<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import ProfileDialog from './ProfileDialog.vue';

const router = useRouter();
const authStore = useAuthStore();

const showProfileDialog = ref(false);
const menu = ref();
const userMenuItems = ref([
  {
    label: 'Profil',
    icon: 'pi pi-user',
    command: () => {
      showProfileDialog.value = true;
    }
  },
  {
    separator: true
  },
  {
    label: 'Déconnecter',
    icon: 'pi pi-sign-out',
    command: () => handleLogout()
  }
]);

const toggleMenu = (event) => {
  menu.value.toggle(event);
};

const items = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/dashboard')
  },
  {
    label: 'Comparateur Achat',
    icon: 'pi pi-search-plus',
    command: () => router.push('/comparateur')
  }
]);

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<template>
  <Menubar :model="items">
    <template #start>
      <div class="flex items-center">
        <span class="nav-brand">Reapro Achat</span>
      </div>
    </template>
    <template #item="{ item, props, hasSubmenu }">
      <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" @click="navigate">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
        </a>
      </router-link>
      <a v-else :href="item.url" :target="item.target" v-bind="props.action">
        <span :class="item.icon" />
        <span class="ml-2">{{ item.label }}</span>
        <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
      </a>
    </template>
    <template #end>
      <div class="flex items-center gap-2">
        <Button icon="pi pi-cog" text rounded aria-label="Settings" @click="router.push('/settings')" />
        <div class="profile-menu-container">
          <Button @click="toggleMenu" class="profile-button" text plain>
            <Avatar icon="pi pi-user" style="background-color: #dee9fc; color: #1a2551" shape="circle" />
            <span class="font-bold text-white ml-2">{{ authStore.user?.lastname || authStore.user?.nom ||
              authStore.user?.name || 'User' }}</span>
            <i class="pi pi-angle-down ml-2 text-sm"></i>
          </Button>
          <Menu ref="menu" :model="userMenuItems" :popup="true" :pt="{
            root: { class: 'profile-dropdown-menu' },
            itemlink: { class: 'profile-menu-item' },
            itemicon: { class: 'profile-menu-icon' },
            itemtext: { class: 'profile-menu-text' }
          }" />
        </div>
      </div>
    </template>
  </Menubar>
  <ProfileDialog v-model:visible="showProfileDialog" />
</template>

<style>
/* Global styles to override PrimeVue defaults */
.p-menubar {
  background-color: #1e3a8a !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0.5rem 1rem !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.p-menubar .p-menubar-root-list {
  background-color: #1e3a8a !important;
}

.p-menubar .p-menuitem-link {
  color: rgba(255, 255, 255, 0.9) !important;
}

.p-menubar .p-menuitem-link .p-menuitem-text,
.p-menubar .p-menuitem-link .p-menuitem-icon {
  color: rgba(255, 255, 255, 0.9) !important;
}

.p-menubar .p-menuitem-link:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.p-menubar .p-menuitem-link:hover .p-menuitem-text,
.p-menubar .p-menuitem-link:hover .p-menuitem-icon {
  color: white !important;
}

/* Ensure all anchors in menubar are white */
.p-menubar a {
  color: rgba(255, 255, 255, 0.9) !important;
}

.p-menubar a:hover {
  color: white !important;
}

/* Settings button */
.p-menubar .p-button.p-button-icon-only.p-button-rounded.p-button-text {
  color: rgba(255, 255, 255, 0.9) !important;
}

.p-menubar .p-button.p-button-icon-only.p-button-rounded.p-button-text:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

/* User dropdown arrow */
.p-menubar .pi-angle-down {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Ensure end section stays on the right */
.p-menubar .p-menubar-end {
  margin-left: auto !important;
  display: flex !important;
  align-items: center !important;
}

/* Profile dropdown menu styling - Override PrimeVue green completely */
.p-menu .p-menuitem-link {
  transition: background-color 0.2s, color 0.2s !important;
  background-color: #eff6ff !important;
  background: #eff6ff !important;
}

.p-menu .p-menuitem-link:not(.p-disabled):hover,
.p-menu .p-menuitem-link:not(.p-disabled):focus,
.p-menu .p-focus>.p-menuitem-link {
  background-color: #dbeafe !important;
  background: #dbeafe !important;
}

.p-menu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text,
.p-menu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon,
.p-menu .p-menuitem-link:not(.p-disabled):focus .p-menuitem-text,
.p-menu .p-menuitem-link:not(.p-disabled):focus .p-menuitem-icon,
.p-menu .p-focus>.p-menuitem-link .p-menuitem-text,
.p-menu .p-focus>.p-menuitem-link .p-menuitem-icon {
  color: #2563eb !important;
}

.p-menu .p-menuitem-icon {
  color: #3b82f6 !important;
}

.p-menu .p-menuitem-text {
  color: #3b82f6 !important;
}

/* Ensure no green anywhere in menu */
.p-menu .p-menuitem:not(.p-disabled) .p-menuitem-link:hover {
  background: #dbeafe !important;
}
</style>

<style scoped>
.nav-logo {
  height: 32px;
  width: auto;
  margin-right: 0.75rem;
  object-fit: contain;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.card {
  margin-bottom: 0;
}

.profile-menu-container {
  display: inline-flex;
  align-items: center;
}

.profile-button {
  display: inline-flex !important;
  align-items: center;
  padding: 0.5rem;
  color: white !important;
  white-space: nowrap;
}

.profile-button:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.profile-button .p-avatar {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}
</style>
