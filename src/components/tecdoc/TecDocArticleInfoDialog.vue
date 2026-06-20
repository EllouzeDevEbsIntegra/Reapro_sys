<!--
  Composant PARTAGÉ — Dialog « Informations Article » TecDoc.
  Référence visuelle = dialog finalisé dans B2B. Consommé par B2B et Confirmation Achat C2
  (et toute future page). Ne recréez PAS un dialog local : consommez ce composant.

  Données : props.item (forme souple — lit plusieurs noms de champs B2B/C2 en fallback).
  Logique métier (API véhicules) : reste chez le parent via @load-vehicle-models.
-->
<template>
  <teleport to="body">
    <div v-if="visible" class="c2-info-backdrop" @click="close"></div>
    <div v-if="visible" class="c2-info-modal" role="dialog" aria-modal="true">
      <!-- Header Deep Ocean + logo TecAlliance + fermer -->
      <div class="c2-info-head">
        <div class="c2-info-title"><b>{{ headerLine }}</b></div>
        <div class="c2-info-headright">
          <img src="/images/articles/tecalliance_partner.png" alt="TecAlliance" class="c2-info-partner" />
          <button class="c2-info-close" @click="close"><i class="pi pi-times"></i></button>
        </div>
      </div>

      <div v-if="loading" class="c2-info-loading"><i class="pi pi-spin pi-spinner"></i> Chargement des informations article…</div>
      <div v-else class="c2-info-scroll">
        <!-- ZONE HAUTE : galerie images | identité + chips + specs -->
        <div class="c2-info-top">
          <div class="c2-info-media">
            <div class="c2-info-mainimg" :class="{ is360: is360 }" @mousemove="is360 ? on360Move($event) : null">
              <!-- Priorité TecDoc : 360° puis vignettes -->
              <img v-if="is360 && item?.images360?.length" :src="item.images360[frame360]" alt="Vue 360°" />
              <img v-else-if="item?.thumbnails?.length" :src="item.thumbnails[currentImageIndex]" :alt="item?.no" />
              <!-- Fallback Business Central (aperçu local prioritaire) -->
              <img v-else-if="fallbackPictureUrl" :src="fallbackPictureUrl" :alt="item?.no" />
              <!-- Chargement de la photo BC (optionnel, ne bloque pas le reste du dialog) -->
              <div v-else-if="bcPictureLoading" class="c2-info-bcload"><i class="pi pi-spin pi-spinner"></i></div>
              <!-- Aucune image -->
              <div v-else class="c2-info-noimg"><i class="pi pi-image"></i></div>
              <button v-if="item?.images360?.length" class="c2-info-360btn" :class="{ on: is360 }" @click.stop="is360 = !is360" :title="is360 ? 'Retour aux photos' : 'Vue 360°'"><i class="pi" :class="is360 ? 'pi-images' : 'pi-sync'"></i></button>
              <button v-if="!is360 && item?.thumbnails?.length > 1" class="c2-info-navbtn prev" @click.stop="prevImage" title="Photo précédente"><i class="pi pi-chevron-left"></i></button>
              <button v-if="!is360 && item?.thumbnails?.length > 1" class="c2-info-navbtn next" @click.stop="nextImage" title="Photo suivante"><i class="pi pi-chevron-right"></i></button>
            </div>
            <div class="c2-info-thumbs" ref="thumbsRef" v-if="!is360 && item?.thumbnails?.length > 1">
              <img v-for="(t, ti) in item.thumbnails" :key="ti" :src="t" :class="{ on: ti === currentImageIndex }" @click="currentImageIndex = ti" />
            </div>
            <div v-if="is360" class="c2-info-360hint"><i class="pi pi-arrows-h"></i> Déplacez la souris pour pivoter</div>
            <!-- Gestion photo (ajout/modif/suppression) RETIRÉE de l'Info Article :
                 sera gérée dans la future page « Gestion Articles ». Ici l'image est en lecture seule
                 (TecDoc en priorité, sinon fallback photo Business Central). -->
          </div>

          <div class="c2-info-ident">
            <div class="c2-info-brand">
              <img v-if="item?.brandLogo" :src="item.brandLogo" class="c2-info-brandlogo" :alt="item?.brand" />
              <div class="c2-info-brandtxt">
                <div class="c2-info-brandref">N° de référence : <b>{{ bodyRef }}</b>
                  <i v-if="isMaster" class="pi pi-bookmark-fill product-flag" title="Référence Master"></i>
                </div>
                <div class="c2-info-branddesc">{{ brandDesc }}</div>
              </div>
              <div class="c2-info-brandkpis">
                <span class="c2-info-kpi"><i>Stock</i><b>{{ formatNumber(stock, 0) }}</b></span>
                <span class="c2-info-kpi"><i>Prix</i><b>{{ price != null ? formatNumber(price, 3) : '—' }}</b></span>
              </div>
            </div>

            <!-- Chips Fournisseur / GTIN (données C2) — masqués si non fournis (B2B identique) -->
            <div class="c2-info-meta" v-if="showSupplierGtin && (item?.vendor || item?.gtins?.length)">
              <span v-if="item?.vendor"><i>Fournisseur</i><b>{{ item.vendor }}</b></span>
              <span v-if="item?.gtins?.length"><i>GTIN</i><b>{{ item.gtins.join(', ') }}</b></span>
            </div>

            <div class="c2-info-specsbox">
              <div class="c2-info-sectitle">Caractéristiques techniques</div>
              <div v-if="item?.specs?.length" class="c2-info-specs">
                <div v-for="(s, si) in item.specs" :key="si" class="c2-info-spec"><span>{{ s.label }}</span><b>{{ s.value }}</b></div>
              </div>
              <div v-else class="c2-info-nodata">Aucune spécification technique disponible.</div>
            </div>
          </div>
        </div>

        <!-- SECTIONS COLLAPSIBLES -->
        <div class="c2-info-sections">
          <!-- Numéros OEM -->
          <div class="c2-info-acc" v-if="groupedOemNumbers.length">
            <div class="c2-info-acchead" @click="oemOpen = !oemOpen">
              <span><i class="pi pi-list"></i> Numéros OEM</span>
              <i class="pi" :class="oemOpen ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </div>
            <div class="c2-info-accbody" v-if="oemOpen">
              <div v-for="(group, gi) in groupedOemNumbers" :key="gi" class="c2-info-oemgroup">
                <div class="c2-info-oembrand" @click="toggleOemBrand(group.brand)">
                  <i class="pi" :class="expandedOemBrands.has(group.brand) ? 'pi-minus' : 'pi-plus'"></i>
                  <span class="c2-info-oembrandname">{{ group.brand }}</span>
                  <span class="c2-info-oemcount">{{ group.numbers.length }}</span>
                </div>
                <div v-if="expandedOemBrands.has(group.brand)" class="c2-info-oemlist">
                  <span v-for="(oem, oi) in group.numbers" :key="oi" class="c2-info-oemchip">{{ oem.articleNumber }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Documents PDF -->
          <div class="c2-info-acc" v-if="item?.pdfs?.length">
            <div class="c2-info-acchead" @click="pdfOpen = !pdfOpen">
              <span><i class="pi pi-file-pdf"></i> Documents PDF</span>
              <i class="pi" :class="pdfOpen ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </div>
            <div class="c2-info-accbody" v-if="pdfOpen">
              <a v-for="(pdf, pi) in item.pdfs" :key="pi" :href="pdf.url" target="_blank" rel="noopener noreferrer" class="c2-info-pdf">
                <i class="pi pi-file-pdf"></i><span>{{ pdf.fileName }}</span><i class="pi pi-external-link"></i>
              </a>
            </div>
          </div>

          <!-- Composants du Kit -->
          <div class="c2-info-acc" v-if="item?.articleParts?.length">
            <div class="c2-info-acchead" @click="kitOpen = !kitOpen">
              <span><i class="pi pi-briefcase"></i> Composants du Kit <span class="c2-info-acccount">{{ item.articleParts.length }}</span></span>
              <i class="pi" :class="kitOpen ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </div>
            <div class="c2-info-accbody" v-if="kitOpen">
              <table class="c2-info-kittable">
                <thead><tr><th class="left">Référence</th><th class="left">Désignation</th><th class="left">Fabricant</th><th>Qté</th></tr></thead>
                <tbody>
                  <tr v-for="(part, pi) in item.articleParts" :key="pi">
                    <td class="left"><b>{{ part.articleNo || part.articleNumber || '—' }}</b></td>
                    <td class="left">{{ part.articleName || '—' }}</td>
                    <td class="left muted">{{ part.brandName || '—' }}</td>
                    <td class="c2-info-kitqty">{{ part.quantity || 1 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Véhicules concernés -->
          <div class="c2-info-acc" v-if="item?.vehicles?.length">
            <div class="c2-info-acchead" @click="vehOpen = !vehOpen">
              <span><i class="pi pi-car"></i> Véhicules concernés <span class="c2-info-acccount">{{ item.vehicles.length }}</span></span>
              <i class="pi" :class="vehOpen ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </div>
            <div class="c2-info-accbody c2-info-vehbody" v-if="vehOpen">
              <div v-for="(group, gi) in item.vehicles" :key="gi" class="c2-info-vehgroup">
                <div class="c2-info-vehbrand" @click="toggleVehBrand(group)">
                  <i class="pi" :class="expandedVehBrands.has(group.brand) ? 'pi-minus' : 'pi-plus'"></i>
                  <span class="c2-info-vehbrandname">{{ group.brand }}</span>
                </div>
                <div v-if="expandedVehBrands.has(group.brand)" class="c2-info-vehmodels">
                  <div v-if="group.isLoading" class="c2-info-vehloading"><i class="pi pi-spin pi-spinner"></i> Chargement des modèles…</div>
                  <div v-else-if="!group.models || !group.models.length" class="c2-info-vehempty">Aucun modèle trouvé.</div>
                  <div v-else v-for="(m, mi) in group.models" :key="mi" class="c2-info-vehmodel"><i class="pi pi-angle-right"></i><span>{{ m }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isEmpty" class="c2-info-empty">
          <i class="pi pi-info-circle"></i> Données TecDoc indisponibles pour cette référence.
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  isMaster: { type: Boolean, default: false },        // flag « Référence Master » (B2B)
  showSupplierGtin: { type: Boolean, default: false }, // chips Fournisseur/GTIN (C2). B2B = false → identique
  bcPictureUrl: { type: String, default: null },       // photo Business Central (fallback) — blob URL fourni par le parent
  bcPictureLoading: { type: Boolean, default: false }, // chargement de la photo BC (optionnel)
  canManagePicture: { type: Boolean, default: false }  // droits modif/suppression photo (parent : authStore.isAdmin)
})
const emit = defineEmits(['update:visible', 'load-vehicle-models', 'update-photo', 'delete-photo'])

const close = () => emit('update:visible', false)

/* ── Photo BC : fallback + upload/suppression (présentationnel — API gérée par le parent) ── */
const fileInputRef = ref(null)
const selectedFile = ref(null)
const localPreviewUrl = ref(null)   // aperçu local du fichier choisi (avant upload)

const hasTecdocImage = computed(() => !!(props.item?.thumbnails?.length || props.item?.images360?.length))
const isPreviewing = computed(() => !!localPreviewUrl.value)
const fallbackPictureUrl = computed(() => localPreviewUrl.value || props.bcPictureUrl || null)

const clearPreview = () => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = null
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}
const pickFile = () => fileInputRef.value?.click()
const onFileChange = (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  clearPreview()
  selectedFile.value = f
  localPreviewUrl.value = URL.createObjectURL(f)
}
const cancelPreview = () => clearPreview()
const confirmUpload = () => {
  if (selectedFile.value) emit('update-photo', selectedFile.value)
  clearPreview()
}
const requestDelete = () => emit('delete-photo')

onUnmounted(clearPreview)

/* ── État UI interne (galerie / 360° / accordéons) ── */
const currentImageIndex = ref(0)
const is360 = ref(false)
const frame360 = ref(0)
const oemOpen = ref(false)
const pdfOpen = ref(false)
const kitOpen = ref(false)
const vehOpen = ref(false)
const expandedOemBrands = ref(new Set())
const expandedVehBrands = ref(new Set())
const thumbsRef = ref(null)

/* Réinitialise l'état à chaque ouverture (nouveau produit) */
watch(() => props.visible, (open) => {
  if (open) {
    currentImageIndex.value = 0
    is360.value = false
    frame360.value = 0
    oemOpen.value = false
    pdfOpen.value = false
    kitOpen.value = false
    vehOpen.value = false
    expandedOemBrands.value = new Set()
    expandedVehBrands.value = new Set()
    clearPreview()
  }
})

/* La vignette active reste visible dans le scroll horizontal */
watch(currentImageIndex, (i) => {
  const cont = thumbsRef.value
  const el = cont && cont.children ? cont.children[i] : null
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
})

/* ── Helpers (copie fidèle B2B) ── */
const formatReference = (refVal) => {
  if (!refVal) return ''
  return String(refVal).replace(/MASTER/gi, '').trim()
}
const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) return '—'
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

/* ── Données dérivées (lit B2B et C2 en fallback) ── */
const headerLine = computed(() => {
  const r = formatReference(props.item?.no || props.item?.articleNumber)
  const d = props.item?.descriptionStructuree || props.item?.descriptionStructured || props.item?.description
  return d ? `${r} · ${d}` : r
})
const bodyRef = computed(() => formatReference(props.item?.tecdocArticleNumber || props.item?.no))
const brandDesc = computed(() => props.item?.genericDescription || props.item?.descriptionStructured || props.item?.description || '—')
const stock = computed(() => props.item?.quantite ?? props.item?.qtyStock)
const price = computed(() => props.item?.unitPrice ?? props.item?.price ?? null)

const groupedOemNumbers = computed(() => {
  const oems = props.item?.oemNumbers || []
  if (!oems.length) return []
  const groups = {}
  oems.forEach(o => { const b = o.mfrName || 'Autre'; (groups[b] = groups[b] || []).push(o) })
  return Object.keys(groups).sort().map(brand => ({ brand, numbers: groups[brand] }))
})

const isEmpty = computed(() =>
  !props.item?.brand && !props.item?.specs?.length && !groupedOemNumbers.value.length && !props.item?.thumbnails?.length
)

/* ── Galerie ── */
const nextImage = () => {
  const t = props.item?.thumbnails
  if (!t?.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % t.length
}
const prevImage = () => {
  const t = props.item?.thumbnails
  if (!t?.length) return
  currentImageIndex.value = (currentImageIndex.value - 1 + t.length) % t.length
}
const on360Move = (event) => {
  const imgs = props.item?.images360 || []
  if (!imgs.length) return
  const rect = event.currentTarget.getBoundingClientRect()
  const idx = Math.floor(((event.clientX - rect.left) / rect.width) * imgs.length)
  frame360.value = Math.max(0, Math.min(idx, imgs.length - 1))
}

/* ── Accordéons OEM / Véhicules ── */
const toggleOemBrand = (brand) => {
  const s = new Set(expandedOemBrands.value)
  s.has(brand) ? s.delete(brand) : s.add(brand)
  expandedOemBrands.value = s
}
const toggleVehBrand = (group) => {
  const open = expandedVehBrands.value.has(group.brand)
  const s = new Set()                       // accordéon : une seule marque ouverte
  if (!open) {
    s.add(group.brand)
    if (!group.models || !group.models.length) emit('load-vehicle-models', group)
  }
  expandedVehBrands.value = s
}
</script>

<style scoped>
/* Chrome / structure du dialog — référence visuelle B2B (palette officielle Reapro/C2). */
.c2-info-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); backdrop-filter: blur(1px); z-index: 1200; }
.c2-info-modal {
  --p: var(--c2-select-accent); --p-soft: #eff6ff; --ink: #0f172a; --muted: #64748b; --line: #e8edf3; --line-soft: #f1f5f9;
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(880px, 94vw); max-height: 88vh; z-index: 1201;
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .32);
  display: flex; flex-direction: column; overflow: hidden;
}
.c2-info-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; background: var(--c2-head-bg); color: #fff; flex-shrink: 0; }
.c2-info-title { display: flex; flex-direction: column; min-width: 0; }
.c2-info-title b { font-family: var(--c2-font-sans); font-size: 1rem; font-weight: 800; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.c2-info-headright { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.c2-info-partner { height: 52px; max-width: 220px; width: auto; display: block; object-fit: contain; filter: brightness(0) invert(1); opacity: .95; }
.c2-info-close { border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #cbd5e1; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
.c2-info-close:hover { background: #155088; color: #fff; }
.c2-info-loading { padding: 40px; text-align: center; color: var(--muted); font-weight: 600; }
.c2-info-loading i { margin-right: 8px; color: var(--p); }
.c2-info-scroll { overflow-y: auto; padding: 16px 18px; }
.c2-info-top { display: flex; gap: 18px; }
.c2-info-media { width: 300px; flex-shrink: 0; }
.c2-info-mainimg { position: relative; width: 100%; height: 230px; border: 1px solid var(--line); border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fcfdff; overflow: hidden; }
.c2-info-mainimg img { max-width: 100%; max-height: 100%; object-fit: contain; }
.c2-info-mainimg.is360 { cursor: ew-resize; }
.c2-info-noimg { color: #cbd5e1; font-size: 2.4rem; }
.c2-info-bcload { color: var(--p); font-size: 1.6rem; }
/* Barre de gestion photo BC (fallback) — boutons sobres, charte §10 */
.c2-info-photoacts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.c2-info-fileinput { display: none; }
.c2-info-pbtn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid var(--line); background: #fff; color: #475569; transition: background .15s ease, color .15s ease, border-color .15s ease; }
.c2-info-pbtn i { font-size: 0.82rem; }
.c2-info-pbtn:focus-visible { outline: 2px solid var(--c2-focus, #82C9E5); outline-offset: 2px; }
.c2-info-pbtn.primary { background: var(--c2-primary, var(--p)); border-color: var(--c2-primary, var(--p)); color: #fff; }
.c2-info-pbtn.primary:hover { background: var(--c2-primary-hover, #12468f); }
.c2-info-pbtn.ghost:hover { background: var(--line-soft); color: var(--ink); }
.c2-info-pbtn.danger { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.c2-info-pbtn.danger:hover { background: #fee2e2; }
.c2-info-360btn { position: absolute; bottom: 8px; right: 8px; width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: #fff; color: var(--p); cursor: pointer; box-shadow: 0 2px 6px rgba(16, 24, 40, .12); }
.c2-info-360btn.on { background: var(--p); color: #fff; border-color: var(--p); }
.c2-info-360hint { margin-top: 8px; font-size: 0.72rem; color: var(--muted); text-align: center; }
.c2-info-thumbs { display: flex; flex-wrap: nowrap; gap: 6px; margin-top: 10px; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x proximity; }
.c2-info-thumbs::-webkit-scrollbar { height: 6px; }
.c2-info-thumbs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.c2-info-thumbs::-webkit-scrollbar-track { background: transparent; }
.c2-info-thumbs img { flex: 0 0 calc((100% - 18px) / 4); box-sizing: border-box; height: 62px; object-fit: contain; border: 1px solid var(--line); border-radius: 8px; padding: 3px; background: #fff; cursor: pointer; scroll-snap-align: start; }
.c2-info-thumbs img.on { border-color: var(--p); box-shadow: 0 0 0 2px rgba(24, 89, 179, .15); }
.c2-info-navbtn { position: absolute; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); background: rgba(255, 255, 255, .92); color: var(--ink); cursor: pointer; box-shadow: 0 2px 6px rgba(16, 24, 40, .15); display: inline-flex; align-items: center; justify-content: center; z-index: 2; transition: background .15s ease, color .15s ease; }
.c2-info-navbtn:hover { background: #fff; color: var(--p); }
.c2-info-navbtn.prev { left: 8px; }
.c2-info-navbtn.next { right: 8px; }
.c2-info-ident { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.c2-info-brand { display: flex; gap: 12px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.c2-info-brandlogo { height: 38px; max-width: 120px; object-fit: contain; }
.c2-info-brandtxt { min-width: 0; flex: 1; }
.c2-info-brandkpis { display: flex; flex-direction: column; gap: 5px; margin-left: auto; flex-shrink: 0; }
.c2-info-kpi { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; min-width: 98px; background: var(--p-soft); border: 1px solid #dbeafe; border-radius: 7px; padding: 3px 9px; }
.c2-info-kpi i { font-style: normal; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--p); }
.c2-info-kpi b { font-size: 0.82rem; color: var(--ink); font-variant-numeric: tabular-nums; }
.c2-info-brandref { font-size: 0.78rem; color: var(--muted); }
.c2-info-brandref b { color: var(--ink); font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; }
.c2-info-branddesc { font-size: 0.95rem; font-weight: 800; color: var(--ink); margin: 2px 0; }
.c2-info-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.c2-info-meta span { display: flex; flex-direction: column; background: #f8fafc; border: 1px solid var(--line); border-radius: 9px; padding: 6px 10px; min-width: 68px; }
.c2-info-meta i { font-style: normal; font-size: 0.64rem; text-transform: uppercase; color: var(--muted); font-weight: 700; }
.c2-info-meta b { font-size: 0.88rem; color: var(--ink); font-variant-numeric: tabular-nums; }
.c2-info-specsbox { margin-top: 6px; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }
.c2-info-sectitle { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--p); margin-bottom: 8px; flex-shrink: 0; }
.c2-info-specs { display: flex; flex-direction: column; flex: 1 1 0; min-height: 0; overflow-y: auto; border: 1px solid var(--line-soft); border-radius: 8px; padding: 2px 10px; }
.c2-info-spec { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 0.8rem; padding: 5px 0; border-bottom: 1px dashed var(--line-soft); }
.c2-info-spec:last-child { border-bottom: none; }
.c2-info-spec span { color: var(--muted); flex: 1; min-width: 0; }
.c2-info-spec b { color: var(--ink); text-align: right; flex-shrink: 0; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c2-info-nodata { font-size: 0.82rem; color: var(--muted); font-style: italic; }
.c2-info-sections { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.c2-info-acc { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.c2-info-acchead { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; cursor: pointer; font-weight: 800; font-size: 0.8rem; color: var(--ink); }
.c2-info-acchead span { display: inline-flex; align-items: center; gap: 8px; }
.c2-info-acchead span > i { color: var(--p); }
.c2-info-acccount { background: var(--p-soft); color: var(--p); font-weight: 800; font-size: 0.64rem; padding: 1px 7px; border-radius: 9999px; margin-left: 6px; }
.c2-info-accbody { padding: 8px 12px; }
.c2-info-oemgroup { border-bottom: 1px solid var(--line-soft); }
.c2-info-oemgroup:last-child { border-bottom: none; }
.c2-info-oembrand { display: flex; align-items: center; gap: 8px; padding: 7px 0; cursor: pointer; }
.c2-info-oembrand > i { color: var(--p); font-size: 0.72rem; }
.c2-info-oembrandname { font-weight: 700; font-size: 0.82rem; color: var(--ink); flex: 1; }
.c2-info-oemcount { background: var(--p-soft); color: var(--p); font-weight: 800; font-size: 0.66rem; padding: 1px 8px; border-radius: 9999px; }
.c2-info-oemlist { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 0 10px 22px; }
.c2-info-oemchip { font-size: 0.74rem; font-weight: 700; color: #334155; background: #f1f5f9; border: 1px solid var(--line); border-radius: 7px; padding: 3px 8px; font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; }
.c2-info-pdf { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 8px; color: var(--p); font-size: 0.82rem; font-weight: 600; text-decoration: none; }
.c2-info-pdf:hover { background: var(--p-soft); }
.c2-info-pdf span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c2-info-kittable { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.c2-info-kittable th { text-align: right; font-size: 0.66rem; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); font-weight: 700; padding: 6px 8px; border-bottom: 1.5px solid var(--line); }
.c2-info-kittable th.left { text-align: left; }
.c2-info-kittable td { padding: 6px 8px; border-bottom: 1px solid var(--line-soft); color: #334155; }
.c2-info-kittable td.left { text-align: left; }
.c2-info-kittable td.muted { color: var(--muted); }
.c2-info-kittable td b { color: var(--ink); font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; }
.c2-info-kitqty { text-align: center; font-weight: 700; color: var(--ink); }
.c2-info-vehbody { max-height: 280px; overflow-y: auto; }
.c2-info-vehgroup { border-bottom: 1px solid var(--line-soft); }
.c2-info-vehgroup:last-child { border-bottom: none; }
.c2-info-vehbrand { display: flex; align-items: center; gap: 8px; padding: 7px 0; cursor: pointer; }
.c2-info-vehbrand > i { color: var(--p); font-size: 0.72rem; }
.c2-info-vehbrandname { font-weight: 700; font-size: 0.82rem; color: var(--ink); }
.c2-info-vehmodels { padding: 0 0 8px 22px; }
.c2-info-vehmodel { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #475569; padding: 3px 0; }
.c2-info-vehmodel > i { color: var(--muted); font-size: 0.7rem; }
.c2-info-vehloading, .c2-info-vehempty { font-size: 0.78rem; color: var(--muted); font-style: italic; padding: 6px 0; }
.c2-info-vehloading i { margin-right: 6px; color: var(--p); }
.c2-info-empty { padding: 24px; text-align: center; color: var(--muted); font-style: italic; }
.c2-info-empty i { margin-right: 6px; }
.product-flag { color: #f59e0b; margin-left: 6px; font-size: 0.8rem; }
@media (max-width: 720px) {
  .c2-info-top { flex-direction: column; }
  .c2-info-media { width: 100%; }
}
</style>
