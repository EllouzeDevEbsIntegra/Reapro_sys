<template>
    <div class="h-full flex flex-col overflow-hidden">
        <!-- Loading Spinner -->
        <div v-if="compareStore.isLoading"
            class="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
            <ProgressSpinner style="width: 40px; height: 40px" />
        </div>

        <!-- Table Only -->
        <DataTable :value="compareStore.selectedQuoteLines" scrollable scrollHeight="flex" :rowHover="true"
            @row-click="onRowClick" class="p-datatable-sm p-datatable-hover flex-1 midone-table cursor-pointer">

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

            <Column field="nbLineNotThreated" header="Non Traité" style="min-width: 100px">
                <template #body="slotProps">
                    <span v-if="slotProps.data.nbLineNotThreated > 0"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        {{ slotProps.data.nbLineNotThreated }}
                    </span>
                    <span v-else class="text-gray-400 text-xs">—</span>
                </template>
            </Column>

            <Column field="pageNumber" header="Page" style="min-width: 60px" class="text-center">
                <template #body="slotProps">
                    <span class="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{{
                        slotProps.data.pageNumber }}</span>
                </template>
            </Column>
        </DataTable>


    </div>

</template>

<script setup>
import { useCompareQuoteStore } from '../stores/compareQuote'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
    compareQuoteNo: {
        type: String,
        required: true
    },
    search: {
        type: String,
        default: ''
    },
    treatedFilter: {
        type: [Boolean, null],
        default: null
    }
})

const emit = defineEmits(['close', 'line-selected'])
const compareStore = useCompareQuoteStore()

const onRowClick = (event) => {
    emit('line-selected', event.data)
}
</script>

<style scoped>
:deep(.p-datatable-wrapper) {
    height: 100%;
}
</style>