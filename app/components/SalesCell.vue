<script setup lang="ts">
const props = defineProps<{
  salesValue: number | null
  units: number | null
  clientsServed: number | null
  /** Objetivo do dia atribuído pela gestão (null = ainda não atribuído). */
  target: number | null
  /** Sugestão de objetivo (fatia do objetivo da loja pelas horas trabalhadas), usada só para pré-preencher quando ainda não há objetivo atribuído. */
  suggestedTarget: number
  editable: boolean
}>()

const emit = defineEmits<{
  commit: [salesValue: number, units: number, clientsServed: number, target: number]
}>()

const isOpen = ref(false)
const draftSales = ref('')
const draftUnits = ref('')
const draftClients = ref('')
const draftTarget = ref('')

const hasData = computed(() => (props.salesValue ?? 0) > 0)
const hasTarget = computed(() => (props.target ?? 0) > 0)

const pctColor = computed(() => {
  if (!hasTarget.value) return hasData.value ? 'primary' : 'neutral'
  const pct = (props.salesValue ?? 0) / props.target! * 100
  if (pct >= 100) return 'success'
  if (pct >= 80) return 'warning'
  return 'error'
})

const draftValuePerClient = computed(() => {
  const clients = Number(draftClients.value)
  const sales = Number(draftSales.value)
  return clients > 0 ? sales / clients : 0
})

watch(isOpen, (open) => {
  if (open) {
    draftSales.value = props.salesValue != null ? String(props.salesValue) : ''
    draftUnits.value = props.units != null ? String(props.units) : ''
    draftClients.value = props.clientsServed != null ? String(props.clientsServed) : ''
    draftTarget.value = props.target != null
      ? String(props.target)
      : (props.suggestedTarget > 0 ? String(Math.round(props.suggestedTarget)) : '')
  } else {
    commitIfChanged()
  }
})

function commitIfChanged() {
  const sales = Number(draftSales.value)
  if (!draftSales.value || Number.isNaN(sales)) return
  const units = Number(draftUnits.value) || 0
  const clients = Number(draftClients.value) || 0
  const target = Number(draftTarget.value) || 0
  if (sales === (props.salesValue ?? 0) && units === (props.units ?? 0) && clients === (props.clientsServed ?? 0) && target === (props.target ?? 0)) return
  emit('commit', sales, units, clients, target)
}

function confirmAndClose() {
  isOpen.value = false
}
</script>

<template>
  <div class="flex flex-col items-center gap-0.5">
    <UBadge
      v-if="!editable"
      :color="pctColor"
      variant="subtle"
      class="w-full justify-center"
    >
      {{ hasData ? formatCurrency(salesValue!) : '—' }}
    </UBadge>
    <UPopover
      v-else
      v-model:open="isOpen"
    >
      <UButton
        :label="hasData ? formatCurrency(salesValue!) : '—'"
        :color="pctColor"
        variant="subtle"
        size="sm"
        block
      />

      <template #content>
        <div class="p-3 flex flex-col gap-3 w-56">
          <UFormField label="Objetivo (€)">
            <UInput
              v-model="draftTarget"
              type="number"
              step="0.01"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Vendas (€)">
            <UInput
              v-model="draftSales"
              type="number"
              step="0.01"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Unidades">
            <UInput
              v-model="draftUnits"
              type="number"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Clientes atendidos">
            <UInput
              v-model="draftClients"
              type="number"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <p class="text-xs text-muted">
            Valor por cliente: {{ formatCurrency(draftValuePerClient) }}
          </p>
          <UButton
            label="Confirmar"
            size="xs"
            color="primary"
            variant="soft"
            block
            @click="confirmAndClose"
          />
        </div>
      </template>
    </UPopover>
    <span
      v-if="hasTarget"
      class="text-[10px] text-muted leading-tight"
    >
      obj. {{ formatCurrency(target!) }}
    </span>
  </div>
</template>
