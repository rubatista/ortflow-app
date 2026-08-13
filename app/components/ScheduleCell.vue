<script setup lang="ts">
const props = defineProps<{
  startTime: string | null
  endTime: string | null
  editable: boolean
  onVacation: boolean
}>()

const emit = defineEmits<{
  commit: [startTime: string, endTime: string]
  dayOff: []
}>()

const isOpen = ref(false)
const draftStart = ref('')
const draftEnd = ref('')

const isDayOff = computed(() => !props.startTime || !props.endTime)

const label = computed(() => {
  if (isDayOff.value) return 'Folga'
  return `${props.startTime} – ${props.endTime}`
})

const draftEntry = computed(() => ({ startTime: draftStart.value || null, endTime: draftEnd.value || null }))
const draftLabel = computed(() => shiftLabel(draftEntry.value))
const draftHasBreak = computed(() => shiftHasBreak(draftEntry.value))

watch(isOpen, (open) => {
  if (open) {
    draftStart.value = props.startTime ?? '09:00'
    draftEnd.value = props.endTime ?? '18:00'
  } else {
    commitIfChanged()
  }
})

function commitIfChanged() {
  if (!draftStart.value || !draftEnd.value) return
  if (draftStart.value === props.startTime && draftEnd.value === props.endTime) return
  emit('commit', draftStart.value, draftEnd.value)
}

function confirmAndClose() {
  isOpen.value = false
}

function setDayOff() {
  draftStart.value = ''
  draftEnd.value = ''
  emit('dayOff')
  isOpen.value = false
}
</script>

<template>
  <UBadge
    v-if="onVacation"
    color="success"
    variant="subtle"
    class="w-full justify-center"
  >
    Férias
  </UBadge>
  <UBadge
    v-else-if="!editable"
    :color="isDayOff ? 'neutral' : 'primary'"
    variant="subtle"
    class="w-full justify-center"
  >
    {{ label }}
  </UBadge>
  <UPopover
    v-else
    v-model:open="isOpen"
  >
    <UButton
      :label="label"
      :color="isDayOff ? 'neutral' : 'primary'"
      variant="subtle"
      size="sm"
      block
    />

    <template #content>
      <div class="p-3 flex flex-col gap-3 w-60">
        <div class="flex items-center gap-2">
          <UInput
            v-model="draftStart"
            type="time"
            size="sm"
            class="flex-1"
            @keydown.enter="confirmAndClose"
          />
          <span class="text-muted text-xs">–</span>
          <UInput
            v-model="draftEnd"
            type="time"
            size="sm"
            class="flex-1"
            @keydown.enter="confirmAndClose"
          />
        </div>
        <p class="text-xs text-muted">
          {{ shiftWorkedHours(draftEntry) }}h de trabalho ({{ draftHasBreak ? '1h de pausa' : 'sem pausa' }}) · {{ draftLabel }}
        </p>
        <div class="flex items-center gap-2">
          <UButton
            label="Marcar folga"
            size="xs"
            color="neutral"
            variant="soft"
            class="flex-1"
            @click="setDayOff"
          />
          <UButton
            label="Confirmar"
            size="xs"
            color="primary"
            variant="soft"
            class="flex-1"
            @click="confirmAndClose"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
