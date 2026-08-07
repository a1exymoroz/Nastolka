<script setup>
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <Teleport to="body">
    <div class="fixed right-5 top-5 z-50 flex w-full max-w-sm flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="flex items-start gap-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-lg shadow-black/30 backdrop-blur"
          role="alert"
        >
          <p class="flex-1">{{ toast.message }}</p>
          <button
            type="button"
            class="shrink-0 text-red-400/70 transition hover:text-red-300"
            :aria-label="$t('common.dismiss')"
            @click="toastStore.dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.15s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
