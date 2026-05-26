// src/components/SalesOrderLineItem.vue
<template>
  <tr>
    <td class="option-code">{{ line.reference }}</td>
    <td class="option-name">{{ line.designation }}</td>
    <td class="text-right">{{ formatNumber(line.unitPrice, 2) }} €</td>
    <td class="text-right">
      <InputNumber
        v-model.number="editableQty"
        :min="1"
        :disabled="!isEditable"
        @change="onQtyChange"
        class="qty-input"
      />
    </td>
    <td class="text-right">{{ formatNumber(line.amountExcludingTax, 2) }} €</td>
    <td class="text-center">
      <Button
        icon="pi pi-trash"
        class="p-button-danger p-button-sm"
        @click="emitRemove"
        :disabled="!isEditable"
        title="Supprimer la ligne"
      />
    </td>
  </tr>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useSalesOrderStore } from '@/stores/salesOrderStore'

const props = defineProps({
  line: { type: Object, required: true },
})

const emit = defineEmits(['update-qty', 'remove'])

const store = useSalesOrderStore()
const isEditable = store.isDraft

const editableQty = ref(props.line.quantity)

watch(() => props.line.quantity, (newVal) => {
  editableQty.value = newVal
})

function onQtyChange() {
  // clamp to integer >=1
  const qty = Math.max(1, Math.round(editableQty.value))
  if (qty !== props.line.quantity) {
    emit('update-qty', { lineId: props.line.id, quantity: qty })
  }
}

function emitRemove() {
  emit('remove', props.line.id)
}

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
</script>

<style scoped>
.qty-input {
  width: 80px;
}
</style>
