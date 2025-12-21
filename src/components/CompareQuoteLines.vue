<template>
    <div class="h-full flex flex-col overflow-hidden">
        <!-- Loading Spinner -->
        <div v-if="compareStore.isLoading"
            class="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
            <ProgressSpinner style="width: 40px; height: 40px" />
        </div>

        <!-- Table Only -->
        <DataTable :value="compareStore.selectedQuoteLines" scrollable scrollHeight="flex" :rowHover="true"
            @row-click="onRowClick"
            class="p-datatable-sm p-datatable-hover flex-1 midone-table cursor-pointer">

            <Column field="compareQuoteNo" header="Comp. No" style="min-width: 100px">
                <template #body="slotProps">
                    <span class="text-xs font-medium text-slate-500">{{ slotProps.data.compareQuoteNo }}</span>
                </template>
            </Column>

            <Column field="itemNo" header="Article" style="min-width: 120px">
                <template #body="slotProps">
                    <span class="font-semibold text-blue-600">
                        {{ slotProps.data.itemNo }}
                    </span>
                </template>
            </Column>

            <Column field="pageNumber" header="Page" style="min-width: 60px" class="text-center">
                <template #body="slotProps">
                    <span class="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{{
                        slotProps.data.pageNumber }}</span>
                </template>
            </Column>
        </DataTable>

        <!-- Custom Pagination Bar - CENTERED -->
        <div class="custom-pagination-bar mt-auto justify-center gap-4">
            <div class="flex items-center gap-1">
                <Button icon="pi pi-angle-double-left" text rounded size="small" :disabled="filters.page === 0"
                    @click="onPage({ page: 0, rows: pageSize })" />
                <Button icon="pi pi-angle-left" text rounded size="small" :disabled="filters.page === 0"
                    @click="onPage({ page: filters.page - 1, rows: pageSize })" />

                <div class="flex items-center gap-1 mx-1">
                    <Button v-for="page in totalPages" :key="page" :label="page.toString()" size="small"
                        class="page-num-btn" :class="{ 'active-page': filters.page === page - 1 }"
                        @click="onPage({ page: page - 1, rows: pageSize })" />
                </div>

                <Button icon="pi pi-angle-right" text rounded size="small" :disabled="filters.page >= totalPages - 1"
                    @click="onPage({ page: filters.page + 1, rows: pageSize })" />
                <Button icon="pi pi-angle-double-right" text rounded size="small"
                    :disabled="filters.page >= totalPages - 1"
                    @click="onPage({ page: totalPages - 1, rows: pageSize })" />
            </div>

            <div class="flex items-center gap-2">
                <Dropdown v-model="pageSize" :options="[10, 20, 50, 100]" class="rows-dropdown-sm"
                    @change="loadLines" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCompareQuoteStore } from '../stores/compareQuote'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
    compareQuoteNo: {
        type: String,
        required: true
    },
    search: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['close', 'line-selected'])
const compareStore = useCompareQuoteStore()

const filters = ref({
    itemNo: '',
    pageNumber: '',
    page: 0
})

const pageSize = ref(20)

const totalPages = computed(() => {
    const total = compareStore.totalLinesElements || 0
    const size = pageSize.value || 10
    return Math.max(1, Math.ceil(total / size))
})

const loadLines = () => {
    const apiFilters = {
        page: filters.value.page,
        size: pageSize.value,
        search: props.search
    }
    compareStore.fetchCompareQuoteLines(props.compareQuoteNo, apiFilters)
}

watch([() => props.compareQuoteNo, () => props.search], ([newNo, newSearch]) => {
    if (newNo) {
        loadLines()
    }
}, { immediate: true })

const onPage = (event) => {
    filters.value.page = event.page
    pageSize.value = event.rows
    loadLines()
}

const onRowClick = (event) => {
    emit('line-selected', event.data)
}
</script>

<style scoped>
:deep(.p-datatable-wrapper) {
    height: 100%;
}
</style>