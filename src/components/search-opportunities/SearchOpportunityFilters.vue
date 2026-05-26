<template>
  <div class="so-filters-panel">
    <div class="filters-grid">
      <!-- Date début -->
      <div class="filter-group">
        <label class="filter-label">Date début</label>
        <input type="date" v-model="local.fromDate" class="filter-input" />
      </div>

      <!-- Date fin -->
      <div class="filter-group">
        <label class="filter-label">Date fin</label>
        <input type="date" v-model="local.toDate" class="filter-input" />
      </div>

      <!-- Référence normalisée -->
      <div class="filter-group">
        <label class="filter-label">Référence</label>
        <input type="text" v-model="local.extId" class="filter-input" placeholder="Ex: ABC123" />
      </div>

      <!-- Société -->
      <div class="filter-group">
        <label class="filter-label">Société / Client</label>
        <input type="text" v-model="local.companyName" class="filter-input" placeholder="Nom de la société..." />
      </div>

      <!-- Type -->
      <div class="filter-group">
        <label class="filter-label">Type</label>
        <select v-model="local.type" class="filter-input">
          <option value="">Tous</option>
          <option value="ARTICLE">Article</option>
          <option value="OEM">OEM</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <!-- Min tentatives -->
      <div class="filter-group">
        <label class="filter-label">Min. tentatives</label>
        <input type="number" v-model.number="local.minAttempts" class="filter-input" min="0" placeholder="0" />
      </div>

      <!-- Min clients distincts -->
      <div class="filter-group">
        <label class="filter-label">Min. clients distincts</label>
        <input type="number" v-model.number="local.minDistinctCustomers" class="filter-input" min="0" placeholder="0" />
      </div>

      <!-- Checkboxes -->
      <div class="filter-group filter-group-checks">
        <label class="filter-label">Options</label>
        <div class="checks-row">
          <label class="check-label">
            <input type="checkbox" v-model="local.onlyZeroResults" class="check-input" />
            <span class="check-badge zero">0 résultat</span>
          </label>
          <label class="check-label">
            <input type="checkbox" v-model="local.onlyNoStock" class="check-input" />
            <span class="check-badge nostock">Sans stock</span>
          </label>
          <label class="check-label">
            <input
              type="checkbox"
              v-model="local.includeExistingInErp"
              class="check-input"
              @change="onSearch"
            />
            <span class="check-badge all">Toutes les recherches</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="filter-actions">
      <button class="btn-search" @click="onSearch">
        <i class="pi pi-search"></i>
        <span>Rechercher</span>
      </button>
      <button class="btn-reset" @click="onReset" title="Réinitialiser">
        <i class="pi pi-refresh"></i>
        <span>Réinitialiser</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const local = reactive({
  fromDate: '',
  toDate: '',
  extId: '',
  companyName: '',
  type: '',
  minAttempts: null,
  minDistinctCustomers: null,
  onlyZeroResults: false,
  onlyNoStock: false,
  includeExistingInErp: false,
  ...props.modelValue
})

watch(local, (val) => {
  emit('update:modelValue', { ...val })
})

function onSearch() {
  emit('search', { ...local })
}

function onReset() {
  local.fromDate = ''
  local.toDate = ''
  local.extId = ''
  local.companyName = ''
  local.type = ''
  local.minAttempts = null
  local.minDistinctCustomers = null
  local.onlyZeroResults = false
  local.onlyNoStock = false
  local.includeExistingInErp = false
  emit('reset', { ...local })
}
</script>

<style scoped>
.so-filters-panel {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  border: 1px solid #f1f5f9;
  padding: 1.2rem 1.4rem 1rem;
  margin-bottom: 1.25rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem 1.1rem;
  margin-bottom: 1rem;
}

@media (max-width: 1100px) { .filters-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .filters-grid { grid-template-columns: 1fr; } }

.filter-group { display: flex; flex-direction: column; gap: 4px; }

.filter-label {
  font-size: 0.72rem; font-weight: 600; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.04em;
}

.filter-input {
  width: 100%;
  padding: 0.45rem 0.7rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}
.filter-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  background: #ffffff;
}

.filter-group-checks { justify-content: flex-start; }
.checks-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 2px; }

.check-label {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
}
.check-input {
  accent-color: #1e40af; width: 15px; height: 15px; cursor: pointer;
}

.check-badge {
  font-size: 0.75rem; font-weight: 600; padding: 2px 10px;
  border-radius: 20px; cursor: pointer;
  user-select: none;
}
.check-badge.zero    { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.check-badge.nostock { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
.check-badge.all     { background: #eef2ff; color: #1d4ed8; border: 1px solid #93c5fd; }

.filter-actions {
  display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end;
}

.btn-search {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  color: #fff; border: none; border-radius: 9px;
  padding: 0.55rem 1.3rem; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s, transform 0.15s;
}
.btn-search:hover { opacity: 0.92; transform: translateY(-1px); }
.btn-search:active { transform: translateY(0); }

.btn-reset {
  display: flex; align-items: center; gap: 0.5rem;
  background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0;
  border-radius: 9px; padding: 0.55rem 1.1rem;
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.btn-reset:hover { background: #e2e8f0; }
</style>
