<template>
  <section class="active-order">

    <!-- Chargement initial -->
    <div v-if="store.loading && !order" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Chargement du panier…</span>
    </div>

    <!-- État vide : aucun client sélectionné ou aucun panier chargé -->
    <div v-else-if="!order && !store.loading" class="empty-state">
      <i class="pi pi-shopping-cart empty-icon"></i>
      <p v-if="store.clientId">
        Aucun panier actif pour ce client.<br>
        <span class="text-xs text-slate-400" style="display: block; margin-top: 4px;">Ajoutez un article pour créer un panier, ou ouvrez-en un depuis l'historique.</span>
      </p>
      <p v-else>Sélectionnez un client pour afficher son panier.</p>
    </div>

    <!-- Commande active -->
    <div v-else-if="order" class="order-content">

      <!-- En-tête de commande -->
      <div class="order-header">
        <div class="order-meta">
          <span class="order-id">#{{ order.id }}</span>
          <span class="order-status" :class="'status-' + order.status?.toLowerCase()">
            {{ order.status }}
          </span>
        </div>
        <div class="order-header-right">
          <div class="order-client">
            <i class="pi pi-user"></i>
            <span>{{ order.clientId }}</span>
          </div>
          <button class="close-order-btn" @click="closeOrder" title="Fermer la commande" type="button">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Tableau des lignes -->
      <div class="lines-wrapper">
        <table class="lines-table" v-if="lines.length > 0">
          <thead>
            <tr>
              <th>Réf / Désignation</th>
              <th class="text-center" style="width: 80px;">Qté</th>
              <th class="text-right">PU</th>
              <th class="text-center" v-if="isExpanded">% Rem.</th>
              <th class="text-right">Total HT</th>
              <th class="text-center" v-if="isExpanded">% TVA</th>
              <th class="text-right" v-if="isExpanded">Total TTC</th>
              <th class="text-center" v-if="isDraft" style="width: 32px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="line in sortedLines" 
              :key="line.id" 
              class="line-row" 
              :class="{ 
                'line-cancelled': line.status === 'CANCELLED',
                'blink-highlight': store.highlightedReference === (line.reference ? line.reference.replace(/MASTER/gi, '').trim() : '')
              }"
              :data-reference="line.reference ? line.reference.replace(/MASTER/gi, '').trim() : ''"
            >
              <td>
                <div class="ref-desig-cell">
                  <div class="ref-val">
                    {{ line.reference ? line.reference.replace(/MASTER/gi, '').trim() : '' }}
                    <span v-if="line.status === 'CANCELLED'" class="cancelled-badge">Annulée</span>
                  </div>
                  <div class="desig-val" :title="line.designation">{{ line.designation }}</div>
                </div>
              </td>
              <td class="text-center qty-cell">
                <div class="qty-controls" v-if="isDraft">
                  <button class="qty-btn" @click="decQty(line)" type="button">−</button>
                  <input
                    type="number"
                    class="qty-input"
                    :value="line.quantity"
                    min="1"
                    @change="onQtyChange(line, $event)"
                  />
                  <button class="qty-btn" @click="incQty(line)" type="button">+</button>
                </div>
                <span v-else>{{ line.quantity }}</span>
              </td>
              <td class="text-right price-cell">{{ fmt(line.unitPrice) }}</td>
              <td class="text-center discount-cell" v-if="isExpanded">{{ fmt(line.discountPercent || 0, 1) }}%</td>
              <td class="text-right amount-cell">{{ fmt(line.amountExcludingTax) }}</td>
              <td class="text-center vat-cell" v-if="isExpanded">{{ fmt(line.vatPercent || 19, 0) }}%</td>
              <td class="text-right ttc-cell" v-if="isExpanded">{{ fmt(line.amountIncludingTax) }}</td>
              <td class="text-center action-cell" v-if="isDraft">
                <button
                  class="delete-btn"
                  @click="store.deleteLine(line.id)"
                  title="Supprimer la ligne"
                  type="button"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="no-lines">
          <i class="pi pi-inbox"></i>
          <p>Aucun article dans le panier.<br>Cliquez sur l'icône panier pour ajouter.</p>
        </div>
      </div>

      <!-- Totaux -->
      <div class="totals-block" v-if="lines.length > 0">
        <div class="totals-row">
          <span>Total HT</span>
          <strong>{{ fmt(totals.exclTax) }} DT</strong>
        </div>
        <div class="totals-row" v-if="isExpanded || totals.discount > 0">
          <span>Remise globale</span>
          <strong>{{ fmt(totals.discount) }} DT</strong>
        </div>
        <div class="totals-row" v-if="isExpanded">
          <span>Total TVA</span>
          <strong>{{ fmt(totals.tax) }} DT</strong>
        </div>
        <div class="totals-row total-ttc">
          <span>Total TTC</span>
          <strong>{{ fmt(totals.inclTax) }} DT</strong>
        </div>
      </div>

      <!-- Bouton Valider -->
      <button
        v-if="isDraft"
        class="validate-btn"
        :disabled="lines.length === 0 || store.loading"
        @click="confirmValidation"
        type="button"
      >
        <i class="pi pi-check-circle"></i>
        <span>{{ store.loading ? 'En cours…' : 'Valider la Commande' }}</span>
      </button>

      <!-- Erreur store -->
      <div v-if="store.error" class="error-msg">
        <i class="pi pi-exclamation-triangle"></i> {{ store.error }}
      </div>
    </div>

    <!-- Modal stock insuffisant -->
    <Dialog
      v-model:visible="showStockModal"
      header="⚠️ Stock insuffisant"
      modal
      :style="{ width: '480px' }"
      class="stock-modal"
    >
      <p class="stock-msg">{{ stockError?.message }}</p>
      <table class="stock-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th class="text-right">Qté demandée</th>
            <th class="text-right">Qté disponible</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(inv, i) in stockError?.invalidLines" :key="i">
            <td>{{ inv.reference }}</td>
            <td class="text-right">{{ inv.orderedQuantity }}</td>
            <td class="text-right stock-err">{{ inv.availableQuantity }}</td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <button class="modal-close-btn" @click="showStockModal = false">Fermer</button>
      </template>
    </Dialog>

    <ConfirmDialog />

  </section>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useSalesOrderStore } from '@/stores/salesOrderStore'

const store = useSalesOrderStore()
const confirm = useConfirm()
const toast = useToast()

const order      = computed(() => store.activeOrder)
const lines      = computed(() => store.lines)
// Tri stable : ligne la plus récente (id le plus élevé) en premier.
// Une mise à jour de quantité ne change pas l'id → l'ordre reste fixe.
const sortedLines = computed(() =>
  [...lines.value].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
)
const isDraft    = computed(() => store.isDraft)
const totals     = computed(() => store.totals)
const stockError = computed(() => store.stockError)
const isExpanded = computed(() => store.isExpanded)

const showStockModal = ref(false)
watch(stockError, (val) => { showStockModal.value = !!val })

function closeOrder() {
  store.closeOpenedOrder()
}

function confirmValidation() {
  confirm.require({
    message: 'Voulez-vous vraiment valider cette commande ? Cette action est irréversible.',
    header: 'Confirmation de validation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, valider',
    rejectLabel: 'Non, annuler',
    acceptClass: 'p-button-success',
    rejectClass: 'p-button-secondary',
    accept: async () => {
      const result = await store.validateOrder()
      if (result) {
        const orderNo = result.businessCentralOrderNumber || result.localNumber || '';
        toast.add({
          severity: 'success',
          summary: 'Commande validée',
          detail: `Votre commande est validée avec succès, N° commande ${orderNo}`,
          life: 5000
        })
      }
    }
  })
}

// Debounce map per line to avoid rapid-fire PATCH requests on +/- clicks
const debounceTimers = {}
function debouncedUpdateQty(lineId, qty, delay = 350) {
  clearTimeout(debounceTimers[lineId])
  debounceTimers[lineId] = setTimeout(() => {
    store.error = null  // clear stale error
    store.updateLineQty(lineId, qty)
  }, delay)
}

function fmt(value, decimals = 3) {
  if (value == null || isNaN(value)) return '—'
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function onQtyChange(line, event) {
  const qty = Math.max(1, Math.round(Number(event.target.value)))
  if (qty !== Number(line.quantity)) {
    store.updateLocalQty(line.id, qty)
    debouncedUpdateQty(line.id, qty)
  }
}

function decQty(line) {
  const current = Number(line.quantity)
  const qty = Math.max(1, current - 1)
  if (qty !== current) {
    store.updateLocalQty(line.id, qty)
    debouncedUpdateQty(line.id, qty)
  }
}

function incQty(line) {
  const qty = Number(line.quantity) + 1
  store.updateLocalQty(line.id, qty)
  debouncedUpdateQty(line.id, qty)
}

watch(() => store.highlightedReference, (newRef) => {
  if (newRef) {
    // Double nextTick + petit délai pour laisser le temps au DOM de se
    // rendre après un éventuel changement d'onglet (ex: passage de
    // "transaction" → "order" au moment de l'ajout au panier)
    nextTick(() => {
      setTimeout(() => {
        nextTick(() => {
          const element = document.querySelector(`[data-reference="${newRef}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      }, 80)
    })
  }
})
</script>

<style scoped>
.active-order {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.order-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* ── Empty / Loading states ─────────────────────────────────── */
.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #94a3b8;
  text-align: center;
}
.empty-icon {
  font-size: 2.5rem;
  color: #cbd5e1;
}
.loading-state i { font-size: 1.5rem; color: #3b82f6; }

/* ── Order header ────────────────────────────────────────────── */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.12);
}
.order-meta { display: flex; align-items: center; gap: 8px; }
.order-id { font-weight: 700; font-size: 0.8rem; color: #64748b; font-family: var(--c2-font-mono); }
.order-status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-draft { background: #fef3c7; color: #d97706; }
.status-confirmed { background: #d1fae5; color: #059669; }
.status-cancelled { background: #fee2e2; color: #dc2626; }

.order-client {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #475569;
}

.order-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-order-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.close-order-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* ── Lines table ─────────────────────────────────────────────── */
.lines-wrapper {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 510px;
}
.lines-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.lines-table thead th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 7px 8px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}
.line-row {
  transition: background 0.15s;
}
.line-row:hover { background: #f8fafc; }

.line-row.blink-highlight td {
  background-color: #fde047 !important; /* solid noticeable soft yellow */
}
.line-row td {
  padding: 7px 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  transition: background-color 0.8s ease;
}
.ref-desig-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ref-val {
  font-family: var(--c2-font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e40af;
  white-space: nowrap;
}
.desig-val {
  font-size: 0.7rem;
  color: #64748b;
  word-break: break-word;
  white-space: normal;
  line-height: 1.35;
}
.line-cancelled {
  opacity: 0.65;
  background-color: #fef2f2;
}
.line-cancelled .ref-val {
  text-decoration: line-through;
  color: #94a3b8;
}
.line-cancelled .desig-val {
  text-decoration: line-through;
}
.cancelled-badge {
  background-color: #fee2e2;
  color: #ef4444;
  font-size: 0.6rem;
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 6px;
  font-family: var(--c2-font-sans);
  font-weight: bold;
  text-transform: uppercase;
}
.price-cell, .amount-cell, .ttc-cell { color: #475569; white-space: nowrap; }
.discount-cell, .vat-cell { color: #64748b; font-size: 0.75rem; }
.text-right { text-align: right; }
.text-center { text-align: center; }

/* ── Qty controls ─────────────────────────────────────────────── */
.qty-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.qty-btn {
  width: 22px;
  height: 22px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.qty-btn:hover { background: #e2e8f0; }
.qty-input {
  width: 38px;
  height: 22px;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #1e293b;
  background: white;
}
.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button { opacity: 1; }

/* ── Delete button ────────────────────────────────────────────── */
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 0.85rem;
  padding: 3px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.delete-btn:hover { background: #fee2e2; }

/* ── No lines empty state ─────────────────────────────────────── */
.no-lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #94a3b8;
  text-align: center;
}
.no-lines i { font-size: 2rem; }
.no-lines p { font-size: 0.82rem; line-height: 1.5; }

/* ── Totals block ─────────────────────────────────────────────── */
.totals-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #64748b;
}
.total-ttc {
  font-size: 0.92rem;
  color: #1e293b;
  font-weight: 700;
  border-top: 1px solid #e2e8f0;
  padding-top: 6px;
  margin-top: 2px;
}

/* ── Validate button ──────────────────────────────────────────── */
.validate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.validate-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.validate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Error message ────────────────────────────────────────────── */
.error-msg {
  font-size: 0.8rem;
  color: #dc2626;
  background: #fee2e2;
  border-radius: 6px;
  padding: 8px 12px;
}

/* ── Stock modal ──────────────────────────────────────────────── */
.stock-msg { margin-bottom: 12px; font-size: 0.85rem; color: #374151; }
.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.stock-table th {
  background: #f8fafc;
  padding: 6px 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
}
.stock-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
.stock-err { color: #dc2626; font-weight: 700; }

.modal-close-btn {
  padding: 8px 20px;
  background: #e2e8f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}
.modal-close-btn:hover { background: #cbd5e1; }
</style>
