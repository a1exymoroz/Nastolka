import { defineStore } from 'pinia'
import { ref } from 'vue'

const AUTO_DISMISS_MS = 6000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function showError(message) {
    // crypto.randomUUID() requires a secure context (HTTPS/localhost) and is
    // unavailable when the dev server is opened over plain HTTP on the LAN.
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    toasts.value = [...toasts.value, { id, message }]
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }

  return {
    toasts,
    showError,
    dismiss,
  }
})
