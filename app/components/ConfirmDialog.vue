<script setup lang="ts">
const { isOpen, options, handleConfirm, handleCancel } = useConfirm()

function onUpdateOpen(value: boolean) {
  if (!value) handleCancel()
}
</script>

<template>
  <UModal
    :open="isOpen"
    :title="options.title"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <p
        v-if="options.description"
        class="text-sm text-muted"
      >
        {{ options.description }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          :label="options.cancelLabel ?? 'Cancelar'"
          color="neutral"
          variant="ghost"
          @click="handleCancel"
        />
        <UButton
          :label="options.confirmLabel ?? 'Eliminar'"
          :color="options.color ?? 'error'"
          :icon="options.icon"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
