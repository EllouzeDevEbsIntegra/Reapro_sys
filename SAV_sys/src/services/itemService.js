import api from './api';

export const itemService = {
    /**
     * Récupérer la liste des articles avec pagination et recherche
     * @param {Object} params - { page, size, search }
     * @returns {Promise} - Liste paginée d'articles
     */
    async getItems(params = {}) {
        const response = await api.get('/items', { params });
        return response.data;
    },

    /**
     * Récupérer tous les articles (pour autocomplete)
     * @returns {Promise} - Liste complète des articles
     */
    async getAllItems() {
        const response = await api.get('/items/all');
        return response.data;
    },

    /**
     * Récupérer un article par son code
     * @param {string} no - Code de l'article
     * @returns {Promise} - Article
     */
    async getItemByNo(no) {
        const response = await api.get(`/items/${no}`);
        return response.data;
    },

    /**
     * Créer un nouvel article
     * @param {Object} data - { no, designation, unitPriceHT, category, subcategory }
     * @returns {Promise} - Article créé
     */
    async createItem(data) {
        const response = await api.post('/items', data);
        return response.data;
    },

    /**
     * Mettre à jour un article
     * @param {string} no - Code de l'article
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise} - Article mis à jour
     */
    async updateItem(no, data) {
        const response = await api.put(`/items/${no}`, data);
        return response.data;
    },

    /**
     * Supprimer un article
     * @param {string} no - Code de l'article
     * @returns {Promise}
     */
    async deleteItem(no) {
        const response = await api.delete(`/items/${no}`);
        return response.data;
    }
};
