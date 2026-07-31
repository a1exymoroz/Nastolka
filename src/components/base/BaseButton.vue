<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  size: { type: String, default: 'md' }, // sm | md
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const VARIANT_CLASSES = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
  secondary: 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white',
  danger: 'border border-red-500/30 text-red-400 hover:border-red-500 hover:text-red-300',
  ghost: 'text-slate-400 hover:text-slate-200',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
}
</script>

<template>
  <button
    type="button"
    :disabled="loading || disabled"
    :aria-busy="loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="[VARIANT_CLASSES[variant], SIZE_CLASSES[size], block ? 'w-full' : '']"
  >
    <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
