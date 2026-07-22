<script setup>
/**
 * Dice Playground — test the dice roll in isolation.
 * Uses fake games so you don't need to pick from the list.
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DICE_LABELS, getDiceSides } from '../utils/diceTypes'
import { PHYSICS_DICE_TYPES } from './physics-with-rapier-and-three-variations/getDiceResult.js'
import Dice from '../components/Dice.vue'

const router = useRouter()

const gameCount = ref(4)
const diceType = ref('d6')
const rollKey = ref(0)
const winner = ref(null)
const showDice = ref(false)

// Every fake game needs its own number on the die, so only offer dice with enough faces.
const availableDiceTypes = computed(() =>
  PHYSICS_DICE_TYPES.filter((type) => getDiceSides(type) >= gameCount.value),
)

watch(availableDiceTypes, (types) => {
  if (types.length && !types.includes(diceType.value)) {
    diceType.value = types[0]
  }
})

const mockGames = () =>
  Array.from({ length: gameCount.value }, (_, index) => ({
    id: index + 1,
    name: `Game ${index + 1}`,
    players: '2–4',
    duration: '60 min',
  }))

function roll() {
  winner.value = null
  rollKey.value += 1
  showDice.value = true
}

function onResult(game) {
  winner.value = game
  showDice.value = false
}

function onCancel() {
  showDice.value = false
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <header class="mb-10">
      <button
        type="button"
        class="text-sm text-slate-400 underline transition hover:text-slate-200"
        @click="router.push({ name: 'locations' })"
      >
        ← Back to locations
      </button>
      <h1 class="mt-4 text-2xl font-bold tracking-tight">Dice Playground</h1>
      <p class="mt-1 text-sm text-slate-400">
        Try the dice roll here before we add animation.
      </p>
    </header>

    <label class="mb-4 flex flex-col gap-2 text-sm text-slate-400">
      Dice type
      <select
        v-model="diceType"
        class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
      >
        <option v-for="type in availableDiceTypes" :key="type" :value="type">
          {{ DICE_LABELS[type] }}
        </option>
      </select>
    </label>

    <label class="mb-6 flex flex-col gap-2 text-sm text-slate-400">
      Fake games in the pool: {{ gameCount }}
      <input
        v-model.number="gameCount"
        type="range"
        min="2"
        max="12"
        step="1"
        class="accent-amber-400"
      />
    </label>

    <button
      type="button"
      class="w-full rounded-xl bg-amber-500 py-3 font-bold text-slate-900 transition hover:bg-amber-400"
      @click="roll"
    >
      Roll dice
    </button>

    <Dice
      v-if="showDice"
      :key="rollKey"
      :games="mockGames()"
      :dice-type="diceType"
      @result="onResult"
      @cancel="onCancel"
    />

    <div
      v-if="winner"
      class="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-center"
    >
      <p class="text-xs font-medium uppercase tracking-widest text-amber-400">Winner</p>
      <p class="mt-2 text-2xl font-bold">{{ winner.name }}</p>
    </div>
  </div>
</template>
