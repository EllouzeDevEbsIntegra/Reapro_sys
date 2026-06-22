import apiClient from './axios'

/**
 * API RBAC (Lot 3 frontend) — consomme les endpoints backend Lot 2 (/api/admin/...).
 * Le backend reste la source de vérité (autorisation + anti-escalade) ; côté front on gère
 * seulement l'affichage et les messages 401/403 (via l'intercepteur axios).
 */
export const rbacService = {
    // ── Lectures ──
    listUsers(params) {
        return apiClient.get('/api/admin/users', { params }).then((r) => r.data)
    },
    getUser(id) {
        return apiClient.get(`/api/admin/users/${id}`).then((r) => r.data)
    },
    listPermissions() {
        return apiClient.get('/api/admin/permissions').then((r) => r.data)
    },
    getUserPermissions(id) {
        return apiClient.get(`/api/admin/users/${id}/permissions`).then((r) => r.data)
    },

    // ── Gestion utilisateurs (super-admin / USER_MANAGEMENT_ACCESS) ──
    createUser(payload) {
        return apiClient.post('/api/admin/users', payload).then((r) => r.data)
    },
    setActive(id, active) {
        return apiClient.patch(`/api/admin/users/${id}/active`, { active }).then((r) => r.data)
    },
    resetPassword(id) {
        return apiClient.post(`/api/admin/users/${id}/reset-password`).then((r) => r.data)
    },
    updateUser(id, payload) {
        return apiClient.put(`/api/admin/users/${id}`, payload).then((r) => r.data)
    },

    // ── Affectation société (SUPER ADMIN uniquement) ──
    setUserCompany(id, bcCompanyId) {
        return apiClient.patch(`/api/admin/users/${id}/company`, { bcCompanyId }).then((r) => r.data)
    },
    listCompanies() {
        return apiClient.get('/api/bc/companies').then((r) => r.data)
    },

    // ── Attribution des permissions (super-admin / PERMISSION_ASSIGNMENT_ACCESS) ──
    assignPermissions(id, codes) {
        return apiClient.post(`/api/admin/users/${id}/permissions`, { codes }).then((r) => r.data)
    },
    revokePermissions(id, codes) {
        return apiClient.post(`/api/admin/users/${id}/permissions/revoke`, { codes }).then((r) => r.data)
    }
}

export default rbacService
