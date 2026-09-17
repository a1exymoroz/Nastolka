<script setup>
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirmStore } from '../../stores/confirm'
import BaseButton from './BaseButton.vue'

const { t } = useI18n()
const store = useConfirmStore()
const dialog = computed(() => store.dialog)

const cancelButtonEl = ref(null)
const confirmButtonEl = ref(null)
const lastFocused = ref('cancel')
let previouslyFocusedEl = null

function onKeydown(event) {
  if (event.key === 'Escape') {
    store.cancel()
    return
  }
  // Only 2 focusable elements — Tab and Shift+Tab both just swap them.
  if (event.key === 'Tab') {
    event.preventDefault()
    if (lastFocused.value === 'cancel') confirmButtonEl.value?.focus()
    else cancelButtonEl.value?.focus()
  }
}

watch(
  dialog,
  async (open) => {
    if (open) {
      previouslyFocusedEl = document.activeElement
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      // Focus Cancel, not Confirm, so Enter never accidentally confirms.
      lastFocused.value = 'cancel'
      cancelButtonEl.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
      previouslyFocusedEl?.focus?.()
      previouslyFocusedEl = null
    }
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-scale">
      <div
        v-if="dialog"
        data-testid="confirm-dialog-backdrop"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        @click="store.cancel()"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
          class="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl"
          @click.stop
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            :class="dialog.variant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/50 text-slate-300'"
            aria-hidden="true"
          >
            <svg v-if="dialog.variant === 'danger'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
              <path d="M4 7h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
              <path
                d="M9.5 9.5a2.5 2.5 0 114.2 1.8c-.6.55-1.2.95-1.2 1.95"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path d="M12 16v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>

          <h2 id="confirm-dialog-title" class="mt-4 text-lg font-semibold text-slate-100">{{ dialog.title }}</h2>
          <p v-if="dialog.message" id="confirm-dialog-message" class="mt-2 text-sm text-slate-400">
            {{ dialog.message }}
          </p>

          <div class="mt-6 flex gap-3">
            <BaseButton
              ref="cancelButtonEl"
              variant="secondary"
              class="min-h-[44px] flex-1"
              @focus="lastFocused = 'cancel'"
              @click="store.cancel()"
            >
              {{ dialog.cancelText || t('common.cancel') }}
            </BaseButton>
            <BaseButton
              ref="confirmButtonEl"
              :variant="dialog.variant === 'danger' ? 'dangerSolid' : 'primary'"
              class="min-h-[44px] flex-1"
              @focus="lastFocused = 'confirm'"
              @click="store.confirm()"
            >
              {{ dialog.confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-scale-enter-active,
.confirm-scale-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.confirm-scale-enter-from,
.confirm-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}
</style>
