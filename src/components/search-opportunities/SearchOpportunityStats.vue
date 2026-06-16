<template>
  <div class="so-stats-grid">
    <!-- Skeleton loading -->
    <template v-if="loading">
      <div v-for="i in 5" :key="i" class="so-stat-card so-stat-skeleton">
        <div class="skeleton-icon"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line w60"></div>
          <div class="skeleton-line w40"></div>
        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="error" class="so-stats-error">
      <i class="pi pi-exclamation-triangle"></i>
      <span>Impossible de charger les statistiques</span>
    </div>

    <!-- Stats cards -->
    <template v-else>
      <!-- KPI n°1 : total résultats (ex-titre « Opportunités de recherche · X résultats ») -->
      <div class="so-stat-card so-stat-ocean">
        <div class="so-stat-icon-wrap ocean">
          <i class="pi pi-list"></i>
        </div>
        <div class="so-stat-divider ocean"></div>
        <div class="so-stat-content">
          <span class="so-stat-value">
            <i v-if="loadingResults" class="pi pi-spin pi-spinner" style="font-size: 0.85rem;"></i>
            <template v-else>{{ formatNumber(totalResults ?? '—') }}</template>
          </span>
          <span class="so-stat-label">Résultats de recherche</span>
        </div>
      </div>

      <div class="so-stat-card so-stat-indigo">
        <div class="so-stat-icon-wrap indigo">
          <i class="pi pi-chart-bar"></i>
        </div>
        <div class="so-stat-divider indigo"></div>
        <div class="so-stat-content">
          <span class="so-stat-value">{{ formatNumber(stats?.totalUnclosedOpportunities ?? '—') }}</span>
          <span class="so-stat-label">Opportunités non clôturées</span>
        </div>
      </div>

      <div class="so-stat-card so-stat-blue">
        <div class="so-stat-icon-wrap blue">
          <i class="pi pi-search"></i>
        </div>
        <div class="so-stat-divider blue"></div>
        <div class="so-stat-content">
          <span class="so-stat-value">{{ formatNumber(stats?.totalUnclosedSearchLines ?? '—') }}</span>
          <span class="so-stat-label">Recherches non clôturées</span>
        </div>
      </div>

      <div class="so-stat-card so-stat-red">
        <div class="so-stat-icon-wrap red">
          <i class="pi pi-times-circle"></i>
        </div>
        <div class="so-stat-divider red"></div>
        <div class="so-stat-content">
          <span class="so-stat-value">{{ formatNumber(stats?.totalZeroResultSearches ?? '—') }}</span>
          <span class="so-stat-label">Recherches avec 0 résultat</span>
        </div>
      </div>

      <div class="so-stat-card so-stat-amber">
        <div class="so-stat-icon-wrap amber">
          <i class="pi pi-box"></i>
        </div>
        <div class="so-stat-divider amber"></div>
        <div class="so-stat-content">
          <span class="so-stat-value">{{ formatNumber(stats?.totalNoStockSearches ?? '—') }}</span>
          <span class="so-stat-label">Recherches sans stock</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  stats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  totalResults: { type: [Number, String], default: 0 },  // total résultats (ex-titre tableau), KPI n°1
  loadingResults: { type: Boolean, default: false }       // liste en cours → spinner (vs « 0 » trompeur)
})

function formatNumber(val) {
  if (val === null || val === undefined || val === '—') return '—'
  return Number(val).toLocaleString('fr-FR')
}
</script>

<style scoped>
.so-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 250px);   /* 5 KPI × 250px (= Sync Adaptable) */
  justify-content: flex-end;                 /* alignés à droite */
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 1100px) {
  .so-stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .so-stats-grid { grid-template-columns: 1fr; }
}

.so-stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.35rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  min-height: 52px;
}

.so-stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.so-stat-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}
.so-stat-icon-wrap.ocean  { background: #eff6ff; color: var(--c2-primary); border: 1px solid #dbeafe; }
.so-stat-icon-wrap.indigo { background: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; }
.so-stat-icon-wrap.blue   { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
.so-stat-icon-wrap.red    { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
.so-stat-icon-wrap.amber  { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

.so-stat-divider {
  width: 2px;
  height: 24px;
  border-radius: 99px;
  flex-shrink: 0;
}
.so-stat-divider.ocean  { background: var(--c2-primary); }
.so-stat-divider.indigo { background: #4f46e5; }
.so-stat-divider.blue   { background: #1d4ed8; }
.so-stat-divider.red    { background: #dc2626; }
.so-stat-divider.amber  { background: #d97706; }

.so-stat-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.so-stat-value {
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.1;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.so-stat-label {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Skeleton */
.so-stat-skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}
.skeleton-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: #e2e8f0; flex-shrink: 0;
}
.skeleton-lines { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.skeleton-line {
  height: 10px; border-radius: 4px; background: #e2e8f0;
}
.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.so-stats-error {
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 0.5rem;
  color: #ef4444; font-size: 0.9rem; padding: 1rem;
  background: #fef2f2; border-radius: 10px;
}
</style>
