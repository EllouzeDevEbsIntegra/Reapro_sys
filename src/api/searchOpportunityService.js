import apiClient from './axios'

/**
 * Récupère la liste paginée des opportunités de recherche non clôturées.
 * @param {Object} params - Paramètres de filtrage et pagination
 */
export function getSearchOpportunities(params = {}) {
  return apiClient.get('/api/search-opportunities', { params })
}

/**
 * Récupère le détail d'une opportunité par son filtre normalisé.
 * @param {string} normalizedFilter
 */
export function getSearchOpportunityDetails(normalizedFilter) {
  return apiClient.get(`/api/search-opportunities/${encodeURIComponent(normalizedFilter)}`)
}

/**
 * Clôture toutes les lignes non clôturées d'une opportunité.
 * @param {string} normalizedFilter
 * @param {Object} payload - { closedBy, diagnosticStatus, actionType, closureReason, comment, linkedArticleId }
 */
export function closeSearchOpportunity(normalizedFilter, payload) {
  return apiClient.post(`/api/search-opportunities/${encodeURIComponent(normalizedFilter)}/close`, payload)
}

/**
 * Récupère les statistiques globales des opportunités.
 */
export function getSearchOpportunityStats() {
  return apiClient.get('/api/search-opportunities/stats')
}
