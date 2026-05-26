import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import salesOrderService from '@/api/salesOrderService'

export const useSalesOrderStore = defineStore('salesOrder', () => {
  // ----- State -----
  const clientId = ref(null)                 // Id du client sélectionné
  const activeOrder = ref(null)              // SalesOrderResponse (draft or read‑only)
  const loading = ref(false)
  const error = ref(null)
  const stockError = ref(null)              // { message, invalidLines } on validation failure
  const isExpanded = ref(false)             // expanded panel state
  const activeTab = ref('order')            // active tab ('order' or 'history')
  const selectedTransactionItem = ref(null) // selected article for transaction history
  const highlightedReference = ref(null)    // highlight line on incremental add

  // ----- History -----
  const history = ref({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    loading: false,
  })

  // ----- Getters -----
  const isDraft = computed(() => activeOrder.value?.status === 'DRAFT')
  const lines = computed(() => activeOrder.value?.lines || [])
  const totals = computed(() => ({
    exclTax: activeOrder.value?.totalExcludingTax ?? 0,
    tax: activeOrder.value?.totalTax ?? 0,
    inclTax: activeOrder.value?.totalIncludingTax ?? 0,
    discount: activeOrder.value?.totalDiscount ?? 0,
  }))

  // ----- Helper for generic backend errors -----
  function handleBackendError(err, fallback) {
    const msg = err.response?.data?.message || fallback
    error.value = msg
    // Emit a simple console error; toast is shown from the component if needed
    console.error('[SalesOrderStore]', msg, err)
  }

  // ----- Actions -----
  async function loadActiveOrder(selectedClientId) {
    clientId.value = selectedClientId
    loading.value = true
    error.value = null
    activeOrder.value = null
    try {
      const data = await salesOrderService.fetchActive(clientId.value)
      activeOrder.value = data || null
    } catch (e) {
      if (e.response?.status === 400 || e.response?.status === 404) {
        // Pas de panier actif pour le moment (c'est normal, il sera créé à l'ajout du premier article)
        activeOrder.value = null
      } else {
        handleBackendError(e, 'Impossible de charger le panier')
      }
    } finally {
      loading.value = false
    }
  }

  async function addLine(reference, quantity, price = null) {
    if (activeOrder.value && !isDraft.value) return
    const shouldShowLoader = !activeOrder.value
    if (shouldShowLoader) {
      loading.value = true
    }
    error.value = null
    try {
      let order = activeOrder.value
      if (!order) {
        // Création du panier brouillon d'abord
        order = await salesOrderService.createCart({ clientId: clientId.value })
        activeOrder.value = order
      }
      
      const normRef = reference ? reference.replace(/MASTER/gi, '').trim() : ''
      const alreadyExists = lines.value.some(l => {
        const normL = l.reference ? l.reference.replace(/MASTER/gi, '').trim() : ''
        return normL === normRef
      })
      
      const payload = { reference, quantity }
      if (price !== null && price !== undefined) {
        payload.unitPrice = price
      }
      const { data } = await salesOrderService.addLine(order.id, payload)
      activeOrder.value = data
      
      // Highlight toujours la ligne ajoutée/mise à jour pour attirer l'attention
      highlightedReference.value = normRef
      setTimeout(() => {
        if (highlightedReference.value === normRef) {
          highlightedReference.value = null
        }
      }, 2500)
    } catch (e) {
      const serverMsg = e.response?.data?.message || e.response?.data || null
      if (e.response?.status === 400 && serverMsg) {
        error.value = `Ajout impossible : ${serverMsg}`
      } else {
        handleBackendError(e, "Erreur d'ajout de ligne")
      }
    } finally {
      if (shouldShowLoader) {
        loading.value = false
      }
    }
  }

  async function updateLineQty(lineId, quantity) {
    if (!isDraft.value) return
    error.value = null
    try {
      const { data } = await salesOrderService.updateLine(activeOrder.value.id, lineId, { quantity })
      activeOrder.value = data
    } catch (e) {
      const serverMsg = e.response?.data?.message || e.response?.data || null
      if (e.response?.status === 400 && serverMsg) {
        error.value = `Mise à jour impossible : ${serverMsg}`
      } else {
        handleBackendError(e, 'Erreur de mise à jour de la quantité')
      }
    }
  }

  async function deleteLine(lineId) {
    if (!isDraft.value) return
    try {
      const { data } = await salesOrderService.deleteLine(activeOrder.value.id, lineId)
      activeOrder.value = data
    } catch (e) {
      handleBackendError(e, 'Erreur de suppression')
    }
  }

  function updateLocalQty(lineId, qty) {
    if (!activeOrder.value || !activeOrder.value.lines) return
    const line = activeOrder.value.lines.find(l => l.id === lineId)
    if (line) {
      line.quantity = qty
      if (line.unitPrice != null) {
        line.amountExcludingTax = line.unitPrice * qty
        line.amountIncludingTax = line.amountExcludingTax * (1 + (line.vatPercent || 19) / 100)
      }
    }
  }

  async function validateOrder() {
    if (!isDraft.value) return null
    loading.value = true
    stockError.value = null
    try {
      const { data } = await salesOrderService.validate(activeOrder.value.id)
      activeOrder.value = data
      return data
    } catch (e) {
      if (e.response?.status === 400 && e.response?.data?.invalidLines) {
        stockError.value = e.response.data
      } else {
        handleBackendError(e, 'Erreur de validation')
      }
      return null
    } finally {
      loading.value = false
    }
  }

  // ----- History actions -----
  async function loadHistory(params = {}, append = false) {
    history.value.loading = true
    try {
      const { data } = await salesOrderService.fetchHistory(params)
      if (append) {
        history.value.content = [...history.value.content, ...(data.content || [])]
        history.value.totalElements = data.totalElements
        history.value.totalPages = data.totalPages
        history.value.number = data.number
        history.value.size = data.size
        history.value.loading = false
      } else {
        history.value = { ...data, loading: false }
      }
    } catch (e) {
      console.error('[SalesOrderStore] Erreur chargement historique', e)
      history.value.loading = false
    }
  }

  async function loadOrderDetail(orderId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await salesOrderService.fetchDetail(orderId)
      activeOrder.value = data
      activeTab.value = 'order'
    } catch (e) {
      handleBackendError(e, 'Impossible de charger le détail de la commande')
    } finally {
      loading.value = false
    }
  }

  function closeOpenedOrder() {
    activeOrder.value = null
  }

  // ----- Reset -----
  function resetOrder() {
    activeOrder.value = null
    clientId.value = null
    error.value = null
    stockError.value = null
    activeTab.value = 'order'
    selectedTransactionItem.value = null
    highlightedReference.value = null
  }

  // ----- Expose -----
  return {
    // state
    clientId,
    activeOrder,
    loading,
    error,
    stockError,
    isExpanded,
    activeTab,
    selectedTransactionItem,
    highlightedReference,
    // getters
    isDraft,
    lines,
    totals,
    // actions
    loadActiveOrder,
    addLine,
    updateLineQty,
    updateLocalQty,
    deleteLine,
    validateOrder,
    loadOrderDetail,
    resetOrder,
    closeOpenedOrder,
    // history
    history,
    loadHistory,
  }
})
