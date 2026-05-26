import apiClient from './axios'

/**
 * Récupère la liste des marques disponibles sur Partslink24
 */
export function getBrands() {
  return apiClient.get('/api/partslink/brands')
}

/**
 * Effectue la recherche d'un VIN pour une marque donnée
 * @param {string} brandId - L'ID de la marque (ex: bmw_parts_lc)
 * @param {string} vin - Le code VIN à chercher
 */
export function searchVin(brandId, vin) {
  return apiClient.post('/api/partslink/vin-search', { brandId, vin })
}

/**
 * Récupère les détails d'un groupe principal spécifique (sous-groupes, schémas, pièces)
 * @param {string} brandId - L'ID de la marque
 * @param {string} vin - Le code VIN
 * @param {string} groupId - L'ID du groupe principal (ex: 11)
 */
export function getGroupDetails(brandId, vin, groupId) {
  return apiClient.get('/api/partslink/group-details', {
    params: { brandId, vin, groupId }
  })
}

/**
 * Récupère les pièces (BOM) d'un sous-groupe
 */
export function getSubgroupParts(brandId, vin, mainGroupCode, subGroupCode) {
  return apiClient.get('/api/partslink/subgroup-parts', {
    params: { brandId, vin, mainGroupCode, subGroupCode }
  })
}

/**
 * Récupère le statut de connexion JWT Partslink24
 */
export function getSessionStatus() {
  return apiClient.get('/api/partslink/status')
}
