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

export const getSessionStatus = async () => {
  const response = await api.get('/api/partslink/session/status')
  return response.data
}

export const restartSession = async () => {
  const response = await api.post('/api/partslink/session/restart')
  return response.data
}
