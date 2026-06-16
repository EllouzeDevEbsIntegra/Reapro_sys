<!--
  Composant PARTAGÉ — Dialog « Lignes Import ».
  Ouvert au clic sur la quantité Import « I » de la colonne Appro (détail C2).
  Écritures item-ledger en magasin d'import (RemainingQuantity > 0) pour un article + fournisseur.
  Même enveloppe que ArticlePurchaseLinesDialog (largeur min(1280px,98vw), hauteur FIXE
  min(720px,88vh), header Deep Ocean texte blanc, table scrollable interne, footer pagination
  fixe). NE recréez PAS un dialog local.

  Présentation pure : l'appel API (store.fetchImportLedgerLines) + la pagination restent
  chez le PARENT, qui passe `entries`/`page`/`totalPages` via props et réagit à go-page.
-->
<template>
  <teleport to="body">
    <div v-if="visible" class="c2dlg-backdrop" @click="close"></div>
    <div v-if="visible" class="c2dlg-modal" role="dialog" aria-modal="true">
      <div class="c2dlg-head">
        <div class="c2dlg-title"><b>Lignes Import · {{ itemNo }}</b><span>{{ sourceNo ? ('Frs ' + sourceNo + ' · ') : '' }}{{ totalElements }} ligne(s)</span></div>
        <button class="c2dlg-close" @click="close"><i class="pi pi-times"></i></button>
      </div>

      <div class="c2dlg-body">
        <table class="c2dlg-table">
          <thead><tr>
            <th v-for="col in COLS" :key="col.key" :class="[col.align, 'c2dlg-th-sort']" :style="{ width: col.width }" @click="emit('sort-change', col.key)">
              <span class="c2dlg-th-inner" :class="{ end: col.align === 'num' }">{{ col.label }}<i class="pi c2dlg-sort-ic" :class="sortIcon(col.key)"></i></span>
            </th>
          </tr></thead>
          <tbody>
            <tr v-for="(l, i) in entries" :key="i">
              <td class="left mono">{{ l.documentNo || '—' }}</td>
              <td class="left mono"><b>{{ l.sourceNo || '—' }}</b></td>
              <td class="left" :title="l.sourceName">{{ l.sourceName || '—' }}</td>
              <td class="left muted" :title="l.locationCode">{{ l.locationCode || '—' }}</td>
              <td class="mono">{{ formatDate(l.postingDate) }}</td>
              <td class="num mono">{{ formatNumber(l.quantity, 0) }}</td>
              <td class="num mono"><b>{{ formatNumber(l.remainingQuantity, 0) }}</b></td>
              <td class="num mono">{{ formatNumber(l.costAmountExpected, 3) }}</td>
            </tr>
            <tr v-if="loading && !entries.length"><td colspan="8" class="c2dlg-empty"><i class="pi pi-spin pi-spinner"></i> Chargement…</td></tr>
            <tr v-else-if="!entries.length"><td colspan="8" class="c2dlg-empty"><i class="pi pi-inbox"></i> Aucune ligne d'import</td></tr>
          </tbody>
        </table>
      </div>

      <div class="c2dlg-footer" v-if="totalPages > 1">
        <button class="c2dlg-pager" :disabled="page === 0" @click="emit('go-page', page - 1)"><i class="pi pi-chevron-left"></i></button>
        <span>{{ page + 1 }} / {{ totalPages }}</span>
        <button class="c2dlg-pager" :disabled="page >= totalPages - 1" @click="emit('go-page', page + 1)"><i class="pi pi-chevron-right"></i></button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  itemNo: { type: String, default: '' },
  sourceNo: { type: String, default: '' },
  totalElements: { type: Number, default: 0 },
  entries: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  page: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  sortField: { type: String, default: '' },        // colonne triée (clé = colonne BC whitelistée)
  sortDirection: { type: String, default: '' }     // 'asc' | 'desc' | ''
})
const emit = defineEmits(['update:visible', 'go-page', 'sort-change'])

const close = () => emit('update:visible', false)

// Colonnes (libellé + clé de tri = nom de colonne BC whitelistée côté backend).
const COLS = [
  { key: 'DocumentNo', label: 'N° Document', align: 'left', width: '13%' },
  { key: 'SourceNo', label: 'Frs', align: 'left', width: '10%' },
  { key: 'SourceName', label: 'Nom', align: 'left', width: '19%' },
  { key: 'LocationCode', label: 'Magasin', align: 'left', width: '10%' },
  { key: 'PostingDate', label: 'Date', align: '', width: '11%' },
  { key: 'Quantity', label: 'Qté', align: 'num', width: '9%' },
  { key: 'RemainingQuantity', label: 'Qté Restante', align: 'num', width: '13%' },
  { key: 'CostAmountExpected', label: 'Coût Attendu', align: 'num', width: '15%' }
]
const sortIcon = (key) => {
  if (props.sortField !== key) return 'pi-sort c2dlg-sort-none'
  return props.sortDirection === 'asc' ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'
}

/* ── Helpers de présentation (purs, copie fidèle du parent C2) ── */
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return isNaN(n) ? '—' : n.toFixed(decimals)
}
const formatDate = (d) => {
  if (!d || d === '0001-01-01' || String(d).startsWith('1753-01-01')) return '—'
  const date = (d instanceof Date) ? d : new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
</script>

<style scoped>
/* Enveloppe commune dialogs historiques/achat C2 — réf. ArticlePurchaseLinesDialog.
   Hauteur FIXE ; table = seule zone scrollable ; footer pagination fixe. */
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
/* En-têtes triables */
.c2dlg-th-sort { cursor: pointer; user-select: none; }
.c2dlg-th-sort:hover { background: #eef2f7; }
.c2dlg-th-inner { display: inline-flex; align-items: center; gap: 5px; }
.c2dlg-th-inner.end { justify-content: flex-end; }
.c2dlg-sort-ic { font-size: 0.62rem; color: var(--p); }
.c2dlg-sort-ic.c2dlg-sort-none { color: #cbd5e1; }
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

/* Footer pagination — fixe */
.c2dlg-footer { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px; border-top: 1px solid var(--line); font-size: 0.78rem; font-weight: 700; color: var(--muted); flex-shrink: 0; background: #fcfdff; font-variant-numeric: tabular-nums; }
.c2dlg-pager { width: 26px; height: 24px; border: 1px solid var(--line); background: #fff; color: #475569; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.c2dlg-pager:hover:not(:disabled) { background: var(--p-soft); color: var(--p); border-color: #bfdbfe; }
.c2dlg-pager:disabled { opacity: .4; cursor: default; }
</style>
