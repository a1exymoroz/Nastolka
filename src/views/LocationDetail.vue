<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiUrl } from '../config/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const location = ref(null)
const locationLoading = ref(true)
const locationError = ref('')

// TODO: confirm the exact field the backend uses for the owner's username on
// LocationResponse (assuming `ownerUsername`, falling back to `owner.username`).
const canManage = computed(() => {
  if (!location.value) return false
  const ownerUsername = location.value.ownerUsername ?? location.value.owner?.username
  return auth.isAdmin || ownerUsername === auth.user?.username
})

const editForm = ref({ name: '', description: '' })
const editLoading = ref(false)
const editError = ref('')
const editing = ref(false)

const shares = ref([])
const sharesLoading = ref(false)
const sharesError = ref('')
const shareUsername = ref('')
const shareLoading = ref(false)
const revokingUsername = ref(null)

const userSearchResults = ref([])
const userSearchLoading = ref(false)
let userSearchTimer = null

const locationGames = ref([])
const locationGamesLoading = ref(true)
const locationGamesError = ref('')

const catalogGames = ref([])
const selectedGameId = ref('')
const addGameLoading = ref(false)
const addGameError = ref('')
const removingGameId = ref(null)

// Per-game state for the expansions assigned to this location, keyed by game id:
// { expansions, loading, error, catalogExpansions, selectedExpansionId, addLoading, addError, removingId }
const gameExpansionState = reactive({})

const history = ref([])
const historyLoading = ref(true)
const historyError = ref('')

const deletingHistoryId = ref(null)

// Authenticated photo downloads can't use a plain <img src>, so fetched
// photos are kept as object URLs here, keyed by history entry id.
const photoUrls = reactive({})
const uploadingPhotoId = ref(null)
const deletingPhotoId = ref(null)
const lightboxUrl = ref(null)

function onLightboxKeydown(e) {
  if (e.key === 'Escape') lightboxUrl.value = null
}

const availableCatalogGames = computed(() => {
  const assignedIds = new Set(locationGames.value.map((g) => g.id))
  return catalogGames.value.filter((g) => !assignedIds.has(g.id))
})

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${auth.token}`, ...extra }
}

onMounted(async () => {
  window.addEventListener('keydown', onLightboxKeydown)
  await Promise.all([fetchLocation(), fetchLocationGames(), fetchCatalogGames(), fetchHistory()])
})

watch(
  () => route.params.id,
  async () => {
    await Promise.all([fetchLocation(), fetchLocationGames(), fetchCatalogGames(), fetchHistory()])
  },
)

async function fetchLocation() {
  locationLoading.value = true
  locationError.value = ''

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}`), {
      headers: authHeaders(),
    })

    if (response.status === 404) {
      throw new Error('Location not found')
    }

    if (!response.ok) {
      throw new Error('Failed to load location')
    }

    location.value = await response.json()
    editForm.value = { name: location.value.name, description: location.value.description ?? '' }

    if (canManage.value) {
      await fetchShares()
    }
  } catch (e) {
    locationError.value = e.message || 'Failed to load location'
  } finally {
    locationLoading.value = false
  }
}

async function fetchShares() {
  sharesLoading.value = true
  sharesError.value = ''

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}/shares`), {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to load shares')
    }

    shares.value = await response.json()
  } catch (e) {
    sharesError.value = e.message || 'Failed to load shares'
  } finally {
    sharesLoading.value = false
  }
}

async function handleUpdateLocation() {
  editError.value = ''
  editLoading.value = true

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}`), {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: editForm.value.name,
        description: editForm.value.description || null,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to update location')
    }

    location.value = await response.json()
    editing.value = false
  } catch (e) {
    editError.value = e.message || 'Failed to update location'
  } finally {
    editLoading.value = false
  }
}

function onShareUsernameInput() {
  userSearchResults.value = []
  clearTimeout(userSearchTimer)

  const query = shareUsername.value.trim()
  if (!query) {
    userSearchLoading.value = false
    return
  }

  userSearchLoading.value = true
  userSearchTimer = setTimeout(async () => {
    try {
      const response = await fetch(
        apiUrl(`api/users/search?query=${encodeURIComponent(query)}`),
        { headers: authHeaders() },
      )
      const results = response.ok ? await response.json() : []
      // API returns [{ username }], not plain strings — normalize to strings
      // since the rest of this component (picking, dedup, :key) works with them.
      userSearchResults.value = results.map((u) => (typeof u === 'string' ? u : u.username))
    } catch {
      userSearchResults.value = []
    } finally {
      userSearchLoading.value = false
    }
  }, 300)
}

function pickShareSuggestion(username) {
  shareUsername.value = username
  userSearchResults.value = []
}

async function handleAddShare() {
  if (!shareUsername.value.trim()) return

  sharesError.value = ''
  shareLoading.value = true

  try {
    // TODO: confirm the POST /shares request body shape — assuming { username }.
    const response = await fetch(apiUrl(`api/locations/${route.params.id}/shares`), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username: shareUsername.value.trim() }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to share location')
    }

    shareUsername.value = ''
    userSearchResults.value = []
    await fetchShares()
  } catch (e) {
    sharesError.value = e.message || 'Failed to share location'
  } finally {
    shareLoading.value = false
  }
}

async function handleRevokeShare(targetUsername) {
  if (!window.confirm(`Stop sharing this location with "${targetUsername}"?`)) {
    return
  }

  sharesError.value = ''
  revokingUsername.value = targetUsername

  try {
    const response = await fetch(
      apiUrl(`api/locations/${route.params.id}/shares/${encodeURIComponent(targetUsername)}`),
      { method: 'DELETE', headers: authHeaders() },
    )

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to revoke share')
    }

    await fetchShares()
  } catch (e) {
    sharesError.value = e.message || 'Failed to revoke share'
  } finally {
    revokingUsername.value = null
  }
}

async function fetchLocationGames() {
  locationGamesLoading.value = true
  locationGamesError.value = ''

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}/games`), {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to load games for this location')
    }

    locationGames.value = await response.json()
    await Promise.all(locationGames.value.map((game) => loadGameExpansionState(game.id)))
  } catch (e) {
    locationGamesError.value = e.message || 'Failed to load games for this location'
  } finally {
    locationGamesLoading.value = false
  }
}

async function fetchCatalogGames() {
  try {
    const response = await fetch(apiUrl('api/games'), { headers: authHeaders() })
    if (!response.ok) return
    catalogGames.value = await response.json()
  } catch {
    // Non-fatal: the "add game" picker just stays empty.
  }
}

async function fetchHistory() {
  historyLoading.value = true
  historyError.value = ''

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}/history`), {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to load history')
    }

    // Backend already returns newest-first.
    history.value = await response.json()
    await Promise.all(
      history.value.filter((entry) => entry.photoUrl).map((entry) => loadEntryPhoto(entry)),
    )
  } catch (e) {
    historyError.value = e.message || 'Failed to load history'
  } finally {
    historyLoading.value = false
  }
}

async function loadEntryPhoto(entry) {
  try {
    // TODO: confirm photoUrl is a path on this API (vs. an absolute URL) —
    // assuming a relative path like `/api/locations/{id}/history/{id}/photo`.
    const response = await fetch(apiUrl(entry.photoUrl), { headers: authHeaders() })
    if (!response.ok) return

    const blob = await response.blob()
    if (photoUrls[entry.id]) {
      URL.revokeObjectURL(photoUrls[entry.id])
    }
    photoUrls[entry.id] = URL.createObjectURL(blob)
  } catch {
    // Non-fatal: the entry just renders without a photo.
  }
}

onUnmounted(() => {
  Object.values(photoUrls).forEach((url) => URL.revokeObjectURL(url))
  clearTimeout(userSearchTimer)
  window.removeEventListener('keydown', onLightboxKeydown)
})

const HISTORY_STATE_BADGE_CLASSES = {
  CREATED: 'bg-slate-700 text-slate-200',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  FINISHED: 'bg-emerald-500/20 text-emerald-400',
}

function formatDuration(minutes) {
  if (minutes == null) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

async function handleUploadPhoto(entry, file) {
  if (!file) return

  historyError.value = ''
  uploadingPhotoId.value = entry.id

  try {
    // TODO: confirm the multipart field name — assuming "file".
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      apiUrl(`api/locations/${route.params.id}/history/${entry.id}/photo`),
      { method: 'POST', headers: authHeaders(), body: formData },
    )

    if (!response.ok) {
      throw new Error(response.status === 400 ? 'That file is not an image.' : 'Failed to upload photo')
    }

    await fetchHistory()
  } catch (e) {
    historyError.value = e.message || 'Failed to upload photo'
  } finally {
    uploadingPhotoId.value = null
  }
}

async function handleDeletePhoto(entry) {
  if (!window.confirm('Remove this photo?')) return

  historyError.value = ''
  deletingPhotoId.value = entry.id

  try {
    const response = await fetch(
      apiUrl(`api/locations/${route.params.id}/history/${entry.id}/photo`),
      { method: 'DELETE', headers: authHeaders() },
    )

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to remove photo')
    }

    if (photoUrls[entry.id]) {
      URL.revokeObjectURL(photoUrls[entry.id])
      delete photoUrls[entry.id]
    }
    await fetchHistory()
  } catch (e) {
    historyError.value = e.message || 'Failed to remove photo'
  } finally {
    deletingPhotoId.value = null
  }
}

async function handleDeleteHistory(entry) {
  if (!window.confirm('Delete this history entry? This cannot be undone.')) {
    return
  }

  historyError.value = ''
  deletingHistoryId.value = entry.id

  try {
    const response = await fetch(
      apiUrl(`api/locations/${route.params.id}/history/${entry.id}`),
      { method: 'DELETE', headers: authHeaders() },
    )

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete history entry')
    }

    await fetchHistory()
  } catch (e) {
    historyError.value = e.message || 'Failed to delete history entry'
  } finally {
    deletingHistoryId.value = null
  }
}

function ensureGameState(gameId) {
  if (!gameExpansionState[gameId]) {
    gameExpansionState[gameId] = {
      expansions: [],
      loading: true,
      error: '',
      catalogExpansions: [],
      selectedExpansionId: '',
      addLoading: false,
      addError: '',
      removingId: null,
    }
  }
  return gameExpansionState[gameId]
}

async function loadGameExpansionState(gameId) {
  const state = ensureGameState(gameId)
  state.loading = true
  state.error = ''

  try {
    const [assignedRes, catalogRes] = await Promise.all([
      fetch(apiUrl(`api/locations/${route.params.id}/games/${gameId}/expansions`), {
        headers: authHeaders(),
      }),
      fetch(apiUrl(`api/games/${gameId}/expansions`), { headers: authHeaders() }),
    ])

    if (!assignedRes.ok) {
      throw new Error('Failed to load expansions')
    }

    state.expansions = await assignedRes.json()
    state.catalogExpansions = catalogRes.ok ? await catalogRes.json() : []
  } catch (e) {
    state.error = e.message || 'Failed to load expansions'
  } finally {
    state.loading = false
  }
}

function availableCatalogExpansions(gameId) {
  const state = gameExpansionState[gameId]
  if (!state) return []
  const assignedIds = new Set(state.expansions.map((e) => e.id))
  return state.catalogExpansions.filter((e) => !assignedIds.has(e.id))
}

async function handleAddGame() {
  if (!selectedGameId.value) return

  addGameError.value = ''
  addGameLoading.value = true

  try {
    const response = await fetch(
      apiUrl(`api/locations/${route.params.id}/games/${selectedGameId.value}`),
      { method: 'POST', headers: authHeaders() },
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to add game')
    }

    selectedGameId.value = ''
    await fetchLocationGames()
  } catch (e) {
    addGameError.value = e.message || 'Failed to add game'
  } finally {
    addGameLoading.value = false
  }
}

async function handleRemoveGame(game) {
  if (!window.confirm(`Remove "${game.name}" from this location?`)) {
    return
  }

  addGameError.value = ''
  removingGameId.value = game.id

  try {
    const response = await fetch(apiUrl(`api/locations/${route.params.id}/games/${game.id}`), {
      method: 'DELETE',
      headers: authHeaders(),
    })

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to remove game')
    }

    delete gameExpansionState[game.id]
    await fetchLocationGames()
  } catch (e) {
    addGameError.value = e.message || 'Failed to remove game'
  } finally {
    removingGameId.value = null
  }
}

async function handleAddExpansion(gameId) {
  const state = ensureGameState(gameId)
  if (!state.selectedExpansionId) return

  state.addError = ''
  state.addLoading = true

  try {
    const response = await fetch(
      apiUrl(
        `api/locations/${route.params.id}/games/${gameId}/expansions/${state.selectedExpansionId}`,
      ),
      { method: 'POST', headers: authHeaders() },
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to add expansion')
    }

    state.selectedExpansionId = ''
    await loadGameExpansionState(gameId)
  } catch (e) {
    state.addError = e.message || 'Failed to add expansion'
  } finally {
    state.addLoading = false
  }
}

async function handleRemoveExpansion(gameId, expansion) {
  if (!window.confirm(`Remove "${expansion.name}" from this location?`)) {
    return
  }

  const state = ensureGameState(gameId)
  state.addError = ''
  state.removingId = expansion.id

  try {
    const response = await fetch(
      apiUrl(`api/locations/${route.params.id}/games/${gameId}/expansions/${expansion.id}`),
      { method: 'DELETE', headers: authHeaders() },
    )

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to remove expansion')
    }

    await loadGameExpansionState(gameId)
  } catch (e) {
    state.addError = e.message || 'Failed to remove expansion'
  } finally {
    state.removingId = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <button
      type="button"
      class="mb-8 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      @click="router.push({ name: 'locations' })"
    >
      ← Back to locations
    </button>

    <section v-if="locationLoading" class="py-20 text-center text-slate-400">Loading…</section>

    <section v-else-if="locationError" class="py-20 text-center">
      <p class="text-red-400">{{ locationError }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="fetchLocation"
      >
        Try again
      </button>
    </section>

    <template v-else-if="location">
      <header class="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ location.name }}</h1>
          <p v-if="location.description" class="mt-2 text-slate-400">{{ location.description }}</p>
          <button
            v-if="canManage"
            type="button"
            class="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            @click="editing = !editing"
          >
            {{ editing ? 'Cancel edit' : 'Edit location' }}
          </button>
        </div>
        <button
          type="button"
          :disabled="locationGames.length < 2"
          :title="locationGames.length < 2 ? 'Add at least 2 games to roll' : ''"
          class="shrink-0 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          @click="router.push({ name: 'location-play', params: { id: route.params.id } })"
        >
          Roll dice here
        </button>
      </header>

      <div v-if="canManage && editing" class="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">Edit location</h2>

        <p v-if="editError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ editError }}
        </p>

        <form class="space-y-4" @submit.prevent="handleUpdateLocation">
          <div>
            <label for="edit-location-name" class="mb-1 block text-sm font-medium text-slate-300">
              Name
            </label>
            <input
              id="edit-location-name"
              v-model="editForm.name"
              type="text"
              required
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label
              for="edit-location-description"
              class="mb-1 block text-sm font-medium text-slate-300"
            >
              Description
            </label>
            <textarea
              id="edit-location-description"
              v-model="editForm.description"
              rows="3"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <button
            type="submit"
            :disabled="editLoading"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ editLoading ? 'Saving…' : 'Save changes' }}
          </button>
        </form>
      </div>

      <div v-if="canManage" id="sharing" class="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">Sharing</h2>

        <p v-if="sharesError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ sharesError }}
        </p>

        <p v-if="sharesLoading" class="text-sm text-slate-500">Loading shares…</p>

        <template v-else>
          <p v-if="shares.length === 0" class="mb-4 text-sm text-slate-500">
            Not shared with anyone yet.
          </p>

          <ul v-else class="mb-4 space-y-2">
            <li
              v-for="share in shares"
              :key="share.username ?? share.targetUsername"
              class="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"
            >
              <span class="text-sm text-slate-200">{{ share.username ?? share.targetUsername }}</span>
              <button
                type="button"
                :disabled="revokingUsername === (share.username ?? share.targetUsername)"
                class="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleRevokeShare(share.username ?? share.targetUsername)"
              >
                {{
                  revokingUsername === (share.username ?? share.targetUsername)
                    ? 'Revoking…'
                    : 'Revoke'
                }}
              </button>
            </li>
          </ul>

          <form class="relative flex gap-2" @submit.prevent="handleAddShare">
            <div class="relative flex-1">
              <input
                v-model="shareUsername"
                type="text"
                required
                autocomplete="off"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                placeholder="Search a username to share with…"
                @input="onShareUsernameInput"
              />
              <ul
                v-if="userSearchLoading || userSearchResults.length > 0"
                class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
              >
                <li v-if="userSearchLoading" class="px-4 py-2 text-xs text-slate-500">Searching…</li>
                <li
                  v-for="username in userSearchResults"
                  :key="username"
                  class="cursor-pointer px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                  @mousedown.prevent="pickShareSuggestion(username)"
                >
                  {{ username }}
                </li>
              </ul>
            </div>
            <button
              type="submit"
              :disabled="shareLoading"
              class="shrink-0 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ shareLoading ? 'Sharing…' : 'Share' }}
            </button>
          </form>
        </template>
      </div>

      <div v-if="canManage" class="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">Add a game to this location</h2>

        <p v-if="addGameError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ addGameError }}
        </p>

        <div class="flex gap-2">
          <select
            v-model="selectedGameId"
            class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="" disabled>Select a game from the catalog…</option>
            <option v-for="game in availableCatalogGames" :key="game.id" :value="game.id">
              {{ game.name }}
            </option>
          </select>
          <button
            type="button"
            :disabled="!selectedGameId || addGameLoading"
            class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            @click="handleAddGame"
          >
            {{ addGameLoading ? 'Adding…' : 'Add' }}
          </button>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 class="mb-4 text-xl font-bold tracking-tight">Games</h2>

        <p v-if="locationGamesError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ locationGamesError }}
        </p>

        <p v-if="locationGamesLoading" class="py-6 text-center text-slate-400">Loading games…</p>

        <p v-else-if="locationGames.length === 0" class="text-sm text-slate-500">
          No games assigned to this location yet.
        </p>

        <ul v-else class="space-y-6">
          <li
            v-for="game in locationGames"
            :key="game.id"
            class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
          >
            <div class="flex items-start gap-4 p-5">
              <img
                v-if="game.photo"
                :src="game.photo"
                :alt="game.name"
                class="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <router-link
                    :to="{ name: 'game-detail', params: { id: game.id } }"
                    class="font-semibold hover:text-indigo-400"
                  >
                    {{ game.name }}
                  </router-link>
                  <button
                    v-if="canManage"
                    type="button"
                    :disabled="removingGameId === game.id"
                    class="shrink-0 rounded-lg border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="handleRemoveGame(game)"
                  >
                    {{ removingGameId === game.id ? 'Removing…' : 'Remove' }}
                  </button>
                </div>
                <p v-if="game.description" class="mt-1 line-clamp-2 text-sm text-slate-400">
                  {{ game.description }}
                </p>
              </div>
            </div>

            <div v-if="gameExpansionState[game.id]" class="border-t border-slate-800 bg-slate-950/40 p-5">
              <h3 class="mb-3 text-sm font-semibold text-slate-300">Expansions here</h3>

              <p
                v-if="gameExpansionState[game.id].error"
                class="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
              >
                {{ gameExpansionState[game.id].error }}
              </p>
              <p
                v-if="gameExpansionState[game.id].addError"
                class="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
              >
                {{ gameExpansionState[game.id].addError }}
              </p>

              <p v-if="gameExpansionState[game.id].loading" class="text-xs text-slate-500">
                Loading expansions…
              </p>

              <template v-else>
                <p
                  v-if="gameExpansionState[game.id].expansions.length === 0"
                  class="text-xs text-slate-500"
                >
                  No expansions assigned here yet.
                </p>

                <ul v-else class="mb-4 space-y-2">
                  <li
                    v-for="expansion in gameExpansionState[game.id].expansions"
                    :key="expansion.id"
                    class="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"
                  >
                    <span class="truncate text-sm text-slate-200">{{ expansion.name }}</span>
                    <button
                      v-if="canManage"
                      type="button"
                      :disabled="gameExpansionState[game.id].removingId === expansion.id"
                      class="ml-3 shrink-0 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      @click="handleRemoveExpansion(game.id, expansion)"
                    >
                      {{ gameExpansionState[game.id].removingId === expansion.id ? 'Removing…' : 'Remove' }}
                    </button>
                  </li>
                </ul>

                <div v-if="canManage" class="flex gap-2">
                  <select
                    v-model="gameExpansionState[game.id].selectedExpansionId"
                    class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="" disabled>Select an expansion…</option>
                    <option
                      v-for="expansion in availableCatalogExpansions(game.id)"
                      :key="expansion.id"
                      :value="expansion.id"
                    >
                      {{ expansion.name }}
                    </option>
                  </select>
                  <button
                    type="button"
                    :disabled="
                      !gameExpansionState[game.id].selectedExpansionId ||
                      gameExpansionState[game.id].addLoading
                    "
                    class="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    @click="handleAddExpansion(game.id)"
                  >
                    {{ gameExpansionState[game.id].addLoading ? 'Adding…' : 'Add' }}
                  </button>
                </div>
              </template>
            </div>
          </li>
        </ul>
      </section>

      <section>
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold tracking-tight">Session history</h2>
          <button
            v-if="canManage"
            type="button"
            class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            @click="router.push({ name: 'location-history-new', params: { id: route.params.id } })"
          >
            + Log a session
          </button>
        </div>

        <p v-if="historyError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ historyError }}
        </p>

        <p v-if="historyLoading" class="py-6 text-center text-slate-400">Loading history…</p>

        <p v-else-if="history.length === 0" class="text-sm text-slate-500">
          No sessions logged yet.
        </p>

        <ul v-else class="space-y-3">
          <li
            v-for="entry in history"
            :key="entry.id"
            class="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <img
              v-if="photoUrls[entry.id]"
              :src="photoUrls[entry.id]"
              alt=""
              class="h-16 w-16 shrink-0 cursor-pointer rounded-lg object-cover"
              @click="lightboxUrl = photoUrls[entry.id]"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-semibold">{{ entry.gameName ?? 'Unknown game' }}</p>
                    <span
                      class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
                      :class="HISTORY_STATE_BADGE_CLASSES[entry.state] ?? 'bg-slate-700 text-slate-200'"
                    >
                      {{ entry.state }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500">{{ new Date(entry.playedAt).toLocaleString() }}</p>
                  <p v-if="entry.durationMinutes != null" class="text-xs text-slate-500">
                    Duration: {{ formatDuration(entry.durationMinutes) }}
                  </p>
                </div>
                <span v-if="entry.rating" class="shrink-0 text-sm font-medium text-amber-400">
                  {{ entry.rating }}/10
                </span>
              </div>

              <ol
                v-if="entry.state === 'FINISHED'"
                class="mt-1 list-inside list-decimal text-sm text-slate-400"
              >
                <li
                  v-for="player in [...(entry.players ?? [])].sort((a, b) => a.placement - b.placement)"
                  :key="player.username"
                >
                  {{ player.username }}
                  <span v-if="player.points != null" class="text-slate-500">({{ player.points }} pts)</span>
                </li>
              </ol>
              <ul v-else class="mt-1 list-none space-y-0.5 text-sm text-slate-400">
                <li v-for="player in entry.players ?? []" :key="player.username">
                  {{ player.username }}
                  <span v-if="player.points != null" class="text-slate-500">({{ player.points }} pts)</span>
                </li>
              </ul>
              <div v-if="canManage" class="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  class="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  @click="
                    router.push({
                      name: 'location-history-edit',
                      params: { id: route.params.id, historyId: entry.id },
                    })
                  "
                >
                  Edit
                </button>
                <button
                  type="button"
                  :disabled="deletingHistoryId === entry.id"
                  class="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="handleDeleteHistory(entry)"
                >
                  {{ deletingHistoryId === entry.id ? 'Deleting…' : 'Delete' }}
                </button>
                <label
                  class="cursor-pointer text-xs font-medium text-slate-300 hover:text-white"
                  :class="{ 'pointer-events-none opacity-50': uploadingPhotoId === entry.id }"
                >
                  {{
                    uploadingPhotoId === entry.id
                      ? 'Uploading…'
                      : photoUrls[entry.id]
                        ? 'Replace photo'
                        : 'Add photo'
                  }}
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleUploadPhoto(entry, $event.target.files[0]); $event.target.value = ''"
                  />
                </label>
                <button
                  v-if="photoUrls[entry.id]"
                  type="button"
                  :disabled="deletingPhotoId === entry.id"
                  class="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="handleDeletePhoto(entry)"
                >
                  {{ deletingPhotoId === entry.id ? 'Removing…' : 'Remove photo' }}
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>
      </div>
    </template>

    <div
      v-if="lightboxUrl"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      @click="lightboxUrl = null"
    >
      <button
        type="button"
        class="absolute right-4 top-4 text-3xl leading-none text-slate-300 hover:text-white"
        @click="lightboxUrl = null"
      >
        ✕
      </button>
      <img :src="lightboxUrl" alt="" class="max-h-full max-w-full rounded-lg object-contain" />
    </div>
  </div>
</template>
