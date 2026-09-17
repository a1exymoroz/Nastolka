<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { mountPhysicsWithRapierAndThree } from '../../../physics-with-rapier-and-three-variations/index.js'
import { PHYSICS_DICE_TYPES } from '../../../physics-with-rapier-and-three-variations/getDiceResult.js'
import { pickDiceTypeForGameCount } from '../../../../utils/diceTypes'
import { createSeededRandom } from '../../../../utils/seededRandom'

// The winning game is already decided server-side by the time this shows —
// this is purely a shared, suspenseful "rolling" moment for everyone watching
// live, not a mechanism that picks the winner (unlike the old client-only
// dice roll), so it deliberately ignores the physics result value. `seed`
// is derived by the parent from data every viewer receives identically in
// the same completion broadcast, so the physics roll (deterministic given
// the same starting spin) plays out the same way on every screen.
const props = defineProps({
  gameCount: { type: Number, default: 2 },
  seed: { type: String, required: true },
})

const emit = defineEmits(['done'])
const { t } = useI18n()

const container = ref(null)
const isRolling = ref(true)
let sceneApi = null
let doneTimer = null

const diceType = computed(() => pickDiceTypeForGameCount(props.gameCount, PHYSICS_DICE_TYPES))

function finish() {
  clearTimeout(doneTimer)
  emit('done')
}

onMounted(async () => {
  if (!container.value) return

  sceneApi = await mountPhysicsWithRapierAndThree(container.value, {
    initialDiceType: diceType.value,
    rng: createSeededRandom(props.seed),
    onRolling: () => {
      isRolling.value = true
    },
    onResult: () => {
      isRolling.value = false
      doneTimer = setTimeout(finish, 1200)
    },
  })
})

onUnmounted(() => {
  clearTimeout(doneTimer)
  sceneApi?.dispose()
  sceneApi = null
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-950">
    <div ref="container" class="absolute inset-0" :aria-label="t('pickSession.result.rolling')" />

    <div class="pointer-events-none relative z-10 flex h-full flex-col justify-between p-4 sm:p-6">
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
      <div />
    </div>
  </div>
</template>
