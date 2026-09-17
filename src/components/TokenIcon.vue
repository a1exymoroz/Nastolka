<script setup>
defineProps({
  token: { type: Object, required: true },
})
</script>

<template>
  <img
    v-if="token?.image"
    :src="token.image"
    alt=""
    class="rounded-sm object-cover"
    :class="{ border: token.frameColor }"
    :style="{ borderColor: token.frameColor }"
  />
  <svg v-else-if="token" :viewBox="token.viewBox" :fill="token.color">
    <path :d="token.path" />
  </svg>
</template>
