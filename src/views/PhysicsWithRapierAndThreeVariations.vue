<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { DICE_LABELS } from '../utils/diceTypes'
import { mountPhysicsWithRapierAndThree } from './physics-with-rapier-and-three-variations/index.js'
import { PHYSICS_DICE_TYPES } from './physics-with-rapier-and-three-variations/getDiceResult.js'

const mountEl = ref(null)
const diceType = ref('d6')
const diceResult = ref(null)
let sceneApi = null

onMounted(async () => {
  if (!mountEl.value) {
    return
  }
  sceneApi = await mountPhysicsWithRapierAndThree(mountEl.value, {
    initialDiceType: diceType.value,
    onResult: (value) => {
      diceResult.value = value
    },
    onRolling: () => {
      diceResult.value = null
    },
  })
})

onUnmounted(() => {
  sceneApi?.dispose()
})

function onDiceTypeChange() {
  sceneApi?.setDiceType(diceType.value)
}
</script>

<template>
  <div class="relative h-screen w-full overflow-hidden">
    <div ref="mountEl" class="h-full w-full" />

    <div class="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
      <label class="pointer-events-auto flex flex-col gap-1 text-sm text-slate-300">
        <span>Dice type</span>
        <select
          v-model="diceType"
          class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
          @change="onDiceTypeChange"
        >
          <option v-for="type in PHYSICS_DICE_TYPES" :key="type" :value="type">
            {{ DICE_LABELS[type] }}
          </option>
        </select>
      </label>
      <p class="text-xs text-slate-400">Click the scene to re-roll</p>
    </div>

    <p
      v-if="diceResult !== null"
      class="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900/80 px-6 py-3 text-2xl font-bold text-amber-400"
    >
      Result: {{ diceResult }}
    </p>
  </div>
</template>
