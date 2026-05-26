import apiClient from './axios'

/**
 * Récupère la liste de toutes les exclusions de recherche.
 */
export function getSearchExclusions() {
  return apiClient.get('/api/search-exclusions')
}

/**
 * Ajoute manuellement une exclusion de recherche.
 * @param {Object} payload - { normalizedFilter, reason }
 */
export function createSearchExclusion(payload) {
  return apiClient.post('/api/search-exclusions', payload)
}

/**
 * Supprime une exclusion de recherche par son ID.
 * @param {number|string} id
 */
export function deleteSearchExclusion(id) {
  return apiClient.delete(`/api/search-exclusions/${id}`)
}
