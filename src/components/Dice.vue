<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  games: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['result', 'cancel'])

const isRolling = ref(false)
const diceRef = ref(null)

function pickRandomGame() {
  const index = Math.floor(Math.random() * props.games.length)
  return props.games[index]
}

async function roll() {
  if (isRolling.value || props.games.length === 0) return

  isRolling.value = true

  // TODO: Add dice rolling animation
  // Example approach:
  // 1. Add a CSS keyframe animation class to diceRef
  // 2. await a Promise that resolves when the animation ends (animationend event)
  // 3. Remove the animation class

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const winner = pickRandomGame()
  isRolling.value = false
  emit('result', winner)
}

onMounted(() => {
  roll()
})
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <div
      ref="diceRef"
      class="dice flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-slate-600 bg-slate-800 text-5xl shadow-lg"
      :class="{ 'dice--rolling': isRolling }"
    >
      🎲
    </div>

    <p class="text-sm text-slate-400">
      {{ isRolling ? 'Rolling…' : 'Done!' }}
    </p>

    <button
      class="text-sm text-slate-500 underline transition hover:text-slate-300"
      :disabled="isRolling"
      @click="emit('cancel')"
    >
      Cancel
    </button>
  </div>
</template>

<style scoped>
/* TODO: Add dice rolling animation */
.dice--rolling {
  /* placeholder — replace with your animation */
  animation: dice-shake 0.15s ease-in-out infinite;
}

@keyframes dice-shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg) scale(1.05);
  }
  75% {
    transform: rotate(8deg) scale(1.05);
  }
}
</style>
