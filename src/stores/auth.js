import { defineStore } from 'pinia'
import apiClient from '../api/axios'

// Ordre des modules métier pour la page d'atterrissage post-login (1er module autorisé).
// Le backend reste la source de vérité ; ceci ne sert qu'à choisir une route d'accueil cohérente.
const MODULE_ROUTES = [
    { path: '/comparateur', permission: 'COMPARATOR_ACCESS' },
    { path: '/confirmation-achat', permission: 'PURCHASE_CONFIRMATION_ACCESS' },
    { path: '/b2b', permission: 'B2B_ACCESS' },
    { path: '/search-opportunities', permission: 'SEARCH_OPPORTUNITIES_ACCESS' },
    { path: '/sync-adaptable', permission: 'ADAPTABLE_SYNC_ACCESS' },
    { path: '/partslink-viewer', permission: 'PARTSLINK_ACCESS' },
    { path: '/catalogue-tecdoc', permission: 'TECDOC_CATALOG_ACCESS' },
    { path: '/gestion-articles', permission: 'ARTICLE_MANAGEMENT_ACCESS' }
]

const SETTINGS_PERMISSIONS = ['SETTINGS_ACCESS', 'USER_MANAGEMENT_ACCESS', 'PERMISSION_ASSIGNMENT_ACCESS', 'SYSTEM_SETTINGS_ACCESS']

function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch (_) { return fallback }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null,
        companies: [],
        isLoading: false,
        error: null,
        version: null,
        // ── RBAC (Lot 3) ── source de vérité = backend (/api/auth/me).
        // Persisté en localStorage uniquement pour éviter un flash de menu au rechargement ;
        // ce ne sont que des codes de permission (aucune donnée sensible, aucun token).
        authenticated: false,
        roles: readJson('roles', []) || [],
        permissions: readJson('permissions', []) || [],
        superAdmin: localStorage.getItem('superAdmin') === 'true'
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        isAdmin: (state) => state.superAdmin || state.user?.role === 'ROLE_ADMIN',
        isSuperAdmin: (state) => state.superAdmin || state.user?.role === 'ROLE_ADMIN',

        // Helpers permissions (utilisables en template : authStore.hasPermission('B2B_ACCESS')).
        hasPermission: (state) => (code) =>
            state.superAdmin || (!!code && state.permissions.includes(code)),

        hasAnyPermission: (state) => (codes) =>
            state.superAdmin || (Array.isArray(codes) && codes.some((c) => state.permissions.includes(c))),

        // Peut-il ouvrir la section Paramètres (au moins un onglet) ?
        canOpenSettings: (state) =>
            state.superAdmin || SETTINGS_PERMISSIONS.some((c) => state.permissions.includes(c)),

        // Autorisation d'une route selon meta.permissions (any-of) / meta.permission (single).
        canAccessRoute: (state) => (route) => {
            const meta = route?.meta || {}
            const list = meta.permissions || (meta.permission ? [meta.permission] : null)
            if (!list || list.length === 0) return true
            if (state.superAdmin) return true
            return list.some((c) => state.permissions.includes(c))
        },

        // Page d'accueil = 1er module autorisé ; sinon Paramètres si accessible ; sinon page « accès refusé ».
        landingRoute: (state) => {
            if (state.superAdmin) return '/comparateur'
            const mod = MODULE_ROUTES.find((m) => state.permissions.includes(m.permission))
            if (mod) return mod.path
            if (SETTINGS_PERMISSIONS.some((c) => state.permissions.includes(c))) return '/parametres'
            return '/acces-refuse'
        }
    },

    actions: {
        async login(credentials) {
            this.isLoading = true
            this.error = null
            try {
                const response = await apiClient.post('/api/auth/login', credentials)
                const { accessToken, refreshToken } = response.data

                this.accessToken = accessToken
                this.refreshToken = refreshToken

                localStorage.setItem('accessToken', accessToken)
                localStorage.setItem('refreshToken', refreshToken)

                // Profil (nom/société) + session RBAC (rôles/permissions/superAdmin).
                await Promise.all([this.fetchUserProfile(), this.fetchSession()])
                return true
            } catch (error) {
                this.error = error.response?.data?.message || 'Erreur de connexion'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async fetchUserProfile() {
            try {
                const response = await apiClient.get('/api/admins/me')
                this.user = response.data
                localStorage.setItem('user', JSON.stringify(this.user))
                return this.user
            } catch (error) {
                console.error('Failed to fetch user profile', error)
            }
        },

        async fetchUser() {
            return await this.fetchUserProfile()
        },

        // ── RBAC : récupère la session enrichie depuis le backend (source de vérité). ──
        async fetchSession() {
            try {
                const { data } = await apiClient.get('/api/auth/me')
                this.authenticated = !!data.authenticated
                this.roles = Array.isArray(data.roles) ? data.roles : []
                this.permissions = Array.isArray(data.permissions) ? data.permissions : []
                this.superAdmin = !!data.superAdmin
                if (data.email) {
                    this.user = { ...(this.user || {}), email: data.email }
                    localStorage.setItem('user', JSON.stringify(this.user))
                }
                this._persistRbac()
                return data
            } catch (error) {
                // 401/403 sont gérés par l'intercepteur axios (refresh/logout). On ne logge aucun token.
                console.error('Failed to fetch session')
                throw error
            }
        },

        // Appelé au démarrage de l'app (main.js) si un token est présent.
        async bootstrap() {
            if (!localStorage.getItem('accessToken')) return
            try {
                await Promise.allSettled([this.fetchUserProfile(), this.fetchSession()])
            } catch (_) { /* l'intercepteur gère l'invalidation de session */ }
        },

        _persistRbac() {
            try {
                localStorage.setItem('roles', JSON.stringify(this.roles))
                localStorage.setItem('permissions', JSON.stringify(this.permissions))
                localStorage.setItem('superAdmin', String(this.superAdmin))
            } catch (_) { /* noop */ }
        },

        async updateProfile(userData) {
            try {
                const response = await apiClient.put('/api/admins/me', userData)
                this.user = response.data
                localStorage.setItem('user', JSON.stringify(this.user))
                return this.user
            } catch (error) {
                console.error('Failed to update profile', error)
                throw error
            }
        },

        async fetchCompanies() {
            try {
                const response = await apiClient.get('/api/bc/companies')
                this.companies = response.data
                return this.companies
            } catch (error) {
                console.error('Failed to fetch companies', error)
                throw error
            }
        },

        // ⛔ RBAC : l'utilisateur ne peut plus modifier sa propre société.
        // L'affectation société est réservée au SUPER ADMIN (Paramètres > Utilisateurs),
        // via rbacService.setUserCompany() → PATCH /api/admin/users/{id}/company.

        async changeMyPassword(passwordData) {
            try {
                const response = await apiClient.post('/api/admins/change-password', passwordData)
                return response.data
            } catch (error) {
                console.error('Failed to change password', error)
                throw error
            }
        },

        logout() {
            this.user = null
            this.accessToken = null
            this.refreshToken = null
            this.authenticated = false
            this.roles = []
            this.permissions = []
            this.superAdmin = false
            localStorage.removeItem('user')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('roles')
            localStorage.removeItem('permissions')
            localStorage.removeItem('superAdmin')
            window.location.href = '/'
        },

        async register(userData) {
            this.isLoading = true
            this.error = null
            try {
                const response = await apiClient.post('/api/auth/register', userData)
                return response.data
            } catch (error) {
                this.error = error.response?.data?.message || 'Erreur d\'inscription'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async verifyRegisterCode(data) {
            try {
                const response = await apiClient.post('/api/auth/verify-register-code', data)
                return response.data
            } catch (error) {
                throw error
            }
        },

        async forgotPassword(email) {
            try {
                const response = await apiClient.post('/api/auth/forgot-password', { email })
                return response.data
            } catch (error) {
                throw error
            }
        },

        async verifyResetCode(data) {
            try {
                const response = await apiClient.post('/api/auth/verify-reset-code', data)
                return response.data
            } catch (error) {
                throw error
            }
        },

        async fetchVersion() {
            try {
                const response = await apiClient.get('/api/version')
                console.log('API Version Response:', response.data)
                this.version = response.data
                return this.version
            } catch (error) {
                console.error('Failed to fetch version', error)
                return null
            }
        }
    }
})
