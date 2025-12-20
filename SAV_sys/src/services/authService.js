import api from './api';

export const authService = {
    // 1. AUTHENTIFICATION & INSCRIPTION
    async register(data) {
        // { firstname, lastname, email, password, confirmPassword }
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async verifyRegisterCode(data) {
        // { email, code }
        const response = await api.post('/auth/verify-register-code', data);
        return response.data;
    },

    async login(email, password) {
        // { email, password }
        const response = await api.post('/auth/login', { email, password });
        return response.data; // { accessToken, refreshToken }
    },

    async refreshToken(refreshToken) {
        const response = await api.post(`/auth/refresh-token?refreshToken=${refreshToken}`);
        return response.data; // { accessToken, refreshToken }
    },

    async forgotPassword(email) {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    async verifyResetCode(data) {
        // { email, code }
        const response = await api.post('/auth/verify-reset-code', data);
        return response.data;
    },

    async changePassword(email, oldPassword, newPassword, confirmPassword) {
        // Deprecated but implemented as requested
        const response = await api.post(`/auth/change-password?email=${email}`, {
            oldPassword,
            newPassword,
            confirmPassword
        });
        return response.data;
    },

    async logout() {
        // Optional: Call backend to invalidate token if endpoint exists
        // await api.post('/auth/logout');
        return Promise.resolve();
    },

    // 2. GESTION DES ADMINS (PROTÉGÉ)
    async getMe() {
        const response = await api.get('/admins/me');
        return response.data;
    },

    async updateMe(data) {
        // { firstname, lastname, email, role }
        const response = await api.put('/admins/me', data);
        return response.data;
    },

    async changeMyPassword(data) {
        // { oldPassword, newPassword, confirmPassword }
        const response = await api.put('/admins/me/password', data);
        return response.data;
    },

    async getAdmins(params) {
        // params: { page, size, sort, search }
        const response = await api.get('/admins', { params });
        return response.data;
    },

    async getAdmin(id) {
        const response = await api.get(`/admins/${id}`);
        return response.data;
    },

    async updateAdmin(id, data) {
        const response = await api.put(`/admins/${id}`, data);
        return response.data;
    },

    async toggleAdminActive(id) {
        const response = await api.patch(`/admins/${id}/toggle-active`);
        return response.data;
    }
};
