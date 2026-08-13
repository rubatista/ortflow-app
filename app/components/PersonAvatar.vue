<script setup lang="ts">
import { COLOR_HEX } from '~/types'

const props = withDefaults(defineProps<{
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  photoUrl?: string | null
}>(), {
  color: 'blue',
  size: 'md',
  photoUrl: null
})

const initials = computed(() => {
  return props.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
})

const background = computed(() => COLOR_HEX[props.color] ?? COLOR_HEX.blue)

const sizeClass = computed(() => ({
  sm: 'size-7 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-10 text-base'
}[props.size]))
</script>

<template>
  <img
    v-if="photoUrl"
    :src="photoUrl"
    :alt="name"
    class="inline-block rounded-full object-cover shrink-0"
    :class="sizeClass"
  >
  <span
    v-else
    class="inline-flex items-center justify-center rounded-full font-medium text-white shrink-0"
    :class="sizeClass"
    :style="{ backgroundColor: background }"
  >
    {{ initials }}
  </span>
</template>
