<script setup lang="ts">
const props = defineProps<{
  target: number | null
  achieved: number | null
  totalClients: number | null
  totalReceipts: number | null
  returns: number | null
  units: number | null
  editable: boolean
}>()

const emit = defineEmits<{
  commit: [data: { target: number, achieved: number, totalClients: number, totalReceipts: number, returns: number, units: number }]
}>()

const isOpen = ref(false)
const draft = reactive({ target: '', achieved: '', totalClients: '', totalReceipts: '', returns: '', units: '' })

const hasData = computed(() => (props.target ?? 0) > 0 || (props.achieved ?? 0) > 0)

const achievedPct = computed(() => {
  if (!props.target) return 0
  return ((props.achieved ?? 0) / props.target) * 100
})

const pctColor = computed(() => {
  if (!hasData.value) return 'neutral'
  if (achievedPct.value >= 100) return 'success'
  if (achievedPct.value >= 80) return 'warning'
  return 'error'
})

watch(isOpen, (open) => {
  if (open) {
    draft.target = props.target != null ? String(props.target) : ''
    draft.achieved = props.achieved != null ? String(props.achieved) : ''
    draft.totalClients = props.totalClients != null ? String(props.totalClients) : ''
    draft.totalReceipts = props.totalReceipts != null ? String(props.totalReceipts) : ''
    draft.returns = props.returns != null ? String(props.returns) : ''
    draft.units = props.units != null ? String(props.units) : ''
  } else {
    commitIfChanged()
  }
})

function commitIfChanged() {
  const target = Number(draft.target)
  if (!draft.target || Number.isNaN(target)) return
  const data = {
    target,
    achieved: Number(draft.achieved) || 0,
    totalClients: Number(draft.totalClients) || 0,
    totalReceipts: Number(draft.totalReceipts) || 0,
    returns: Number(draft.returns) || 0,
    units: Number(draft.units) || 0
  }
  const unchanged = data.target === (props.target ?? 0)
    && data.achieved === (props.achieved ?? 0)
    && data.totalClients === (props.totalClients ?? 0)
    && data.totalReceipts === (props.totalReceipts ?? 0)
    && data.returns === (props.returns ?? 0)
    && data.units === (props.units ?? 0)
  if (unchanged) return
  emit('commit', data)
}

function confirmAndClose() {
  isOpen.value = false
}
</script>

<template>
  <UBadge
    v-if="!editable"
    :color="pctColor"
    variant="subtle"
    class="w-full justify-center"
  >
    {{ hasData ? formatPercent(achievedPct) : '—' }}
  </UBadge>
  <UPopover
    v-else
    v-model:open="isOpen"
  >
    <UButton
      :label="hasData ? formatPercent(achievedPct) : '—'"
      :color="pctColor"
      variant="subtle"
      size="sm"
      block
    />

    <template #content>
      <div class="p-3 flex flex-col gap-3 w-60">
        <div class="grid grid-cols-2 gap-2">
          <UFormField label="Objectivo (€)">
            <UInput
              v-model="draft.target"
              type="number"
              step="0.01"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Apuro (€)">
            <UInput
              v-model="draft.achieved"
              type="number"
              step="0.01"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Clientes">
            <UInput
              v-model="draft.totalClients"
              type="number"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Talões">
            <UInput
              v-model="draft.totalReceipts"
              type="number"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Devoluções">
            <UInput
              v-model="draft.returns"
              type="number"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
          <UFormField label="Unidades">
            <UInput
              v-model="draft.units"
              type="number"
              size="sm"
              class="w-full"
              @keydown.enter="confirmAndClose"
            />
          </UFormField>
        </div>
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
</template>
