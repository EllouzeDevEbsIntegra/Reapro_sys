<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import ProfileDialog from './ProfileDialog.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showProfileDialog = ref(false);
const isMobileMenuOpen = ref(false);
const profileOpen = ref(false);

// 7 entrées à plat (labels courts, libellé complet en tooltip). Routes existantes, inchangées.
const navItems = [
  { label: 'Comparateur', full: 'Comparateur Achat', icon: 'pi pi-search-plus', route: '/comparateur' },
  { label: 'Confirmation Achat', full: 'Confirmation Achat', icon: 'pi pi-check-square', route: '/confirmation-achat' },
  { label: 'B2B', full: 'B2B', icon: 'pi pi-users', route: '/b2b' },
  { label: 'Analyse B2B', full: 'Analyse Recherches B2B', icon: 'pi pi-chart-line', route: '/search-opportunities' },
  { label: 'Sync Adaptable', full: 'Synchronisation Adaptable', icon: 'pi pi-sync', route: '/sync-adaptable' },
  { label: 'Partslink', full: 'Catalogue Partslink', icon: 'pi pi-desktop', route: '/partslink-viewer' },
  { label: 'Ancien Conf.', full: 'Ancien Confirmation Achat', icon: 'pi pi-history', route: '/ancien-confirmation-achat' },
];

const userName = computed(() =>
  authStore.user?.lastname || authStore.user?.nom || authStore.user?.name || 'User'
);

const isRouteActive = (targetRoute) =>
  route.path === targetRoute || route.path.startsWith(`${targetRoute}/`);

const closeAll = () => { profileOpen.value = false; isMobileMenuOpen.value = false; };
const toggleProfile = () => { profileOpen.value = !profileOpen.value; };
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };

const navigateTo = (targetRoute) => {
  closeAll();
  if (route.path !== targetRoute) router.push(targetRoute);
};

const openProfile = () => { closeAll(); showProfileDialog.value = true; };

const handleLogout = () => {
  closeAll();
  authStore.logout();
  router.push('/');
};

// Fermeture du dropdown profil au clic extérieur
const onDocClick = () => { profileOpen.value = false; };

onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  document.body.style.overflow = '';
});

watch(isMobileMenuOpen, (open) => { document.body.style.overflow = open ? 'hidden' : ''; });
watch(() => route.path, () => closeAll());
</script>

<template>
  <header class="nav2">
    <!-- ─── Bloc brand : capsule logo-mark + Reapro / ERP Achat (sky) ─── -->
    <div class="nav2-brand">
      <span class="nav2-mark">R</span>
      <div class="nav2-brandtxt"><b>Reapro</b><em>ERP Achat</em></div>
    </div>

    <!-- ─── Track de navigation : 7 pills (scroll interne en repli) ─── -->
    <nav class="nav2-track">
      <RouterLink v-for="it in navItems" :key="it.route" :to="it.route" class="nav2-pill"
        :class="{ 'is-active': isRouteActive(it.route) }" :title="it.full" @click="closeAll">
        <i :class="it.icon"></i><span>{{ it.label }}</span>
      </RouterLink>
    </nav>

    <div class="nav2-spacer"></div>

    <!-- ─── Capsule actions : settings (admin) · séparateur · profil ─── -->
    <div class="nav2-capsule">
      <button v-if="authStore.isAdmin" type="button" class="nav2-iconbtn" title="Paramètres"
        aria-label="Paramètres" @click="navigateTo('/admin/settings')">
        <i class="pi pi-cog"></i>
      </button>
      <span v-if="authStore.isAdmin" class="nav2-divider"></span>

      <div class="nav2-profile-wrap">
        <button type="button" class="nav2-profile" :class="{ open: profileOpen }" @click.stop="toggleProfile">
          <span class="nav2-avatar"><i class="pi pi-user"></i></span>
          <span class="nav2-username">{{ userName }}</span>
          <i class="pi pi-angle-down nav2-caret"></i>
        </button>
        <div v-if="profileOpen" class="nav2-dropdown" @click.stop>
          <button type="button" class="nav2-dropdown-item" @click="openProfile">
            <i class="pi pi-user"></i><span>Profil</span>
          </button>
          <div class="nav2-dropdown-sep"></div>
          <button type="button" class="nav2-dropdown-item danger" @click="handleLogout">
            <i class="pi pi-sign-out"></i><span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>

    <button type="button" class="nav2-burger" title="Menu" aria-label="Ouvrir le menu"
      @click.stop="toggleMobileMenu">
      <i class="pi pi-bars"></i>
    </button>
  </header>

  <!-- ─── Drawer mobile (assorti Z : navy C2) ─── -->
  <transition name="nav2-fade">
    <div v-if="isMobileMenuOpen" class="nav2-overlay" @click="closeAll"></div>
  </transition>
  <transition name="nav2-slide">
    <aside v-if="isMobileMenuOpen" class="nav2-drawer" role="dialog" aria-label="Navigation mobile">
      <div class="nav2-drawer-head">
        <div class="nav2-brand">
          <span class="nav2-mark">R</span>
          <div class="nav2-brandtxt"><b>Reapro</b><em>ERP Achat</em></div>
        </div>
        <button type="button" class="nav2-iconbtn" aria-label="Fermer le menu" @click="closeAll">
          <i class="pi pi-times"></i>
        </button>
      </div>
      <nav class="nav2-drawer-list">
        <button v-for="it in navItems" :key="it.route" type="button" class="nav2-drawer-link"
          :class="{ 'is-active': isRouteActive(it.route) }" @click="navigateTo(it.route)">
          <i :class="it.icon"></i><span>{{ it.full }}</span>
        </button>
        <div class="nav2-drawer-sep"></div>
        <button v-if="authStore.isAdmin" type="button" class="nav2-drawer-link"
          @click="navigateTo('/admin/settings')"><i class="pi pi-cog"></i><span>Paramètres</span></button>
        <button type="button" class="nav2-drawer-link" @click="openProfile">
          <i class="pi pi-user"></i><span>Profil</span></button>
        <button type="button" class="nav2-drawer-link danger" @click="handleLogout">
          <i class="pi pi-sign-out"></i><span>Déconnexion</span></button>
      </nav>
    </aside>
  </transition>

  <ProfileDialog v-model:visible="showProfileDialog" />
</template>

<style scoped>
/* ════════════ Navbar Reapro — « Z · C2 Native » ════════════
   Construite avec les tokens de Confirmation Achat C2 :
   matériau des en-têtes de zone (#1e293b→#243246, bordure #3b4a61),
   track façon .c2-carttabs (piste blanche translucide, actif BLEU PLEIN #2563eb),
   sous-label brand en sky #7dd3fc (label STOCKS), survols matière .c2-year.
   L'orange reste réservé au panier (sémantique C2 préservée). */
.nav2 {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 58px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: linear-gradient(180deg, #1e293b, #243246);
  border-bottom: 1px solid #3b4a61;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 2px 10px rgba(15, 23, 42, .25);
  font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
}

/* ─── Bloc brand (capsule) ─── */
.nav2-brand {
  display: flex; align-items: center; gap: 10px; padding: 5px 12px 5px 5px;
  background: rgba(255, 255, 255, .10); border: 1px solid #3b4a61; border-radius: 12px;
  flex-shrink: 0;
}
.nav2-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 31px; height: 31px; border-radius: 9px;
  background: #2563eb; color: #fff; font-size: 1rem; font-weight: 800;
  box-shadow: 0 1px 3px rgba(37, 99, 235, .4);
  user-select: none; flex-shrink: 0;
}
.nav2-brandtxt { display: flex; flex-direction: column; line-height: 1.15; }
.nav2-brandtxt b { font-size: .95rem; font-weight: 800; color: #fff; letter-spacing: -.02em; }
.nav2-brandtxt em {
  font-style: normal; font-size: .6rem; font-weight: 700; color: #7dd3fc;
  text-transform: uppercase; letter-spacing: .07em;
}

/* ─── Track de navigation (façon c2-carttabs) ─── */
.nav2-track {
  display: flex; align-items: center; gap: 2px;
  background: rgba(255, 255, 255, .08); border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 12px; padding: 3px;
  min-width: 0; overflow-x: auto; scrollbar-width: none;
}
.nav2-track::-webkit-scrollbar { height: 0; display: none; }
.nav2-pill {
  display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px;
  color: #cbd5e1; background: transparent; border: 1px solid transparent; border-radius: 9px;
  font-weight: 650; font-size: .84rem; cursor: pointer; text-decoration: none; white-space: nowrap;
  flex-shrink: 0; transition: color .15s ease, background .15s ease, box-shadow .15s ease;
}
.nav2-pill i { font-size: .9rem; color: #94a3b8; transition: color .15s ease; }
.nav2-pill:hover { color: #fff; background: rgba(255, 255, 255, .10); }
.nav2-pill:hover i { color: #cbd5e1; }
.nav2-pill.is-active {
  color: #fff; background: #2563eb; border-color: transparent;
  box-shadow: 0 1px 3px rgba(37, 99, 235, .4);
}
.nav2-pill.is-active i { color: #bfdbfe; }

.nav2-spacer { flex: 1; min-width: 0; }

/* ─── Capsule actions (droite) ─── */
.nav2-capsule {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
  background: rgba(255, 255, 255, .10); border: 1px solid #3b4a61; border-radius: 999px; padding: 3px;
}
.nav2-iconbtn {
  display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px;
  border: none; background: transparent; border-radius: 999px; cursor: pointer;
  color: #94a3b8; transition: background .15s ease, color .15s ease;
}
.nav2-iconbtn:hover { background: rgba(255, 255, 255, .12); color: #fff; }
.nav2-divider { width: 1px; height: 18px; background: rgba(255, 255, 255, .14); flex-shrink: 0; }

.nav2-profile-wrap { position: relative; }
.nav2-profile {
  display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 10px 0 3px;
  border: none; background: transparent; border-radius: 999px; cursor: pointer;
  color: #cbd5e1; transition: background .15s ease, color .15s ease;
}
.nav2-profile:hover, .nav2-profile.open { background: rgba(255, 255, 255, .12); color: #fff; }
.nav2-avatar {
  display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;
  border-radius: 50%; background: #eff6ff; color: #1e40af; font-size: .85rem; flex-shrink: 0;
}
.nav2-username { font-weight: 700; font-size: .84rem; white-space: nowrap; }
.nav2-caret { font-size: .7rem !important; color: #94a3b8; }

/* ─── Dropdown profil (surface claire, comme les dialogs C2) ─── */
.nav2-dropdown {
  position: absolute; top: calc(100% + 10px); right: 0; z-index: 1001; min-width: 190px;
  background: #fff; border: 1px solid #e8edf3; border-radius: 12px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, .28); padding: 6px;
}
.nav2-dropdown-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px;
  background: transparent; border: none; border-radius: 8px; cursor: pointer;
  color: #334155; font-weight: 600; font-size: .84rem; text-align: left;
  transition: background .15s ease, color .15s ease;
}
.nav2-dropdown-item i { font-size: .92rem; color: #64748b; }
.nav2-dropdown-item:hover { background: #f1f5f9; color: #1e40af; }
.nav2-dropdown-item:hover i { color: #1e40af; }
.nav2-dropdown-item.danger:hover { background: #fef2f2; color: #b91c1c; }
.nav2-dropdown-item.danger:hover i { color: #b91c1c; }
.nav2-dropdown-sep { height: 1px; background: #e8edf3; margin: 5px 4px; }

.nav2-burger { display: none; }

/* ─── Drawer mobile (navy C2, assorti Z) ─── */
.nav2-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, .5); backdrop-filter: blur(2px); z-index: 1098; }
.nav2-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: min(88vw, 340px); z-index: 1099;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #1e293b, #1b2536); border-left: 1px solid #3b4a61;
  box-shadow: -12px 0 30px rgba(15, 23, 42, .35);
}
.nav2-drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid #3b4a61;
}
.nav2-drawer-list { display: flex; flex-direction: column; gap: 4px; padding: 12px; overflow-y: auto; }
.nav2-drawer-link {
  display: flex; align-items: center; gap: 12px; padding: 11px 12px; width: 100%;
  border: 1px solid transparent; border-radius: 10px; background: transparent; cursor: pointer;
  color: #cbd5e1; font-weight: 600; font-size: .9rem; text-align: left; transition: all .15s ease;
}
.nav2-drawer-link i { font-size: 1rem; width: 18px; color: #94a3b8; }
.nav2-drawer-link:hover { background: rgba(255, 255, 255, .07); color: #fff; }
.nav2-drawer-link:hover i { color: #cbd5e1; }
.nav2-drawer-link.is-active { background: #2563eb; border-color: transparent; color: #fff; box-shadow: 0 1px 3px rgba(37, 99, 235, .4); }
.nav2-drawer-link.is-active i { color: #bfdbfe; }
.nav2-drawer-link.danger:hover { background: rgba(220, 38, 38, .18); color: #fca5a5; }
.nav2-drawer-link.danger:hover i { color: #fca5a5; }
.nav2-drawer-sep { height: 1px; background: #3b4a61; margin: 8px 4px; }

/* Transitions drawer */
.nav2-fade-enter-active, .nav2-fade-leave-active { transition: opacity .2s ease; }
.nav2-fade-enter-from, .nav2-fade-leave-to { opacity: 0; }
.nav2-slide-enter-active, .nav2-slide-leave-active { transition: transform .24s ease, opacity .24s ease; }
.nav2-slide-enter-from, .nav2-slide-leave-to { transform: translateX(22px); opacity: 0; }

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .nav2 { gap: 10px; padding: 0 12px; }
  .nav2-track, .nav2-spacer { display: none; }
  .nav2-capsule { margin-left: auto; }
  .nav2-burger {
    display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px;
    border: none; background: transparent; border-radius: 9px; cursor: pointer; color: #cbd5e1;
  }
  .nav2-burger:hover { background: rgba(255, 255, 255, .12); color: #fff; }
  .nav2-username { display: none; }
  .nav2-profile { padding: 0 3px; }
  .nav2-profile .nav2-caret { display: none; }
}
</style>
