import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

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
    component: () => import('../views/CompareQuotesView.vue')
  },
  {
    path: '/comparateur/:compareQuoteNo',
    name: 'comparateur-detail',
    component: () => import('../views/CompareQuoteDetailView.vue')
  },
  {
    path: '/b2b',
    name: 'b2b',
    component: () => import('../views/B2BView.vue')
  },
  {
    path: '/search-opportunities',
    name: 'SearchOpportunities',
    component: () => import('../views/SearchOpportunitiesView.vue'),
    meta: {
      title: 'Analyse Recherches B2B'
    }
  },
  {
    path: '/admin/search-exclusions',
    name: 'SearchExclusions',
    component: () => import('../views/SearchExclusionsView.vue'),
    meta: {
      title: 'Exclusions Recherches B2B'
    }
  },
  {
    path: '/admin/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: 'Paramètres'
    }
  },
  {
    path: '/sync-adaptable',
    name: 'SyncAdaptable',
    component: () => import('../views/SyncAdaptableView.vue'),
    meta: { title: 'Synchronisation Adaptable' }
  },
  {
    path: '/partslink-viewer',
    name: 'PartslinkViewer',
    component: () => import('../views/PartslinkNativeViewer.vue'),
    meta: { title: 'Catalogue Partslink' }
  },
  {
    path: '/confirmation-achat',
    name: 'ConfirmationAchat',
    component: () => import('../views/ConfirmationAchatView.vue'),
    meta: { title: 'Confirmation Achat' }
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

export default router
