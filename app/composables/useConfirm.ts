export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'primary' | 'warning' | 'neutral'
  icon?: string
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({ title: '' })
let resolvePromise: ((value: boolean) => void) | null = null

function settle(value: boolean) {
  const resolve = resolvePromise
  resolvePromise = null
  isOpen.value = false
  resolve?.(value)
}

export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    settle(false)
    options.value = opts
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    settle(true)
  }

  function handleCancel() {
    settle(false)
  }

  return { isOpen, options, confirm, handleConfirm, handleCancel }
}
