import { ref, watch } from 'vue'

// Boolean UI state (collapsed/expanded panels, etc.) persisted across reloads.
// Stored as '1'/'0' strings to match the convention already used by
// InfoPanel.vue's dismissed-banner flags.
export function useLocalStorage(key, defaultValue) {
  let stored = null
  try {
    stored = localStorage.getItem(key)
  } catch {
    // Storage unavailable (private mode, blocked, etc.) — fall back to the default.
  }

  const value = ref(stored === null ? defaultValue : stored === '1')

  watch(value, (v) => {
    try {
      localStorage.setItem(key, v ? '1' : '0')
    } catch {
      // Non-fatal: the preference just won't persist this time.
    }
  })

  return value
}
