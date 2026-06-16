<!--
  Composant PARTAGÉ — Dialog « Équivalences OEM » (détails du count OEM d'un master).
  Ouvert au clic sur le chip/badge « OEM / Count » de l'en-tête (détail C2 et ancien
  détail comparateur). Présentation pure : l'appel API (store.fetchOemEquivalenceCount)
  reste chez le PARENT, qui passe `details` + `total` via props. Le tri (count desc)
  est une dérivation UI locale.

  Enveloppe charte C2 : header Deep Ocean texte blanc, max-height 88vh, table scroll interne.
-->
<template>
  <teleport to="body">
    <div v-if="visible" class="c2oem-backdrop" @click="close"></div>
    <div v-if="visible" class="c2oem-modal" role="dialog" aria-modal="true">
      <div class="c2oem-head">
        <div class="c2oem-title">
          <b>Équivalences OEM</b>
          <span v-if="master">{{ master }}</span>
        </div>
        <div class="c2oem-headright">
          <span class="c2oem-total">Total : {{ total ?? 0 }}</span>
          <button class="c2oem-close" @click="close"><i class="pi pi-times"></i></button>
        </div>
      </div>

      <div class="c2oem-body">
        <table class="c2oem-table">
          <thead><tr>
            <th class="left" style="width:70%">Référence Équivalente</th>
            <th class="num" style="width:30%">Count</th>
          </tr></thead>
          <tbody>
            <tr v-for="(d, i) in sorted" :key="i">
              <td class="left"><b>{{ d.reference || '—' }}</b></td>
              <td class="num">{{ d.count ?? 0 }}</td>
            </tr>
            <tr v-if="loading && !sorted.length"><td colspan="2" class="c2oem-empty"><i class="pi pi-spin pi-spinner"></i> Chargement…</td></tr>
            <tr v-else-if="!sorted.length"><td colspan="2" class="c2oem-empty"><i class="pi pi-inbox"></i> Aucun détail disponible</td></tr>
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
  master: { type: String, default: '' },          // réf master (sous-titre)
  total: { type: [Number, String], default: 0 },   // count total OEM
  details: { type: Array, default: () => [] },     // [{ reference, count }]
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible'])

const close = () => emit('update:visible', false)

// Tri count décroissant (dérivation UI pure)
const sorted = computed(() => [...(props.details || [])].sort((a, b) => (b.count || 0) - (a.count || 0)))
</script>

<style scoped>
/* Enveloppe charte C2 — teleport body (z 1200/1201), max-height 88vh, table scroll interne. */
.c2oem-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); backdrop-filter: blur(1px); z-index: 1200; }
.c2oem-modal {
  --p: var(--c2-select-accent); --ink: #0f172a; --muted: #64748b; --line: #e8edf3; --line-soft: #f1f5f9;
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(1280px, 98vw); max-width: 98vw; z-index: 1201;
  height: min(720px, 88vh); max-height: 88vh;   /* dimensions standard des dialogs partagés */
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .32);
  display: flex; flex-direction: column; overflow: hidden;
  font-family: var(--c2-font-sans);
}
/* Header Deep Ocean — texte blanc */
.c2oem-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: var(--c2-head-bg); color: #fff; flex-shrink: 0; }
.c2oem-title { display: flex; flex-direction: column; min-width: 0; }
.c2oem-title b { font-size: 1rem; font-weight: 800; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c2oem-title span { font-size: 0.8rem; color: #fff; opacity: .82; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.c2oem-headright { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.c2oem-total { background: rgba(255, 255, 255, .12); color: #fff; font-weight: 800; font-size: 0.82rem; padding: 3px 12px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .2); white-space: nowrap; font-variant-numeric: tabular-nums; }
.c2oem-close { border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #cbd5e1; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
.c2oem-close:hover { background: #155088; color: #fff; }

/* Corps = SEULE zone scrollable */
.c2oem-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.c2oem-table { table-layout: fixed; width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.c2oem-table th, .c2oem-table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c2oem-table th { position: sticky; top: 0; z-index: 1; background: #f8fafc; color: #475569; text-transform: uppercase; font-weight: 700; font-size: 12.5px; letter-spacing: .02em; text-align: right; padding: 10px 12px; border-bottom: 1.5px solid var(--line); }
.c2oem-table th.left { text-align: left; }
.c2oem-table th.num { text-align: right; }
.c2oem-table td { padding: 9px 12px; font-size: 14px; color: #334155; text-align: right; border-bottom: 1px solid var(--line-soft); }
.c2oem-table td.left { text-align: left; }
.c2oem-table td.num { text-align: right; font-weight: 700; color: var(--p); }
.c2oem-table td b { font-weight: 800; color: var(--ink); }
.c2oem-table tbody tr:nth-child(even) { background: #fcfdfe; }
.c2oem-table tbody tr:hover { background: #f5f9ff; }
.c2oem-empty { text-align: center !important; padding: 22px !important; color: #94a3b8; font-style: italic; }
.c2oem-empty i { font-size: 1.1rem; margin-right: 6px; }
.c2oem-body::-webkit-scrollbar { width: 8px; }
.c2oem-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.c2oem-body::-webkit-scrollbar-track { background: transparent; }
</style>
