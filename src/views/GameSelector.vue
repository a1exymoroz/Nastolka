<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Dice from '../components/Dice.vue'

const router = useRouter()
const auth = useAuthStore()

const games = ref([])
const selectedIds = ref(new Set())
const loading = ref(true)
const showDice = ref(false)
const winner = ref(null)

const selectedGames = computed(() =>
  games.value.filter((game) => selectedIds.value.has(game.id)),
)

const canRoll = computed(() => selectedGames.value.length >= 2)

onMounted(async () => {
  await fetchGames()
})

async function fetchGames() {
  loading.value = true

  // TODO: Replace mock data with a real API call
  // const response = await fetch('/api/games', {
  //   headers: { Authorization: `Bearer ${auth.token}` },
  // })
  // games.value = await response.json()

  games.value = [
    { id: 1, name: 'Catan', players: '3–4', duration: '60–90 min' },
    { id: 2, name: 'Ticket to Ride', players: '2–5', duration: '30–60 min' },
    { id: 3, name: 'Codenames', players: '4–8', duration: '15 min' },
    { id: 4, name: 'Azul', players: '2–4', duration: '30–45 min' },
    { id: 5, name: 'Wingspan', players: '1–5', duration: '40–70 min' },
    { id: 6, name: 'Splendor', players: '2–4', duration: '30 min' },
  ]

  loading.value = false
}

function toggleGame(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
  winner.value = null
}

function startRoll() {
  winner.value = null
  showDice.value = true
}

function onDiceResult(game) {
  winner.value = game
  showDice.value = false
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
        <h1 class="text-3xl font-bold tracking-tight">Nastolka</h1>
        <p class="mt-1 text-slate-400">Pick your contenders, then let the dice decide</p>
      </div>
      <button
        class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="logout"
      >
        Log out
      </button>
    </header>

    <section v-if="loading" class="py-20 text-center text-slate-400">Loading games…</section>

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
            </div>
          </div>
        </li>
      </ul>

      <div v-if="canRoll" class="mt-10 flex flex-col items-center gap-6">
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
          @result="onDiceResult"
          @cancel="onDiceCancel"
        />
      </div>

      <div
        v-if="winner"
        class="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-8 text-center"
      >
        <p class="text-sm font-medium uppercase tracking-widest text-amber-400">Tonight's pick</p>
        <p class="mt-2 text-4xl font-bold">{{ winner.name }}</p>
        <p class="mt-2 text-slate-400">{{ winner.players }} · {{ winner.duration }}</p>
      </div>
    </section>
  </div>
</template>
