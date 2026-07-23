<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiUrl } from '../config/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isEdit = computed(() => !!route.params.historyId)

const location = ref(null)
const locationGames = ref([])
const shares = ref([])
const pageLoading = ref(true)
const pageError = ref('')

// TODO: confirm the exact field the backend uses for the owner's username on
// LocationResponse (assuming `ownerUsername`, falling back to `owner.username`).
const canManage = computed(() => {
  if (!location.value) return false
  const ownerUsername = location.value.ownerUsername ?? location.value.owner?.username
  return auth.isAdmin || ownerUsername === auth.user?.username
})

// Only the owner and users the location has been shared with are eligible
// to be tagged as history players.
const eligiblePlayers = computed(() => {
  const ownerUsername = location.value?.ownerUsername ?? location.value?.owner?.username
  const usernames = shares.value.map((s) => s.username ?? s.targetUsername)
  if (ownerUsername) usernames.unshift(ownerUsername)
  return [...new Set(usernames)]
})

const HISTORY_STATES = ['CREATED', 'IN_PROGRESS', 'FINISHED']

function emptyPlayerRow() {
  return { username: '', points: '' }
}

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nowDateTimeString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function emptyHistoryForm() {
  // `players` is entered in finishing order — index 0 = 1st place, etc. —
  // rather than asking for a manual placement number per row, so the
  // permutation-of-1..N constraint the backend validates is automatic.
  // Placement is only sent to the server once state is FINISHED; points has
  // no such restriction and is sent whenever filled in.
  return {
    gameId: '',
    state: 'CREATED',
    playedAt: todayDateString(),
    startedAt: nowDateTimeString(),
    finishedAt: '',
    players: [emptyPlayerRow()],
    rating: '',
    expansionIds: [],
  }
}

const form = ref(emptyHistoryForm())
const formLoading = ref(false)
const formError = ref('')

// Expansions the location owns for the currently selected game — reloaded
// whenever form.gameId changes (initial preselect, edit population, or the
// user switching games in the dropdown).
const gameExpansions = ref([])
const expansionsLoading = ref(false)

async function loadExpansionsForGame(gameId) {
  if (!gameId) {
    gameExpansions.value = []
    return
  }
  expansionsLoading.value = true
  try {
    const res = await fetch(
      apiUrl(`api/locations/${route.params.id}/games/${gameId}/expansions`),
      { headers: authHeaders() },
    )
    if (res.ok) {
      gameExpansions.value = await res.json()
      const validIds = new Set(gameExpansions.value.map((e) => e.id))
      form.value.expansionIds = form.value.expansionIds.filter((id) => validIds.has(id))
    }
  } finally {
    expansionsLoading.value = false
  }
}

watch(() => form.value.gameId, (gameId) => {
  loadExpansionsForGame(gameId)
})

function toggleExpansion(expansionId) {
  const ids = form.value.expansionIds
  const index = ids.indexOf(expansionId)
  if (index === -1) {
    ids.push(expansionId)
  } else {
    ids.splice(index, 1)
  }
}

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${auth.token}`, ...extra }
}

onMounted(async () => {
  await loadPage()
})

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''

  try {
    const [locationRes, gamesRes] = await Promise.all([
      fetch(apiUrl(`api/locations/${route.params.id}`), { headers: authHeaders() }),
      fetch(apiUrl(`api/locations/${route.params.id}/games`), { headers: authHeaders() }),
    ])

    if (locationRes.status === 404) {
      throw new Error('Location not found')
    }
    if (!locationRes.ok) {
      throw new Error('Failed to load location')
    }
    location.value = await locationRes.json()

    if (!canManage.value) {
      router.replace({ name: 'location-detail', params: { id: route.params.id } })
      return
    }

    locationGames.value = gamesRes.ok ? await gamesRes.json() : []

    if (!isEdit.value && route.query.gameId) {
      const preselected = locationGames.value.find(
        (g) => String(g.id) === String(route.query.gameId),
      )
      if (preselected) {
        form.value.gameId = preselected.id
      }
    }

    const sharesRes = await fetch(apiUrl(`api/locations/${route.params.id}/shares`), {
      headers: authHeaders(),
    })
    shares.value = sharesRes.ok ? await sharesRes.json() : []

    if (isEdit.value) {
      const historyRes = await fetch(apiUrl(`api/locations/${route.params.id}/history`), {
        headers: authHeaders(),
      })
      if (!historyRes.ok) {
        throw new Error('Failed to load history entry')
      }
      const entries = await historyRes.json()
      const entry = entries.find((e) => String(e.id) === String(route.params.historyId))
      if (!entry) {
        throw new Error('History entry not found')
      }
      populateForm(entry)
    }
  } catch (e) {
    pageError.value = e.message || 'Failed to load'
  } finally {
    pageLoading.value = false
  }
}

function populateForm(entry) {
  const hasPlacements = (entry.players ?? []).every((p) => p.placement != null)
  const orderedPlayers = hasPlacements
    ? [...(entry.players ?? [])].sort((a, b) => a.placement - b.placement)
    : (entry.players ?? [])
  form.value = {
    gameId: entry.gameId ?? '',
    state: entry.state ?? 'CREATED',
    playedAt: entry.playedAt ? entry.playedAt.slice(0, 10) : todayDateString(),
    startedAt: entry.startedAt ? entry.startedAt.slice(0, 16) : '',
    finishedAt: entry.finishedAt ? entry.finishedAt.slice(0, 16) : '',
    players:
      orderedPlayers.length > 0
        ? orderedPlayers.map((p) => ({
            username: p.username,
            points: p.points ?? '',
          }))
        : [emptyPlayerRow()],
    rating: entry.rating ?? '',
    expansionIds: (entry.expansions ?? []).map((e) => e.id),
  }
}

function addPlayerRow() {
  form.value.players.push(emptyPlayerRow())
}

function removePlayerRow(index) {
  form.value.players.splice(index, 1)
  if (form.value.players.length === 0) {
    form.value.players.push(emptyPlayerRow())
  }
}

function movePlayerRow(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.value.players.length) return
  const players = form.value.players
  ;[players[index], players[target]] = [players[target], players[index]]
}

async function handleSubmit() {
  const entries = form.value.players
    .map((p) => ({ username: p.username.trim(), points: p.points }))
    .filter((p) => p.username)

  if (!form.value.gameId || entries.length === 0) {
    formError.value = 'A game and at least one player are required.'
    return
  }

  const usernames = entries.map((p) => p.username)
  if (new Set(usernames).size !== usernames.length) {
    formError.value = 'Each player can only appear once.'
    return
  }

  formError.value = ''
  formLoading.value = true

  const isFinished = form.value.state === 'FINISHED'
  // Row order = finishing order, so placement is just the 1-based index —
  // only meaningful (and only sent) once the session is FINISHED. Points
  // has no such restriction and is sent whenever filled in.
  // TODO: confirm the request body field names — assuming
  // { gameId, state, playedAt, startedAt, finishedAt, players: [{ username, placement, points }], rating }.
  const body = {
    gameId: form.value.gameId,
    state: form.value.state,
    playedAt: form.value.playedAt ? new Date(form.value.playedAt).toISOString() : null,
    players: entries.map((entry, index) => ({
      username: entry.username,
      placement: isFinished ? index + 1 : null,
      points: entry.points === '' || entry.points == null ? null : Number(entry.points),
    })),
    rating: form.value.rating === '' ? null : Number(form.value.rating),
    expansionIds: form.value.expansionIds,
  }

  // Only include startedAt/finishedAt if the user explicitly set them —
  // omitting the key (rather than sending null) leaves the backend's
  // auto-computed/persisted value alone.
  if (form.value.startedAt) {
    body.startedAt = new Date(form.value.startedAt).toISOString()
  }
  if (form.value.finishedAt) {
    body.finishedAt = new Date(form.value.finishedAt).toISOString()
  }

  try {
    const url = isEdit.value
      ? `api/locations/${route.params.id}/history/${route.params.historyId}`
      : `api/locations/${route.params.id}/history`

    const response = await fetch(apiUrl(url), {
      method: isEdit.value ? 'PUT' : 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to save history entry')
    }

    router.push({ name: 'location-detail', params: { id: route.params.id } })
  } catch (e) {
    formError.value = e.message || 'Failed to save history entry'
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <button
      type="button"
      class="mb-8 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      @click="router.push({ name: 'location-detail', params: { id: route.params.id } })"
    >
      ← Back to {{ location ? location.name : 'location' }}
    </button>

    <section v-if="pageLoading" class="py-20 text-center text-slate-400">Loading…</section>

    <section v-else-if="pageError" class="py-20 text-center">
      <p class="text-red-400">{{ pageError }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="loadPage"
      >
        Try again
      </button>
    </section>

    <template v-else>
      <h1 class="mb-6 text-2xl font-bold tracking-tight">
        {{ isEdit ? 'Edit session' : 'Log a session' }}
      </h1>

      <p v-if="formError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ formError }}
      </p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="history-game" class="mb-1 block text-sm font-medium text-slate-300">
            Game
          </label>
          <select
            id="history-game"
            v-model="form.gameId"
            required
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="" disabled>Select a game played here…</option>
            <option v-for="game in locationGames" :key="game.id" :value="game.id">
              {{ game.name }}
            </option>
          </select>
        </div>

        <div v-if="form.gameId">
          <label class="mb-1 block text-sm font-medium text-slate-300">Expansions used</label>
          <p v-if="expansionsLoading" class="text-xs text-slate-500">Loading expansions…</p>
          <p v-else-if="gameExpansions.length === 0" class="text-xs text-slate-500">
            No expansions assigned to this game at this location.
          </p>
          <div v-else class="flex flex-wrap gap-2">
            <label
              v-for="expansion in gameExpansions"
              :key="expansion.id"
              class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/10"
            >
              <input
                type="checkbox"
                class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/30"
                :checked="form.expansionIds.includes(expansion.id)"
                @change="toggleExpansion(expansion.id)"
              />
              {{ expansion.name }}
            </label>
          </div>
        </div>

        <div v-if="isEdit">
          <label for="history-state" class="mb-1 block text-sm font-medium text-slate-300">
            State
          </label>
          <select
            id="history-state"
            v-model="form.state"
            required
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option v-for="s in HISTORY_STATES" :key="s" :value="s">{{ s }}</option>
          </select>
          <p v-if="form.state === 'FINISHED'" class="mt-1 text-xs text-slate-500">
            Finishing requires every player to have a placement — order them below.
          </p>
        </div>

        <div>
          <label for="history-played-at" class="mb-1 block text-sm font-medium text-slate-300">
            Played at
          </label>
          <input
            id="history-played-at"
            v-model="form.playedAt"
            type="date"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <p class="mt-1 text-xs text-slate-500">Defaults to today.</p>
        </div>

        <div :class="isEdit ? 'grid grid-cols-2 gap-4' : ''">
          <div>
            <label for="history-started-at" class="mb-1 block text-sm font-medium text-slate-300">
              Started at
            </label>
            <input
              id="history-started-at"
              v-model="form.startedAt"
              type="datetime-local"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <p class="mt-1 text-xs text-slate-500">
              {{
                isEdit
                  ? 'Auto-set on first IN_PROGRESS/FINISHED — only fill in to backfill.'
                  : 'Defaults to now.'
              }}
            </p>
          </div>
          <div v-if="isEdit">
            <label for="history-finished-at" class="mb-1 block text-sm font-medium text-slate-300">
              Finished at
            </label>
            <input
              id="history-finished-at"
              v-model="form.finishedAt"
              type="datetime-local"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <p class="mt-1 text-xs text-slate-500">Auto-set on first FINISHED.</p>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-300">
            Players
            <span v-if="form.state === 'FINISHED'">, in finishing order (1st place first)</span>
          </label>
          <p class="mb-2 text-xs text-slate-500">
            Only the owner and users this location is shared with are eligible.
            <router-link
              v-if="eligiblePlayers.length < 2"
              :to="{ name: 'location-detail', params: { id: route.params.id }, hash: '#sharing' }"
              class="text-indigo-400 hover:text-indigo-300"
            >
              Share it with someone first.
            </router-link>
          </p>

          <div
            v-for="(player, index) in form.players"
            :key="index"
            class="mb-2 flex items-center gap-2"
          >
            <span
              v-if="form.state === 'FINISHED'"
              class="w-6 shrink-0 text-right text-xs text-slate-500"
            >
              {{ index + 1 }}.
            </span>
            <select
              v-model="player.username"
              required
              class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="" disabled>Select a player…</option>
              <option
                v-for="username in eligiblePlayers"
                :key="username"
                :value="username"
                :disabled="
                  form.players.some((p) => p.username === username) && player.username !== username
                "
              >
                {{ username }}
              </option>
            </select>
            <input
              v-if="isEdit"
              v-model="player.points"
              type="number"
              placeholder="pts"
              title="Points (optional)"
              class="w-20 shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <template v-if="form.state === 'FINISHED'">
              <button
                type="button"
                :disabled="index === 0"
                class="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Move up"
                @click="movePlayerRow(index, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                :disabled="index === form.players.length - 1"
                class="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Move down"
                @click="movePlayerRow(index, 1)"
              >
                ↓
              </button>
            </template>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:border-red-500 hover:text-red-300"
              title="Remove"
              @click="removePlayerRow(index)"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            class="mt-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            @click="addPlayerRow"
          >
            + Add player
          </button>
        </div>

        <div v-if="isEdit">
          <label for="history-rating" class="mb-1 block text-sm font-medium text-slate-300">
            Rating (1–10)
          </label>
          <input
            id="history-rating"
            v-model="form.rating"
            type="number"
            min="1"
            max="10"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="formLoading"
            class="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ formLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Log session' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            @click="router.push({ name: 'location-detail', params: { id: route.params.id } })"
          >
            Cancel
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
