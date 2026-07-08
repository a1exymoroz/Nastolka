<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { mountPhysicsWithRapierAndThree } from './physics-with-rapier-and-three-variations/index.js'

const mountEl = ref(null)
let disposeScene = null

onMounted(async () => {
  if (!mountEl.value) {
    return
  }
  disposeScene = await mountPhysicsWithRapierAndThree(mountEl.value)
})

onUnmounted(() => {
  if (disposeScene) {
    disposeScene()
  }
})
</script>

<template>
  <div ref="mountEl" class="h-screen w-full overflow-hidden" />
</template>
