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
        <a :href="href" v-bind="props.action" @click="navigate" class="nav-item-link">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
        </a>
      </router-link>
      <a v-else :href="item.url" :target="item.target" v-bind="props.action" class="nav-item-link">
        <span :class="item.icon" />
        <span class="ml-2">{{ item.label }}</span>
        <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
      </a>
    </template>
    <template #end>
      <div class="flex items-center gap-2">
        <Button icon="pi pi-cog" text rounded aria-label="Settings" />
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
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0.75rem 1.5rem !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
}

.p-menubar .p-menubar-root-list {
  background: transparent !important;
}

/* Target our custom class for menu items */
.nav-item-link {
  color: rgba(255, 255, 255, 0.85) !important;
  border-radius: 8px !important;
  padding: 0.6rem 1rem !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  text-decoration: none !important;
}

.nav-item-link .p-menuitem-text,
.nav-item-link .p-menuitem-icon,
.nav-item-link span {
  color: rgba(255, 255, 255, 0.85) !important;
}

.nav-item-link:hover {
  background-color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-item-link:hover .p-menuitem-text,
.nav-item-link:hover .p-menuitem-icon,
.nav-item-link:hover span {
  color: #1e3a8a !important;
  font-weight: 600 !important;
}

/* Settings button */
.p-menubar .p-button.p-button-icon-only.p-button-rounded.p-button-text {
  color: rgba(255, 255, 255, 0.85) !important;
  transition: all 0.2s ease;
}

.p-menubar .p-button.p-button-icon-only.p-button-rounded.p-button-text:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transform: rotate(45deg);
}

/* User dropdown arrow */
.p-menubar .pi-angle-down {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 0.8rem;
}

/* Ensure end section stays on the right */
.p-menubar .p-menubar-end {
  margin-left: auto !important;
  display: flex !important;
  align-items: center !important;
}

/* Profile dropdown menu styling */
.profile-dropdown-menu {
  background: #ffffff !important;
  border: none !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  padding: 0.5rem !important;
  margin-top: 0.5rem !important;
  min-width: 200px !important;
}

.profile-dropdown-menu .p-menuitem-link {
  border-radius: 8px !important;
  margin: 0.25rem 0 !important;
  padding: 0.75rem 1rem !important;
  transition: all 0.2s ease !important;
}

.profile-dropdown-menu .p-menuitem-link:hover {
  background-color: #f3f4f6 !important;
}

.profile-dropdown-menu .p-menuitem-text {
  color: #374151 !important;
  font-weight: 500 !important;
}

.profile-dropdown-menu .p-menuitem-icon {
  color: #6b7280 !important;
  margin-right: 0.75rem !important;
}

.profile-dropdown-menu .p-menuitem-link:hover .p-menuitem-text {
  color: #1e40af !important;
}

.profile-dropdown-menu .p-menuitem-link:hover .p-menuitem-icon {
  color: #1e40af !important;
}

.profile-dropdown-menu .p-submenu-header {
  background: transparent !important;
  color: #9ca3af !important;
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 0.75rem 1rem 0.25rem !important;
}

.profile-dropdown-menu .p-menu-separator {
  border-top: 1px solid #e5e7eb !important;
  margin: 0.5rem 0 !important;
}
</style>

<style scoped>
.nav-logo {
  height: 36px;
  width: auto;
  margin-right: 1rem;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.025em;
  background: linear-gradient(to right, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.profile-menu-container {
  display: inline-flex;
  align-items: center;
  margin-left: 1rem;
}

.profile-button {
  display: inline-flex !important;
  align-items: center;
  padding: 0.5rem 0.75rem !important;
  color: white !important;
  white-space: nowrap;
  border-radius: 9999px !important;
  transition: background-color 0.2s ease !important;
}

.profile-button:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.profile-button .p-avatar {
  background-color: #eff6ff !important;
  color: #1e40af !important;
  border: 2px solid rgba(255, 255, 255, 0.2);
  width: 36px;
  height: 36px;
}

.profile-button:hover .p-avatar {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
