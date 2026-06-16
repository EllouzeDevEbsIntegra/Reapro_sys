import { defineStore } from 'pinia'
import axios from '../api/axios'

export const useCompareQuoteStore = defineStore('compareQuote', {
    state: () => ({
        quotes: [],
        selectedQuoteLines: [],
        totalElements: 0,
        totalLinesElements: 0,
        isLoading: false,
        error: null,
        currentPage: 0,
        pageSize: 20,
        currentLinesPage: 0,
        linesPageSize: 20,
        currentLineGlobalIndex: null,
        cartCount: 0,
        cartItems: [],
        cartPagination: {
            page: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0
        }
    }),

    actions: {
        async fetchCompareQuotes(page = 0, search = '') {
            this.isLoading = true
            this.error = null
            try {
                const response = await axios.get('/api/compare-quotes', {
                    params: {
                        page,
                        size: this.pageSize,
                        search
                    }
                })
                this.quotes = response.data.content
                this.totalElements = response.data.totalElements
                this.currentPage = page
            } catch (err) {
                this.error = err.response?.data?.message || 'Erreur lors de la récupération des comparaisons'
                console.error('Fetch quotes error:', err)
            } finally {
                this.isLoading = false
            }
        },

        async searchItems(params) {
            this.isLoading = true
            this.error = null
            try {
                const response = await axios.get('/api/elva-items', { params })
                return response.data
            } catch (err) {
                this.error = err.response?.data?.message || 'Erreur lors de la recherche des articles'
                console.error('searchItems error:', err)
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async fetchCompareQuoteLines(compareQuoteNo, filters = {}) {
            this.isLoading = true
            this.error = null
            this.selectedQuoteLines = []
            try {
                const params = {
                    page: filters.page || 0,
                    size: filters.size || this.linesPageSize
                }

                if (filters.search) {
                    params.search = filters.search
                }

                if (filters.pageNumber !== undefined && filters.pageNumber !== null && filters.pageNumber !== '') {
                    params.pageNumber = filters.pageNumber
                }

                if (filters.treated !== undefined && filters.treated !== null) {
                    params.treated = filters.treated
                }

                const response = await axios.get(`/api/compare-quotes/${compareQuoteNo}/lines`, { params })

                if (response.data.content) {
                    this.selectedQuoteLines = response.data.content
                    if (response.data.page) {
                        this.totalLinesElements = response.data.page.totalElements
                        this.currentLinesPage = response.data.page.number
                        this.linesPageSize = response.data.page.size || params.size
                    } else {
                        this.totalLinesElements = response.data.totalElements
                        this.currentLinesPage = response.data.number
                        this.linesPageSize = params.size
                    }
                } else {
                    this.selectedQuoteLines = response.data
                    this.totalLinesElements = response.data.length
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Erreur lors de la récupération des lignes'
                console.error('Fetch lines error:', err)
            } finally {
                this.isLoading = false
            }
        },

        async fetchQuoteLineDetails(compareQuoteNo, referenceMaster) {
            this.isLoading = true
            this.error = null
            try {
                const response = await axios.get('/api/bc/quote-lines', {
                    params: {
                        compareQuoteNo,
                        referenceMaster
                    }
                })
                return response.data
            } catch (err) {
                console.error('Fetch line details error:', err)
                throw err
            } finally {
                this.isLoading = false
            }
        },

        // Confirmation Achat : récupère les lignes fournisseur d'un comparateur (paginé serveur).
        // Depuis Phase 4C, l'endpoint renvoie un objet { content, totalElements, totalPages, page, size }.
        // Cette méthode expose l'objet COMPLET (utilisée par le détail C2 pour le badge total + hasMore).
        async fetchConfirmationQuoteLinesPaged(compareQuoteNo, page = 0, size = 20, filters = {}) {
            try {
                const params = { compareQuoteNo, page, size }
                // Filtres optionnels (opérateur + valeur), appliqués côté backend AVANT pagination.
                const hasValue = (v) => v !== undefined && v !== null && v !== ''
                if (hasValue(filters.stockValue) && filters.stockOperator) {
                    params.stockOperator = filters.stockOperator
                    params.stockValue = filters.stockValue
                }
                if (hasValue(filters.dateDernierAchatValue) && filters.dateDernierAchatOperator) {
                    params.dateDernierAchatOperator = filters.dateDernierAchatOperator
                    params.dateDernierAchatValue = filters.dateDernierAchatValue
                }
                if (hasValue(filters.quantityValue) && filters.quantityOperator) {
                    params.quantityOperator = filters.quantityOperator
                    params.quantityValue = filters.quantityValue
                }
                // Filtre "1ère Conf" (qtyFirstConfirmation) — même logique numérique que Qté Cf
                if (hasValue(filters.qtyFirstConfirmationValue) && filters.qtyFirstConfirmationOperator) {
                    params.qtyFirstConfirmationOperator = filters.qtyFirstConfirmationOperator
                    params.qtyFirstConfirmationValue = filters.qtyFirstConfirmationValue
                }
                // Filtre Réf / Désignation (référence article = no) — contains / equals
                if (hasValue(filters.referenceValue) && filters.referenceOperator) {
                    params.referenceOperator = filters.referenceOperator
                    params.referenceValue = filters.referenceValue
                }
                const response = await axios.get('/api/bc/quote-lines/by-compare-quote', {
                    params
                })
                return response.data
            } catch (err) {
                console.error('Fetch confirmation quote lines error:', err)
                throw err
            }
        },

        // Compat ascendante : renvoie UNIQUEMENT le tableau de lignes (utilisée par l'ancien
        // composant ConfirmationAchatDetail.vue qui attend un tableau). Délègue à la version paginée.
        async fetchConfirmationQuoteLines(compareQuoteNo, page = 0, size = 20, filters = {}) {
            const data = await this.fetchConfirmationQuoteLinesPaged(compareQuoteNo, page, size, filters)
            return Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : [])
        },

        async fetchItemLedgerEntries(itemNo, year, page = 0, size = 20, companyId = null, sourceNo = null, allYears = false) {
            this.error = null
            try {
                const params = {
                    itemNo,
                    year,
                    page,
                    size
                }
                if (companyId) {
                    params.companyId = companyId
                }
                if (sourceNo) {
                    params.sourceNo = sourceNo
                }
                if (allYears) {
                    params.allYears = true
                }
                const response = await axios.get('/api/bc/item-ledger-entries', {
                    params
                })
                return response.data
            } catch (err) {
                console.error('Fetch item ledger entries error:', err)
                throw err
            }
        },

        // Lignes Import (clic quantité « I » colonne Appro, détail C2) :
        // item-ledger en magasin d'import, RemainingQuantity > 0, pour itemNo + sourceNo (FRS).
        async fetchImportLedgerLines(itemNo, sourceNo, page = 0, size = 50, sort = '') {
            this.error = null
            try {
                const params = { itemNo, sourceNo, page, size }
                if (sort) {
                    params.sort = sort
                }
                const response = await axios.get('/api/bc/import-ledger-entries', { params })
                return response.data
            } catch (err) {
                console.error('Fetch import ledger lines error:', err)
                throw err
            }
        },

        async fetchEquivalenceItems(referenceMaster, no, page = 0, size = 10, compareQuoteNo = null, filters = {}) {
            this.error = null
            try {
                const params = {
                    referenceMaster,
                    no,
                    page,
                    size
                }
                if (compareQuoteNo) {
                    params.compareQuoteNo = compareQuoteNo
                }
                // PHASE 6B : filtres EQV optionnels (stock / dernier achat), appliqués côté backend AVANT pagination
                const hasValue = (v) => v !== undefined && v !== null && v !== ''
                if (hasValue(filters.stockValue) && filters.stockOperator) {
                    params.stockOperator = filters.stockOperator
                    params.stockValue = filters.stockValue
                }
                if (hasValue(filters.dateDernierAchatValue) && filters.dateDernierAchatOperator) {
                    params.dateDernierAchatOperator = filters.dateDernierAchatOperator
                    params.dateDernierAchatValue = filters.dateDernierAchatValue
                }
                // Filtre Réf / Désignation (référence article = no) — contains / equals
                if (hasValue(filters.referenceValue) && filters.referenceOperator) {
                    params.referenceOperator = filters.referenceOperator
                    params.referenceValue = filters.referenceValue
                }
                const response = await axios.get('/api/bc/itemsEqv', {
                    params
                })
                return response.data
            } catch (err) {
                console.error('Fetch equivalence items error:', err)
                throw err
            }
        },

        async fetchKitItems(no, page = 0, size = 10, compareQuoteNo = null, filters = {}) {
            this.error = null
            try {
                const params = {
                    no,
                    page,
                    size
                }
                if (compareQuoteNo) {
                    params.compareQuoteNo = compareQuoteNo
                }
                // PHASE 6B : filtres KIT optionnels (stock / dernier achat), appliqués côté backend AVANT pagination
                const hasValue = (v) => v !== undefined && v !== null && v !== ''
                if (hasValue(filters.stockValue) && filters.stockOperator) {
                    params.stockOperator = filters.stockOperator
                    params.stockValue = filters.stockValue
                }
                if (hasValue(filters.dateDernierAchatValue) && filters.dateDernierAchatOperator) {
                    params.dateDernierAchatOperator = filters.dateDernierAchatOperator
                    params.dateDernierAchatValue = filters.dateDernierAchatValue
                }
                // Filtre Réf / Désignation (référence article = no) — contains / equals
                if (hasValue(filters.referenceValue) && filters.referenceOperator) {
                    params.referenceOperator = filters.referenceOperator
                    params.referenceValue = filters.referenceValue
                }
                const response = await axios.get('/api/itemsKit', {
                    params
                })
                return response.data
            } catch (err) {
                console.error('Fetch kit items error:', err)
                throw err
            }
        },

        getPageForLineIndex(globalIndex, pageSize) {
            return Math.floor(globalIndex / pageSize)
        },

        setCurrentLineGlobalIndex(index) {
            this.currentLineGlobalIndex = index
        },

        async fetchIntercompanyStock(itemNo) {
            try {
                const response = await axios.get('/api/bc/items/intercompany-stock', {
                    params: { no: itemNo }
                })
                return response.data
            } catch (err) {
                console.error('Fetch intercompany stock error:', err)
                throw err
            }
        },

        async fetchPurchasePrices(itemNo, vendorNo = null) {
            try {
                const params = { itemNo }
                if (vendorNo) params.vendorNo = vendorNo

                const response = await axios.get('/api/purchase-prices', {
                    params
                })
                return response.data
            } catch (err) {
                console.error('Fetch purchase prices error:', err)
                throw err
            }
        },

        async fetchLastInvoicedCost(itemNo) {
            try {
                const response = await axios.get('/api/last-invoiced-cost', {
                    params: { itemNo }
                })
                return response.data
            } catch (err) {
                console.error('Fetch last invoiced cost error:', err)
                throw err
            }
        },

        // Historique paginé "Der P" (vue View_ProjectReapro_LastInvoicedItemCost), trié date desc.
        // Distinct de fetchLastInvoicedCost (/api/last-invoiced-cost) et fetchPurchasePrices.
        async fetchLastInvoicedItemCosts(itemNo, page = 0, size = 20) {
            try {
                const response = await axios.get(`/api/sqlserver/last-invoiced-item-costs/${itemNo}`, {
                    params: { page, size }
                })
                return response.data
            } catch (err) {
                console.error('Fetch last invoiced item costs error:', err)
                throw err
            }
        },

        async fetchTecdocArticleDetails(search, supplier) {
            try {
                const response = await axios.get('/api/tecdoc/articles', {
                    params: {
                        search,
                        supplier
                    }
                })
                return response.data
            } catch (err) {
                console.error('TecDoc article details error:', err)
                throw err
            }
        },

        async fetchTecdocVerification(query) {
            try {
                const response = await axios.get('/api/tecdoc/verify', {
                    params: { query }
                })
                return response.data
            } catch (err) {
                console.error('TecDoc verification error:', err)
                throw err
            }
        },

        async markAsToVerify(bcItemNo) {
            try {
                const response = await axios.patch(`/api/bc/itemsEqv/${bcItemNo}/toVerify`)
                return response.data
            } catch (err) {
                console.error('Mark as to verify error:', err)
                throw err
            }
        },

        async createArticleMaster(payload) {
            try {
                const response = await axios.post('/api/bc/items/copy', payload)
                return response.data
            } catch (err) {
                console.error('Create Article Master error:', err)
                throw err
            }
        },

        async fetchCategories(indentation, parentCategory, companyId = null) {
            try {
                const params = { indentation }
                if (parentCategory) {
                    params.parentCategory = parentCategory
                }
                if (companyId) {
                    params.companyId = companyId
                }
                const response = await axios.get('/api/bc/categories', { params })
                return response.data
            } catch (err) {
                console.error('Fetch categories error:', err)
                throw err
            }
        },

        async updateQuoteLine(id, etag, payload, companyId = null) {
            try {
                const headers = {
                    'If-Match': etag,
                    'Content-Type': 'application/json'
                }

                const params = {}
                if (companyId) {
                    params.companyId = companyId
                }

                const response = await axios.patch(`/api/bc/quote-lines/${id}`, payload, {
                    headers,
                    params
                })
                return response
            } catch (err) {
                console.error('Update quote line error:', err)
                throw err
            }
        },

        async updateQuoteLineComment(id, comment) {
            this.isLoading = true
            this.error = null
            try {
                const response = await axios.patch(`/api/bc/quote-lines/${id}`, {
                    quoteLineComment: comment
                })
                return response.data
            } catch (err) {
                this.error = err.response?.data?.message || 'Erreur lors de la mise à jour du commentaire'
                console.error('Update quote line comment error:', err)
                throw err
            } finally {
                this.isLoading = false
            }
        },

        async fetchTotalAmount(documentNo) {
            try {
                const response = await axios.get('/api/bc/quote-lines/total-amount', {
                    params: { documentNo }
                })
                return response.data
            } catch (err) {
                console.error('Fetch total amount error:', err)
                throw err
            }
        },

        async fetchVendors() {
            try {
                const response = await axios.get('/api/bc/vendors')
                return response.data
            } catch (err) {
                console.error('Fetch vendors error:', err)
                throw err
            }
        },

        async fetchArticleVehicles(articleId, manuId) {
            try {
                const response = await axios.get('/api/tecdoc/article-vehicles', {
                    params: { articleId, manuId }
                })
                return response.data
            } catch (err) {
                console.error('Error fetching article vehicles:', err)
                throw err
            }
        },

        async fetchCartCount(compareQuoteNo) {
            try {
                const response = await axios.get('/api/bc/purchase-cart/count', {
                    params: { compareQuoteNo }
                })
                // The API returns { "count": 7 }, so we need to access .count
                this.cartCount = response.data.count !== undefined ? response.data.count : response.data
                return this.cartCount
            } catch (err) {
                console.error('Fetch cart count error:', err)
                this.isLoading = false
            }
        },

        async fetchCartItems(filters = {}, page = 0, size = 20) {
            this.isLoading = true;
            try {
                const params = { page, size };

                // Handle Status filter (OData syntax)
                if (filters.status && filters.status !== 'All') {
                    params.status = `(status eq '${filters.status}')`;
                } else {
                    params.status = "(status eq 'New' or status eq 'Verified')";
                }

                if (filters.itemNo) {
                    params.itemNo = filters.itemNo;
                }
                if (filters.vendorNo) {
                    params.vendorNo = filters.vendorNo;
                }
                if (filters.compareQuoteNo) {
                    params.compareQuoteNo = filters.compareQuoteNo;
                }

                const response = await axios.get('/api/bc/purchase-cart', { params });
                
                if (response.data && response.data.content !== undefined) {
                    this.cartItems = response.data.content || [];
                    const pageMeta = response.data.page || response.data;
                    this.cartPagination = {
                        page: pageMeta.number !== undefined ? pageMeta.number : page,
                        size: pageMeta.size !== undefined ? pageMeta.size : size,
                        totalElements: pageMeta.totalElements !== undefined ? pageMeta.totalElements : 0,
                        totalPages: pageMeta.totalPages !== undefined ? pageMeta.totalPages : 1
                    };
                } else {
                    this.cartItems = response.data?.value || response.data || [];
                    this.cartPagination = {
                        page: 0, size: size, totalElements: this.cartItems.length, totalPages: 1
                    };
                }
                return this.cartItems;
            } catch (err) {
                console.error('Fetch cart items error:', err);
                this.cartItems = [];
            } finally {
                this.isLoading = false;
            }
        },

        async addToCart(payload) {
            try {
                const response = await axios.post('/api/bc/purchase-cart', payload);
                return response.data;
            } catch (err) {
                console.error('Add to cart error:', err);
                throw err;
            }
        },



        async updateCartItemStatus(lineNo, status) {
            try {
                const response = await axios.patch(`/api/bc/purchase-cart/${lineNo}`, { status });
                return response.data;
            } catch (err) {
                console.error('Update cart item status error:', err);
                throw err;
            }
        },

        async updateCartItemComment(lineNo, comment) {
            try {
                const response = await axios.patch(`/api/bc/purchase-cart/${lineNo}`, { comment });
                return response.data;
            } catch (err) {
                console.error('Update cart item comment error:', err);
                throw err;
            }
        },

        async fetchPurchaseLines(no, page = 0, size = 10, sort = '') {
            try {
                const params = { page, size };
                if (sort) {
                    params.sort = sort;
                }
                const response = await axios.get(`/api/sqlserver/purchase-lines/${no}`, { params });
                return response.data;
            } catch (err) {
                console.error('Fetch purchase lines error:', err);
                throw err;
            }
        },

        async fetchOemEquivalenceCount(masterItemNo) {
            try {
                const response = await axios.get(`/api/sqlserver/oem-equivalence-count/${masterItemNo}`);
                return response.data;
            } catch (err) {
                console.error('Fetch OEM equivalence count error:', err);
                throw err;
            }
        }
    }
})

