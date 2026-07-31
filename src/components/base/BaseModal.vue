<script setup>
import { nextTick, ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  bare: { type: Boolean, default: false },
  closeOnBackdrop: { type: Boolean, default: true },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'close'])

const closeButtonEl = ref(null)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onBackdropClick() {
  if (props.closeOnBackdrop) close()
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      closeButtonEl.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel || title || undefined"
        @click="onBackdropClick"
      >
        <div v-if="bare" class="relative max-h-full max-w-full" @click.stop>
          <button
            ref="closeButtonEl"
            type="button"
            class="absolute right-2 top-2 z-10 text-3xl leading-none text-slate-300 transition hover:text-white"
            :aria-label="$t('common.close')"
            @click="close"
          >
            ✕
          </button>
          <slot />
        </div>

        <div
          v-else
          class="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
          @click.stop
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <slot name="header">
              <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
            </slot>
            <button
              ref="closeButtonEl"
              type="button"
              class="shrink-0 text-slate-400 transition hover:text-slate-200"
              :aria-label="$t('common.close')"
              @click="close"
            >
              ✕
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
