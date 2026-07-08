<script setup>
/**
 * Step 2 — Three.js canvas area for the die.
 * Next steps: add die mesh, animate roll, then pick the winner.
 */
import { ref, computed, onMounted } from 'vue'
import { DICE_LABELS } from '../utils/diceTypes'
import DiceCanvas from './DiceCanvas.vue'

const props = defineProps({
  games: {
    type: Array,
    required: true,
  },
  diceType: {
    type: String,
    default: 'd6',
  },
})

const emit = defineEmits(['result', 'cancel'])

const isRolling = ref(true)

const diceLabel = computed(() => DICE_LABELS[props.diceType] ?? props.diceType.toUpperCase())

function pickRandomGame() {
  const index = Math.floor(Math.random() * props.games.length)
  return props.games[index]
}

onMounted(async () => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  isRolling.value = false
  emit('result', pickRandomGame())
})
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-center gap-4">
    <p class="text-xs font-medium uppercase tracking-widest text-amber-400">
      {{ diceLabel }}
    </p>

    <DiceCanvas class="w-full" />

    <p class="text-sm text-slate-400">
      {{ isRolling ? 'Rolling…' : 'Done!' }}
    </p>

    <button
      type="button"
      class="text-sm text-slate-500 underline transition hover:text-slate-300"
      :disabled="isRolling"
      @click="emit('cancel')"
    >
      Cancel
    </button>
  </div>
</template>
