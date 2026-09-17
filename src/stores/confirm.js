import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfirmStore = defineStore('confirm', () => {
  const dialog = ref(null) // { title, message, confirmText, cancelText, variant } | null
  let resolveFn = null

  function request(options) {
    // Resolve any stale pending confirmation as cancelled rather than
    // leaving its caller's promise hanging forever.
    resolveFn?.(false)
    dialog.value = options
    return new Promise((resolve) => {
      resolveFn = resolve
    })
  }

  function confirm() {
    resolveFn?.(true)
    resolveFn = null
    dialog.value = null
  }

  function cancel() {
    resolveFn?.(false)
    resolveFn = null
    dialog.value = null
  }

  return { dialog, request, confirm, cancel }
})
