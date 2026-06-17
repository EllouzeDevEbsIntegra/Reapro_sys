import api from './axios'

export const searchVehicleByVin = async (vin, brand) => {
  const brandParam = brand ? `&brand=${encodeURIComponent(brand)}` : ''
  const response = await api.post(`/api/partslink/search/vin?vin=${encodeURIComponent(vin)}${brandParam}`)
  return response.data
}

export const getSubgroups = async (vin, groupId) => {
  const response = await api.get(`/api/partslink/vehicle/${encodeURIComponent(vin)}/groups/${groupId}/subgroups`)
  return response.data
}

export const getSubgroupDetails = async (vin, subgroupId) => {
  const response = await api.get(`/api/partslink/vehicle/${encodeURIComponent(vin)}/subgroups/${subgroupId}/details`)
  return response.data
}

export const getSearchStatus = async (jobId) => {
  const response = await api.get(`/api/partslink/search/status/${encodeURIComponent(jobId)}`)
  return response.data
}

export const cancelSearch = async (jobId) => {
  const response = await api.post(`/api/partslink/search/status/${encodeURIComponent(jobId)}/cancel`)
  return response.data
}

export const getSessionStatus = async () => {
  const response = await api.get('/api/partslink/session/status')
  return response.data
}

// NB : /session/restart et /session/close sont désormais réservés aux administrateurs
// (action globale sur tout le pool). Le pool crée/recycle les sessions à la demande :
// aucun "démarrage de session" manuel n'est requis côté utilisateur standard.
