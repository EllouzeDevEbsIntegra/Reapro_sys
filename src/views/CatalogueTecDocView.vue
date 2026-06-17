<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useTecdocCatalogStore } from '../stores/tecdocCatalog'
import TheNavbar from '../components/TheNavbar.vue'
import TecDocArticleInfoDialog from '../components/tecdoc/TecDocArticleInfoDialog.vue'
// Composants PrimeVue non enregistrés globalement → import local (sans risque).
import AutoComplete from 'primevue/autocomplete'

const store = useTecdocCatalogStore()

// ───────────────────────── Recherche / autocomplete (avec fallback) ─────────────────────────
const searchText = ref('')

// Normalise les suggestions (forme inconnue : string | objet) en chaînes affichables.
const suggestionItems = computed(() =>
    (store.suggestions || []).map((s) =>
        typeof s === 'string' ? s : (s?.suggestion ?? s?.label ?? s?.text ?? s?.value ?? String(s ?? ''))
    )
)

async function onSuggestComplete(event) {
    // Autocomplete best-effort : un échec/vide ne bloque jamais la recherche directe.
    await store.fetchSuggestions(event?.query ?? '')
}

// searchType TecDoc (le backend accepte 0 / 1 / 10 / 99) :
//  • REF  = 10 → « any number » : réf article IAM/adaptable + OE/cross-reference
//               (validé runtime 8057 : searchQuery=02380 → 23 articles vs 2 avec 0).
//  • DESC = 99 → description : chaîne issue de l'autocomplete TecDoc (getAutoCompleteSuggestions)
const REF_TYPE = 10
const DESC_TYPE = 99

// Heuristique « ça ressemble à une référence » : un seul token, alphanumérique court,
// beaucoup de chiffres ou des séparateurs . - /  (ex : 02380, 17521, 13.0460-2617.2).
function looksLikeReference(q) {
    const s = (q || '').trim()
    if (!s || /\s/.test(s)) return false                 // espace ⇒ description
    if (!/^[a-z0-9.\-/]+$/i.test(s)) return false         // caractères « mot » ⇒ description
    if (s.length > 24) return false
    const digits = (s.match(/\d/g) || []).length
    const hasSep = /[.\-/]/.test(s)
    return hasSep || (digits / s.length) >= 0.3
}

// Recherche texte (Mode A GLOBAL) : neutralise la famille active (pas de mélange),
// fixe le searchType, n'envoie QUE searchQuery (+ searchType) — jamais linkage/assembly.
function detectType(q) { return looksLikeReference(q) ? REF_TYPE : DESC_TYPE }

// Recherche texte (Mode A) : famille neutralisée, véhicule conservé.
// La limitation au véhicule est AUTOMATIQUE dès qu'un type est sélectionné,
// SAUF recherche globale explicite ({ global: true }).
function runTextSearch(q, searchType, { global = false } = {}) {
    const text = (q || '').trim()
    if (!text) return
    clearCriteriaFilters()
    clearMfrFilters()
    store.selectedSupplierId = null            // nouveau contexte → on repart sans filtre fournisseur
    store.selectedAssemblyGroupNodeId = null   // famille neutralisée
    const params = { searchQuery: text, searchType, page: 1, perPage: store.perPage }
    if (!global && store.selectedLinkageTargetId != null) {
        params.linkageTargetId = store.selectedLinkageTargetId
        params.linkageTargetType = store.linkageType
    }
    store.fetchCatalogArticles(params)
}

// Clic suggestion → DESCRIPTION (99), limité au véhicule si un type est sélectionné.
function onSuggestionSelect(event) {
    const v = event?.value
    const picked = typeof v === 'string' ? v : (v?.label ?? v?.suggestion ?? searchText.value)
    searchText.value = picked
    runTextSearch(picked, DESC_TYPE)
}

// Entrée / bouton Rechercher : référence ⇒ 10, sinon description ⇒ 99 ; limité au véhicule si sélectionné.
function doSearch() {
    const q = (searchText.value || '').trim()
    if (!q) return
    runTextSearch(q, detectType(q))
}

// Action explicite : rechercher dans tout TecDoc (hors véhicule).
function doSearchGlobal() {
    const q = (searchText.value || '').trim()
    if (!q) return
    runTextSearch(q, detectType(q), { global: true })
}

// ───────────────────────── Cascade véhicule (Selects, colonne gauche) ─────────────────────────
const manufacturerOptions = computed(() =>
    (store.manufacturers || []).map((m) => ({
        label: m?.name ?? m?.mfrName ?? `#${m?.id ?? ''}`,
        value: m?.id ?? m?.mfrId ?? null
    })).filter((o) => o.value != null)
)

const modelOptions = computed(() =>
    (store.models || []).map((m) => ({
        label: m?.name ?? m?.vehicleModelSeriesName ?? `#${m?.id ?? ''}`,
        value: m?.id ?? m?.vehicleModelSeriesId ?? null
    })).filter((o) => o.value != null)
)

const vehicleTypeOptions = computed(() =>
    (store.vehicleTypes || []).map((t) => {
        const years = t?.beginYearMonth ? ` (${t.beginYearMonth} → ${t.endYearMonth || '…'})` : ''
        const desc = (t?.description ?? '').toString().trim()
        return { label: (desc + years).trim() || `#${t?.linkageTargetId ?? ''}`, value: t?.linkageTargetId ?? null }
    }).filter((o) => o.value != null)
)

const mfrModel = computed({
    get: () => store.selectedMfrId,
    set: (v) => { clearCriteriaFilters(); store.selectManufacturer(v) }
})
const modelModel = computed({
    get: () => store.selectedModelSeriesId,
    set: (v) => { clearCriteriaFilters(); store.selectModel(v) }
})
const typeModel = computed({
    get: () => store.selectedLinkageTargetId,
    set: (v) => { clearCriteriaFilters(); store.selectVehicleType(v) }
})

// Libellés courants (pour breadcrumb)
const mfrLabel = computed(() => manufacturerOptions.value.find((o) => o.value === store.selectedMfrId)?.label || '')
const modelLabel = computed(() => modelOptions.value.find((o) => o.value === store.selectedModelSeriesId)?.label || '')
const typeLabel = computed(() => vehicleTypeOptions.value.find((o) => o.value === store.selectedLinkageTargetId)?.label || '')
const familyLabel = computed(() =>
    assemblyGroupItems.value.find((g) => g.id === store.selectedAssemblyGroupNodeId)?.name || ''
)

// ───────────────────────── Résumé technique du type sélectionné ─────────────────────────
const selectedTypeObj = computed(() =>
    (store.vehicleTypes || []).find((t) => t?.linkageTargetId === store.selectedLinkageTargetId) || null
)

const vehicleImage = computed(() => {
    const imgs = selectedTypeObj.value?.vehicleImages
    const img = Array.isArray(imgs) ? imgs[0] : null
    if (!img) return null
    // Préférer la plus haute résolution disponible (la carte fait ~267px de large) :
    // imageURL100 était trop petit → upscaling/pixelisation.
    return img.imageURL400 || img.imageURL800 || img.imageURL200 || img.imageURL100 || img.imageURL50 || img.url || null
})

const vehicleSummaryRows = computed(() => {
    const t = selectedTypeObj.value
    if (!t) return []
    const rows = []
    const period = [t.beginYearMonth, t.endYearMonth].filter(Boolean).join(' → ')
    if (period) rows.push({ label: 'Années', value: period })
    const kw = t.kiloWattsFrom ?? t.kiloWatts
    const hp = t.horsePowerFrom ?? t.horsePower
    if (kw || hp) rows.push({ label: 'Puissance', value: [kw ? `${kw} kW` : null, hp ? `${hp} ch` : null].filter(Boolean).join(' / ') })
    const cc = t.capacityCC ?? t.capacityCc
    const lit = t.capacityLiters ?? t.capacityLitres
    if (cc) rows.push({ label: 'Cylindrée', value: `${cc} cm³${lit ? ` (${lit} L)` : ''}` })
    else if (lit) rows.push({ label: 'Cylindrée', value: `${lit} L` })
    if (t.fuelType) rows.push({ label: 'Carburant', value: t.fuelType })
    const motor = t.engineType || (Array.isArray(t.motorCodes) ? t.motorCodes.join(', ') : t.motorType)
    if (motor) rows.push({ label: 'Moteur', value: motor })
    if (t.bodyType) rows.push({ label: 'Carrosserie', value: t.bodyType })
    if (t.driveType) rows.push({ label: 'Transmission', value: t.driveType })
    return rows
})

// ───────────────────────── Familles / sous-familles ─────────────────────────
const familyFilter = ref('')

const assemblyGroupItems = computed(() => {
    const raw = (store.assemblyGroups || []).map((g) => ({
        id: g?.assemblyGroupNodeId ?? null,
        name: g?.assemblyGroupName ?? `#${g?.assemblyGroupNodeId ?? ''}`,
        count: g?.count ?? null
    })).filter((g) => g.id != null)
    // L'arbre complet TecDoc renvoie le même libellé sur plusieurs nœuds → doublons.
    // On dédoublonne par nom en gardant, pour chaque libellé, le nœud au plus grand count.
    const byName = new Map()
    for (const g of raw) {
        const key = g.name.trim().toLowerCase()
        const prev = byName.get(key)
        if (!prev || (g.count ?? 0) > (prev.count ?? 0)) byName.set(key, g)
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})

// Filtre local sur la liste (déjà dédoublonnée) des familles.
const filteredFamilies = computed(() => {
    const q = familyFilter.value.trim().toLowerCase()
    if (!q) return assemblyGroupItems.value
    return assemblyGroupItems.value.filter((g) => g.name.toLowerCase().includes(q))
})

// Familles PRÉSENTES dans les résultats affichés (extraites des genericArticles), pour
// synchroniser le panneau gauche pendant une recherche désignation/référence.
const resultFamilies = computed(() => {
    const map = new Map() // nodeId → { id, name, count }
    for (const a of store.articles || []) {
        const gas = Array.isArray(a?.genericArticles) ? a.genericArticles : []
        const seen = new Set()
        for (const g of gas) {
            const id = g?.assemblyGroupNodeId
            const name = g?.assemblyGroupName
            if (id == null || !name || seen.has(id)) continue
            seen.add(id)
            const prev = map.get(id)
            if (prev) prev.count++
            else map.set(id, { id, name, count: 1 })
        }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
})

function selectFamily(id) {
    clearCriteriaFilters()
    clearMfrFilters()
    store.selectedSupplierId = null
    searchText.value = ''            // Mode B : on vide visuellement la barre de recherche texte.
    store.selectAssemblyGroup(id)
}

// ───────────────────────── Breadcrumb / chips ─────────────────────────
// Mode courant DÉRIVÉ du dernier contexte envoyé (source de vérité) → transparence totale.
const lastQ = computed(() => store.lastQuery || {})
const searchMode = computed(() => {
    const q = lastQ.value
    if (q.assemblyGroupNodeId != null) return 'family'
    if (q.searchQuery != null && q.linkageTargetId != null) return 'text-vehicle'
    if (q.searchQuery != null) return 'text-global'
    if (q.linkageTargetId != null) return 'vehicle'
    return 'none'
})
const isTextSearchActive = computed(() => searchMode.value === 'text-vehicle' || searchMode.value === 'text-global')
const activeSearchTerm = computed(() => lastQ.value.searchQuery || '')
const activeTermLabel = computed(() => {
    const t = lastQ.value.searchType
    const isRef = t === 10 || t === '10'
    return (isRef ? 'Référence : ' : 'Désignation : ') + activeSearchTerm.value
})

const breadcrumbChips = computed(() => {
    const out = []
    const m = searchMode.value
    // Recherche globale explicite : le véhicule n'est PAS un filtre actif → on ne l'affiche pas comme tel.
    if (m === 'text-global') {
        out.push({ key: 'global', label: 'Recherche globale', kind: 'mode', removable: false })
        if (activeSearchTerm.value) out.push({ key: 'term', label: activeTermLabel.value, kind: 'term', removable: true })
        return out
    }
    if (mfrLabel.value) out.push({ key: 'mfr', label: mfrLabel.value, removable: true })
    if (modelLabel.value) out.push({ key: 'model', label: modelLabel.value, removable: true })
    if (typeLabel.value) out.push({ key: 'type', label: typeLabel.value, removable: true })
    if (m === 'family' && familyLabel.value) out.push({ key: 'family', label: familyLabel.value, removable: true })
    if (m === 'text-vehicle' && activeSearchTerm.value) out.push({ key: 'term', label: activeTermLabel.value, kind: 'term', removable: true })
    return out
})

// ✕ sur la chip « Désignation/Référence » : on nettoie la recherche texte et on revient au contexte véhicule.
function clearTextSearch() {
    searchText.value = ''
    clearCriteriaFilters()
    clearMfrFilters()
    store.selectAssemblyGroup(null)   // vide articles + lastQuery + famille, garde le véhicule sélectionné
}

function resetChip(key) {
    clearCriteriaFilters()
    clearMfrFilters()
    if (key === 'mfr') store.selectManufacturer(null)
    else if (key === 'model') store.selectModel(null)
    else if (key === 'type') store.selectVehicleType(null)
    else if (key === 'family') store.selectAssemblyGroup(null)
    else if (key === 'term') clearTextSearch()
}

// ───────────────────────── Panneau « Critères article » (filtrage local V1) ─────────────────────────
const selectedCrit = reactive({}) // clé `${group}|||${value}` → true
const SEP = '|||'

function critKey(group, value) { return `${group}${SEP}${value}` }
function isCritChecked(group, value) { return !!selectedCrit[critKey(group, value)] }
function toggleCrit(group, value) {
    const k = critKey(group, value)
    if (selectedCrit[k]) delete selectedCrit[k]
    else selectedCrit[k] = true
}
function clearCriteriaFilters() {
    for (const k of Object.keys(selectedCrit)) delete selectedCrit[k]
}

// Agrège les critères présents dans les articles chargés (groupés par criteriaDescription).
const criteriaGroups = computed(() => {
    const map = new Map() // group -> Map(value -> count)
    for (const a of store.articles || []) {
        const crit = Array.isArray(a?.articleCriteria) ? a.articleCriteria : []
        for (const c of crit) {
            const group = c?.criteriaDescription || c?.criteriaAbbrDescription
            const rawVal = c?.formattedValue ?? c?.rawValue ?? c?.value
            if (!group || rawVal == null || rawVal === '') continue
            const value = String(rawVal)
            if (!map.has(group)) map.set(group, new Map())
            const vm = map.get(group)
            vm.set(value, (vm.get(value) || 0) + 1)
        }
    }
    return [...map.entries()].map(([group, vm]) => ({
        group,
        values: [...vm.entries()]
            .map(([value, count]) => ({ value, count }))
            .sort((x, y) => y.count - x.count)
    }))
})

const hasActiveCriteria = computed(() => Object.keys(selectedCrit).length > 0)

// ───────────────────────── Filtre « Fabricants » (local, séparé des critères) ─────────────────────────
const selectedMfr = reactive({}) // mfrName → true

function isMfrChecked(name) { return !!selectedMfr[name] }
function toggleMfr(name) {
    if (selectedMfr[name]) delete selectedMfr[name]
    else selectedMfr[name] = true
}
function clearMfrFilters() {
    for (const k of Object.keys(selectedMfr)) delete selectedMfr[k]
}
const hasActiveMfr = computed(() => Object.keys(selectedMfr).length > 0)

// Facettes fabricants agrégées depuis les articles chargés.
const mfrFacets = computed(() => {
    const map = new Map()
    for (const a of store.articles || []) {
        const name = a?.mfrName
        if (!name) continue
        map.set(name, (map.get(name) || 0) + 1)
    }
    return [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
})

// Filtre LOCAL par famille issue des résultats : les assemblyGroupNodeId des genericArticles
// ne sont PAS compatibles avec une requête getArticles (espace d'ID différent des facettes)
// → on filtre donc localement les articles déjà affichés, sans re-requête.
const selectedResultFamilyId = ref(null)
function selectResultFamily(id) {
    selectedResultFamilyId.value = (selectedResultFamilyId.value === id) ? null : id
}
function clearResultFamily() { selectedResultFamilyId.value = null }
const isResultFamilyActive = computed(() => selectedResultFamilyId.value != null)

// ── Composant « Fabricants TecDoc » : SOURCE UNIQUE = liste globale getBrands ──
//  'global' : liste globale TecDoc (getBrands) = tous les fabricants → filtre serveur dataSupplierIds.
//  'local'  : repli SEULEMENT si /data-suppliers indisponible — agrégat de la page affichée,
//             clairement étiqueté « page courante » (jamais présenté comme une facette globale).
const supplierFilter = ref('')
const supplierSource = computed(() =>
    (store.dataSuppliers && store.dataSuppliers.length > 0) ? 'global' : 'local'
)
const isServerSupplier = computed(() => supplierSource.value === 'global')
const supplierBadge = computed(() =>
    supplierSource.value === 'global'
        ? { text: 'liste globale', cls: 'is-global' }
        : { text: 'page courante', cls: '' }
)

const supplierItems = computed(() => {
    if (supplierSource.value === 'global') {
        return (store.dataSuppliers || []).map((s) => ({
            id: s?.dataSupplierId ?? null,
            name: s?.mfrName ?? `#${s?.dataSupplierId ?? ''}`,
            count: null
        })).filter((s) => s.id != null).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    // Repli local : agrégation par nom sur la page affichée (pas d'id fournisseur).
    return mfrFacets.value.map((m) => ({ id: null, name: m.name, count: m.count }))
})

// Message discret quand la liste filtrée est vide.
const supplierEmptyMsg = computed(() => {
    if (supplierItems.value.length) return 'Aucun fabricant ne correspond.'
    if (store.isSuppliersLoading) return 'Chargement…'
    return 'Liste fabricants indisponible'
})

const filteredSupplierItems = computed(() => {
    const q = supplierFilter.value.trim().toLowerCase()
    const list = supplierItems.value
    if (!q) return list
    return list.filter((s) => s.name.toLowerCase().includes(q))
})

function onSupplierClick(item) {
    if (isServerSupplier.value) store.selectSupplier(item.id)   // re-requête serveur (dataSupplierIds)
    else toggleMfr(item.name)                                  // filtre local (page)
}
function isSupplierActive(item) {
    return isServerSupplier.value
        ? store.selectedSupplierId === item.id
        : isMfrChecked(item.name)
}

// Filtres LOCAUX (qui réduisent displayedArticles sur la page) — pour le compteur « affichés / total ».
const hasLocalFilter = computed(() => hasActiveCriteria.value || hasActiveMfr.value || isResultFamilyActive.value)
// Au moins un filtre actif (local OU fournisseur serveur) — pour l'action « Effacer ».
const hasAnyFilter = computed(() => hasLocalFilter.value || store.selectedSupplierId != null)
function clearAllFilters() {
    clearCriteriaFilters(); clearMfrFilters(); clearResultFamily()
    if (store.selectedSupplierId != null) store.selectSupplier(store.selectedSupplierId) // re-clic = OFF (re-requête)
    supplierFilter.value = ''
}

// Filtre local combiné : un article est gardé s'il satisfait le filtre fabricant (si actif)
// ET chaque groupe de critères sélectionné (au moins une valeur cochée).
const displayedArticles = computed(() => {
    const critKeys = Object.keys(selectedCrit)
    const mfrKeys = Object.keys(selectedMfr)
    const rfId = selectedResultFamilyId.value
    if (!critKeys.length && !mfrKeys.length && rfId == null) return store.articles || []
    const mfrSet = new Set(mfrKeys)
    const groups = new Map()
    for (const k of critKeys) {
        const [g, v] = k.split(SEP)
        if (!groups.has(g)) groups.set(g, new Set())
        groups.get(g).add(v)
    }
    return (store.articles || []).filter((a) => {
        if (mfrSet.size && !mfrSet.has(a?.mfrName)) return false
        if (rfId != null) {
            const gas = Array.isArray(a?.genericArticles) ? a.genericArticles : []
            if (!gas.some((g) => g?.assemblyGroupNodeId === rfId)) return false
        }
        const crit = Array.isArray(a?.articleCriteria) ? a.articleCriteria : []
        for (const [g, vals] of groups) {
            const ok = crit.some((c) => {
                const cg = c?.criteriaDescription || c?.criteriaAbbrDescription
                const cv = String(c?.formattedValue ?? c?.rawValue ?? c?.value ?? '')
                return cg === g && vals.has(cv)
            })
            if (!ok) return false
        }
        return true
    })
})

// Quand un nouveau jeu d'articles arrive, on remet les filtres critères à zéro (état UI local uniquement).
watch(() => store.articles, () => {
    clearCriteriaFilters(); clearMfrFilters(); clearResultFamily()
    // Filet de sécurité : si la liste globale n'a pas encore pu se charger (échec au montage),
    // on re-tente dès qu'on a des résultats — fetchDataSuppliers est idempotent (cache sur succès).
    if ((store.articles?.length) && !(store.dataSuppliers?.length) && !store.isSuppliersLoading) {
        store.fetchDataSuppliers()
    }
})
watch(() => store.assemblyGroups, () => { familyFilter.value = '' })

// Clé de la DataTable : change à chaque page / contexte → remontage propre, jamais de ligne fantôme.
const tableKey = computed(() => {
    const q = store.lastQuery || {}
    return [store.page, q.searchQuery || '', q.searchType || '', q.assemblyGroupNodeId || '', q.linkageTargetId || ''].join('|')
})

// ───────────────────────── Articles (affichage) ─────────────────────────
function articleImage(a) {
    const img = a?.images?.[0] || a?.thumbnails?.[0]
    if (!img) return null
    if (typeof img === 'string') return img
    return img.imageURL100 || img.imageURL200 || img.imageURL50 || img.url || img.thumbnailUrl || null
}
function articleDescription(a) {
    return a?.genericArticles?.[0]?.genericArticleDescription ?? a?.descriptionStructured ?? a?.description ?? '—'
}
function articleGtin(a) {
    const g = a?.gtins
    return Array.isArray(g) && g.length ? g[0] : ''
}
function articleStatus(a) {
    return a?.misc?.articleStatusDescription ?? a?.articleStatusDescription ?? ''
}
function articleCriteriaPreview(a) {
    const crit = a?.articleCriteria
    if (!Array.isArray(crit) || !crit.length) return ''
    return crit.slice(0, 3)
        .map((c) => {
            const label = c?.criteriaAbbrDescription || c?.criteriaDescription || ''
            const val = c?.formattedValue ?? c?.rawValue ?? c?.value ?? ''
            return [label, val].filter(Boolean).join(' : ')
        })
        .filter(Boolean)
        .join(' · ')
}

// Mapping prudent article brut → item attendu par le dialog partagé (non modifié).
function mapArticleToDialogItem(a) {
    if (!a) return null
    const generic = a.genericArticles?.[0]
    return {
        ...a,
        no: a.articleNumber,
        articleNumber: a.articleNumber,
        tecdocArticleNumber: a.articleNumber,
        mfrName: a.mfrName,
        brand: a.mfrName,
        genericDescription: generic?.genericArticleDescription,
        descriptionStructured: generic?.genericArticleDescription,
        description: generic?.genericArticleDescription,
        gtins: Array.isArray(a.gtins) ? a.gtins : [],
        oemNumbers: Array.isArray(a.oemNumbers) ? a.oemNumbers : [],
        specs: Array.isArray(a.articleCriteria)
            ? a.articleCriteria.map((c) => ({
                label: c?.criteriaAbbrDescription || c?.criteriaDescription || '',
                value: c?.formattedValue ?? c?.rawValue ?? c?.value ?? ''
            }))
            : [],
        thumbnails: Array.isArray(a.images)
            ? a.images.map((img) => (typeof img === 'string' ? img : (img.imageURL200 || img.imageURL100 || img.imageURL50 || img.url))).filter(Boolean)
            : []
    }
}

function openDetail(article) { store.openArticleDetail(mapArticleToDialogItem(article)) }
function onRowClick(event) { openDetail(event?.data) }
function onDetailVisible(v) { if (!v) store.closeArticleDetail() }
function onLoadVehicleModels() { /* no-op V1 (endpoint hors périmètre) */ }

// ───────────────────────── Pagination ─────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil((store.totalMatchingArticles || 0) / (store.perPage || 50))))

// La pagination REJOUE le dernier contexte valide (texte OU famille) via le store :
// elle ne reconstruit plus les params depuis la vue, donc plus aucun mélange accidentel.
function prevPage() { store.goToPage(store.page - 1) }
function nextPage() { store.goToPage(store.page + 1) }

// ───────────────────────── Cycle de vie ─────────────────────────
// Au montage : constructeurs (cascade véhicule) + liste globale des fabricants TecDoc
// (affichée d'emblée dans le panneau Fabricants, avant toute recherche).
onMounted(() => {
    store.fetchManufacturers()
    store.fetchDataSuppliers()
})
</script>

<template>
    <div class="page-layout">
        <TheNavbar />

        <main class="main-content">
            <!-- ───────── HEADER 76px ───────── -->
            <header class="cat-header">
                <h1>Catalogue TecDoc</h1>
                <AutoComplete
                    v-model="searchText"
                    :suggestions="suggestionItems"
                    :loading="store.isSuggesting"
                    placeholder="Référence, OE, marque, produit ou description..."
                    class="cat-search"
                    @complete="onSuggestComplete"
                    @item-select="onSuggestionSelect"
                    @keyup.enter="doSearch"
                >
                    <template #header>
                        <div style="padding:6px 12px;font-size:.7rem;font-weight:800;letter-spacing:.04em;color:#1859B3;text-transform:uppercase;display:flex;align-items:center;gap:6px;border-bottom:1px solid #eef2f7;">
                            <i class="pi pi-bolt" style="font-size:.75rem;"></i> Suggestions TecDoc
                        </div>
                    </template>
                    <template #option="{ option }">
                        <div style="display:flex;align-items:center;gap:8px;font-family:var(--c2-font-sans);font-size:.84rem;color:#334155;">
                            <i class="pi pi-tag" style="font-size:.75rem;color:#94a3b8;"></i>
                            <span>{{ option }}</span>
                        </div>
                    </template>
                </AutoComplete>
                <button type="button" class="cat-btn-primary" @click="doSearch">
                    <i class="pi pi-search" />
                    <span>{{ store.selectedLinkageTargetId ? 'Rechercher (véhicule)' : 'Rechercher' }}</span>
                </button>
                <button v-if="store.selectedLinkageTargetId" type="button" class="cat-btn-ghost"
                        title="Rechercher dans tout TecDoc, hors véhicule sélectionné" @click="doSearchGlobal">
                    <i class="pi pi-globe" /> <span>Globalement</span>
                </button>
                <div class="cat-spacer" />
                <span v-if="store.totalMatchingArticles > 0" class="cat-count-chip">
                    <template v-if="hasLocalFilter">{{ displayedArticles.length }} / {{ store.totalMatchingArticles }}</template>
                    <template v-else>{{ store.totalMatchingArticles }}</template>
                    article(s)
                </span>
            </header>

            <!-- ───────── BODY : 3 zones, scroll interne uniquement ───────── -->
            <div class="cat-body">
                <p v-if="store.error" class="cat-error">
                    <i class="pi pi-exclamation-triangle" /> {{ store.error }}
                </p>

                <div class="cat-cols">
                    <!-- ZONE GAUCHE : sélection véhicule + résumé + familles -->
                    <aside class="cat-left">
                        <div class="cat-card-title">Sélection actuelle</div>
                        <div class="cat-left-fixed">
                            <div class="cat-veh-selects">
                                <Dropdown
                                    v-model="mfrModel" :options="manufacturerOptions"
                                    optionLabel="label" optionValue="value" filter autoFilterFocus
                                    placeholder="Constructeur" panelClass="c2-dropdown-panel cat-veh-panel"
                                    class="cat-select" :loading="store.isLoading"
                                />
                                <Dropdown
                                    v-model="modelModel" :options="modelOptions"
                                    optionLabel="label" optionValue="value" filter autoFilterFocus
                                    placeholder="Modèle / série" panelClass="c2-dropdown-panel cat-veh-panel"
                                    class="cat-select"
                                    :disabled="!store.selectedMfrId || modelOptions.length === 0"
                                />
                                <Dropdown
                                    v-model="typeModel" :options="vehicleTypeOptions"
                                    optionLabel="label" optionValue="value" filter autoFilterFocus
                                    placeholder="Type / motorisation" panelClass="c2-dropdown-panel cat-veh-panel"
                                    class="cat-select"
                                    :disabled="!store.selectedModelSeriesId || vehicleTypeOptions.length === 0"
                                />
                            </div>

                            <div v-if="selectedTypeObj" class="cat-veh-card">
                                <img v-if="vehicleImage" :src="vehicleImage" alt="" class="cat-veh-img" loading="lazy" />
                                <div class="cat-veh-title">{{ mfrLabel }} · {{ typeLabel }}</div>
                                <dl class="cat-veh-specs">
                                    <template v-for="row in vehicleSummaryRows" :key="row.label">
                                        <dt>{{ row.label }}</dt>
                                        <dd>{{ row.value }}</dd>
                                    </template>
                                </dl>
                            </div>
                        </div>

                        <div class="cat-card-title cat-card-title--sub cat-fam-head">
                            <span>{{ isTextSearchActive ? 'Familles des résultats' : 'Familles' }}</span>
                            <span v-if="isTextSearchActive && resultFamilies.length" class="cat-fam-total">{{ resultFamilies.length }}</span>
                            <span v-else-if="!isTextSearchActive && assemblyGroupItems.length" class="cat-fam-total">{{ assemblyGroupItems.length }}</span>
                        </div>
                        <!-- Filtre famille : uniquement en mode véhicule/famille (pas pendant une recherche texte). -->
                        <div v-if="!isTextSearchActive && assemblyGroupItems.length" class="cat-fam-filter">
                            <i class="pi pi-search" />
                            <input v-model="familyFilter" type="text" placeholder="Filtrer une famille…" />
                            <button v-if="familyFilter" type="button" class="cat-fam-clear" @click="familyFilter = ''" aria-label="Effacer">
                                <i class="pi pi-times" />
                            </button>
                        </div>
                        <div class="cat-left-scroll">
                            <!-- A) Recherche texte active → familles présentes dans les résultats affichés -->
                            <template v-if="isTextSearchActive">
                                <div class="cat-fam-note">
                                    Filtre les résultats affichés · «&nbsp;{{ activeSearchTerm }}&nbsp;»
                                </div>
                                <template v-if="resultFamilies.length">
                                    <button
                                        v-for="g in resultFamilies" :key="g.id" type="button"
                                        class="cat-family"
                                        :class="{ 'is-active': selectedResultFamilyId === g.id }"
                                        @click="selectResultFamily(g.id)"
                                    >
                                        <span class="cat-family-name">{{ g.name }}</span>
                                        <span class="cat-family-count">{{ g.count }}</span>
                                    </button>
                                </template>
                                <div v-else class="cat-empty">
                                    <i class="pi pi-sitemap" />
                                    <span>{{ store.isLoading ? 'Chargement…' : 'Aucune famille dans les résultats.' }}</span>
                                </div>
                            </template>
                            <!-- B) Mode véhicule/famille → familles du véhicule -->
                            <template v-else-if="assemblyGroupItems.length && filteredFamilies.length">
                                <button
                                    v-for="g in filteredFamilies" :key="g.id" type="button"
                                    class="cat-family"
                                    :class="{ 'is-active': store.selectedAssemblyGroupNodeId === g.id }"
                                    @click="selectFamily(g.id)"
                                >
                                    <span class="cat-family-name">{{ g.name }}</span>
                                    <span v-if="g.count != null" class="cat-family-count">{{ g.count }}</span>
                                </button>
                            </template>
                            <div v-else-if="assemblyGroupItems.length" class="cat-empty">
                                <i class="pi pi-search" />
                                <span>Aucune famille ne correspond à « {{ familyFilter }} ».</span>
                            </div>
                            <div v-else class="cat-empty">
                                <i class="pi pi-sitemap" />
                                <span>Choisissez un type/motorisation pour afficher les familles.</span>
                            </div>
                        </div>
                    </aside>

                    <!-- ZONE CENTRALE : breadcrumb + articles -->
                    <section class="cat-center">
                        <div class="cat-breadcrumb">
                            <template v-if="breadcrumbChips.length">
                                <span v-for="(chip, i) in breadcrumbChips" :key="chip.key" class="cat-chip">
                                    <span class="cat-chip-label" :class="{ 'is-mode': chip.kind === 'mode', 'is-term': chip.kind === 'term' }">
                                        <i v-if="chip.kind === 'mode'" class="pi pi-globe" />
                                        {{ chip.label }}
                                    </span>
                                    <button v-if="chip.removable" type="button" class="cat-chip-x" @click="resetChip(chip.key)" aria-label="Retirer">
                                        <i class="pi pi-times" />
                                    </button>
                                    <i v-if="i < breadcrumbChips.length - 1" class="pi pi-angle-right cat-chip-sep" />
                                </span>
                            </template>
                            <span v-else class="cat-breadcrumb-empty">Aucune sélection — recherchez ou choisissez un véhicule.</span>
                        </div>

                        <div class="cat-center-scroll">
                            <DataTable
                                v-if="displayedArticles.length"
                                :key="tableKey"
                                :value="displayedArticles" scrollable scrollHeight="flex"
                                dataKey="_rowKey" :loading="store.isLoading"
                                selectionMode="single" class="cat-table" @row-click="onRowClick"
                            >
                                <Column header="" :style="{ width: '56px' }">
                                    <template #body="{ data }">
                                        <img v-if="articleImage(data)" :src="articleImage(data)" alt="" class="cat-thumb" loading="lazy" />
                                        <span v-else class="cat-thumb cat-thumb--ph"><i class="pi pi-image" /></span>
                                    </template>
                                </Column>
                                <Column field="articleNumber" header="Référence" :style="{ width: '150px' }">
                                    <template #body="{ data }"><span class="cat-num cat-ref">{{ data?.articleNumber || '—' }}</span></template>
                                </Column>
                                <Column field="mfrName" header="Marque" :style="{ width: '150px' }">
                                    <template #body="{ data }">{{ data?.mfrName || '—' }}</template>
                                </Column>
                                <Column header="Désignation">
                                    <template #body="{ data }">
                                        <div class="cat-desc-main">{{ articleDescription(data) }}</div>
                                        <div v-if="articleCriteriaPreview(data)" class="cat-desc-sub">{{ articleCriteriaPreview(data) }}</div>
                                        <div v-if="articleGtin(data)" class="cat-desc-gtin">GTIN : <span class="cat-num">{{ articleGtin(data) }}</span></div>
                                    </template>
                                </Column>
                                <Column header="Statut" :style="{ width: '110px' }">
                                    <template #body="{ data }"><span class="cat-status">{{ articleStatus(data) || '—' }}</span></template>
                                </Column>
                            </DataTable>

                            <div v-else class="cat-empty cat-empty--lg">
                                <i class="pi pi-box" />
                                <span v-if="store.isLoading">Chargement des articles…</span>
                                <span v-else-if="store.articles.length && hasAnyFilter">Aucun article ne correspond aux filtres sélectionnés.</span>
                                <span v-else>Aucun article. Lancez une recherche (réf/OEM) ou choisissez une famille.</span>
                            </div>
                        </div>
                    </section>

                    <!-- ZONE DROITE : 2 composants distincts — Fabricants (serveur) + Critères (local) -->
                    <aside class="cat-right">
                        <div class="cat-card-title cat-right-head">
                            <span>Filtres</span>
                            <button v-if="hasAnyFilter" type="button" class="cat-clear" @click="clearAllFilters">Effacer</button>
                        </div>

                        <!-- COMPOSANT 1 : Fabricants — hauteur limitée + scroll interne + recherche -->
                        <div class="cat-supplier-box">
                            <div class="cat-supplier-head">
                                <span class="cat-crit-grouptitle cat-mfr-title"><i class="pi pi-building" /> Fabricants TecDoc</span>
                                <span class="cat-supplier-scope" :class="supplierBadge.cls">{{ supplierBadge.text }}</span>
                            </div>
                            <div v-if="supplierItems.length" class="cat-fam-filter cat-supplier-filter">
                                <i class="pi pi-search" />
                                <input v-model="supplierFilter" type="text" placeholder="Filtrer un fabricant…" />
                                <button v-if="supplierFilter" type="button" class="cat-fam-clear" @click="supplierFilter = ''" aria-label="Effacer">
                                    <i class="pi pi-times" />
                                </button>
                            </div>
                            <div class="cat-supplier-list">
                                <template v-if="filteredSupplierItems.length">
                                    <label v-for="s in filteredSupplierItems" :key="s.id ?? s.name" class="cat-crit-row">
                                        <input type="checkbox" :checked="isSupplierActive(s)" @change="onSupplierClick(s)" />
                                        <span class="cat-crit-val">{{ s.name }}</span>
                                        <span v-if="s.count != null" class="cat-crit-count">{{ s.count }}</span>
                                    </label>
                                </template>
                                <div v-else class="cat-supplier-empty">{{ supplierEmptyMsg }}</div>
                            </div>
                        </div>

                        <!-- COMPOSANT 2 : Critères de l'article (filtrage local, page affichée) -->
                        <div class="cat-card-title cat-card-title--sub">Critères de l'article</div>
                        <div class="cat-right-scroll">
                            <template v-if="criteriaGroups.length">
                                <div v-for="grp in criteriaGroups" :key="grp.group" class="cat-crit-group">
                                    <div class="cat-crit-grouptitle">{{ grp.group }}</div>
                                    <label v-for="val in grp.values" :key="val.value" class="cat-crit-row">
                                        <input type="checkbox" :checked="isCritChecked(grp.group, val.value)" @change="toggleCrit(grp.group, val.value)" />
                                        <span class="cat-crit-val">{{ val.value }}</span>
                                        <span class="cat-crit-count">{{ val.count }}</span>
                                    </label>
                                </div>
                            </template>
                            <div v-else class="cat-empty">
                                <i class="pi pi-filter" />
                                <span>Les critères apparaîtront après le chargement d'articles.</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <!-- ───────── FOOTER 48px ───────── -->
            <footer class="cat-footer">
                <span class="cat-footer-label">Catalogue TecDoc</span>
                <div class="cat-pager" v-if="store.totalMatchingArticles > 0">
                    <button type="button" class="cat-pager-btn" :disabled="store.page <= 1" @click="prevPage"><i class="pi pi-angle-left" /></button>
                    <span class="cat-pager-info">Page {{ store.page }} / {{ totalPages }} · {{ store.totalMatchingArticles }} article(s)</span>
                    <button type="button" class="cat-pager-btn" :disabled="store.page >= totalPages" @click="nextPage"><i class="pi pi-angle-right" /></button>
                </div>
            </footer>
        </main>

        <TecDocArticleInfoDialog
            :visible="store.isDetailVisible" :item="store.selectedArticle"
            :loading="store.isDetailLoading" :showSupplierGtin="true"
            @update:visible="onDetailVisible" @load-vehicle-models="onLoadVehicleModels"
        />
    </div>
</template>

<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; font-family: var(--c2-font-sans); }

.main-content {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: var(--c2-page-pad) var(--c2-page-pad);
    box-sizing: border-box;
    overflow: hidden;
}

/* ───────── Header ───────── */
.cat-header {
    flex-shrink: 0;
    height: var(--c2-head-h);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0 1.25rem;
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius);
    box-shadow: var(--c2-head-shadow);
    margin-bottom: var(--c2-head-gap);
    overflow: hidden;
}
.cat-header h1 { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--c2-head-title); white-space: nowrap; }
.cat-spacer { flex: 1; }

.cat-search { flex: 0 1 460px; min-width: 220px; }
.cat-search :deep(.p-autocomplete) { width: 100%; }
.cat-search :deep(.p-inputtext) {
    width: 100%; height: 38px;
    background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px;
    color: #1e293b; -webkit-text-fill-color: #1e293b; caret-color: #1e293b;
    font-family: var(--c2-font-sans); font-size: 0.875rem; font-weight: 500;
}
.cat-search :deep(.p-inputtext::placeholder) { color: #94a3b8; font-style: italic; }
.cat-search :deep(.p-inputtext:focus) { border-color: var(--c2-frozen); box-shadow: 0 0 0 3px rgba(130, 201, 229, 0.18); }

.cat-btn-primary {
    display: inline-flex; align-items: center; gap: 0.4rem; height: 38px; padding: 0 1rem;
    border: none; border-radius: 8px; background: var(--c2-primary); color: #fff;
    font-weight: 600; font-size: 0.85rem; cursor: pointer; white-space: nowrap;
    transition: background 0.15s ease, transform 0.1s ease;
}
.cat-btn-primary:hover { background: var(--c2-primary-hover); transform: translateY(-1px); }
.cat-btn-primary:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }

.cat-btn-ghost {
    display: inline-flex; align-items: center; gap: 0.4rem; height: 38px; padding: 0 0.8rem;
    border-radius: 8px; cursor: pointer; white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.06);
    color: #cbd5e1; font-size: 0.8rem; font-weight: 600;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.cat-btn-ghost:hover { background: rgba(255, 255, 255, 0.14); color: #fff; }
.cat-btn-ghost i { font-size: 0.85rem; }

.cat-count-chip {
    display: inline-flex; align-items: center; height: 28px; padding: 0 0.75rem;
    border-radius: 999px; background: rgba(130, 201, 229, 0.18); color: #d6f0fb;
    font-size: 0.78rem; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums;
}

/* ───────── Body / colonnes ───────── */
.cat-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.cat-error {
    flex-shrink: 0; margin: 0 0 var(--c2-page-pad) 0; padding: 0.55rem 0.8rem;
    border-radius: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
    font-size: 0.83rem; display: flex; align-items: center; gap: 0.5rem;
}
.cat-cols { flex: 1; min-height: 0; display: flex; gap: var(--c2-page-pad); overflow: hidden; }

.cat-left, .cat-center, .cat-right {
    display: flex; flex-direction: column; min-height: 0;
    background: #fff; border: 1px solid #e8edf3; border-radius: 12px; overflow: hidden;
}
.cat-left { width: 312px; flex-shrink: 0; }
.cat-center { flex: 1; min-width: 0; }
.cat-right { width: 286px; flex-shrink: 0; }

.cat-card-title {
    flex-shrink: 0; padding: 0.6rem 0.9rem; font-size: 0.72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em; color: #475569;
    background: #f8fafc; border-bottom: 1.5px solid #e8edf3;
}
.cat-card-title--sub { border-top: 1px solid #e8edf3; }
.cat-fam-head { display: flex; align-items: center; justify-content: space-between; }
.cat-fam-total {
    font-size: 0.68rem; font-weight: 800; color: #64748b; background: #eef2f7;
    border-radius: 999px; padding: 1px 7px; letter-spacing: 0; text-transform: none;
    font-variant-numeric: tabular-nums;
}
.cat-fam-filter {
    flex-shrink: 0; display: flex; align-items: center; gap: 0.4rem;
    margin: 0.4rem 0.4rem 0; padding: 0 0.55rem; height: 32px;
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px;
}
.cat-fam-filter:focus-within { border-color: var(--c2-frozen); box-shadow: 0 0 0 3px rgba(130, 201, 229, 0.18); }
.cat-fam-filter > i { color: #94a3b8; font-size: 0.8rem; }
.cat-fam-filter input {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font-family: var(--c2-font-sans); font-size: 0.82rem; color: #1e293b;
}
.cat-fam-filter input::placeholder { color: #94a3b8; font-style: italic; }
.cat-fam-clear { border: none; background: transparent; color: #94a3b8; cursor: pointer; padding: 0 2px; display: inline-flex; }
.cat-fam-clear:hover { color: #ef4444; }
.cat-fam-clear i { font-size: 0.72rem; }
.cat-right-head { display: flex; align-items: center; justify-content: space-between; }
.cat-clear {
    border: none; background: transparent; color: var(--c2-primary);
    font-size: 0.72rem; font-weight: 700; cursor: pointer; text-transform: none; letter-spacing: 0;
}
.cat-clear:hover { text-decoration: underline; }

/* Zone gauche : sélection + résumé (fixe) puis familles (scroll) */
.cat-left-fixed { flex-shrink: 0; padding: 0.7rem; border-bottom: 1px solid #eef2f7; }
.cat-veh-selects { display: flex; flex-direction: column; gap: 0.5rem; }
/* La classe cat-select est posée DIRECTEMENT sur l'élément racine .p-select :
   on stylise donc cet élément lui-même (pas un descendant). Même chrome que les
   <Select> des autres pages (B2B / Confirmation). */
.cat-select {
    width: 100% !important; height: 40px !important; background: #fff !important;
    border: 1.5px solid #e2e8f0 !important; border-radius: 8px !important;
    display: flex !important; align-items: center !important; cursor: pointer !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
}
.cat-select:hover { border-color: #cbd5e1 !important; }
.cat-select.p-focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important; outline: none !important;
}
.cat-select.p-disabled { background: #f8fafc !important; opacity: 1 !important; cursor: not-allowed !important; }
.cat-select :deep(.p-select-label),
.cat-select :deep(.p-dropdown-label) {
    padding: 0 0.75rem !important; font-size: 0.875rem !important; color: #1e293b !important;
    font-weight: 500 !important; flex: 1 !important; min-width: 0 !important;
    display: flex !important; align-items: center !important; height: 100% !important; overflow: hidden !important;
}
.cat-select :deep(.p-select-label.p-placeholder),
.cat-select :deep(.p-dropdown-label.p-placeholder) { color: #94a3b8 !important; font-style: italic !important; }
.cat-select :deep(.p-select-dropdown),
.cat-select :deep(.p-dropdown-trigger) {
    width: 2rem !important; color: #94a3b8 !important;
    display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;
}

.cat-veh-card { margin-top: 0.7rem; padding: 0.6rem; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; }
.cat-veh-img { display: block; width: 100%; max-height: 92px; object-fit: contain; margin-bottom: 0.45rem; }
.cat-veh-title { font-size: 0.82rem; font-weight: 800; color: #0f2747; margin-bottom: 0.45rem; line-height: 1.25; }
.cat-veh-specs { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 0; }
.cat-veh-specs dt { font-size: 0.74rem; color: #64748b; white-space: nowrap; }
.cat-veh-specs dd { margin: 0; font-size: 0.74rem; color: #1e293b; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }

.cat-left-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 0.4rem; }
.cat-fam-note {
    font-size: 0.72rem; color: #64748b; font-style: italic;
    padding: 0.2rem 0.5rem 0.45rem; line-height: 1.3;
}
.cat-family {
    width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
    padding: 0.5rem 0.6rem; margin-bottom: 2px; border: none; border-radius: 7px; background: transparent;
    color: #334155; font-family: var(--c2-font-sans); font-size: 0.84rem; text-align: left; cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
}
.cat-family:hover { background: #f5f9ff; }
.cat-family.is-active { background: #eff6ff; color: var(--c2-select-accent); font-weight: 700; box-shadow: inset 3px 0 0 var(--c2-select-accent); }
.cat-family-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-family-count {
    flex-shrink: 0; font-size: 0.72rem; font-weight: 700; color: #64748b; background: #f1f5f9;
    border-radius: 999px; padding: 1px 7px; font-variant-numeric: tabular-nums;
}

/* Zone centrale : breadcrumb + table */
.cat-breadcrumb {
    flex-shrink: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem;
    padding: 0.5rem 0.8rem; border-bottom: 1.5px solid #e8edf3; min-height: 40px; box-sizing: border-box;
}
.cat-breadcrumb-empty { color: #94a3b8; font-size: 0.8rem; font-style: italic; }
.cat-chip { display: inline-flex; align-items: center; gap: 0.3rem; }
.cat-chip-label {
    display: inline-flex; align-items: center; height: 24px; padding: 0 0.55rem; border-radius: 999px;
    background: #eff6ff; color: var(--c2-select-accent); font-size: 0.78rem; font-weight: 700;
    max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cat-chip-label.is-mode {
    display: inline-flex; align-items: center; gap: 0.3rem;
    background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;
}
.cat-chip-label.is-term { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.cat-chip-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; padding: 0 2px; display: inline-flex; }
.cat-chip-x:hover { color: #ef4444; }
.cat-chip-x i { font-size: 0.7rem; }
.cat-chip-sep { color: #cbd5e1; font-size: 0.7rem; }

.cat-center-scroll { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.cat-table { flex: 1; min-height: 0; }
.cat-table :deep(.p-datatable-wrapper) { border: none; }
.cat-num { font-variant-numeric: tabular-nums; }
.cat-ref { color: var(--c2-select-accent); font-weight: 700; }
.cat-desc-main { color: #1e293b; font-weight: 600; font-size: 0.84rem; }
.cat-desc-sub { color: #64748b; font-size: 0.78rem; margin-top: 1px; }
.cat-desc-gtin { color: #94a3b8; font-size: 0.74rem; margin-top: 1px; }
.cat-status { font-size: 0.8rem; color: #475569; }
.cat-thumb { width: 40px; height: 40px; object-fit: contain; border-radius: 6px; background: #f8fafc; border: 1px solid #eef2f7; }
.cat-thumb--ph { display: inline-flex; align-items: center; justify-content: center; color: #cbd5e1; }

/* Zone droite : critères */
.cat-right-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 0.5rem 0.6rem; }
.cat-crit-group { margin-bottom: 0.75rem; }
.cat-mfr-title { display: flex; align-items: center; gap: 0.4rem; color: var(--c2-select-accent); }
.cat-mfr-title i { font-size: 0.8rem; }
.cat-filter-sep { height: 1px; background: #e8edf3; margin: 0.25rem 0 0.75rem; }

/* Composant 1 : Fabricants — bloc fixe, liste à hauteur limitée + scroll interne. */
.cat-supplier-box { flex-shrink: 0; display: flex; flex-direction: column; border-bottom: 1px solid #e8edf3; }
.cat-supplier-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 0.6rem 0.25rem; }
.cat-supplier-scope {
    font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;
    color: #94a3b8; background: #f1f5f9; border-radius: 999px; padding: 1px 7px; white-space: nowrap;
}
.cat-supplier-scope.is-global { color: #1859b3; background: #eff6ff; }
.cat-supplier-filter { margin: 0 0.6rem 0.4rem; height: 30px; }
.cat-supplier-list { max-height: 196px; overflow-y: auto; padding: 0 0.4rem 0.4rem; }
.cat-supplier-empty { padding: 0.4rem 0.6rem; font-size: 0.78rem; color: #94a3b8; font-style: italic; }
.cat-crit-grouptitle {
    font-size: 0.74rem; font-weight: 800; color: #0f2747; text-transform: none;
    padding: 0.2rem 0; margin-bottom: 0.2rem; border-bottom: 1px solid #f1f5f9;
}
.cat-crit-row {
    display: flex; align-items: center; gap: 0.45rem; padding: 0.22rem 0.2rem;
    border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: #334155;
}
.cat-crit-row:hover { background: #f5f9ff; }
.cat-crit-row input { accent-color: var(--c2-primary); width: 14px; height: 14px; cursor: pointer; }
.cat-crit-val { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-crit-count { flex-shrink: 0; font-size: 0.7rem; font-weight: 700; color: #64748b; font-variant-numeric: tabular-nums; }

/* Empty states */
.cat-empty {
    height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.5rem; padding: 1.5rem; color: #94a3b8; font-size: 0.83rem; text-align: center;
}
.cat-empty i { font-size: 1.6rem; color: #cbd5e1; }
.cat-empty--lg i { font-size: 2.2rem; }

/* ───────── Footer 48px ───────── */
.cat-footer {
    flex-shrink: 0; height: 48px; box-sizing: border-box; display: flex; align-items: center;
    justify-content: space-between; gap: 1rem; padding: 0 1.25rem; margin-top: var(--c2-head-gap);
    background: var(--c2-head-bg); border: 1px solid var(--c2-head-border); border-radius: var(--c2-head-radius);
    box-shadow: var(--c2-head-shadow);
}
.cat-footer-label { color: #cbd5e1; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; }
.cat-pager { display: flex; align-items: center; gap: 0.6rem; }
.cat-pager-info { color: #cbd5e1; font-size: 0.8rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.cat-pager-btn {
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 7px; background: rgba(255, 255, 255, 0.06);
    color: #e2e8f0; cursor: pointer; transition: background 0.12s ease;
}
.cat-pager-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.16); }
.cat-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>

<!-- Panneau des 3 selects véhicule : NON scopé (l'overlay PrimeVue est téléporté dans <body>).
     Cible la seule classe cat-veh-panel → n'affecte pas le c2-dropdown-panel partagé des autres pages. -->
<style>
.cat-veh-panel.p-select-overlay {
    width: 286px !important;
    max-width: 286px !important;
}
.cat-veh-panel .p-select-list { width: 100%; box-sizing: border-box; }
.cat-veh-panel .p-select-option {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
