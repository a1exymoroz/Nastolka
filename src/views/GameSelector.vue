<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiUrl } from '../config/api'
import { DICE_LABELS, pickDiceTypeForGameCount } from '../utils/diceTypes'
import { PHYSICS_DICE_TYPES } from './physics-with-rapier-and-three-variations/getDiceResult.js'
import Dice from '../components/Dice.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const location = ref(null)
const games = ref([])
const selectedIds = ref(new Set())
const loading = ref(true)
const error = ref('')
const showDice = ref(false)

const selectedGames = computed(() =>
  games.value.filter((game) => selectedIds.value.has(game.id)),
)

const canRoll = computed(() => selectedGames.value.length >= 2)

// Pick the die that best fits the pool so every game gets a fair shot.
const diceType = computed(() =>
  pickDiceTypeForGameCount(selectedGames.value.length, PHYSICS_DICE_TYPES),
)

onMounted(async () => {
  await Promise.all([fetchLocation(), fetchGames()])
})

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${auth.token}`, ...extra }
}

async function fetchLocation() {
  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}`), {
      headers: authHeaders(),
    })
    if (response.ok) {
      location.value = await response.json()
    }
  } catch {
    // Non-fatal: the header just falls back to a generic title.
  }
}

async function fetchGames() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}/games`), {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to load games for this location')
    }

    games.value = await response.json()
  } catch (e) {
    error.value = e.message || 'Failed to load games for this location'
  } finally {
    loading.value = false
  }
}

function toggleGame(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

function startRoll() {
  showDice.value = true
}

function onDiceResult(game) {
  showDice.value = false
  router.push({
    name: 'location-history-new',
    params: { id: route.params.id },
    query: { gameId: game.id },
  })
}

function onDiceCancel() {
  showDice.value = false
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <header class="mb-10 flex items-center justify-between">
      <div>
        <button
          type="button"
          class="mb-2 text-sm text-slate-400 underline transition hover:text-slate-200"
          @click="router.push({ name: 'location-detail', params: { id: route.params.id } })"
        >
          ← Back to {{ location ? location.name : 'location' }}
        </button>
        <h1 class="text-3xl font-bold tracking-tight">{{ location ? location.name : 'Nastolka' }}</h1>
        <p class="mt-1 text-slate-400">Pick your contenders, then let the dice decide</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="auth.isAdmin"
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="router.push({ name: 'admin' })"
        >
          Admin
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="router.push({ name: 'locations' })"
        >
          Locations
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="router.push({ name: 'dice-playground' })"
        >
          Dice playground
        </button>
        <button
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="logout"
        >
          Log out
        </button>
      </div>
    </header>

    <section v-if="loading" class="py-20 text-center text-slate-400">Loading games…</section>

    <section v-else-if="error" class="py-20 text-center">
      <p class="text-red-400">{{ error }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="fetchGames"
      >
        Try again
      </button>
    </section>

    <p v-else-if="games.length === 0" class="py-20 text-center text-slate-500">
      No games at this location yet.
      <router-link
        :to="{ name: 'location-detail', params: { id: route.params.id } }"
        class="text-indigo-400 hover:text-indigo-300"
      >
        Add some
      </router-link>
    </p>

    <section v-else>
      <p class="mb-4 text-sm text-slate-400">
        Selected: {{ selectedGames.length }}
        <span v-if="selectedGames.length < 2"> — choose at least 2 to roll</span>
      </p>

      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="game in games"
          :key="game.id"
          role="button"
          tabindex="0"
          class="cursor-pointer rounded-xl border p-5 transition"
          :class="
            selectedIds.has(game.id)
              ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/40'
              : 'border-slate-800 bg-slate-900 hover:border-slate-600'
          "
          @click="toggleGame(game.id)"
          @keydown.enter.space.prevent="toggleGame(game.id)"
        >
          <img
            v-if="game.photo"
            :src="game.photo"
            :alt="game.name"
            class="mb-3 -mx-5 -mt-5 h-32 w-[calc(100%+2.5rem)] rounded-t-xl object-cover"
          />
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              :checked="selectedIds.has(game.id)"
              class="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              @click.stop
              @change="toggleGame(game.id)"
            />
            <div>
              <h2 class="font-semibold">{{ game.name }}</h2>
              <p class="mt-1 text-sm text-slate-400">
                {{ game.players }} · {{ game.duration }}
              </p>
              <router-link
                :to="{ name: 'game-detail', params: { id: game.id } }"
                class="mt-1 inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300"
                @click.stop
              >
                View details
              </router-link>
            </div>
          </div>
        </li>
      </ul>

      <div v-if="canRoll" class="mt-10 flex flex-col items-center gap-6">
        <p v-if="!showDice" class="text-sm text-slate-400">
          Rolling a <span class="font-semibold text-slate-200">{{ DICE_LABELS[diceType] }}</span>
        </p>

        <button
          v-if="!showDice"
          class="rounded-xl bg-amber-500 px-8 py-3 text-lg font-bold text-slate-900 transition hover:bg-amber-400"
          @click="startRoll"
        >
          Roll the Dice
        </button>

        <Dice
          v-if="showDice"
          :games="selectedGames"
          :dice-type="diceType"
          @result="onDiceResult"
          @cancel="onDiceCancel"
        />
      </div>
    </section>
  </div>
</template>
