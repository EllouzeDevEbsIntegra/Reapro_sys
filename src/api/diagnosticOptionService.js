import apiClient from './axios'

/**
 * Récupère toutes les options de diagnostic.
 */
export function getDiagnosticOptions() {
  return apiClient.get('/api/diagnostic-options')
}

/**
 * Récupère une option de diagnostic par son ID.
 */
export function getDiagnosticOptionById(id) {
  return apiClient.get(`/api/diagnostic-options/${id}`)
}

/**
 * Crée une nouvelle option de diagnostic.
 */
export function createDiagnosticOption(payload) {
  return apiClient.post('/api/diagnostic-options', payload)
}

/**
 * Modifie une option de diagnostic existante.
 */
export function updateDiagnosticOption(id, payload) {
  return apiClient.put(`/api/diagnostic-options/${id}`, payload)
}

/**
 * Supprime une option de diagnostic.
 */
export function deleteDiagnosticOption(id) {
  return apiClient.delete(`/api/diagnostic-options/${id}`)
}
