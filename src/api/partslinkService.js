import api from './axios'

export const createOrGetPartslinkSession = async () => {
  const response = await api.post('/api/partslink/session')
  return response.data
}

export const getPartslinkSessionStatus = async () => {
  const response = await api.get('/api/partslink/session/status')
  return response.data
}

export const restartPartslinkSession = async () => {
  const response = await api.post('/api/partslink/session/restart')
  return response.data
}

export const closePartslinkSession = async () => {
  const response = await api.post('/api/partslink/session/close')
  return response.data
}
