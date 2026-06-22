import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue')
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue')
  },
  {
    path: '/comparateur',
    name: 'comparateur',
    component: () => import('../views/CompareQuotesView.vue'),
    meta: { permissions: ['COMPARATOR_ACCESS'] }
  },
  {
    path: '/comparateur/:compareQuoteNo',
    name: 'comparateur-detail',
    component: () => import('../views/CompareQuoteDetailView.vue'),
    meta: { permissions: ['COMPARATOR_ACCESS'] }
  },
  {
    path: '/b2b',
    name: 'b2b',
    component: () => import('../views/B2BView.vue'),
    meta: { permissions: ['B2B_ACCESS'] }
  },
  {
    path: '/search-opportunities',
    name: 'SearchOpportunities',
    component: () => import('../views/SearchOpportunitiesView.vue'),
    meta: {
      title: 'Analyse Recherches B2B',
      permissions: ['SEARCH_OPPORTUNITIES_ACCESS']
    }
  },
  {
    path: '/admin/search-exclusions',
    name: 'SearchExclusions',
    component: () => import('../views/SearchExclusionsView.vue'),
    meta: {
      title: 'Exclusions Recherches B2B',
      permissions: ['SEARCH_OPPORTUNITIES_ACCESS']
    }
  },
  {
    path: '/admin/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: 'Paramètres système',
      permissions: ['SYSTEM_SETTINGS_ACCESS']
    }
  },
  // ── RBAC Lot 3 : section Paramètres + administration des utilisateurs/autorisations ──
  {
    path: '/parametres',
    name: 'SettingsHub',
    component: () => import('../views/SettingsHubView.vue'),
    meta: {
      title: 'Paramètres',
      permissions: ['SETTINGS_ACCESS', 'USER_MANAGEMENT_ACCESS', 'PERMISSION_ASSIGNMENT_ACCESS', 'SYSTEM_SETTINGS_ACCESS']
    }
  },
  {
    path: '/admin/users',
    name: 'UsersAdmin',
    component: () => import('../views/UsersAdminView.vue'),
    meta: {
      title: 'Utilisateurs',
      permissions: ['USER_MANAGEMENT_ACCESS']
    }
  },
  {
    path: '/admin/autorisations',
    name: 'PermissionsAdmin',
    component: () => import('../views/PermissionsAdminView.vue'),
    meta: {
      title: 'Autorisations',
      permissions: ['PERMISSION_ASSIGNMENT_ACCESS']
    }
  },
  {
    path: '/acces-refuse',
    name: 'Forbidden',
    component: () => import('../views/ForbiddenView.vue'),
    meta: { title: 'Accès non autorisé' }
  },
  {
    path: '/sync-adaptable',
    name: 'SyncAdaptable',
    component: () => import('../views/SyncAdaptableView.vue'),
    meta: { title: 'Synchronisation Adaptable', permissions: ['ADAPTABLE_SYNC_ACCESS'] }
  },
  {
    path: '/partslink-viewer',
    name: 'PartslinkViewer',
    component: () => import('../views/PartslinkNativeViewer.vue'),
    meta: { title: 'Catalogue Partslink', permissions: ['PARTSLINK_ACCESS'] }
  },
  {
    path: '/confirmation-achat',
    name: 'ConfirmationAchat',
    component: () => import('../views/ConfirmationAchatView.vue'),
    meta: { title: 'Confirmation Achat', permissions: ['PURCHASE_CONFIRMATION_ACCESS'] }
  },
  {
    path: '/catalogue-tecdoc',
    name: 'CatalogueTecDoc',
    component: () => import('../views/CatalogueTecDocView.vue'),
    meta: { title: 'Catalogue TecDoc', permissions: ['TECDOC_CATALOG_ACCESS'] }
  },
  {
    path: '/gestion-articles',
    name: 'GestionArticles',
    component: () => import('../views/ArticleManagementView.vue'),
    meta: { title: 'Gestion Articles', permissions: ['ARTICLE_MANAGEMENT_ACCESS'] }
  }
]

// Routes laboratoire / prototypes UI — DEV UNIQUEMENT.
// `import.meta.env.DEV` est statiquement remplacé par `false` au build Vite :
// ces routes (et leurs vues en import dynamique) sont éliminées du bundle de prod
// et ne sont donc jamais exposées en production.
const devRoutes = [
  {
    // laboratoire visuel (maquettes A/B/C), aucune logique métier
    path: '/confirmation-achat-ui-lab',
    name: 'ConfirmationAchatUiLab',
    component: () => import('../views/ConfirmationAchatUiLabView.vue'),
    meta: { title: 'Confirmation Achat — UI Lab' }
  },
  {
    // laboratoire navbar (variantes sur mock C2), aucune logique métier
    path: '/prototype-navbar',
    name: 'PrototypeNavbar',
    component: () => import('../views/PrototypeNavbarView.vue'),
    meta: { title: 'Prototype Navbar' }
  },
  {
    // laboratoire navigation VERTICALE gauche + mock C2, aucune logique métier
    path: '/prototype-vertical-navbar',
    name: 'PrototypeVerticalNavbar',
    component: () => import('../views/PrototypeVerticalNavbarView.vue'),
    meta: { title: 'Prototype Vertical Navbar' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: import.meta.env.DEV ? [...routes, ...devRoutes] : routes
})

// ──────────────────────────────────────────────────────────────────────────
// Garde d'authentification globale.
//  - Routes publiques (auth) accessibles sans token.
//  - Toute autre route = protégée : sans session exploitable → redirection /login (route '/')
//    avec ?redirect=<cible> pour revenir après connexion.
//  - Utilisateur déjà connecté arrivant sur la page de connexion → page métier par défaut.
//  - Source de vérité = localStorage (cohérent avec l'intercepteur axios) ; on ne logge aucun token.
// ──────────────────────────────────────────────────────────────────────────
const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/forgot-password', '/reset-password'])

function decodeJwtExp(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp : null
  } catch (_) {
    return null
  }
}

function isAccessTokenValid() {
  const t = localStorage.getItem('accessToken')
  if (!t) return false
  const exp = decodeJwtExp(t)
  if (exp == null) return true // exp illisible → on laisse l'API/refresh trancher
  return exp * 1000 > Date.now() + 5000 // marge de 5 s
}

// Session exploitable = access token valide OU refresh token présent (l'intercepteur tentera le refresh).
function hasSession() {
  return isAccessTokenValid() || !!localStorage.getItem('refreshToken')
}

function isSafeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}

router.beforeEach((to) => {
  // /login → route de connexion canonique ('/'), en conservant la query
  if (to.path === '/login') {
    return { path: '/', query: to.query }
  }

  const isPublic = PUBLIC_PATHS.has(to.path)
  const authed = hasSession()

  // Route protégée sans session → connexion (avec retour)
  if (!isPublic && !authed) {
    return { path: '/', query: { redirect: to.fullPath } }
  }

  const auth = useAuthStore()

  // Déjà connecté et arrive sur la page de connexion → page d'accueil autorisée (ou redirect demandé)
  if (to.path === '/' && authed) {
    const redirect = isSafeRedirect(to.query.redirect) ? to.query.redirect : null
    return redirect || auth.landingRoute || { path: '/comparateur' }
  }

  // ── RBAC : contrôle de permission par route (meta.permissions / meta.permission).
  //    superAdmin bypass (géré dans canAccessRoute). Manque de droit → page « accès refusé » (403 propre).
  //    Le backend reste la source de vérité : l'API renverra de toute façon 401/403 le cas échéant.
  if (!isPublic && authed && to.name !== 'Forbidden' && !auth.canAccessRoute(to)) {
    return { name: 'Forbidden', query: { from: to.fullPath } }
  }

  return true
})

export default router
