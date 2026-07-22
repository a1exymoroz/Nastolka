<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiUrl } from '../config/api'

const router = useRouter()
const auth = useAuthStore()

const games = ref([])
const gamesLoading = ref(true)
const gamesError = ref('')

const createForm = ref({ name: '', description: '', photo: '' })
const createLoading = ref(false)
const createError = ref('')

const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchError = ref('')
const importingBggId = ref(null)

const deletingId = ref(null)
const deleteError = ref('')

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${auth.token}`, ...extra }
}

onMounted(async () => {
  await fetchGames()
})

async function fetchGames() {
  gamesLoading.value = true
  gamesError.value = ''

  try {
    const response = await fetch(apiUrl('api/games'), {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to load games')
    }

    games.value = await response.json()
  } catch (e) {
    gamesError.value = e.message || 'Failed to load games'
  } finally {
    gamesLoading.value = false
  }
}

async function handleCreate() {
  createError.value = ''
  createLoading.value = true

  try {
    const response = await fetch(apiUrl('api/games'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: createForm.value.name,
        description: createForm.value.description || null,
        photo: createForm.value.photo,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to create game')
    }

    createForm.value = { name: '', description: '', photo: '' }
    await fetchGames()
  } catch (e) {
    createError.value = e.message || 'Failed to create game'
  } finally {
    createLoading.value = false
  }
}

async function handleSearch() {
  searchError.value = ''
  searchLoading.value = true
  searchResults.value = []

  try {
    const response = await fetch(
      apiUrl(`api/games/search-external?query=${encodeURIComponent(searchQuery.value)}`),
      { headers: authHeaders() },
    )

    if (!response.ok) {
      throw new Error('BoardGameGeek search failed')
    }

    const results = await response.json()
    // search-external now also returns expansions (flagged `expansion: true`).
    // Importing here creates a top-level game, so expansions are excluded —
    // import those from the base game's detail page instead.
    searchResults.value = results.filter((result) => !result.expansion)
  } catch (e) {
    searchError.value = e.message || 'BoardGameGeek search failed'
  } finally {
    searchLoading.value = false
  }
}

async function handleImport(bggId) {
  searchError.value = ''
  importingBggId.value = bggId

  try {
    const response = await fetch(apiUrl(`api/games/import/${bggId}`), {
      method: 'POST',
      headers: authHeaders(),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to import game')
    }

    // TODO: decide whether an already-imported game should be indicated in the search results
    await fetchGames()
  } catch (e) {
    searchError.value = e.message || 'Failed to import game'
  } finally {
    importingBggId.value = null
  }
}

async function handleDelete(game) {
  if (!window.confirm(`Delete "${game.name}"? This cannot be undone.`)) {
    return
  }

  deleteError.value = ''
  deletingId.value = game.id

  try {
    const response = await fetch(apiUrl(`api/games/${game.id}`), {
      method: 'DELETE',
      headers: authHeaders(),
    })

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete game')
    }

    await fetchGames()
  } catch (e) {
    deleteError.value = e.message || 'Failed to delete game'
  } finally {
    deletingId.value = null
  }
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
        <h1 class="text-3xl font-bold tracking-tight">Manage games</h1>
        <p class="mt-1 text-slate-400">Add games manually or import them from BoardGameGeek</p>
      </div>
      <div class="flex items-center gap-3">
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
          @click="logout"
        >
          Log out
        </button>
      </div>
    </header>

    <section class="mb-12 grid gap-6 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">Add a game manually</h2>

        <p v-if="createError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ createError }}
        </p>

        <form class="space-y-4" @submit.prevent="handleCreate">
          <div>
            <label for="game-name" class="mb-1 block text-sm font-medium text-slate-300">
              Name
            </label>
            <input
              id="game-name"
              v-model="createForm.name"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Catan"
            />
          </div>

          <div>
            <label for="game-description" class="mb-1 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              id="game-description"
              v-model="createForm.description"
              maxlength="2000"
              rows="3"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label for="game-photo" class="mb-1 block text-sm font-medium text-slate-300">
              Photo URL
            </label>
            <input
              id="game-photo"
              v-model="createForm.photo"
              type="url"
              required
              maxlength="2048"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            :disabled="createLoading"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ createLoading ? 'Adding…' : 'Add game' }}
          </button>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">Import from BoardGameGeek</h2>

        <p v-if="searchError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ searchError }}
        </p>

        <form class="mb-4 flex gap-2" @submit.prevent="handleSearch">
          <input
            v-model="searchQuery"
            type="text"
            required
            class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            placeholder="Search BoardGameGeek…"
          />
          <button
            type="submit"
            :disabled="searchLoading"
            class="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ searchLoading ? 'Searching…' : 'Search' }}
          </button>
        </form>

        <p v-if="!searchLoading && searchResults.length === 0" class="text-sm text-slate-500">
          No results yet.
        </p>

        <ul v-else class="max-h-80 space-y-2 overflow-y-auto">
          <li
            v-for="result in searchResults"
            :key="result.bggId"
            class="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-2.5"
          >
            <span class="truncate text-sm text-slate-200">{{ result.name }}</span>
            <button
              type="button"
              :disabled="importingBggId === result.bggId"
              class="ml-3 shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleImport(result.bggId)"
            >
              {{ importingBggId === result.bggId ? 'Importing…' : 'Import' }}
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-lg font-semibold">Existing games</h2>

      <p v-if="deleteError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ deleteError }}
      </p>

      <p v-if="gamesLoading" class="py-10 text-center text-slate-400">Loading games…</p>

      <div v-else-if="gamesError" class="py-10 text-center">
        <p class="text-red-400">{{ gamesError }}</p>
        <button
          class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="fetchGames"
        >
          Try again
        </button>
      </div>

      <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="game in games"
          :key="game.id"
          class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-600"
        >
          <router-link :to="{ name: 'game-detail', params: { id: game.id } }" class="block">
            <img
              v-if="game.photo"
              :src="game.photo"
              :alt="game.name"
              class="h-36 w-full object-cover"
            />
            <div class="p-5">
              <h3 class="font-semibold">{{ game.name }}</h3>
              <p v-if="game.description" class="mt-1 line-clamp-2 text-sm text-slate-400">
                {{ game.description }}
              </p>
            </div>
          </router-link>
          <div class="border-t border-slate-800 p-3">
            <button
              type="button"
              :disabled="deletingId === game.id"
              class="w-full rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleDelete(game)"
            >
              {{ deletingId === game.id ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
