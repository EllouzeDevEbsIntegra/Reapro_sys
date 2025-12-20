import { defineStore } from 'pinia';
import { authService } from '../services/authService';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: (() => {
            try {
                const userStr = localStorage.getItem('user');
                return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
            } catch {
                return null;
            }
        })(),
        token: localStorage.getItem('token') || null,
        error: null,
        loading: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        currentUser: (state) => state.user
    },

    actions: {
        async login(email, password) {
            this.loading = true;
            this.error = null;
            try {
                const response = await authService.login(email, password);

                // Response format: { accessToken, refreshToken }
                const { accessToken, refreshToken } = response;

                this.token = accessToken;
                localStorage.setItem('token', accessToken);

                if (refreshToken) {
                    localStorage.setItem('refreshToken', refreshToken);
                }

                // Fetch full user profile immediately after login
                await this.fetchUser();

                return accessToken;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Login failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async register(data) {
            this.loading = true;
            this.error = null;
            try {
                const response = await authService.register(data);
                return response;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Registration failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async verifyRegisterCode(email, code) {
            this.loading = true;
            this.error = null;
            try {
                const response = await authService.verifyRegisterCode({ email, code });
                return response;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Verification failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async forgotPassword(email) {
            this.loading = true;
            this.error = null;
            try {
                const response = await authService.forgotPassword(email);
                return response;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Request failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async verifyResetCode(email, code) {
            this.loading = true;
            this.error = null;
            try {
                const response = await authService.verifyResetCode({ email, code });
                return response;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Verification failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async fetchUser() {
            try {
                const userProfile = await authService.getMe();
                this.user = userProfile;
                localStorage.setItem('user', JSON.stringify(userProfile));
                return userProfile;
            } catch (err) {
                console.error('Failed to fetch user profile', err);
                // Throw so the caller knows it failed, but we still have this.user from localStorage if it existed
                throw err;
            }
        },

        async updateProfile(data) {
            this.loading = true;
            try {
                const updatedUser = await authService.updateMe(data);
                // Merge updated fields into current user state
                this.user = { ...this.user, ...data };
                localStorage.setItem('user', JSON.stringify(this.user));
                return updatedUser;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Update failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async changeMyPassword(data) {
            this.loading = true;
            try {
                await authService.changeMyPassword(data);
            } catch (err) {
                this.error = err.response?.data || err.message || 'Password change failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async changePassword(email, oldPassword, newPassword, confirmPassword) {
            this.loading = true;
            this.error = null;
            try {
                const response = await authService.changePassword(email, oldPassword, newPassword, confirmPassword);
                return response;
            } catch (err) {
                this.error = err.response?.data || err.message || 'Password change failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.user = null;
            this.token = null;
            this.error = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        },

        // Force logout when token expires (called by API interceptor)
        forceLogout() {
            this.user = null;
            this.token = null;
            this.error = 'Session expirée. Veuillez vous reconnecter.';
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        }
    }
});
