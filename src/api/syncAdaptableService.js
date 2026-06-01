import api from './axios'

export const getSyncAdaptableData = async (params) => {
  const response = await api.get('/api/v1/sync-adaptable', { params })
  return response.data
}

export const triggerSync = async () => {
  const response = await api.post('/api/v1/sync-adaptable/sync')
  return response.data
}

export const getSyncStatus = async () => {
  const response = await api.get('/api/v1/sync-adaptable/sync-status')
  return response.data
}
