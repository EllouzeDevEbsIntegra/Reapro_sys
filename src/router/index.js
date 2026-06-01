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
  }
]




const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
