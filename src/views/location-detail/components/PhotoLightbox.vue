<script setup>
defineProps({
  url: { type: String, default: null },
})

defineEmits(['close'])
</script>

<template>
  <div
    v-if="url"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    @click="$emit('close')"
  >
    <button
      type="button"
      class="absolute right-4 top-4 text-3xl leading-none text-slate-300 hover:text-white"
      @click="$emit('close')"
    >
      ✕
    </button>
    <img :src="url" alt="" class="max-h-full max-w-full rounded-lg object-contain" />
  </div>
</template>
