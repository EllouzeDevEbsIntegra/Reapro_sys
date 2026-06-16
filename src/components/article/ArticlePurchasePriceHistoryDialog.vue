<!--
  Composant PARTAGÉ — Dialog « Historique Prix Achat » (purchase prices).
  Ouvert au clic sur une cellule coût/prix (FRS/EQV/KIT) du détail C2.
  Même enveloppe visuelle que ArticleStockHistoryDialog (réf. de design C2) :
  largeur min(1280px,98vw), hauteur FIXE min(720px,88vh), header Deep Ocean texte
  blanc, table = seule zone scrollable. NE recréez PAS un dialog local.

  Présentation pure : l'appel API (store.fetchPurchasePrices) reste chez le PARENT,
  qui passe la liste `prices` via props. Le filtre fournisseur est piloté en v-model
  (update:vendorFilter) ; le filtrage/dédoublonnage est une dérivation UI locale.
-->
<template>
  <teleport to="body">
    <div v-if="visible" class="c2dlg-backdrop" @click="close"></div>
    <div v-if="visible" class="c2dlg-modal" role="dialog" aria-modal="true">
      <div class="c2dlg-head">
        <div class="c2dlg-title">
          <b>Historique Prix Achat · {{ itemNo }}</b>
          <span>{{ description }}</span>
        </div>
        <div class="c2dlg-headright">
          <select v-if="vendors.length > 1" class="c2dlg-filter" v-model="vendorModel" :disabled="filterLocked">
            <option value="">Tous les fournisseurs</option>
            <option v-for="v in vendors" :key="v" :value="v">{{ v }}</option>
          </select>
          <button class="c2dlg-close" @click="close"><i class="pi pi-times"></i></button>
        </div>
      </div>

      <div class="c2dlg-body">
        <table class="c2dlg-table">
          <thead><tr>
            <th class="left" style="width:18%">Frs</th>
            <th class="left" style="width:20%">Date Début</th>
            <th class="left" style="width:20%">Date Fin</th>
            <th class="left" style="width:18%">Devise</th>
            <th class="num" style="width:24%">Coût Unitaire Direct</th>
          </tr></thead>
          <tbody>
            <tr v-for="(p, i) in filtered" :key="i">
              <td class="left mono">{{ p.vendorNo || '—' }}</td>
              <td class="left mono">{{ formatDate(p.startingDate) }}</td>
              <td class="left mono">{{ formatDate(p.endingDate) }}</td>
              <td class="left">{{ p.currencyCode || '—' }}</td>
              <td class="num mono">{{ formatNumber(p.directUnitCost, 2) }}</td>
            </tr>
            <tr v-if="loading && !filtered.length"><td colspan="5" class="c2dlg-empty"><i class="pi pi-spin pi-spinner"></i> Chargement…</td></tr>
            <tr v-else-if="!filtered.length"><td colspan="5" class="c2dlg-empty"><i class="pi pi-inbox"></i> Aucun historique de prix disponible</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  itemNo: { type: String, default: '' },
  description: { type: String, default: '' },
  prices: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  vendorFilter: { type: String, default: '' },
  filterLocked: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'update:vendorFilter'])

const close = () => emit('update:visible', false)

const vendorModel = computed({
  get: () => props.vendorFilter,
  set: (v) => emit('update:vendorFilter', v)
})
const vendors = computed(() => {
  const v = (props.prices || []).map(p => p.vendorNo).filter(Boolean)
  return [...new Set(v)].sort()
})
const filtered = computed(() => {
  const f = props.vendorFilter
  return f ? (props.prices || []).filter(p => p.vendorNo === f) : (props.prices || [])
})

/* ── Helpers de présentation (purs, copie fidèle du parent C2) ── */
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return isNaN(n) ? '—' : n.toFixed(decimals)
}
const formatDate = (d) => {
  if (!d) return '—'
  const date = (d instanceof Date) ? d : new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
</script>

<style scoped>
/* Enveloppe commune dialogs historiques/achat C2 — réf. ArticleStockHistoryDialog.
   Hauteur FIXE (même hauteur quel que soit le nombre de lignes) ; table = seule zone scrollable. */
.c2dlg-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); backdrop-filter: blur(1px); z-index: 1200; }
.c2dlg-modal {
  --p: var(--c2-select-accent); --p-soft: #eff6ff; --ink: #0f172a; --muted: #64748b;
  --line: #e8edf3; --line-soft: #f1f5f9; --ok: #16a34a; --bad: #dc2626;
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(1280px, 98vw); max-width: 98vw; z-index: 1201;
  height: min(720px, 88vh); max-height: 88vh;
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .32);
  display: flex; flex-direction: column; overflow: hidden;
  font-family: var(--c2-font-sans);
}
.c2dlg-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: var(--c2-head-bg); color: #fff; flex-shrink: 0; }
.c2dlg-title { display: flex; flex-direction: column; min-width: 0; }
.c2dlg-title b { font-size: 1rem; font-weight: 800; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.c2dlg-title span { font-size: 0.8rem; color: #fff; opacity: .82; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c2dlg-headright { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.c2dlg-filter { height: 30px; border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #e2e8f0; border-radius: 8px; padding: 0 8px; font-size: 0.78rem; cursor: pointer; max-width: 200px; font-family: var(--c2-font-sans); }
.c2dlg-filter:disabled { opacity: .6; cursor: default; }
.c2dlg-close { border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #cbd5e1; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
.c2dlg-close:hover { background: #155088; color: #fff; }

/* Corps = SEULE zone scrollable */
.c2dlg-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: auto; }
.c2dlg-table { table-layout: fixed; width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.c2dlg-table th, .c2dlg-table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c2dlg-table th { position: sticky; top: 0; z-index: 1; background: #f8fafc; color: #475569; text-transform: uppercase; font-weight: 700; font-size: 12.5px; letter-spacing: .02em; text-align: right; padding: 10px 8px; border-bottom: 1.5px solid var(--line); border-right: 1px solid var(--line-soft); }
.c2dlg-table th:last-child { border-right: none; }
.c2dlg-table th.left { text-align: left; }
.c2dlg-table th.num { text-align: right; }
.c2dlg-table td { padding: 8px 8px; font-size: 14px; color: #334155; text-align: right; border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft); }
.c2dlg-table td:last-child { border-right: none; }
.c2dlg-table td.left { text-align: left; }
.c2dlg-table td.num { text-align: right; }
.c2dlg-table tbody tr:nth-child(even) { background: #fcfdfe; }
.c2dlg-table td.mono { font-variant-numeric: tabular-nums; font-weight: 650; color: var(--ink); }
.c2dlg-table td.muted { color: #94a3b8; }
.c2dlg-table td b { font-weight: 800; color: var(--ink); }
.c2dlg-empty { text-align: center !important; padding: 22px !important; color: #94a3b8; font-style: italic; }
.c2dlg-empty i { font-size: 1.1rem; margin-right: 6px; }
.c2dlg-body::-webkit-scrollbar { width: 8px; height: 8px; }
.c2dlg-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.c2dlg-body::-webkit-scrollbar-track { background: transparent; }
</style>
