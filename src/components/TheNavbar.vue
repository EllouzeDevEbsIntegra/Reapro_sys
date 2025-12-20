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
        <div class="profile-menu-container">
          <Button @click="toggleMenu" class="profile-button" text plain>
            <Avatar icon="pi pi-user" shape="circle" />
            <span class="font-bold text-white ml-2">{{ authStore.user?.lastname || 'Admin' }}</span>
            <i class="pi pi-angle-down ml-2 text-sm"></i>
          </Button>
          <Menu ref="menu" :model="userMenuItems" :popup="true" />
        </div>
      </div>
    </template>
  </Menubar>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'

const router = useRouter()
const authStore = useAuthStore()

const menu = ref()
const userMenuItems = ref([
  {
    label: 'Profil',
    icon: 'pi pi-user',
    command: () => router.push('/profile')
  },
  {
    separator: true
  },
  {
    label: 'Déconnecter',
    icon: 'pi pi-sign-out',
    command: () => {
      authStore.logout()
      router.push('/')
    }
  }
])

const toggleMenu = (event) => {
  menu.value.toggle(event)
}

const items = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    route: '/dashboard'
  },
  {
    label: 'Comparateur Achat',
    icon: 'pi pi-search-plus',
    route: '/comparateur'
  }
])
</script>

<style>
/* Global styles to override PrimeVue defaults (matching SAV_sys) */
.p-menubar {
  background-color: #1e3a8a !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0.5rem 2rem !important;
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

/* Added for better visibility */
.p-menubar .p-menuitem-content .p-menuitem-link .p-menuitem-text,
.p-menubar .p-menuitem-content .p-menuitem-link .p-menuitem-icon {
  color: rgba(255, 255, 255, 0.9) !important;
}

.p-menubar a {
  color: rgba(255, 255, 255, 0.9) !important;
}

.p-menubar .p-menuitem-link:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.p-menubar .p-menuitem-link:hover .p-menuitem-text,
.p-menubar .p-menuitem-link:hover .p-menuitem-icon,
.p-menubar .p-menuitem-content:hover .p-menuitem-link .p-menuitem-text,
.p-menubar .p-menuitem-content:hover .p-menuitem-link .p-menuitem-icon {
  color: #ffffff !important;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-right: 2rem;
}

.profile-button {
  color: white !important;
  padding: 0.5rem 1rem !important;
}

.profile-button:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.p-avatar {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}
</style>
