<script setup>
import { ref } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, default: '' },
})

const STORAGE_PREFIX = 'nastolka-help-dismissed:'

const dismissed = ref(localStorage.getItem(STORAGE_PREFIX + props.id) === '1')

function dismiss() {
  localStorage.setItem(STORAGE_PREFIX + props.id, '1')
  dismissed.value = true
}
</script>

<template>
  <div
    v-if="!dismissed"
    class="mb-6 flex items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-200"
  >
    <span class="mt-0.5 shrink-0" aria-hidden="true">ℹ️</span>
    <div class="min-w-0 flex-1">
      <p v-if="title" class="mb-1 font-semibold">{{ title }}</p>
      <p><slot /></p>
    </div>
    <button
      type="button"
      class="shrink-0 text-xs font-medium text-indigo-300/80 transition hover:text-indigo-100"
      @click="dismiss"
    >
      {{ $t('common.dismiss') }}
    </button>
  </div>
</template>
