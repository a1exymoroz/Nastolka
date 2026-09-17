import { useConfirmStore } from '../stores/confirm'

// Imperative, window.confirm()-style API backed by a global Pinia store, so
// it works both inside <script setup> components and inside plain
// composable factory functions:
//   const confirm = useConfirm()
//   const confirmed = await confirm({ title, message, confirmText, variant })
export function useConfirm() {
  const store = useConfirmStore()
  return (options) => store.request(options)
}
