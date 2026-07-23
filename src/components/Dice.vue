<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { DICE_LABELS, getDiceSides } from '../utils/diceTypes'
import { mountPhysicsWithRapierAndThree } from '../views/physics-with-rapier-and-three-variations/index.js'

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

const AUTO_CLOSE_SECONDS = 10

const container = ref(null)
const isRolling = ref(true)
const resultGame = ref(null)
const secondsLeft = ref(AUTO_CLOSE_SECONDS)
let sceneApi = null
let autoCloseTimer = null
let countdownInterval = null

const diceLabel = computed(() => DICE_LABELS[props.diceType] ?? props.diceType.toUpperCase())
const sides = computed(() => getDiceSides(props.diceType))

function gameForValue(value) {
  const index = Math.floor(((value - 1) * props.games.length) / sides.value)
  return props.games[Math.min(index, props.games.length - 1)]
}

const legend = computed(() =>
  Array.from({ length: sides.value }, (_, i) => {
    const value = i + 1
    return { value, game: gameForValue(value) }
  }),
)

function clearTimers() {
  clearTimeout(autoCloseTimer)
  clearInterval(countdownInterval)
}

function closeWithResult() {
  clearTimers()
  emit('result', resultGame.value)
}

function handleButtonClick() {
  if (resultGame.value) {
    closeWithResult()
  } else {
    emit('cancel')
  }
}

function reroll() {
  clearTimers()
  resultGame.value = null
  isRolling.value = true
  sceneApi?.roll()
}

onMounted(async () => {
  if (!container.value) {
    return
  }

  sceneApi = await mountPhysicsWithRapierAndThree(container.value, {
    initialDiceType: props.diceType,
    onRolling: () => {
      isRolling.value = true
    },
    onResult: (value) => {
      isRolling.value = false
      resultGame.value = gameForValue(value)
      secondsLeft.value = AUTO_CLOSE_SECONDS
      countdownInterval = setInterval(() => {
        secondsLeft.value -= 1
      }, 1000)
      autoCloseTimer = setTimeout(closeWithResult, AUTO_CLOSE_SECONDS * 1000)
    },
  })
})

onUnmounted(() => {
  clearTimers()
  sceneApi?.dispose()
  sceneApi = null
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-950">
    <div ref="container" class="absolute inset-0" aria-label="Dice roll area" />

    <div class="pointer-events-none relative z-10 flex h-full flex-col justify-between p-6">
      <div class="flex items-start justify-between">
        <p
          class="pointer-events-auto rounded-lg bg-slate-900/80 px-4 py-2 text-sm font-medium uppercase tracking-widest text-amber-400"
        >
          {{ diceLabel }} — {{ isRolling ? 'Rolling…' : 'Done!' }}
        </p>
        <button
          type="button"
          class="pointer-events-auto rounded-lg bg-slate-900/80 px-4 py-2 text-sm text-slate-300 underline transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isRolling"
          @click="handleButtonClick"
        >
          {{ resultGame ? `Close (${secondsLeft}s)` : 'Cancel' }}
        </button>
      </div>

      <div
        v-if="resultGame"
        class="pointer-events-auto mx-auto rounded-2xl border border-amber-500/40 bg-slate-900/90 px-10 py-8 text-center"
      >
        <p class="text-sm font-medium uppercase tracking-widest text-amber-400">Tonight's pick</p>
        <p class="mt-2 text-4xl font-bold text-white">{{ resultGame.name }}</p>
        <div class="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            class="text-sm text-slate-400 underline transition hover:text-slate-200"
            @click="reroll"
          >
            Reroll
          </button>
          <button
            type="button"
            class="text-sm text-slate-400 underline transition hover:text-slate-200"
            @click="closeWithResult"
          >
            Close now
          </button>
        </div>
      </div>

      <div
        v-if="!isRolling"
        class="pointer-events-auto mx-auto w-full max-w-lg rounded-xl bg-slate-900/80 p-4"
      >
        <p class="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          Which number picks which game
        </p>
        <ul class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-200 sm:grid-cols-3">
          <li
            v-for="entry in legend"
            :key="entry.value"
            class="flex items-center gap-2"
            :class="{ 'font-bold text-amber-300': entry.game === resultGame }"
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-900"
              :class="entry.game === resultGame ? 'bg-white' : 'bg-amber-500'"
            >
              {{ entry.value }}
            </span>
            <span class="truncate">{{ entry.game.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
