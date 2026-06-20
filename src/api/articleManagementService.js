import apiClient from './axios'

/**
 * Service API page « Gestion Articles » (consultation V1).
 * N'appelle que des endpoints Reapro. Pas de CRUD pour l'instant.
 */
export default {
  /**
   * Liste paginée des articles ELVA_Item.
   * @returns { content, page, size, totalElements, totalPages }
   */
  async fetchItems({ page = 0, size = 20, search = '', manufacturerCode = '', groupCode = '', subGroupCode = '', hasStock = false } = {}) {
    const params = { page, size }
    if (search) params.search = search
    if (manufacturerCode) params.manufacturerCode = manufacturerCode
    if (groupCode) params.groupCode = groupCode
    if (subGroupCode) params.subGroupCode = subGroupCode
    if (hasStock) params.hasStock = true

    const { data } = await apiClient.get('/api/articles-management/items', { params })
    return data
  },

  /**
   * Données « lourdes » chargées à l'ouverture du dialog (hors liste) : dernier achat.
   * @returns { itemNo, lastPurchaseDate }
   */
  async fetchExtra(itemNo) {
    const { data } = await apiClient.get(`/api/articles-management/items/${encodeURIComponent(itemNo)}/extra`)
    return data
  }
}
