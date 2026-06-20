<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import ProfileDialog from './ProfileDialog.vue';
import ebsLogo from '../assets/ebs-integra-logo.svg';
import apiClient from '../api/axios';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showProfileDialog = ref(false);
const isMobileMenuOpen = ref(false);
const profileOpen = ref(false);

// Logo footer : utilise EN PRIORITÉ le fichier réel déposé dans public/ (ex. public/ebs-logo.png).
// Tant qu'il n'existe pas, repli automatique sur la recréation SVG (aucune image cassée).
const ebsLogoSrc = ref('/ebs-logo.png');
const onLogoError = () => { if (ebsLogoSrc.value !== ebsLogo) ebsLogoSrc.value = ebsLogo; };

// Version applicative : lue dynamiquement depuis /api/version (source = version du pom backend),
// affichée en court « V<majeur>.<mineur> » (ex. V2.6). Repli sobre « V?.? » si l'API est indisponible.
// Mise en cache (sessionStorage) car la navbar est re-montée à chaque navigation → un seul appel/session.
const VERSION_CACHE_KEY = 'reapro.appVersion';
const appVersion = ref('V?.?');
try {
  const cached = sessionStorage.getItem(VERSION_CACHE_KEY);
  if (cached) appVersion.value = cached;
} catch (e) { /* noop */ }

function shortDisplayVersion(displayVersion) {
  const match = String(displayVersion || '').match(/V(\d+)\.(\d+)/i);
  return match ? `V${match[1]}.${match[2]}` : 'V?.?';
}

async function loadAppVersion() {
  // déjà résolue (cache) → pas de re-fetch ; seul « V?.? » (échec/non chargé) retente.
  if (appVersion.value && appVersion.value !== 'V?.?') return;
  try {
    const { data } = await apiClient.get('/api/version');
    const label = shortDisplayVersion(data?.displayVersion);
    appVersion.value = label;
    if (label !== 'V?.?') {
      try { sessionStorage.setItem(VERSION_CACHE_KEY, label); } catch (e) { /* noop */ }
    }
  } catch (e) {
    // silencieux : ne pas spammer la console, ne pas casser la navbar.
    appVersion.value = 'V?.?';
  }
}

// Collapse desktop — PERSISTÉ : la navbar est re-montée à chaque navigation
// (montée par vue), donc on conserve l'état dans localStorage pour éviter un reset.
const COLLAPSE_KEY = 'reapro.nav.collapsed';
const collapsed = ref(false);
try { collapsed.value = localStorage.getItem(COLLAPSE_KEY) === '1'; } catch (e) { /* noop */ }

// 7 entrées à plat (label court + libellé complet en tooltip). Routes existantes, inchangées.
const navItems = [
  { label: 'Comparateur', full: 'Comparateur Achat', icon: 'pi pi-search-plus', route: '/comparateur' },
  { label: 'Confirmation Achat', full: 'Confirmation Achat', icon: 'pi pi-check-square', route: '/confirmation-achat' },
  { label: 'B2B', full: 'B2B', icon: 'pi pi-users', route: '/b2b' },
  { label: 'Analyse B2B', full: 'Analyse Recherches B2B', icon: 'pi pi-chart-line', route: '/search-opportunities' },
  { label: 'Sync Adaptable', full: 'Synchronisation Adaptable', icon: 'pi pi-sync', route: '/sync-adaptable' },
  { label: 'Partslink', full: 'Catalogue Partslink', icon: 'pi pi-desktop', route: '/partslink-viewer' },
  { label: 'TecDoc', full: 'Catalogue TecDoc', icon: 'pi pi-box', route: '/catalogue-tecdoc' },
  { label: 'Gestion Articles', full: 'Gestion Articles', icon: 'pi pi-tags', route: '/gestion-articles' },
];

const userName = computed(() =>
  authStore.user?.lastname || authStore.user?.nom || authStore.user?.name || 'User'
);

// Titre de marque = nom de la société du user (fallback Reapro si non chargé)
const companyName = computed(() =>
  authStore.user?.bcCompanyName || authStore.user?.companyName || 'Reapro'
);

const isRouteActive = (targetRoute) =>
  route.path === targetRoute || route.path.startsWith(`${targetRoute}/`);

// Le contenu des vues est décalé par padding-left = var(--rv-w) (240/70px),
// mis à jour ici (compatible tous navigateurs, sans :has).
const applyWidth = () => {
  try {
    document.documentElement.style.setProperty('--rv-w', collapsed.value ? '70px' : '240px');
  } catch (e) { /* noop */ }
};

const closeAll = () => { profileOpen.value = false; isMobileMenuOpen.value = false; };
const toggleProfile = () => { profileOpen.value = !profileOpen.value; };
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  try { localStorage.setItem(COLLAPSE_KEY, collapsed.value ? '1' : '0'); } catch (e) { /* noop */ }
};

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

onMounted(() => {
  applyWidth();
  document.addEventListener('click', onDocClick);
  loadAppVersion();
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  document.body.style.overflow = '';
});

watch(collapsed, applyWidth);
watch(isMobileMenuOpen, (open) => { document.body.style.overflow = open ? 'hidden' : ''; });
watch(() => route.path, () => closeAll());
</script>

<template>
  <!-- ═══════════ SIDEBAR VERTICALE (desktop fixe / mobile drawer) ═══════════
       Premier enfant du wrapper de page ; fixe → ne décale pas les dialogs/toasts
       téléportés dans <body> (centrage Confirmation Achat préservé). -->
  <aside class="rv-sidebar" :class="{ collapsed, open: isMobileMenuOpen }">
    <!-- 1. Brand : carte navy. Expanded → texte + collapse ; collapsed → collapse seul. -->
    <div class="rv-brandcard">
      <div class="rv-brandtxt"><b :title="companyName">{{ companyName }}</b></div>
      <button type="button" class="rv-collapse" :title="collapsed ? 'Déployer le menu' : 'Réduire le menu'"
        :aria-label="collapsed ? 'Déployer le menu' : 'Réduire le menu'" @click="toggleCollapse">
        <svg class="rv-burger" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
    </div>

    <!-- 2. Menu principal (zone scrollable) -->
    <div class="rv-section">Navigation</div>
    <nav class="rv-menu">
      <RouterLink v-for="it in navItems" :key="it.route" :to="it.route" class="rv-link"
        :class="{ 'is-active': isRouteActive(it.route) }" :title="it.full" @click="closeAll">
        <i :class="it.icon"></i><span class="rv-label">{{ it.label }}</span>
      </RouterLink>
    </nav>

    <!-- 3. Zone compte (séparée, ancrée en bas) : Paramètres (admin) + profil -->
    <div class="rv-actions">
      <button v-if="authStore.isAdmin" type="button" class="rv-link" title="Paramètres"
        @click="navigateTo('/admin/settings')">
        <i class="pi pi-cog"></i><span class="rv-label">Paramètres</span>
      </button>

      <div class="rv-profile-wrap">
        <button type="button" class="rv-link" :class="{ open: profileOpen }" :title="userName"
          @click.stop="toggleProfile">
          <span class="rv-avatar"><i class="pi pi-user"></i></span>
          <span class="rv-label">{{ userName }}</span>
          <i class="pi pi-angle-up rv-caret"></i>
        </button>
        <div v-if="profileOpen" class="rv-dropup" @click.stop>
          <button type="button" class="rv-dropup-item" @click="openProfile">
            <i class="pi pi-user"></i><span>Profil</span>
          </button>
          <div class="rv-dropup-sep"></div>
          <button type="button" class="rv-dropup-item danger" @click="handleLogout">
            <i class="pi pi-sign-out"></i><span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Pied : rappel navy (version + chip) -->
    <div class="rv-foot">
      <div class="rv-foot-card">
        <span class="rv-foot-version">{{ appVersion }}</span>
        <img class="rv-foot-logo" :src="ebsLogoSrc" @error="onLogoError" alt="EBS" />
      </div>
    </div>
  </aside>

  <!-- Bouton hamburger (mobile uniquement) -->
  <button type="button" class="rv-mobile-toggle" title="Menu" aria-label="Ouvrir le menu"
    @click.stop="toggleMobileMenu">
    <i class="pi pi-bars"></i>
  </button>

  <!-- Overlay mobile -->
  <transition name="rv-fade">
    <div v-if="isMobileMenuOpen" class="rv-overlay" @click="closeAll"></div>
  </transition>

  <ProfileDialog v-model:visible="showProfileDialog" />
</template>

<style scoped>
/* ════════════ Sidebar verticale Reapro — tokens Confirmation Achat C2 ════════════ */
.rv-sidebar {
  position: fixed; left: 0; top: 0; bottom: 0; z-index: 950;
  width: 240px; display: flex; flex-direction: column;
  background: #f7f9fc;                          /* clair, mais pas blanc pur */
  border-right: 1px solid #dde4ee;
  box-shadow: 1px 0 4px rgba(16, 24, 40, .05);
  font-family: var(--c2-font-sans);
  transition: width .22s ease, transform .22s ease;
}
.rv-sidebar.collapsed { width: 70px; }

/* 1. Brand — carte navy alignée (haut/bas) avec le matériau des en-têtes C2. */
.rv-brandcard {
  display: flex; align-items: center; gap: 10px;
  /* Aligné sur le header de page : même top (--c2-page-pad = padding-top du contenu)
     et même hauteur (--c2-head-h) → top ET bottom alignés sur toutes les pages. */
  margin: var(--c2-page-pad) 10px 8px; padding: 10px 14px; min-height: var(--c2-head-h, 72px); box-sizing: border-box;
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border); border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 4px 14px rgba(15, 23, 42, .18);
  flex-shrink: 0;
}
.rv-brandtxt { display: flex; flex-direction: column; line-height: 1.2; flex: 1; min-width: 0; }
.rv-brandtxt b { font-size: 1.05rem; font-weight: 800; color: #fff; letter-spacing: -.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rv-brandtxt em {
  font-style: normal; font-size: .62rem; font-weight: 700; color: var(--c2-head-accent);
  text-transform: uppercase; letter-spacing: .08em;
}
/* Bouton collapse/expand — intégré, ghost navy net, icône centrée */
.rv-collapse {
  margin-left: auto; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 10px; padding: 0; line-height: 0;
  background: rgba(255, 255, 255, .07); border: 1px solid transparent;
  color: #cbd5e1; cursor: pointer; font-size: .8rem;
  transition: background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .12s ease;
}
/* Hover = accent Frozen (charte) : teinte + bordure + anneau doux, icône blanche */
.rv-collapse:hover {
  background: rgba(130, 201, 229, .16);
  border-color: rgba(130, 201, 229, .45);
  color: #fff;
  box-shadow: 0 0 0 3px rgba(130, 201, 229, .12);
}
.rv-collapse:active { transform: scale(.92); background: rgba(130, 201, 229, .24); }
.rv-collapse:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
/* Icône menu moderne (3 traits fins, bouts arrondis, dernier raccourci) */
.rv-collapse .rv-burger { width: 18px; height: 18px; display: block; }

/* 2. Menu — libellé de section + zone scrollable + items homogènes */
.rv-section {
  padding: 4px 16px 6px; font-size: .62rem; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase; color: #64748b; flex-shrink: 0;
}
.rv-menu {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px; padding: 2px 10px 8px;
}
.rv-menu::-webkit-scrollbar { width: 6px; }
.rv-menu::-webkit-scrollbar-thumb { background: #d3dbe6; border-radius: 999px; }
.rv-link {
  position: relative; display: flex; align-items: center; gap: 11px;
  min-height: 40px; padding: 0 12px; width: 100%;
  color: #475569; border-radius: 10px; border: none; background: transparent;
  font-weight: 600; font-size: .86rem; text-decoration: none; text-align: left; cursor: pointer;
  font-family: inherit;
  transition: background .15s ease, color .15s ease;
}
.rv-link i { font-size: .98rem; color: #7c8898; width: 22px; text-align: center; flex-shrink: 0; transition: color .15s ease; }
.rv-link .rv-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rv-link:hover { background: #eef3f9; color: #0f172a; }
.rv-link:hover i { color: #475569; }
.rv-link.is-active {
  background: linear-gradient(90deg, #dbeafe, #eaf2ff);
  color: var(--c2-select-accent); font-weight: 700;
}
.rv-link.is-active i { color: var(--c2-select-accent); }
.rv-link.is-active::before {
  content: ''; position: absolute; left: 4px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 18px; border-radius: 3px; background: var(--c2-select-accent);
}

/* 3. Actions bas de menu (Paramètres / profil) — ancrées, séparateur fin */
.rv-actions { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-top: 1px solid #e4eaf2; flex-shrink: 0; }
.rv-profile-wrap { position: relative; }
.rv-link.open { background: #eef3f9; color: #0f172a; }
.rv-avatar {
  display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;
  border-radius: 50%; background: #eff6ff; color: #1e40af; font-size: .78rem; flex-shrink: 0;
  margin-left: -3px;
}
.rv-caret { margin-left: auto; font-size: .7rem !important; color: #94a3b8; }

/* Menu profil — s'ouvre vers le HAUT (surface claire, comme les dialogs C2) */
.rv-dropup {
  position: absolute; bottom: calc(100% + 8px); left: 6px; z-index: 1001; min-width: 190px;
  background: #fff; border: 1px solid #e8edf3; border-radius: 12px;
  box-shadow: 0 -10px 34px rgba(15, 23, 42, .22); padding: 6px;
}
.rv-dropup-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px;
  background: transparent; border: none; border-radius: 8px; cursor: pointer;
  color: #334155; font-weight: 600; font-size: .84rem; text-align: left; font-family: inherit;
  transition: background .15s ease, color .15s ease;
}
.rv-dropup-item i { font-size: .92rem; color: #64748b; }
.rv-dropup-item:hover { background: #f1f5f9; color: #1e40af; }
.rv-dropup-item:hover i { color: #1e40af; }
.rv-dropup-item.danger:hover { background: #fef2f2; color: #b91c1c; }
.rv-dropup-item.danger:hover i { color: #b91c1c; }
.rv-dropup-sep { height: 1px; background: #e8edf3; margin: 5px 4px; }

/* 4. Pied — rappel navy header (version + chip) */
/* padding-bas = var(--c2-page-pad) (8px) → footer navbar aligné au pixel avec le footer de page */
.rv-foot { padding: 10px 10px var(--c2-page-pad); flex-shrink: 0; }
.rv-foot-card {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  height: 48px; box-sizing: border-box;   /* = hauteur du footer de page (uniformisé) */
  padding: 0 12px; border-radius: 10px;
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border);
}
.rv-foot-version { font-size: .74rem; font-weight: 700; color: #cbd5e1; white-space: nowrap; }
.rv-foot-app { font-size: inherit; color: inherit; }
/* Pastille claire → le logo s'affiche avec ses couleurs de marque exactes, lisible sur navy.
   Dimension ajustée à l'espace du footer 48px. */
/* Logo sur fond transparent (pas de pastille). Taille ajustée à l'espace du footer 48px. */
.rv-foot-logo {
  height: 26px; width: auto; max-width: 150px; display: block; flex-shrink: 0;
  object-fit: contain;
}

/* ─── Mode COLLAPSED (70px) : icônes seules ; brand = collapse seul ─── */
.rv-sidebar.collapsed .rv-brandcard { justify-content: center; gap: 0; margin: var(--c2-page-pad) 8px 8px; padding: 9px 6px; }
.rv-sidebar.collapsed .rv-brandtxt { display: none; }
.rv-sidebar.collapsed .rv-collapse { margin-left: 0; width: 30px; height: 30px; }
.rv-sidebar.collapsed .rv-section { display: none; }
.rv-sidebar.collapsed .rv-menu { padding: 6px 8px; }
.rv-sidebar.collapsed .rv-link { justify-content: center; gap: 0; padding: 0; }
.rv-sidebar.collapsed .rv-link .rv-label { display: none; }
.rv-sidebar.collapsed .rv-link i { width: auto; }
.rv-sidebar.collapsed .rv-link.is-active::before { display: none; }
.rv-sidebar.collapsed .rv-caret { display: none; }
.rv-sidebar.collapsed .rv-avatar { margin-left: 0; }
.rv-sidebar.collapsed .rv-dropup { left: calc(100% + 8px); bottom: 0; }   /* popover latéral en réduit */
.rv-sidebar.collapsed .rv-foot-card { justify-content: center; padding: 9px 6px; }
.rv-sidebar.collapsed .rv-foot-app, .rv-sidebar.collapsed .rv-foot-logo { display: none; }

/* ─── Hamburger + overlay (mobile uniquement) ─── */
.rv-mobile-toggle { display: none; }
.rv-overlay { display: none; }

/* Transitions overlay */
.rv-fade-enter-active, .rv-fade-leave-active { transition: opacity .2s ease; }
.rv-fade-enter-from, .rv-fade-leave-to { opacity: 0; }

@media (max-width: 1024px) {
  /* Sidebar = drawer off-canvas ; le collapse desktop est neutralisé */
  .rv-sidebar { transform: translateX(-100%); z-index: 1099; width: 240px; }
  .rv-sidebar.open { transform: translateX(0); }
  .rv-sidebar.collapsed { width: 240px; }
  .rv-sidebar.collapsed .rv-brandcard { justify-content: flex-start; gap: 10px; margin: var(--c2-page-pad) 10px 8px; padding: 10px 14px; }
  .rv-sidebar.collapsed .rv-brandtxt { display: flex; }
  .rv-sidebar.collapsed .rv-collapse { display: none; }
  .rv-sidebar.collapsed .rv-section { display: block; }
  .rv-sidebar.collapsed .rv-menu { padding: 2px 10px 8px; }
  .rv-sidebar.collapsed .rv-link { justify-content: flex-start; gap: 11px; padding: 0 12px; }
  .rv-sidebar.collapsed .rv-link.is-active::before { display: block; }
  .rv-sidebar.collapsed .rv-link .rv-label { display: inline; }
  .rv-sidebar.collapsed .rv-caret { display: inline; }
  .rv-sidebar.collapsed .rv-avatar { margin-left: -3px; }
  .rv-sidebar.collapsed .rv-dropup { left: 6px; bottom: calc(100% + 8px); }
  .rv-sidebar.collapsed .rv-foot-card { justify-content: space-between; padding: 9px 12px; }
  .rv-sidebar.collapsed .rv-foot-app { display: inline; }
  .rv-sidebar.collapsed .rv-foot-logo { display: block; }
  /* En desktop le collapse cache le chevron-haut sur le bouton collapse ; rien à faire ici */
  .rv-collapse { display: none; }

  .rv-overlay { display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, .5); backdrop-filter: blur(2px); z-index: 1098; }
  .rv-mobile-toggle {
    display: inline-flex; align-items: center; justify-content: center;
    position: fixed; top: 12px; left: 12px; z-index: 1097;
    width: 40px; height: 40px; border: 1px solid var(--c2-head-border); border-radius: 10px;
    background: var(--c2-head-bg); color: #cbd5e1; cursor: pointer;
    box-shadow: 0 2px 8px rgba(15, 23, 42, .3);
  }
}
</style>

<!-- Décalage GLOBAL (non scoped) du contenu des vues qui montent la sidebar.
     padding-left sur le wrapper (et non marge sur le contenu width:100%) → aucun
     débordement horizontal. Ces classes wrapper n'existent que sur les pages
     authentifiées ; les pages d'auth (.login-container) ne sont pas affectées.
     Largeur via --rv-w (240px / 70px) mise à jour par le composant. -->
<style>
.page-layout,
.dashboard-layout,
.customers-layout {
  padding-left: var(--rv-w, 240px);
  transition: padding-left .22s ease;
}
@media (max-width: 1024px) {
  .page-layout,
  .dashboard-layout,
  .customers-layout { padding-left: 0; }
}
</style>
