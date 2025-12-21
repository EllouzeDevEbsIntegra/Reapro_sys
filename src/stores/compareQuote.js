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
        linesPageSize: 20
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

                const response = await axios.get(`/api/compare-quotes/${compareQuoteNo}/lines`, { params })

                // Handle both paginated and non-paginated responses
                if (response.data.content) {
                    this.selectedQuoteLines = response.data.content
                    this.totalLinesElements = response.data.totalElements
                    this.currentLinesPage = response.data.number
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
        }
    }
})
