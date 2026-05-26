import apiClient from './axios'

/**
 * Récupère toutes les options d'action.
 */
export function getActionOptions() {
  return apiClient.get('/api/action-options')
}

/**
 * Récupère une option d'action par son ID.
 */
export function getActionOptionById(id) {
  return apiClient.get(`/api/action-options/${id}`)
}

/**
 * Crée une nouvelle option d'action.
 */
export function createActionOption(payload) {
  return apiClient.post('/api/action-options', payload)
}

/**
 * Modifie une option d'action existante.
 */
export function updateActionOption(id, payload) {
  return apiClient.put(`/api/action-options/${id}`, payload)
}

/**
 * Supprime une option d'action.
 */
export function deleteActionOption(id) {
  return apiClient.delete(`/api/action-options/${id}`)
}
