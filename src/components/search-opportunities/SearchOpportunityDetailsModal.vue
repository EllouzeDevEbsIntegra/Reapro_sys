<template>
  <Teleport to="body">
    <div v-if="visible" class="so-modal-overlay" @click.self="$emit('close')">
      <div class="so-modal so-detail-modal">
        <!-- Header -->
        <div class="so-modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-wrap">
              <i class="pi pi-eye"></i>
            </div>
            <div>
              <h3 class="modal-title">Détail de l'opportunité</h3>
              <div class="modal-subtitle">
                <span class="ref-chip">{{ normalizedFilter }}</span>
              </div>
            </div>
          </div>
          <button class="modal-close-btn" @click="$emit('close')">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="so-modal-body">
          <!-- Loading -->
          <div v-if="loading" class="modal-loading">
            <i class="pi pi-spin pi-spinner" style="font-size:2rem; color:var(--c2-primary);"></i>
            <span>Chargement des détails...</span>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="modal-error">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Erreur lors du chargement des données.</span>
          </div>

          <!-- Content -->
          <template v-else>
            <!-- Summary chips -->
            <div class="detail-summary">
              <div class="summary-chip blue">
                <i class="pi pi-list"></i>
                <span><strong>{{ details.length }}</strong> recherche{{ details.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="summary-chip red" v-if="zeroResultCount > 0">
                <i class="pi pi-times-circle"></i>
                <span><strong>{{ zeroResultCount }}</strong> sans résultat</span>
              </div>
              <div class="summary-chip amber" v-if="noStockCount > 0">
                <i class="pi pi-box"></i>
                <span><strong>{{ noStockCount }}</strong> sans stock</span>
              </div>
            </div>

            <!-- Table -->
            <div class="detail-table-scroll">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Texte saisi</th>
                    <th>Client</th>
                    <th>Code ext.</th>
                    <th>Type</th>
                    <th class="text-center">Résultats</th>
                    <th class="text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in details" :key="row.id" class="detail-row">
                    <td class="date-cell">{{ formatDate(row.creationDate) }}</td>
                    <td>
                      <span class="mono-text">{{ row.filterDecoded || row.normalizedFilter }}</span>
                    </td>
                    <td>
                      <span class="company-name">{{ row.companyName || '—' }}</span>
                    </td>
                    <td>
                      <span class="ext-id">{{ row.extId || '—' }}</span>
                    </td>
                    <td>
                      <span class="type-badge">{{ row.type || '—' }}</span>
                    </td>
                    <td class="text-center">
                      <span v-if="row.resultsCount === 0" class="badge-zero-sm">0</span>
                      <span v-else class="results-count">{{ row.resultsCount }}</span>
                    </td>
                    <td class="text-center">
                      <span v-if="row.isStockAvailable === true" class="stock-ok">
                        <i class="pi pi-check-circle"></i>
                      </span>
                      <span v-else-if="row.isStockAvailable === false" class="stock-nok">
                        <i class="pi pi-times-circle"></i>
                      </span>
                      <span v-else class="text-muted">—</span>
                    </td>
                  </tr>
                  <tr v-if="details.length === 0 && !loading">
                    <td colspan="7" class="empty-detail">Aucune ligne de recherche disponible.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="so-modal-footer">
          <button class="btn-secondary" @click="$emit('close')">Fermer</button>
          <button class="btn-primary" @click="$emit('open-close', normalizedFilter)">
            <i class="pi pi-check-circle"></i>
            Clôturer cette opportunité
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible:         { type: Boolean, default: false },
  normalizedFilter:{ type: String,  default: '' },
  details:         { type: Array,   default: () => [] },
  loading:         { type: Boolean, default: false },
  error:           { type: Boolean, default: false }
})

defineEmits(['close', 'open-close'])

const zeroResultCount = computed(() => props.details.filter(d => d.resultsCount === 0).length)
const noStockCount    = computed(() => props.details.filter(d => d.isStockAvailable === false).length)

function formatDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.so-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1200;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.18s ease;
  font-family: var(--c2-font-sans);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.so-modal {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.32);
  display: flex; flex-direction: column;
  max-height: 88vh;
  animation: slideUp 0.22s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.so-detail-modal { width: 860px; max-width: 98vw; }

/* Header */
/* Header Deep Ocean — texte blanc (charte §16) */
.so-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.25rem;
  background: var(--c2-head-bg);
  border-bottom: 1px solid var(--c2-head-border);
}
.modal-title-wrap { display: flex; align-items: center; gap: 0.85rem; }
.modal-icon-wrap {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(130, 201, 229, 0.5);   /* anneau Frozen */
  display: flex; align-items: center; justify-content: center;
  color: #ffffff; font-size: 1.15rem; flex-shrink: 0;
}
.modal-title { font-size: 1rem; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.3; }
.modal-subtitle { margin-top: 3px; }
.ref-chip {
  background: rgba(255, 255, 255, 0.12); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px; padding: 2px 12px; font-size: 0.8rem; font-weight: 700;
  font-family: var(--c2-font-sans);
  font-variant-numeric: tabular-nums;
}
.modal-close-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--c2-head-border);
  background: #0e3f6e; color: #cbd5e1; cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.modal-close-btn:hover { background: #155088; color: #ffffff; }

/* Body */
.so-modal-body {
  padding: 1.2rem 1.5rem;
  overflow-y: auto; flex: 1;
}

.modal-loading, .modal-error {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 3rem; color: #64748b; font-size: 0.9rem;
}
.modal-error { color: #dc2626; }

/* Summary chips */
.detail-summary {
  display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.1rem;
}
.summary-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 500;
}
.summary-chip.blue  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.summary-chip.red   { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.summary-chip.amber { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }

/* Detail table */
.detail-table-scroll { overflow-x: auto; border-radius: 10px; border: 1px solid #e2e8f0; }
.detail-table { width: 100%; border-collapse: collapse; min-width: 660px; }
.detail-table thead tr { background: #f8fafc; }
.detail-table th {
  padding: 0.6rem 0.8rem;
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: #64748b; border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.detail-table td {
  padding: 0.6rem 0.8rem; font-size: 0.82rem; color: #334155;
  border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}
.detail-row:hover td { background: #f8fafc; }

.date-cell { font-size: 0.75rem; color: #64748b; white-space: nowrap; }
/* §14.8 : texte/réf métier en sans + tabular-nums (jamais mono) */
.mono-text { font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; font-size: 0.82rem; color: #1e293b; font-weight: 600; }
.company-name { font-weight: 600; color: #1e293b; }
.ext-id { font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; font-size: 0.78rem; color: #64748b; }
.type-badge {
  background: #f1f5f9; color: #475569; border-radius: 12px;
  padding: 2px 8px; font-size: 0.7rem; font-weight: 600;
}
.badge-zero-sm {
  background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5;
  border-radius: 12px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700;
}
.results-count { font-weight: 700; color: #16a34a; }
.stock-ok  { color: #16a34a; font-size: 1.1rem; }
.stock-nok { color: #dc2626; font-size: 1.1rem; }
.text-muted { color: #cbd5e1; }
.text-center { text-align: center; }
.empty-detail { text-align: center; padding: 2rem; color: #94a3b8; font-style: italic; }

/* Footer */
.so-modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}
.btn-secondary {
  padding: 0.55rem 1.2rem; border-radius: 9px;
  border: 1.5px solid #e2e8f0; background: #f8fafc; color: #475569;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }

/* Action principale → Cobalt (charte §10) ; la confirmation forte (vert) est dans le modal de clôture */
.btn-primary {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.55rem 1.3rem; border-radius: 9px; border: none;
  background: var(--c2-primary);
  color: #fff; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s, transform 0.15s;
}
.btn-primary:hover { background: var(--c2-primary-hover); transform: translateY(-1px); }
</style>
