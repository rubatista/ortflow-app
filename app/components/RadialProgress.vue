<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  max?: number
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  label: string
  caption?: string
}>(), {
  max: 100,
  color: 'primary',
  size: 'md'
})

const radius = 40
const circumference = 2 * Math.PI * radius

const pct = computed(() => {
  if (props.max <= 0) return 0
  return Math.min(1, Math.max(0, props.value / props.max))
})

const dashOffset = computed(() => circumference * (1 - pct.value))

const dimension = computed(() => ({ sm: 72, md: 96, lg: 128 }[props.size]))
const labelSize = computed(() => ({ sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }[props.size]))

const colorClass = computed(() => ({
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  neutral: 'text-highlighted'
}[props.color]))
</script>

<template>
  <div class="inline-flex flex-col items-center gap-1.5">
    <div
      class="relative inline-flex items-center justify-center"
      :style="{ width: `${dimension}px`, height: `${dimension}px` }"
    >
      <svg
        viewBox="0 0 100 100"
        class="size-full -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          :r="radius"
          fill="none"
          stroke-width="10"
          class="text-muted/25"
          stroke="currentColor"
        />
        <circle
          cx="50"
          cy="50"
          :r="radius"
          fill="none"
          stroke-width="10"
          stroke-linecap="round"
          :class="colorClass"
          stroke="currentColor"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          class="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span
        class="absolute font-bold text-highlighted"
        :class="labelSize"
      >
        {{ label }}
      </span>
    </div>
    <p
      v-if="caption"
      class="text-xs text-muted text-center"
    >
      {{ caption }}
    </p>
  </div>
</template>
