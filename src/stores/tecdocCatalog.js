import { defineStore } from 'pinia'
import axios from '../api/axios'

/**
 * Store « Catalogue TecDoc » (Phase 2).
 *
 * Consomme uniquement le proxy backend `/api/tecdoc/*` (jamais la gateway TecDoc
 * directement). Le pays (TN), la langue (fr) et le provider sont résolus côté
 * serveur : ils ne transitent JAMAIS par le frontend. Aucun flux VIN.
 *
 * Cascade véhicule : constructeur → modèle/série → type/motorisation → familles → articles.
 */
export const useTecdocCatalogStore = defineStore('tecdocCatalog', {
    state: () => ({
        // ─ Recherche texte ─
        searchQuery: '',
        suggestions: [],
        isSuggesting: false,

        // ─ Cascade véhicule ─
        linkageType: 'P',               // Type de liaison TecDoc (P = véhicules de tourisme + LCV + moto)
        manufacturers: [],
        selectedMfrId: null,
        models: [],
        selectedModelSeriesId: null,
        vehicleTypes: [],
        selectedLinkageTargetId: null,  // = type/motorisation choisi

        // ─ Familles / sous-familles ─
        assemblyGroups: [],
        selectedAssemblyGroupNodeId: null,

        // ─ Articles ─
        articles: [],
        totalMatchingArticles: 0,
        page: 1,
        perPage: 50,
        // Contexte de recherche articles, pour distinguer les modes et rejouer la
        // pagination À L'IDENTIQUE (jamais de mélange searchQuery + famille/véhicule).
        articleSearchMode: null,        // null | 'text' | 'vehicleFamily'
        lastQuery: null,                // dernier contexte (hors page) effectivement envoyé
        selectedSupplierId: null,       // fournisseur filtré côté serveur (dataSupplierIds)
        // Liste GLOBALE des fabricants TecDoc (getBrands) — SEULE source du filtre fabricant.
        dataSuppliers: [],
        isSuppliersLoading: false,
        suppliersTried: false,          // évite de re-tenter getBrands à chaque recherche

        // ─ Détail article (dialog partagé TecDocArticleInfoDialog) ─
        selectedArticle: null,
        isDetailVisible: false,
        isDetailLoading: false,

        // ─ Transverse ─
        isLoading: false,
        error: null
    }),

    actions: {
        // ───────────────────────── Recherche / autocomplete ─────────────────────────

        /**
         * Autocomplétion. N'altère PAS l'état global du store (isLoading/error) :
         * un échec de suggestions ne doit pas bloquer le reste de la page.
         */
        async fetchSuggestions(query) {
            const q = (query ?? '').trim()
            this.searchQuery = query ?? ''
            if (!q) {
                this.suggestions = []
                return []
            }
            this.isSuggesting = true
            try {
                const { data } = await axios.get('/api/tecdoc/suggestions', {
                    params: { query: q }
                })
                this.suggestions = data?.suggestions || []
                return this.suggestions
            } catch (err) {
                // Non bloquant : on vide simplement les suggestions.
                console.error('TecDoc suggestions error:', err)
                this.suggestions = []
                return []
            } finally {
                this.isSuggesting = false
            }
        },

        // ───────────────────────── Cascade véhicule ─────────────────────────

        async fetchManufacturers() {
            this.isLoading = true
            this.error = null
            try {
                const { data } = await axios.get('/api/tecdoc/vehicles/manufacturers', {
                    params: { type: this.linkageType }
                })
                this.manufacturers = data?.mfrFacets?.counts || data?.manufacturers || []
                return this.manufacturers
            } catch (err) {
                console.error('TecDoc manufacturers error:', err)
                this.error = err.response?.data?.message || 'Erreur lors du chargement des constructeurs.'
                this.manufacturers = []
                return []
            } finally {
                this.isLoading = false
            }
        },

        async fetchModels(mfrId) {
            if (mfrId == null) return []
            this.isLoading = true
            this.error = null
            try {
                const { data } = await axios.get('/api/tecdoc/vehicles/models', {
                    params: { type: this.linkageType, mfrId }
                })
                this.models = data?.vehicleModelSeriesFacets?.counts || data?.models || []
                return this.models
            } catch (err) {
                console.error('TecDoc models error:', err)
                this.error = err.response?.data?.message || 'Erreur lors du chargement des modèles.'
                this.models = []
                return []
            } finally {
                this.isLoading = false
            }
        },

        async fetchVehicleTypes(mfrId, modelSeriesId, page = 1, perPage = 50) {
            if (mfrId == null || modelSeriesId == null) return []
            this.isLoading = true
            this.error = null
            try {
                const { data } = await axios.get('/api/tecdoc/vehicles/types', {
                    params: {
                        type: this.linkageType,
                        mfrId,
                        modelSeriesId,
                        page: page || 1,
                        perPage: perPage || 50
                    }
                })
                this.vehicleTypes = data?.linkageTargets || data?.vehicleTypes || []
                return this.vehicleTypes
            } catch (err) {
                console.error('TecDoc vehicle types error:', err)
                this.error = err.response?.data?.message || 'Erreur lors du chargement des motorisations.'
                this.vehicleTypes = []
                return []
            } finally {
                this.isLoading = false
            }
        },

        // ───────────────────────── Familles / sous-familles ─────────────────────────

        async fetchAssemblyGroups(linkageTargetId, linkageTargetType) {
            if (linkageTargetId == null) return []
            this.isLoading = true
            this.error = null
            try {
                const { data } = await axios.get('/api/tecdoc/assembly-groups', {
                    params: {
                        linkageTargetId,
                        linkageTargetType: linkageTargetType || this.linkageType
                    }
                })
                this.assemblyGroups = data?.assemblyGroupFacets?.counts || data?.assemblyGroups || []
                return this.assemblyGroups
            } catch (err) {
                console.error('TecDoc assembly groups error:', err)
                this.error = err.response?.data?.message || 'Erreur lors du chargement des familles.'
                this.assemblyGroups = []
                return []
            } finally {
                this.isLoading = false
            }
        },

        // ───────────────────────── Articles ─────────────────────────

        /**
         * Recherche catalogue paginée. Accepte un objet de paramètres ; ne transmet
         * que les champs réellement fournis (searchQuery / famille / véhicule / fournisseur).
         * Le pays, la langue et le provider restent côté serveur.
         */
        async fetchCatalogArticles(params = {}) {
            const {
                searchQuery,
                searchType,
                assemblyGroupNodeId,
                linkageTargetId,
                linkageTargetType,
                dataSupplierIds,
                page,
                perPage
            } = params

            this.page = page || this.page || 1
            this.perPage = perPage || this.perPage || 50

            const query = { page: this.page, perPage: this.perPage }
            if (searchQuery != null && String(searchQuery).trim() !== '') {
                query.searchQuery = String(searchQuery).trim()
                // searchType n'a de sens qu'avec un searchQuery (0=IAM/adaptable, 10=any number, 99=description).
                if (searchType != null) query.searchType = searchType
            }
            if (assemblyGroupNodeId != null) query.assemblyGroupNodeId = assemblyGroupNodeId
            if (linkageTargetId != null) query.linkageTargetId = linkageTargetId
            if (linkageTargetType != null) query.linkageTargetType = linkageTargetType
            if (dataSupplierIds != null) query.dataSupplierIds = dataSupplierIds  // compat backend (V1 : non forcé côté UI)

            // Mémorise le contexte EXACT (hors page) : la pagination le rejoue tel quel,
            // sans réinjecter un searchQuery résiduel par-dessus un contexte famille/véhicule.
            const { page: _omitPage, ...context } = query
            this.lastQuery = context
            this.articleSearchMode = context.searchQuery != null
                ? 'text'
                : (context.assemblyGroupNodeId != null || context.linkageTargetId != null)
                    ? 'vehicleFamily'
                    : null

            this.isLoading = true
            this.error = null
            // Vide IMMÉDIATEMENT : aucune ligne de la page/contexte précédent ne doit subsister
            // pendant le chargement (remplacement atomique, pas de chevauchement visuel).
            this.articles = []
            try {
                const { data } = await axios.get('/api/tecdoc/catalog/articles', { params: query })
                // On conserve les objets bruts (pour le dialog partagé) + une clé de ligne UNIQUE :
                // le n° d'article seul n'est pas unique (même réf chez plusieurs fournisseurs/marques).
                this.articles = (data?.articles || []).map((a, i) => ({
                    ...a,
                    _rowKey: `${a?.dataSupplierId ?? ''}|${a?.mfrId ?? ''}|${a?.articleNumber ?? ''}|${i}`
                }))
                this.totalMatchingArticles = data?.totalMatchingArticles || data?.total || 0
                return { articles: this.articles, total: this.totalMatchingArticles }
            } catch (err) {
                console.error('TecDoc catalog articles error:', err)
                this.error = err.response?.data?.message || 'Erreur lors du chargement des articles.'
                this.articles = []
                this.totalMatchingArticles = 0
                return { articles: [], total: 0 }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Pagination : rejoue le DERNIER contexte de recherche valide (texte OU famille/véhicule),
         * exactement, en ne changeant que la page. Garantit l'absence de mélange de filtres.
         */
        async goToPage(page) {
            if (!this.lastQuery) return
            const maxPage = Math.max(1, Math.ceil((this.totalMatchingArticles || 0) / (this.perPage || 50)))
            if (page < 1 || page > maxPage) return
            await this.fetchCatalogArticles({ ...this.lastQuery, page })
        },

        /**
         * Filtre fournisseur CÔTÉ SERVEUR (dataSupplierIds) : rejoue le contexte courant
         * (hors fournisseur) avec le fournisseur sélectionné. Re-clic = désélection.
         */
        async selectSupplier(id) {
            this.selectedSupplierId = (this.selectedSupplierId === id) ? null : id
            const base = { ...(this.lastQuery || {}) }
            delete base.dataSupplierIds
            await this.fetchCatalogArticles({
                ...base,
                dataSupplierIds: this.selectedSupplierId ?? undefined,
                page: 1
            })
        },

        /**
         * Liste globale des fabricants TecDoc (getBrands), chargée une seule fois en cas de succès.
         * En cas d'échec on NE bloque PAS définitivement : suppliersTried reste false → un déclencheur
         * ultérieur (nouvelle recherche) peut re-tenter. isSuppliersLoading empêche les appels concurrents.
         */
        async fetchDataSuppliers() {
            if (this.dataSuppliers.length || this.isSuppliersLoading || this.suppliersTried) return this.dataSuppliers
            this.isSuppliersLoading = true
            try {
                const { data } = await axios.get('/api/tecdoc/data-suppliers')
                this.dataSuppliers = Array.isArray(data) ? data : []
                this.suppliersTried = true   // succès uniquement → on ne re-télécharge plus la liste
                return this.dataSuppliers
            } catch (err) {
                // Échec → on laisse suppliersTried=false pour autoriser une nouvelle tentative.
                console.error('TecDoc data-suppliers error:', err)
                this.dataSuppliers = []
                return []
            } finally {
                this.isSuppliersLoading = false
            }
        },

        // ───────────────────────── Sélections (orchestrent cascade + reset) ─────────────────────────

        async selectManufacturer(mfrId) {
            this.selectedMfrId = mfrId
            this.resetVehicleCascadeFromManufacturer()
            if (mfrId == null) return
            await this.fetchModels(mfrId)
        },

        async selectModel(modelSeriesId) {
            this.selectedModelSeriesId = modelSeriesId
            this.resetVehicleCascadeFromModel()
            if (modelSeriesId == null || this.selectedMfrId == null) return
            await this.fetchVehicleTypes(this.selectedMfrId, modelSeriesId)
        },

        async selectVehicleType(linkageTargetId) {
            this.selectedLinkageTargetId = linkageTargetId
            this.resetAssemblyAndArticles()
            if (linkageTargetId == null) return
            await this.fetchAssemblyGroups(linkageTargetId, this.linkageType)
        },

        async selectAssemblyGroup(assemblyGroupNodeId) {
            this.selectedAssemblyGroupNodeId = assemblyGroupNodeId
            this.page = 1
            if (assemblyGroupNodeId == null) {
                this.articles = []
                this.totalMatchingArticles = 0
                this.lastQuery = null
                this.articleSearchMode = null
                this.selectedSupplierId = null
                return
            }
            await this.fetchCatalogArticles({
                assemblyGroupNodeId,
                linkageTargetId: this.selectedLinkageTargetId,
                linkageTargetType: this.linkageType,
                page: 1,
                perPage: this.perPage
            })
        },

        // ───────────────────────── Détail article (dialog partagé) ─────────────────────────

        openArticleDetail(article) {
            this.selectedArticle = article || null
            this.isDetailVisible = true
        },

        closeArticleDetail() {
            this.isDetailVisible = false
            this.selectedArticle = null
            this.isDetailLoading = false
        },

        // ───────────────────────── Resets ─────────────────────────

        /** Constructeur changé : on invalide modèle → type → familles → articles. */
        resetVehicleCascadeFromManufacturer() {
            this.models = []
            this.selectedModelSeriesId = null
            this.resetVehicleCascadeFromModel()
        },

        /** Modèle changé : on invalide type → familles → articles. */
        resetVehicleCascadeFromModel() {
            this.vehicleTypes = []
            this.selectedLinkageTargetId = null
            this.resetAssemblyAndArticles()
        },

        /** Type changé (ou recherche texte) : on invalide familles + articles. */
        resetAssemblyAndArticles() {
            this.assemblyGroups = []
            this.selectedAssemblyGroupNodeId = null
            this.articles = []
            this.totalMatchingArticles = 0
            this.page = 1
            this.lastQuery = null
            this.articleSearchMode = null
            this.selectedSupplierId = null
        },

        /** Réinitialise la recherche texte et ses suggestions. */
        resetSearch() {
            this.searchQuery = ''
            this.suggestions = []
            this.isSuggesting = false
        }
    }
})
