import { defineStore } from 'pinia'
import { ref } from 'vue'

const AUTO_DISMISS_MS = 6000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function showError(message) {
    const id = crypto.randomUUID()
    toasts.value = [...toasts.value, { id, message }]
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }

  return {
    toasts,
    showError,
    dismiss,
  }
})
