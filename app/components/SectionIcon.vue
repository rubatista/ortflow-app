<script setup lang="ts">
const props = withDefaults(defineProps<{
  icon: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md'
}>(), {
  color: 'primary',
  size: 'md'
})

// Classes escritas por extenso (não interpoladas) para o Tailwind conseguir detetá-las em build.
const COLOR_CLASSES = {
  primary: { box: 'bg-primary/10', icon: 'text-primary' },
  secondary: { box: 'bg-secondary/10', icon: 'text-secondary' },
  success: { box: 'bg-success/10', icon: 'text-success' },
  warning: { box: 'bg-warning/10', icon: 'text-warning' },
  error: { box: 'bg-error/10', icon: 'text-error' },
  info: { box: 'bg-info/10', icon: 'text-info' },
  neutral: { box: 'bg-elevated', icon: 'text-highlighted' }
} as const

const sizeClasses = computed(() => ({
  sm: { box: 'p-1.5 rounded-lg', icon: 'size-3.5' },
  md: { box: 'p-2.5 rounded-xl', icon: 'size-5' }
}[props.size]))
</script>

<template>
  <div
    class="inline-flex items-center justify-center shrink-0"
    :class="[COLOR_CLASSES[color].box, sizeClasses.box]"
  >
    <UIcon
      :name="icon"
      :class="[COLOR_CLASSES[color].icon, sizeClasses.icon]"
    />
  </div>
</template>
