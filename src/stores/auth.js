import { defineStore } from 'pinia'
import apiClient from '../api/axios'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null,
        isLoading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        isAdmin: (state) => state.user?.role === 'ROLE_ADMIN'
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

                await this.fetchUserProfile()
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
            } catch (error) {
                console.error('Failed to fetch user profile', error)
            }
        },

        logout() {
            this.user = null
            this.accessToken = null
            this.refreshToken = null
            localStorage.removeItem('user')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
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
        }
    }
})
