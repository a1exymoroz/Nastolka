<script setup>
defineProps({
  invalid: { type: Boolean, default: false },
})

const model = defineModel()
</script>

<template>
  <input
    v-model="model"
    :aria-invalid="invalid"
    class="rounded-lg border bg-slate-800 text-slate-100 outline-none transition focus:ring-2"
    :class="
      invalid
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
        : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
    "
  />
</template>
