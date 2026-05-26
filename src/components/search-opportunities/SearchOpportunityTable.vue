<template>
  <div class="so-table-wrapper">
    <div class="so-table-header">
      <span class="so-table-title">
        <i class="pi pi-list"></i>
        Opportunités de recherche
      </span>
      <span class="so-table-count" v-if="!loading">
        {{ totalElements.toLocaleString('fr-FR') }} résultat{{ totalElements !== 1 ? 's' : '' }}
      </span>
    </div>

    <div class="so-table-scroll">
      <table class="so-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Catégories</th>
            <th class="text-center">Score</th>
            <th class="text-center">Tentatives</th>
            <th class="text-center">Clients</th>
            <th class="text-center">0 Résultat</th>
            <th class="text-center">Sans stock</th>
            <th class="text-center">Avec stock</th>
            <th>Dates recherche</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading rows -->
          <template v-if="loading">
            <tr v-for="i in pageSize" :key="'sk-'+i" class="skeleton-row">
              <td v-for="j in 10" :key="j"><div class="skeleton-cell"></div></td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="items.length === 0">
            <td colspan="10" class="so-empty-state">
              <div class="empty-inner">
                <i class="pi pi-search" style="font-size:2.5rem; color:#94a3b8;"></i>
                <span class="empty-title">Aucune opportunité non clôturée</span>
                <span class="empty-sub">Modifiez les filtres ou revenez ultérieurement.</span>
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-else
            v-for="item in items"
            :key="item.normalizedFilter"
            class="so-row"
          >
            <!-- Référence -->
            <td>
              <span class="ref-text">{{ item.normalizedFilter }}</span>
            </td>

            <!-- Catégories / Tags -->
            <td>
              <div class="badges-col">
                <span v-if="item.priorityScore >= 100" class="badge badge-priority">
                  <i class="pi pi-star-fill"></i> Priorité élevée
                </span>
                <span v-if="item.distinctCustomersCount >= 2" class="badge badge-multi">
                  <i class="pi pi-users"></i> Multi-clients
                </span>
              </div>
            </td>

            <!-- Score -->
            <td class="text-center">
              <span class="score-badge" :class="scoreClass(item.priorityScore)">
                {{ item.priorityScore ?? '—' }}
              </span>
            </td>

            <!-- Tentatives -->
            <td class="text-center">
              <span class="num-val">{{ item.totalAttempts }}</span>
            </td>

            <!-- Clients distincts -->
            <td class="text-center">
              <span class="num-val">{{ item.distinctCustomersCount }}</span>
            </td>

            <!-- 0 résultat -->
            <td class="text-center">
              <span v-if="item.zeroResultCount > 0" class="badge badge-zero">{{ item.zeroResultCount }}</span>
              <span v-else class="text-muted">0</span>
            </td>

            <!-- Sans stock -->
            <td class="text-center">
              <span v-if="item.noStockCount > 0" class="badge badge-nostock">{{ item.noStockCount }}</span>
              <span v-else class="text-muted">0</span>
            </td>

            <!-- Avec stock -->
            <td class="text-center">
              <span v-if="item.withStockCount > 0" class="badge badge-stock">{{ item.withStockCount }}</span>
              <span v-else class="text-muted">0</span>
            </td>

            <!-- Dates recherche (stacked) -->
            <td class="date-cell">
              <div class="dates-stacked">
                <div class="date-row" title="Première recherche">
                  <i class="pi pi-calendar-plus"></i>
                  <span>{{ formatDate(item.firstSearchDate) }}</span>
                </div>
                <div class="date-row" title="Dernière recherche">
                  <i class="pi pi-calendar-minus"></i>
                  <span>{{ formatDate(item.lastSearchDate) }}</span>
                </div>
              </div>
            </td>

            <!-- Actions -->
            <td class="text-center">
              <div class="action-btns">
                <button class="act-btn act-detail" @click="$emit('detail', item)" title="Voir le détail">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="act-btn act-close" @click="$emit('close', item)" title="Clôturer">
                  <i class="pi pi-check-circle"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="so-pagination" v-if="totalPages > 1 || items.length > 0">
      <span class="page-info">
        Page {{ currentPage + 1 }} / {{ Math.max(1, totalPages) }}
      </span>
      <div class="page-controls">
        <button 
          class="page-btn" 
          :disabled="currentPage === 0" 
          @click="$emit('page-change', currentPage - 1)"
          type="button"
        >
          <i class="pi pi-chevron-left" style="pointer-events: none;"></i>
        </button>
        <button
          v-for="p in visiblePages"
          :key="p"
          class="page-btn"
          :class="{ active: p - 1 === currentPage, dots: p === '...' }"
          :disabled="p === '...'"
          @click="p !== '...' && $emit('page-change', p - 1)"
          type="button"
        >
          {{ p }}
        </button>
        <button 
          class="page-btn" 
          :disabled="currentPage >= totalPages - 1" 
          @click="$emit('page-change', currentPage + 1)"
          type="button"
        >
          <i class="pi pi-chevron-right" style="pointer-events: none;"></i>
        </button>
      </div>
      <div class="page-size-select">
        <label>Lignes :</label>
        <select :value="pageSize" @change="$emit('size-change', Number($event.target.value))" class="size-sel">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items:        { type: Array,   default: () => [] },
  loading:      { type: Boolean, default: false },
  currentPage:  { type: Number,  default: 0 },
  totalPages:   { type: Number,  default: 0 },
  totalElements:{ type: Number,  default: 0 },
  pageSize:     { type: Number,  default: 20 }
})

defineEmits(['detail', 'close', 'page-change', 'size-change'])

const visiblePages = computed(() => {
  const total = props.totalPages
  const cur   = props.currentPage + 1
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (cur <= 4) {
    for (let i = 1; i <= Math.min(5, total); i++) pages.push(i)
    if (total > 5) pages.push('...')
    pages.push(total)
  } else if (cur >= total - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1, '...')
    for (let i = cur - 1; i <= cur + 1; i++) pages.push(i)
    pages.push('...', total)
  }
  return pages.filter((p, i, arr) => arr.indexOf(p) === i)
})

function formatDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function scoreClass(score) {
  if (score >= 150) return 'score-critical'
  if (score >= 100) return 'score-high'
  if (score >= 50)  return 'score-medium'
  return 'score-low'
}
</script>

<style scoped>
.so-table-wrapper {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.so-table-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.9rem 1.2rem 0.7rem;
  border-bottom: 1px solid #f1f5f9;
}
.so-table-title {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.95rem; font-weight: 700; color: #1e293b;
}
.so-table-count {
  font-size: 0.8rem; color: #64748b; background: #f1f5f9;
  padding: 3px 10px; border-radius: 20px; font-weight: 500;
}

.so-table-scroll { overflow-x: auto; }

.so-table {
  width: 100%; border-collapse: collapse; min-width: 1150px;
}
.so-table thead tr {
  background: #f8fafc;
}
.so-table th {
  padding: 0.7rem 0.8rem;
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.so-table td {
  padding: 0.65rem 0.8rem;
  font-size: 0.82rem; color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.so-row { transition: background 0.12s; }
.so-row:nth-child(odd) td { background: #ffffff; }
.so-row:nth-child(even) td { background: #f4f8fd; }
.so-row:hover td { background: #e2effe !important; }

.badges-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.65rem; font-weight: 700; padding: 2px 7px;
  border-radius: 20px; white-space: nowrap;
}
.badge-priority { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
.badge-multi    { background: #ede9fe; color: #5b21b6; border: 1px solid #c4b5fd; }
.badge-zero     { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.badge-nostock  { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
.badge-stock    { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }

.score-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.78rem; font-weight: 700;
}
.score-critical { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.score-high     { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
.score-medium   { background: #ede9fe; color: #5b21b6; border: 1px solid #c4b5fd; }
.score-low      { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

.num-val { font-weight: 700; color: #1e293b; }
.text-muted { color: #cbd5e1; font-size: 0.8rem; }

/* Dates stacked column */
.dates-stacked {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.date-row {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
}
.date-row .pi {
  font-size: 0.7rem;
  margin-right: 4px;
  color: #94a3b8;
}
.ref-text { font-weight: 700; color: #1e3a8a; font-family: monospace; font-size: 0.85rem; }

.action-btns { display: flex; align-items: center; justify-content: center; gap: 6px; }
.act-btn {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 0.9rem; transition: all 0.15s;
}
.act-detail { background: #eff6ff; color: #1d4ed8; }
.act-detail:hover { background: #1d4ed8; color: #fff; transform: translateY(-1px); }
.act-close  { background: #f0fdf4; color: #16a34a; }
.act-close:hover  { background: #16a34a; color: #fff; transform: translateY(-1px); }

/* Empty state */
.so-empty-state { padding: 4rem 1rem; }
.empty-inner {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}
.empty-title { font-size: 1rem; font-weight: 600; color: #475569; }
.empty-sub   { font-size: 0.85rem; color: #94a3b8; }

/* Skeleton */
.skeleton-row td { padding: 0.85rem 0.8rem; }
.skeleton-cell {
  height: 14px; border-radius: 6px; background: #e2e8f0;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
}

/* Pagination */
.so-pagination {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.75rem 1.2rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.page-info { font-size: 0.8rem; color: #64748b; flex: 1; }
.page-controls { display: flex; gap: 4px; align-items: center; }
.page-btn {
  min-width: 32px; height: 32px; padding: 0 8px;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569; font-size: 0.82rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.page-btn.active { background: #1e40af; border-color: #1e40af; color: #fff; font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-btn.dots, .page-btn.dots:hover {
  border: none;
  background: transparent;
  cursor: default;
  opacity: 1;
  color: #64748b;
}

.page-size-select { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #64748b; }
.size-sel {
  border: 1.5px solid #e2e8f0; border-radius: 7px;
  padding: 3px 6px; font-size: 0.82rem; color: #1e293b;
  cursor: pointer;
}

.text-center { text-align: center; }
</style>
