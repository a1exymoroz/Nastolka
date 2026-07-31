<script setup>
import BaseModal from '../../../components/base/BaseModal.vue'

defineProps({
  url: { type: String, default: null },
})

defineEmits(['close'])
</script>

<template>
  <BaseModal :model-value="!!url" bare @close="$emit('close')">
    <img :src="url" alt="" class="max-h-full max-w-full rounded-lg object-contain" />
  </BaseModal>
</template>
