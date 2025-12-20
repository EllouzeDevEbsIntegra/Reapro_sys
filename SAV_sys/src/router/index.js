import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/verify-code',
      name: 'verify-code',
      component: () => import('../views/VerifyCodeView.vue'),
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
    },

    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/activity-logs',
      name: 'activity-logs',
      component: () => import('../views/ActivityLogView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/workload',
      name: 'workload',
      component: () => import('../views/WorkloadView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/performance',
      name: 'performance',
      component: () => import('../views/PerformanceView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth) {
    // Dynamically import authStore to avoid circular dependency
    const { useAuthStore } = await import('../stores/auth.js');
    const authStore = useAuthStore();

    // Validate both store state AND localStorage
    const hasStoreToken = authStore.isAuthenticated;
    const hasLocalStorageToken = !!localStorage.getItem('token');

    // If store says authenticated but localStorage is empty, force logout
    if (hasStoreToken && !hasLocalStorageToken) {
      console.warn('Token missing from localStorage. Forcing logout...');
      authStore.logout();
      next('/login');
      return;
    }

    // If not authenticated, redirect to login
    if (!hasStoreToken) {
      console.warn('Access denied. Redirecting to login...');
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router
