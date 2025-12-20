import { defineStore } from 'pinia'
import axios from '../api/axios'

export const useCompareQuoteStore = defineStore('compareQuote', {
    state: () => ({
        quotes: [],
        selectedQuoteLines: [],
        totalElements: 0,
        isLoading: false,
        error: null,
        currentPage: 0,
        pageSize: 50
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

        async fetchCompareQuoteLines(compareQuoteNo) {
            this.isLoading = true
            this.error = null
            this.selectedQuoteLines = []
            try {
                const response = await axios.get(`/api/compare-quotes/${compareQuoteNo}/lines`)
                this.selectedQuoteLines = response.data
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
