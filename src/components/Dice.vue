<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

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
    <div ref="container" class="absolute inset-0" :aria-label="t('dice.whichNumberPicks')" />

    <div class="pointer-events-none relative z-10 flex h-full flex-col justify-between gap-3 p-4 sm:gap-0 sm:p-6">
      <div class="flex items-start justify-between">
        <p
          class="pointer-events-auto rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-amber-400 sm:px-4 sm:py-2 sm:text-sm"
        >
          {{ diceLabel }} — {{ isRolling ? $t('dice.rolling') : $t('dice.done') }}
        </p>
        <button
          type="button"
          class="pointer-events-auto rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 underline transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
          :disabled="isRolling"
          @click="handleButtonClick"
        >
          {{ resultGame ? $t('dice.closeWithSeconds', { seconds: secondsLeft }) : $t('dice.cancel') }}
        </button>
      </div>

      <div
        v-if="resultGame"
        class="pointer-events-auto mx-auto rounded-2xl border border-amber-500/40 bg-slate-900/90 px-6 py-5 text-center sm:px-10 sm:py-8"
      >
        <p class="text-sm font-medium uppercase tracking-widest text-amber-400">{{ $t('dice.tonightsPick') }}</p>
        <p class="mt-2 text-3xl font-bold text-white sm:text-4xl">{{ resultGame.name }}</p>
        <div class="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            class="text-sm text-slate-400 underline transition hover:text-slate-200"
            @click="reroll"
          >
            {{ $t('dice.reroll') }}
          </button>
          <button
            type="button"
            class="text-sm text-slate-400 underline transition hover:text-slate-200"
            @click="closeWithResult"
          >
            {{ $t('dice.closeNow') }}
          </button>
        </div>
      </div>

      <div
        v-if="!isRolling"
        class="pointer-events-auto mx-auto max-h-[30vh] w-full max-w-lg overflow-y-auto rounded-xl bg-slate-900/80 p-3 sm:max-h-[40vh] sm:p-4"
      >
        <p class="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          {{ $t('dice.whichNumberPicks') }}
        </p>
        <ul class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-200 sm:grid-cols-3 sm:gap-x-6 sm:text-sm">
          <li
            v-for="entry in legend"
            :key="entry.value"
            class="flex items-center gap-2"
            :class="{ 'font-bold text-amber-300': entry.game === resultGame }"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-slate-900 sm:h-6 sm:w-6 sm:text-xs"
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
