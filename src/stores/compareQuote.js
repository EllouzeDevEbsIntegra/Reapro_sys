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
        currentLineGlobalIndex: null
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

        clearSelectedLines() {
            this.selectedQuoteLines = []
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

        async fetchItemLedgerEntries(itemNo, year, page = 0, size = 20, companyId = null) {
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
                const response = await axios.get('/api/bc/item-ledger-entries', {
                    params
                })
                return response.data
            } catch (err) {
                console.error('Fetch item ledger entries error:', err)
                throw err
            }
        },

        async fetchEquivalenceItems(referenceMaster, no, page = 0, size = 10) {
            this.error = null
            try {
                const response = await axios.get('/api/bc/itemsEqv', {
                    params: {
                        referenceMaster,
                        no,
                        page,
                        size
                    }
                })
                return response.data
            } catch (err) {
                console.error('Fetch equivalence items error:', err)
                throw err
            }
        },

        async fetchKitItems(no, page = 0, size = 10) {
            this.error = null
            try {
                const response = await axios.get('/api/itemsKit', {
                    params: {
                        no,
                        page,
                        size
                    }
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

        async createArticleMaster(payload) {
            try {
                const response = await axios.post('/api/bc/items/copy', payload)
                return response.data
            } catch (err) {
                console.error('Create Article Master error:', err)
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
        }
    }
})
