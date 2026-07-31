<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  text: { type: String, required: true },
  label: { type: String, default: '' },
})

const { t } = useI18n()

const open = ref(false)
const rootEl = ref(null)
const tooltipId = `help-tooltip-${Math.random().toString(36).slice(2, 9)}`

function toggle() {
  open.value = !open.value
}

function onDocClick(event) {
  if (rootEl.value && !rootEl.value.contains(event.target)) {
    open.value = false
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <span
    ref="rootEl"
    class="relative inline-flex"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <button
      type="button"
      class="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-semibold text-slate-400 transition hover:border-slate-400 hover:text-slate-200"
      :aria-label="label || t('common.whatsThis')"
      :aria-describedby="open ? tooltipId : undefined"
      @click.stop="toggle"
      @focus="open = true"
      @blur="open = false"
    >
      ?
    </button>
    <span
      v-if="open"
      :id="tooltipId"
      role="tooltip"
      class="absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs font-normal text-slate-200 shadow-lg"
    >
      {{ text }}
    </span>
  </span>
</template>
