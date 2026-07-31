<script setup>
defineProps({
  variant: { type: String, default: 'error' }, // error | info | success
  size: { type: String, default: 'md' }, // sm | md
})

const VARIANT_CLASSES = {
  error: 'bg-red-500/10 text-red-400',
  info: 'bg-indigo-500/10 text-indigo-300',
  success: 'bg-emerald-500/10 text-emerald-400',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2 text-sm',
}
</script>

<template>
  <p class="rounded-lg" :class="[VARIANT_CLASSES[variant], SIZE_CLASSES[size]]" role="alert">
    <slot />
  </p>
</template>
