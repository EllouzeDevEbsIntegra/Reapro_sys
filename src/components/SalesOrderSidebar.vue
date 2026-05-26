<template>
  <div class="sidebar-container">

    <!-- Onglets -->
    <div class="tab-bar">
      <button
        class="toggle-sidebar-btn"
        @click="store.isExpanded = !store.isExpanded"
        :title="store.isExpanded ? 'Réduire' : 'Agrandir'"
        type="button"
      >
        <i class="pi" :class="store.isExpanded ? 'pi-chevron-right' : 'pi-chevron-left'"></i>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'order' }"
        @click="activeTab = 'order'"
        type="button"
      >
        <i class="pi pi-shopping-cart"></i>
        <span>Commande</span>
        <span v-if="lineCount > 0" class="tab-badge">{{ lineCount }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
        type="button"
      >
        <i class="pi pi-history"></i>
        <span>Historique</span>
      </button>
      <div style="flex: 1;"></div>
      <button
        class="tab-btn transaction-tab"
        :class="{ active: activeTab === 'transaction' }"
        @click="activeTab = 'transaction'"
        type="button"
      >
        <i class="pi pi-chart-line"></i>
        <span>Transaction Article</span>
      </button>
    </div>

    <!-- Contenu des onglets -->
    <div class="tab-content">
      <SalesOrderActive v-if="activeTab === 'order'" />
      <SalesOrderHistory v-else-if="activeTab === 'history'" />
      <ArticleTransactionHistory v-else-if="activeTab === 'transaction'" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SalesOrderActive from '@/components/SalesOrderActive.vue'
import SalesOrderHistory from '@/components/SalesOrderHistory.vue'
import ArticleTransactionHistory from '@/components/ArticleTransactionHistory.vue'
import { useSalesOrderStore } from '@/stores/salesOrderStore'

const store = useSalesOrderStore()
const activeTab = computed({
  get: () => store.activeTab,
  set: (val) => store.activeTab = val
})
const lineCount = computed(() => store.lines.length)
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Tab bar ───────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 0;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.8);
  flex-shrink: 0;
}

.toggle-sidebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  color: #64748b;
  margin-bottom: 6px;
  transition: all 0.2s ease;
}

.toggle-sidebar-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  color: #64748b;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
  margin-bottom: -1px;
  position: relative;
}

.tab-btn:hover {
  color: #1e293b;
  background: rgba(59, 130, 246, 0.05);
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: white;
  font-weight: 600;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

/* ── Tab content ────────────────────────────────────────────────── */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: white;
}

/* ── Transaction Tab specific style ────────────────────────────── */
.tab-btn.transaction-tab:hover {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.05);
}

.tab-btn.transaction-tab.active {
  color: #f97316;
  border-bottom-color: #f97316;
  background: white;
  font-weight: 600;
}
</style>
