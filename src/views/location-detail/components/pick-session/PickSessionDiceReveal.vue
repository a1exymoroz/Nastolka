<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { mountPhysicsWithRapierAndThree } from '../../../physics-with-rapier-and-three-variations/index.js'
import { simulateDiceRoll } from '../../../physics-with-rapier-and-three-variations/simulateDiceRoll.js'
import { PHYSICS_DICE_TYPES } from '../../../physics-with-rapier-and-three-variations/getDiceResult.js'
import { buildDiceLegend, orderGamesForKnownResult, pickDiceTypeForGameCount } from '../../../../utils/diceTypes'
import { createSeededRandom } from '../../../../utils/seededRandom'

// The winning game is already decided server-side by the time this shows —
// this is purely a shared, suspenseful "rolling" moment for everyone watching
// live, not a mechanism that picks the winner (unlike the old client-only
// dice roll). `seed` is derived by the parent from data every viewer receives
// identically in the same completion broadcast, so the physics roll
// (deterministic given the same starting spin) plays out the same way on
// every screen. Before the animated roll starts, the same seed is replayed
// headlessly (simulateDiceRoll) to learn in advance which face it lands on,
// and the survivor games are ordered so the actual winner sits under that
// face — so the "which number picks which game" legend shown up front stays
// truthful even though the roll itself doesn't decide the winner.
const props = defineProps({
  survivors: { type: Array, required: true },
  winnerGameId: { type: [String, Number], required: true },
  seed: { type: String, required: true },
})

const emit = defineEmits(['done'])
const { t } = useI18n()

// The reveal has three timed beats: linger on the legend so everyone can see
// what's still in the pool, let the roll itself play out, then linger on the
// result before moving on. Only the middle beat's length comes from physics
// (see GRAVITY_Y in createWorld.js) — these two are plain delays.
const PRE_ROLL_DELAY_MS = 2500
const POST_RESULT_DELAY_MS = 3500

const container = ref(null)
const isRolling = ref(true)
const legend = ref([])
let sceneApi = null
let preRollTimer = null
let doneTimer = null

const diceType = computed(() => pickDiceTypeForGameCount(props.survivors.length, PHYSICS_DICE_TYPES))

function finish() {
  clearTimeout(preRollTimer)
  clearTimeout(doneTimer)
  emit('done')
}

function wait(ms) {
  return new Promise((resolve) => {
    preRollTimer = setTimeout(resolve, ms)
  })
}

onMounted(async () => {
  // Mount the scene (floor, lights, camera) right away, with autoRoll off, so
  // the table is visible under the legend instead of a bare black screen —
  // the die itself only drops once .roll() is called below, after the delay.
  const simulateResultPromise = simulateDiceRoll({
    diceType: diceType.value,
    rng: createSeededRandom(props.seed),
  })

  if (!container.value) return

  sceneApi = await mountPhysicsWithRapierAndThree(container.value, {
    initialDiceType: diceType.value,
    rng: createSeededRandom(props.seed),
    autoRoll: false,
    onRolling: () => {
      isRolling.value = true
    },
    onResult: () => {
      isRolling.value = false
      doneTimer = setTimeout(finish, POST_RESULT_DELAY_MS)
    },
  })

  const landedValue = await simulateResultPromise
  const orderedGames = orderGamesForKnownResult(
    props.survivors,
    props.winnerGameId,
    diceType.value,
    landedValue,
  )
  legend.value = buildDiceLegend(orderedGames, diceType.value)

  await wait(PRE_ROLL_DELAY_MS)

  sceneApi?.roll()
})

onUnmounted(() => {
  clearTimeout(preRollTimer)
  clearTimeout(doneTimer)
  sceneApi?.dispose()
  sceneApi = null
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-950">
    <div ref="container" class="absolute inset-0" :aria-label="t('pickSession.result.rolling')" />

    <div class="pointer-events-none relative z-10 flex h-full flex-col justify-between gap-3 p-4 sm:gap-0 sm:p-6">
      <div class="flex items-start justify-between">
        <p
          class="pointer-events-auto rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-amber-400 sm:px-4 sm:py-2 sm:text-sm"
        >
          {{ isRolling ? t('pickSession.result.rolling') : t('dice.done') }}
        </p>
        <button
          type="button"
          class="pointer-events-auto rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 underline transition hover:text-white sm:px-4 sm:py-2 sm:text-sm"
          @click="finish"
        >
          {{ t('pickSession.result.skip') }}
        </button>
      </div>

      <div
        v-if="legend.length"
        class="pointer-events-auto mx-auto max-h-[30vh] w-full max-w-lg overflow-y-auto rounded-xl bg-slate-900/80 p-3 sm:max-h-[40vh] sm:p-4"
      >
        <p class="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          {{ t('dice.whichNumberPicks') }}
        </p>
        <ul class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-200 sm:grid-cols-3 sm:gap-x-6 sm:text-sm">
          <li v-for="entry in legend" :key="entry.value" class="flex items-center gap-2">
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 sm:h-6 sm:w-6 sm:text-xs"
            >
              {{ entry.value }}
            </span>
            <span class="truncate">{{ entry.game.gameName }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
