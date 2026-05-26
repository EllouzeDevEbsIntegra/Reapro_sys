import api from './axios'

export const getSyncAdaptableData = async (params) => {
  const response = await api.get('/api/v1/sync-adaptable', { params })
  return response.data
}
