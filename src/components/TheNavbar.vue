<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import ProfileDialog from './ProfileDialog.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showProfileDialog = ref(false);
const isMobileMenuOpen = ref(false);
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
    label: 'Deconnecter',
    icon: 'pi pi-sign-out',
    command: () => handleLogout()
  }
]);

const navItems = [
  {
    label: 'Comparateur Achat',
    icon: 'pi pi-search-plus',
    route: '/comparateur'
  },
  {
    label: 'B2B',
    icon: 'pi pi-users',
    route: '/b2b'
  },
  {
    label: 'Analyse Recherches B2B',
    icon: 'pi pi-chart-line',
    route: '/search-opportunities'
  },
  {
    label: 'Sync Adaptable',
    icon: 'pi pi-sync',
    route: '/sync-adaptable'
  },
  {
    label: 'Partslink',
    icon: 'pi pi-compass',
    route: '/partslink'
  }
];


const items = computed(() =>
  navItems.map(item => ({
    ...item,
    command: () => navigateTo(item.route)
  }))
);

const isRouteActive = (targetRoute) =>
  route.path === targetRoute || route.path.startsWith(`${targetRoute}/`);

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const navigateTo = (targetRoute) => {
  closeMobileMenu();
  if (route.path !== targetRoute) {
    router.push(targetRoute);
  }
};

const toggleMenu = (event) => {
  menu.value.toggle(event);
};

watch(isMobileMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});

watch(
  () => route.path,
  () => closeMobileMenu()
);

onBeforeUnmount(() => {
  document.body.style.overflow = '';
});

const handleLogout = () => {
  closeMobileMenu();
  authStore.logout();
  router.push('/');
};
</script>

<template>
  <Menubar :model="items" class="app-navbar">
    <template #start>
      <div class="flex items-center nav-brand-wrap">
        <span class="nav-brand">Reapro Achat</span>
      </div>
    </template>

    <template #item="{ item, props, hasSubmenu }">
      <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" @click="navigate" class="nav-item-link"
          :class="{ 'nav-item-link--active': isRouteActive(item.route) }">
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
      <div class="nav-actions">
        <Button v-if="authStore.isAdmin" icon="pi pi-cog" text rounded class="nav-settings-btn" aria-label="Parametres"
          @click="navigateTo('/admin/settings')" />

        <div class="profile-menu-container">
          <Button @click="toggleMenu" class="profile-button" text plain type="button">
            <Avatar icon="pi pi-user" style="background-color: #dee9fc; color: #1a2551" shape="circle" />
            <span class="font-bold text-white ml-2 profile-name">{{ authStore.user?.lastname || authStore.user?.nom ||
              authStore.user?.name || 'User' }}</span>
            <i class="pi pi-angle-down ml-2 text-sm profile-chevron"></i>
          </Button>
          <Menu ref="menu" :model="userMenuItems" :popup="true" :pt="{
            root: { class: 'profile-dropdown-menu' },
            itemlink: { class: 'profile-menu-item' },
            itemicon: { class: 'profile-menu-icon' },
            itemtext: { class: 'profile-menu-text' }
          }" />
        </div>

        <Button icon="pi pi-bars" text rounded type="button" aria-label="Ouvrir le menu" class="mobile-menu-toggle"
          @click="toggleMobileMenu" />
      </div>
    </template>
  </Menubar>

  <transition name="mobile-nav-fade">
    <div v-if="isMobileMenuOpen" class="mobile-nav-overlay" @click="closeMobileMenu"></div>
  </transition>

  <transition name="mobile-nav-slide">
    <aside v-if="isMobileMenuOpen" class="mobile-nav-panel" role="dialog" aria-label="Navigation mobile">
      <div class="mobile-nav-header">
        <span class="mobile-nav-title">Navigation</span>
        <Button icon="pi pi-times" text rounded type="button" aria-label="Fermer le menu" class="mobile-nav-close"
          @click="closeMobileMenu" />
      </div>
      <nav class="mobile-nav-list">
        <button v-for="item in navItems" :key="item.route" type="button" class="mobile-nav-link"
          :class="{ 'mobile-nav-link--active': isRouteActive(item.route) }" @click="navigateTo(item.route)">
          <span :class="item.icon"></span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>
  </transition>

  <ProfileDialog v-model:visible="showProfileDialog" />
</template>

<style>
.app-navbar.p-menubar {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0.75rem 1.5rem !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  position: relative;
  z-index: 1000;
}

.app-navbar .p-menubar-root-list {
  background: transparent !important;
  gap: 0.35rem !important;
}

.app-navbar .p-menubar-item,
.app-navbar .p-menubar-item *,
.app-navbar .p-menubar-item-content,
.app-navbar .p-menubar-item-content *,
.app-navbar .p-menubar-item-link,
.app-navbar .p-menubar-item-link * {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

.nav-item-link,
.nav-item-link.p-menuitem-link {
  color: rgba(255, 255, 255, 0.92) !important;
  padding: 0.6rem 1rem !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  text-decoration: none !important;
  border: none !important;
  position: relative;
  font-weight: 500 !important;
  background: transparent !important;
  background-color: transparent !important;
}

.nav-item-link .p-menuitem-text,
.nav-item-link .p-menuitem-icon,
.nav-item-link span {
  color: rgba(255, 255, 255, 0.92) !important;
  transition: color 0.2s ease !important;
}

.nav-item-link:hover,
.nav-item-link.p-menuitem-link:hover,
.nav-item-link.p-menuitem-link:focus,
.nav-item-link.p-menuitem-link:active {
  background: transparent !important;
  background-color: transparent !important;
}

.nav-item-link:hover .p-menuitem-text,
.nav-item-link:hover .p-menuitem-icon,
.nav-item-link:hover span {
  color: #ffffff !important;
}

.nav-item-link--active,
.nav-item-link--active.p-menuitem-link {
  background: transparent !important;
  background-color: transparent !important;
}

.nav-item-link--active span:first-child {
  color: #f97316 !important;
  text-shadow: 0 0 12px rgba(249, 115, 22, 0.6);
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.nav-item-link--active span.ml-2 {
  color: #ffffff !important;
}

.nav-item-link--active .p-menuitem-text,
.nav-item-link--active .p-menuitem-icon,
.nav-item-link--active span {
  color: #ffffff !important;
}

.nav-item-link:focus-visible {
  outline: none !important;
}

.app-navbar .p-button.p-button-icon-only.p-button-rounded.p-button-text {
  color: rgba(255, 255, 255, 0.9) !important;
  transition: all 0.2s ease;
}

.app-navbar .p-button.p-button-icon-only.p-button-rounded.p-button-text:hover {
  background-color: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  transform: scale(1.06);
}

.app-navbar .pi-angle-down {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 0.8rem;
}

.app-navbar .p-menubar-end {
  margin-left: auto !important;
  display: flex !important;
  align-items: center !important;
}

.app-navbar .p-menubar-button {
  display: none !important;
}

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

.profile-dropdown-menu .p-menuitem-link:hover .p-menuitem-text,
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
.nav-brand {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.025em;
  background: linear-gradient(to right, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.profile-menu-container {
  display: inline-flex;
  align-items: center;
  margin-left: 0.75rem;
}

.profile-button {
  display: inline-flex !important;
  align-items: center;
  padding: 0.5rem 0.75rem !important;
  color: white !important;
  white-space: nowrap;
  border-radius: 9999px !important;
  border: 1px solid transparent !important;
  transition: background-color 0.2s ease, border-color 0.2s ease !important;
}

.profile-button:hover {
  background-color: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(191, 219, 254, 0.42) !important;
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

.nav-settings-btn {
  margin-right: 0.2rem;
}

.mobile-menu-toggle {
  display: none !important;
  color: rgba(255, 255, 255, 0.92) !important;
}

.mobile-menu-toggle:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1098;
}

.mobile-nav-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(88vw, 360px);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: -12px 0 30px rgba(15, 23, 42, 0.25);
  z-index: 1099;
  display: flex;
  flex-direction: column;
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-nav-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a8a;
}

.mobile-nav-list {
  display: flex;
  flex-direction: column;
  padding: 0.8rem;
  gap: 0.4rem;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #334155;
  font-weight: 600;
  padding: 0.8rem 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-nav-link:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.mobile-nav-link--active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e3a8a;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.12);
}

.mobile-nav-fade-enter-active,
.mobile-nav-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mobile-nav-fade-enter-from,
.mobile-nav-fade-leave-to {
  opacity: 0;
}

.mobile-nav-slide-enter-active,
.mobile-nav-slide-leave-active {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.mobile-nav-slide-enter-from,
.mobile-nav-slide-leave-to {
  transform: translateX(22px);
  opacity: 0;
}

@media (max-width: 1024px) {
  .app-navbar.p-menubar {
    padding: 0.6rem 0.8rem !important;
  }

  .app-navbar :deep(.p-menubar-root-list) {
    display: none !important;
  }

  .nav-brand {
    font-size: 1.22rem;
  }

  .profile-menu-container {
    margin-left: 0.3rem;
  }

  .profile-button {
    padding: 0.2rem !important;
    min-width: 0;
  }

  .profile-name,
  .profile-chevron {
    display: none;
  }

  .mobile-menu-toggle {
    display: inline-flex !important;
  }
}

@media (max-width: 640px) {
  .nav-brand {
    font-size: 1.05rem;
  }
}
</style>