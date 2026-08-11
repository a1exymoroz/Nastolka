<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

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

onMounted(async () => {
  await fetchGames()
})

async function fetchGames() {
  gamesLoading.value = true
  gamesError.value = ''

  try {
    const response = await apiFetch('api/games')

    if (!response.ok) {
      throw new Error(t('admin.loadGamesFailed'))
    }

    games.value = await response.json()
  } catch (e) {
    gamesError.value = e.message || t('admin.loadGamesFailed')
  } finally {
    gamesLoading.value = false
  }
}

async function handleCreate() {
  createError.value = ''
  createLoading.value = true

  try {
    const response = await apiFetch('api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.value.name,
        description: createForm.value.description || null,
        photo: createForm.value.photo,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || t('admin.createGameFailed'))
    }

    createForm.value = { name: '', description: '', photo: '' }
    await fetchGames()
  } catch (e) {
    createError.value = e.message || t('admin.createGameFailed')
  } finally {
    createLoading.value = false
  }
}

async function handleSearch() {
  searchError.value = ''
  searchLoading.value = true
  searchResults.value = []

  try {
    const response = await apiFetch(
      `api/games/search-external?query=${encodeURIComponent(searchQuery.value)}`,
    )

    if (!response.ok) {
      throw new Error(t('admin.bggSearchFailed'))
    }

    const results = await response.json()
    // search-external now also returns expansions (flagged `expansion: true`).
    // Importing here creates a top-level game, so expansions are excluded —
    // import those from the base game's detail page instead.
    searchResults.value = results.filter((result) => !result.expansion)
  } catch (e) {
    searchError.value = e.message || t('admin.bggSearchFailed')
  } finally {
    searchLoading.value = false
  }
}

async function handleImport(bggId) {
  searchError.value = ''
  importingBggId.value = bggId

  try {
    const response = await apiFetch(`api/games/import/${bggId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || t('admin.importGameFailed'))
    }

    // TODO: decide whether an already-imported game should be indicated in the search results
    await fetchGames()
  } catch (e) {
    searchError.value = e.message || t('admin.importGameFailed')
  } finally {
    importingBggId.value = null
  }
}

async function handleDelete(game) {
  if (!window.confirm(t('common.confirmDeleteNamed', { name: game.name }))) {
    return
  }

  deleteError.value = ''
  deletingId.value = game.id

  try {
    const response = await apiFetch(`api/games/${game.id}`, {
      method: 'DELETE',
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(t('admin.deleteGameFailed'))
    }

    await fetchGames()
  } catch (e) {
    deleteError.value = e.message || t('admin.deleteGameFailed')
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
    <header class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ $t('admin.title') }}</h1>
        <p class="mt-1 text-slate-400">{{ $t('admin.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="router.push({ name: 'locations' })"
        >
          {{ $t('common.locations') }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="logout"
        >
          {{ $t('common.logOut') }}
        </button>
      </div>
    </header>

    <section class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">{{ $t('admin.addGameManually') }}</h2>

        <p v-if="createError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ createError }}
        </p>

        <form class="space-y-4" @submit.prevent="handleCreate">
          <div>
            <label for="game-name" class="mb-1 block text-sm font-medium text-slate-300">
              {{ $t('common.name') }}
            </label>
            <input
              id="game-name"
              v-model="createForm.name"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              :placeholder="$t('admin.namePlaceholder')"
            />
          </div>

          <div>
            <label for="game-description" class="mb-1 block text-sm font-medium text-slate-300">
              {{ $t('common.description') }}
            </label>
            <textarea
              id="game-description"
              v-model="createForm.description"
              maxlength="2000"
              rows="3"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              :placeholder="$t('common.optionalDescriptionPlaceholder')"
            />
          </div>

          <div>
            <label for="game-photo" class="mb-1 block text-sm font-medium text-slate-300">
              {{ $t('admin.photoUrlLabel') }}
            </label>
            <input
              id="game-photo"
              v-model="createForm.photo"
              type="url"
              required
              maxlength="2048"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              :placeholder="$t('admin.photoPlaceholder')"
            />
          </div>

          <button
            type="submit"
            :disabled="createLoading"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ createLoading ? $t('common.adding') : $t('admin.addGame') }}
          </button>
        </form>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 class="mb-4 text-lg font-semibold">{{ $t('admin.importFromBgg') }}</h2>

        <p v-if="searchError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {{ searchError }}
        </p>

        <form class="mb-4 flex gap-2" @submit.prevent="handleSearch">
          <input
            v-model="searchQuery"
            type="text"
            required
            class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            :placeholder="$t('admin.searchBggPlaceholder')"
          />
          <button
            type="submit"
            :disabled="searchLoading"
            class="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ searchLoading ? $t('common.searching') : $t('common.search') }}
          </button>
        </form>

        <p v-if="!searchLoading && searchResults.length === 0" class="text-sm text-slate-500">
          {{ $t('admin.noResultsYet') }}
        </p>

        <ul v-else class="max-h-80 space-y-2 overflow-y-auto">
          <li
            v-for="result in searchResults"
            :key="result.bggId"
            class="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-2.5"
          >
            <a
              :href="`https://boardgamegeek.com/boardgame/${result.bggId}`"
              target="_blank"
              rel="noopener noreferrer"
              :title="$t('common.viewOnBgg')"
              class="truncate text-sm text-slate-200 hover:text-indigo-400 hover:underline"
            >
              {{ result.name }}
            </a>
            <button
              type="button"
              :disabled="importingBggId === result.bggId"
              class="ml-3 shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleImport(result.bggId)"
            >
              {{ importingBggId === result.bggId ? $t('common.importing') : $t('common.import') }}
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-lg font-semibold">{{ $t('admin.existingGames') }}</h2>

      <p v-if="deleteError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ deleteError }}
      </p>

      <p v-if="gamesLoading" class="py-10 text-center text-slate-400">{{ $t('admin.loadingGames') }}</p>

      <div v-else-if="gamesError" class="py-10 text-center">
        <p class="text-red-400">{{ gamesError }}</p>
        <button
          class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="fetchGames"
        >
          {{ $t('common.tryAgain') }}
        </button>
      </div>

      <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              {{ deletingId === game.id ? $t('common.deleting') : $t('common.delete') }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
