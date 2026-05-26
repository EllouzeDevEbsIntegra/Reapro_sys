// src/api/salesOrderService.js
import apiClient from '@/api/axios'

export default {
  /** GET active draft for a client (without auto‑creation) */
  async fetchActive(clientId) {
    const { data } = await apiClient.get(`/api/orders/active?clientId=${encodeURIComponent(clientId)}`)
    return data
  },
  /** POST create sales order */
  async createCart(payload) {
    const { data } = await apiClient.post('/api/orders', payload)
    return data
  },
  /** GET active draft for a client (creates if 404) */
  async fetchOrCreateActive(clientId) {
    try {
      const { data } = await apiClient.get(`/api/orders/active?clientId=${encodeURIComponent(clientId)}`)
      return data
    } catch (err) {
      if (err.response?.status === 404) {
        const { data } = await apiClient.post('/api/orders', { clientId })
        return data
      }
      throw err
    }
  },
  /** POST line */
  addLine(orderId, payload) {
    return apiClient.post(`/api/orders/${orderId}/lines`, payload)
  },
  /** PATCH line */
  updateLine(orderId, lineId, payload) {
    return apiClient.patch(`/api/orders/${orderId}/lines/${lineId}`, payload)
  },
  /** DELETE line */
  deleteLine(orderId, lineId) {
    return apiClient.delete(`/api/orders/${orderId}/lines/${lineId}`)
  },
  /** POST validate */
  validate(orderId) {
    return apiClient.post(`/api/orders/${orderId}/validate`)
  },
  /** GET history list (paginated) */
  fetchHistory(params = {}) {
    return apiClient.get('/api/orders', { params })
  },
  /** GET order detail */
  fetchDetail(orderId) {
    return apiClient.get(`/api/orders/${orderId}`)
  },
}
