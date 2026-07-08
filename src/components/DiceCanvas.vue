<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createDiceScene } from '../utils/createDiceScene'

const container = ref(null)
let sceneApi = null

onMounted(() => {
  if (container.value) {
    sceneApi = createDiceScene(container.value)
  }
})

onUnmounted(() => {
  sceneApi?.dispose()
  sceneApi = null
})

defineExpose({ getScene: () => sceneApi })
</script>

<template>
  <div
    ref="container"
    class="h-64 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
    aria-label="Dice roll area"
  />
</template>
