<!--
  Dialog détail article — page « Gestion Articles » (consultation V1).
  Présentationnel : reçoit l'article + les URLs d'image (TecDoc/BC) déjà résolues par le parent.
  Aucune action update/delete photo en V1 (préparation pour une étape ultérieure).
  Charte C2 : header Deep Ocean (texte blanc), teleport body, hauteur fixe, scroll interne.
-->
<template>
  <teleport to="body">
    <div v-if="visible" class="am-backdrop" @click="close"></div>
    <div v-if="visible" class="am-modal" role="dialog" aria-modal="true">
      <!-- Header -->
      <div class="am-head">
        <div class="am-title"><b>{{ headerLine }}</b></div>
        <button class="am-close" @click="close" aria-label="Fermer"><i class="pi pi-times"></i></button>
      </div>

      <div class="am-scroll">
        <!-- Zone haute : image (D) + Général (A) -->
        <div class="am-top">
          <!-- D. Images / Références externes -->
          <div class="am-media">
            <div class="am-img">
              <div v-if="imageLoading" class="am-imgload"><i class="pi pi-spin pi-spinner"></i></div>
              <img v-else-if="displayImageUrl" :src="displayImageUrl" :alt="article?.itemNo" />
              <div v-else class="am-noimg"><i class="pi pi-image"></i></div>
            </div>
            <div class="am-imgnote"><i class="pi pi-info-circle"></i> La gestion des photos sera disponible dans une prochaine étape.</div>
          </div>

          <!-- A. Général -->
          <section class="am-sec am-grow">
            <h3 class="am-sectitle">Général</h3>
            <div class="am-grid">
              <div class="am-field"><span>Référence</span><b>{{ val(article?.itemNo) }}</b></div>
              <div class="am-field"><span>Master / origine</span><b>{{ val(article?.masterReference) }}</b></div>
              <div class="am-field am-wide"><span>Description</span><b>{{ val(article?.description) }}</b></div>
              <div class="am-field am-wide"><span>Description structurée</span><b>{{ val(article?.descriptionStructured) }}</b></div>
              <div class="am-field"><span>Groupe</span><b>{{ val(article?.groupName) }}</b></div>
              <div class="am-field"><span>Sous-groupe</span><b>{{ val(article?.subGroupName) }}</b></div>
              <div class="am-field"><span>Code groupe</span><b>{{ val(article?.groupCode) }}</b></div>
              <div class="am-field"><span>Code sous-groupe</span><b>{{ val(article?.subGroupCode) }}</b></div>
              <div class="am-field"><span>Code fabricant</span><b>{{ val(article?.manufacturerCode) }}</b></div>
              <div class="am-field"><span>Fabricant</span><b>{{ val(article?.manufacturerName) }}</b></div>
              <div class="am-field"><span>N° fournisseur</span><b>{{ val(article?.vendorNo) }}</b></div>
            </div>
          </section>
        </div>

        <!-- B. Stock & Vente + C. Achat -->
        <div class="am-cols">
          <section class="am-sec">
            <h3 class="am-sectitle">Stock &amp; Vente</h3>
            <div class="am-grid">
              <div class="am-field"><span>Stock</span><b>{{ num(article?.inventory, 0) }}</b></div>
              <div class="am-field"><span>Prix unitaire</span><b>{{ num(article?.unitPrice, 3) }}</b></div>
              <div class="am-field"><span>Total vente</span><b>{{ num(article?.totalSales, 3) }}</b></div>
              <div class="am-field"><span>Count OEM</span><b>{{ article?.oemCount ?? 0 }}</b></div>
            </div>
          </section>

          <section class="am-sec">
            <h3 class="am-sectitle">Achat</h3>
            <div class="am-grid">
              <div class="am-field"><span>Qté import</span><b>{{ num(article?.qtyImport, 0) }}</b></div>
              <div class="am-field"><span>Coût unitaire</span><b>{{ num(article?.unitCost, 3) }}</b></div>
              <div class="am-field"><span>Dernier achat</span>
                <b v-if="extraLoading" class="am-skel">&nbsp;</b>
                <b v-else>{{ date(lastPurchaseDate) }}</b>
              </div>
              <div class="am-field"><span>N° fournisseur</span><b>{{ val(article?.vendorNo) }}</b></div>
              <div class="am-field"><span>Vendor item no</span><b>{{ val(article?.vendorItemNo) }}</b></div>
            </div>
          </section>
        </div>

        <!-- E. Informations complémentaires -->
        <section class="am-sec">
          <h3 class="am-sectitle">Informations complémentaires</h3>
          <div class="am-grid">
            <div class="am-field"><span>Make code</span><b>{{ val(article?.makeCode) }}</b></div>
            <div class="am-field"><span>TecDoc id fabricant</span><b>{{ val(article?.tecdocIdFabricant) }}</b></div>
            <div class="am-field"><span>Vendor item no</span><b>{{ val(article?.vendorItemNo) }}</b></div>
          </div>
        </section>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  article: { type: Object, default: null },
  tecdocImageUrl: { type: String, default: null }, // priorité TecDoc
  bcPictureUrl: { type: String, default: null },    // fallback Business Central (blob géré par le parent)
  imageLoading: { type: Boolean, default: false },
  lastPurchaseDate: { type: String, default: null }, // chargé à l'ouverture (endpoint extra)
  extraLoading: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible'])

const close = () => emit('update:visible', false)

const displayImageUrl = computed(() => props.tecdocImageUrl || props.bcPictureUrl || null)

const headerLine = computed(() => {
  const r = props.article?.itemNo || ''
  const d = props.article?.descriptionStructured || props.article?.description
  return d ? `${r} · ${d}` : (r || 'Article')
})

const val = (v) => (v === null || v === undefined || v === '') ? '—' : v
const num = (v, decimals = 2) => {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—'
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v))
}
const date = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.am-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); backdrop-filter: blur(1px); z-index: 1200; }
.am-modal {
  --ink: #0f172a; --muted: #64748b; --line: #e8edf3; --line-soft: #f1f5f9;
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(900px, 94vw); height: min(680px, 88vh); z-index: 1201;
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .32);
  display: flex; flex-direction: column; overflow: hidden;
}
.am-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: var(--c2-head-bg); color: #fff; flex-shrink: 0; }
.am-title { min-width: 0; }
.am-title b { font-family: var(--c2-font-sans); font-size: 1rem; font-weight: 800; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.am-close { border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #cbd5e1; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
.am-close:hover { background: #155088; color: #fff; }

.am-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 16px; }

.am-top { display: flex; gap: 18px; }
.am-media { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; }
.am-img { width: 100%; height: 200px; border: 1px solid var(--line); border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fcfdff; overflow: hidden; }
.am-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
.am-noimg { color: #cbd5e1; font-size: 2.4rem; }
.am-imgload { color: var(--c2-primary, #1859B3); font-size: 1.6rem; }
.am-imgnote { font-size: 0.7rem; color: var(--muted); display: flex; align-items: center; gap: 5px; line-height: 1.3; }
.am-imgnote i { color: var(--c2-primary, #1859B3); }

.am-grow { flex: 1; min-width: 0; }
.am-cols { display: flex; gap: 16px; flex-wrap: wrap; }
.am-cols .am-sec { flex: 1 1 0; min-width: 240px; }

.am-sec { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
.am-sectitle { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--c2-primary, #1859B3); margin: 0 0 10px; }
.am-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
.am-field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.am-field.am-wide { grid-column: 1 / -1; }
.am-field span { font-size: 0.64rem; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); font-weight: 700; }
.am-field b { font-size: 0.84rem; color: var(--ink); font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; word-break: break-word; }
.am-skel { display: inline-block; width: 72px; height: 12px; border-radius: 4px; background: linear-gradient(90deg, #eef2f7, #f8fafc, #eef2f7); background-size: 200% 100%; animation: am-shimmer 1.2s infinite; }
@keyframes am-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 720px) {
  .am-top { flex-direction: column; }
  .am-media { width: 100%; }
}
</style>
