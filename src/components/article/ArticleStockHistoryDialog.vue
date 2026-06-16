<!--
  Composant PARTAGÉ — Dialog « Historique / détail stock par SOCIÉTÉ ».
  Ouvert au clic sur une cellule de stock société (bande STOCKS du détail C2).
  Affiche les écritures item-ledger filtrées par société, pour l'article sélectionné.

  Conçu pour être réutilisé sur d'autres pages : NE recréez PAS un dialog local,
  consommez ce composant.

  Présentation pure : la logique métier (appel API item-ledger, pagination,
  changement d'année, scroll infini) reste chez le PARENT, qui passe les données
  via props et réagit aux emits (update:visible / change-year / scroll).

  Header Deep Ocean + texte BLANC (charte C2, identique au dialog Info Article partagé).
-->
<template>
  <teleport to="body">
    <div v-if="visible" class="ash-backdrop" @click="close"></div>
    <div v-if="visible" class="ash-modal" role="dialog" aria-modal="true">
      <!-- Header Deep Ocean — texte blanc -->
      <div class="ash-head">
        <div class="ash-title">
          <span class="ash-badge">{{ company }}</span>
          <span class="ash-ref">{{ formatReference(reference) }}</span>
          <span class="ash-sep" v-if="description">-</span>
          <span class="ash-desc">{{ description }}</span>
        </div>
        <div class="ash-headright">
          <span class="ash-year">
            <button class="ash-year-nav" @click="emit('change-year', -1)" title="Année précédente"><i class="pi pi-chevron-left"></i></button>
            <span class="ash-year-val">{{ year }}</span>
            <button class="ash-year-nav" @click="emit('change-year', 1)" title="Année suivante"><i class="pi pi-chevron-right"></i></button>
          </span>
          <button class="ash-close" @click="close"><i class="pi pi-times"></i></button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="ash-kpis">
        <span class="kpi"><i>Stock</i><b>{{ kpis.stock }}</b></span>
        <span class="kpi"><i>Achat</i><b class="pos">{{ kpis.achat }}</b></span>
        <span class="kpi"><i>Vente</i><b class="pos">{{ Math.abs(Number(kpis.vente) || 0) }}</b></span>
        <span class="kpi"><i>Rupt</i><b class="neg">{{ kpis.rupt }}</b></span>
      </div>

      <!-- Tableau écritures (scroll interne + scroll infini via emit) -->
      <div class="ash-table" @scroll="emit('scroll', $event)">
        <table class="ash-histtable">
          <thead><tr>
            <th style="width:7%">Date</th><th style="width:4%">T</th>
            <th class="left" style="width:13%">Type Doc</th><th class="left" style="width:14%">N° Doc</th>
            <th class="left" style="width:11%">Client / Frs</th><th class="left" style="width:22%">Nom</th>
            <th class="num" style="width:5%">Qté</th><th class="left" style="width:13%">Magasin</th><th class="num" style="width:11%">PU</th>
          </tr></thead>
          <tbody>
            <tr v-for="(h, i) in entries" :key="i">
              <td class="mono">{{ formatDate(h.postingDate) }}</td>
              <td><span class="ash-typ" :class="histTypeClass(h.entryType)" :title="h.entryType">{{ histTypeLetter(h.entryType) }}</span></td>
              <td class="left muted" :title="h.documentType">{{ h.documentType || '—' }}</td>
              <td class="left mono muted" :title="h.documentNo">{{ h.documentNo || '—' }}</td>
              <td class="left mono" :title="h.sourceNo">{{ h.sourceNo || '—' }}</td>
              <td class="left" :title="h.sourceName">{{ h.sourceName || '—' }}</td>
              <td class="num mono" :class="{ neg: Number(h.quantity) < 0 }">{{ h.quantity }}</td>
              <td class="left muted" :title="h.locationCode">{{ h.locationCode || '—' }}</td>
              <td class="num mono">{{ formatNumber(calculatePU(h), 3) }}</td>
            </tr>
            <tr v-if="loading && !entries.length"><td colspan="9" class="ash-empty"><i class="pi pi-spin pi-spinner"></i> Chargement…</td></tr>
            <tr v-else-if="!entries.length"><td colspan="9" class="ash-empty"><i class="pi pi-inbox"></i> Aucun mouvement</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </teleport>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  company: { type: String, default: '' },
  reference: { type: String, default: '' },        // n° article (brut) — formaté dans le composant
  description: { type: String, default: '' },
  year: { type: [Number, String], default: '' },
  kpis: { type: Object, default: () => ({ stock: 0, achat: 0, vente: 0, rupt: 0 }) },
  entries: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'change-year', 'scroll'])

const close = () => emit('update:visible', false)

/* ── Helpers de présentation (copie fidèle du parent C2) ── */
const formatReference = (refVal) => (refVal ? String(refVal).replace(/MASTER/gi, '').trim() : '')
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
const histTypeLetter = (t) => ({ Purchase: 'A', Sale: 'V', Rupture: 'R', Transfer: 'T' }[t] || (t ? t[0] : ''))
const histTypeClass = (t) => ({ Purchase: 'Achat', Sale: 'Vente', Rupture: 'Rupture', Transfer: 'Transfert' }[t] || 'Transfert')
const calculatePU = (entry) => {
  if (!entry) return 0
  const qty = Math.abs(Number(entry.quantity)) || 1
  if (entry.entryType === 'Sale') return ((entry.salesAmountActual ?? entry.salesAmountExpected ?? 0)) / qty
  if (entry.entryType === 'Purchase') return ((entry.costAmountActual ?? entry.costAmountExpected ?? 0)) / qty
  return 0
}
</script>

<style scoped>
/* Chrome / structure — charte C2 (palette officielle, tokens c2-charter.css). Teleport body → z 1200/1201. */
.ash-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); backdrop-filter: blur(1px); z-index: 1200; }
.ash-modal {
  --p: var(--c2-select-accent); --ink: #0f172a; --muted: #64748b;
  --line: #e8edf3; --line-soft: #f1f5f9; --ok: #16a34a; --bad: #dc2626;
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(1280px, 98vw); max-width: 98vw; z-index: 1201;
  /* Hauteur FIXE/stable : IDENTIQUE quel que soit le nombre de lignes (peu, beaucoup ou aucune).
     `min/max-height` seuls ne suffisent pas → le navigateur ajuste au contenu entre les bornes.
     Hauteur réelle figée ici ; seule la zone table scrolle. `max-height: 88vh` = garde-fou viewport. */
  height: min(720px, 88vh); max-height: 88vh;
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .32);
  display: flex; flex-direction: column; overflow: hidden;
  font-family: var(--c2-font-sans);
}

/* Header Deep Ocean — TEXTE BLANC (charte) */
.ash-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: var(--c2-head-bg); color: #fff; flex-shrink: 0; }
.ash-title { display: flex; flex-direction: row; align-items: center; gap: 8px; min-width: 0; }
.ash-badge { flex-shrink: 0; background: rgba(130, 201, 229, .22); color: #fff; border: 1px solid rgba(130, 201, 229, .5); font-weight: 700; font-size: 0.78rem; padding: 3px 11px; border-radius: 999px; white-space: nowrap; letter-spacing: .02em; }
.ash-ref { flex-shrink: 0; font-weight: 800; font-size: 0.95rem; color: #fff; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ash-sep { flex-shrink: 0; color: rgba(255, 255, 255, .55); }
.ash-desc { min-width: 0; font-size: 0.85rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ash-headright { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
/* Sélecteur d'année — segmenté ‹ AAAA › sur navy, boutons à zone cliquable claire + hover */
.ash-year { display: inline-flex; align-items: center; gap: 2px; background: rgba(255, 255, 255, .1); border: 1px solid rgba(255, 255, 255, .16); border-radius: 8px; padding: 2px; }
.ash-year-nav { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: transparent; color: #cbd5e1; border-radius: 6px; cursor: pointer; transition: background .15s ease, color .15s ease; }
.ash-year-nav:hover { background: rgba(255, 255, 255, .16); color: #fff; }
.ash-year-nav:active { background: rgba(255, 255, 255, .24); }
.ash-year-nav i { font-size: 0.7rem; }
.ash-year-val { min-width: 46px; text-align: center; font-weight: 800; font-size: 0.82rem; color: #fff; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.ash-close { border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #cbd5e1; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
.ash-close:hover { background: #155088; color: #fff; }

/* KPIs */
.ash-kpis { display: flex; border-bottom: 1px solid var(--line); background: #fcfdff; flex-shrink: 0; }
.ash-kpis .kpi { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 9px 0; border-right: 1px solid var(--line-soft); }
.ash-kpis .kpi:last-child { border-right: none; }
.ash-kpis .kpi i { font-style: normal; font-size: 0.68rem; text-transform: uppercase; color: var(--muted); letter-spacing: .03em; }
.ash-kpis .kpi b { font-size: 1.1rem; color: var(--ink); font-variant-numeric: tabular-nums; }
.ash-kpis .kpi b.pos { color: var(--ok); }
.ash-kpis .kpi b.neg { color: var(--bad); }

/* Table écritures — SEULE zone scrollable (flex:1) → le scroll reste interne à la table,
   pas au dialog. C'est ce conteneur qui émet @scroll (scroll infini). */
.ash-table { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: auto; }
.ash-histtable { table-layout: fixed; width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.ash-histtable th, .ash-histtable td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ash-histtable th {
  position: sticky; top: 0; z-index: 1;
  background: #f8fafc; color: #475569; text-transform: uppercase; font-weight: 700;
  font-size: 12.5px; letter-spacing: .02em; text-align: right; padding: 10px 8px;
  border-bottom: 1.5px solid var(--line); border-right: 1px solid var(--line-soft);
}
.ash-histtable th:last-child { border-right: none; }
.ash-histtable th.left { text-align: left; }
.ash-histtable th.num { text-align: right; }
.ash-histtable td { padding: 8px 8px; font-size: 14px; color: #334155; text-align: right; border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft); }
.ash-histtable td:last-child { border-right: none; }
.ash-histtable td.left { text-align: left; }
.ash-histtable td.num { text-align: right; }
.ash-histtable tbody tr:nth-child(even) { background: #fcfdfe; }
.ash-histtable td.mono { font-variant-numeric: tabular-nums; font-weight: 650; color: var(--ink); }
.ash-histtable td.muted { color: #94a3b8; }
.ash-histtable td.mono.muted { color: var(--muted); font-weight: 500; }
.ash-histtable td.neg { color: var(--bad); }

/* Badge Type (Achat/Vente/Rupture/Transfert) */
.ash-typ { display: inline-block; width: 19px; height: 19px; line-height: 19px; text-align: center; border-radius: 5px; font-weight: 800; font-size: 0.64rem; }
.ash-typ.Achat { background: #dbeafe; color: #1e40af; }
.ash-typ.Vente { background: #dcfce7; color: #166534; }
.ash-typ.Rupture { background: #fee2e2; color: #b91c1c; }
.ash-typ.Transfert { background: #ffedd5; color: #c2410c; }

.ash-empty { text-align: center !important; padding: 22px !important; color: #94a3b8; font-style: italic; }
.ash-empty i { font-size: 1.1rem; margin-right: 6px; }

/* Scrollbar discrète */
.ash-table::-webkit-scrollbar { width: 8px; height: 8px; }
.ash-table::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.ash-table::-webkit-scrollbar-track { background: transparent; }
</style>
