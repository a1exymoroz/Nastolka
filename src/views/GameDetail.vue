<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiUrl } from '../config/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const game = ref(null)
const loading = ref(true)
const error = ref('')

const expansions = ref([])
const expansionsLoading = ref(true)
const expansionsError = ref('')

const createForm = ref({ name: '', description: '', photo: '' })
const createLoading = ref(false)
const createError = ref('')

const searchResults = ref([])
const searchLoading = ref(false)
const searchError = ref('')
const searchAttempted = ref(false)
const importingBggId = ref(null)

const deletingId = ref(null)
const deleteError = ref('')

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${auth.token}`, ...extra }
}

onMounted(async () => {
  await Promise.all([fetchGame(), fetchExpansions()])
})

watch(
  () => route.params.id,
  async () => {
    await Promise.all([fetchGame(), fetchExpansions()])
  },
)

async function fetchGame() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(apiUrl(`api/games/${route.params.id}`), {
      headers: authHeaders(),
    })

    if (response.status === 404) {
      throw new Error('Game not found')
    }

    if (!response.ok) {
      throw new Error('Failed to load game')
    }

    game.value = await response.json()
  } catch (e) {
    error.value = e.message || 'Failed to load game'
  } finally {
    loading.value = false
  }
}

async function fetchExpansions() {
  expansionsLoading.value = true
  expansionsError.value = ''

  try {
    const response = await fetch(apiUrl(`api/games/${route.params.id}/expansions`), {
      headers: authHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to load expansions')
    }

    expansions.value = await response.json()
  } catch (e) {
    expansionsError.value = e.message || 'Failed to load expansions'
  } finally {
    expansionsLoading.value = false
  }
}

async function handleCreateExpansion() {
  createError.value = ''
  createLoading.value = true

  try {
    const response = await fetch(apiUrl(`api/games/${route.params.id}/expansions`), {
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
      throw new Error(data.message || data.error || 'Failed to add expansion')
    }

    createForm.value = { name: '', description: '', photo: '' }
    await fetchExpansions()
  } catch (e) {
    createError.value = e.message || 'Failed to add expansion'
  } finally {
    createLoading.value = false
  }
}

async function handleSearch() {
  searchError.value = ''
  searchLoading.value = true
  searchAttempted.value = true
  searchResults.value = []

  try {
    const response = await fetch(
      apiUrl(`api/games/${route.params.id}/expansions/search-external`),
      { headers: authHeaders() },
    )

    if (response.status === 400) {
      throw new Error("This game wasn't imported from BoardGameGeek, so its official expansions can't be looked up automatically.")
    }

    if (!response.ok) {
      throw new Error('BoardGameGeek search failed')
    }

    searchResults.value = await response.json()
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
    const response = await fetch(
      apiUrl(`api/games/${route.params.id}/expansions/import/${bggId}`),
      { method: 'POST', headers: authHeaders() },
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'Failed to import expansion')
    }

    await fetchExpansions()
  } catch (e) {
    searchError.value = e.message || 'Failed to import expansion'
  } finally {
    importingBggId.value = null
  }
}

async function handleDeleteExpansion(expansion) {
  if (!window.confirm(`Delete "${expansion.name}"? This cannot be undone.`)) {
    return
  }

  deleteError.value = ''
  deletingId.value = expansion.id

  try {
    const response = await fetch(
      apiUrl(`api/games/${route.params.id}/expansions/${expansion.id}`),
      { method: 'DELETE', headers: authHeaders() },
    )

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete expansion')
    }

    await fetchExpansions()
  } catch (e) {
    deleteError.value = e.message || 'Failed to delete expansion'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <button
      type="button"
      class="mb-8 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      @click="router.back()"
    >
      ← Back
    </button>

    <section v-if="loading" class="py-20 text-center text-slate-400">Loading…</section>

    <section v-else-if="error" class="py-20 text-center">
      <p class="text-red-400">{{ error }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="fetchGame"
      >
        Try again
      </button>
    </section>

    <article v-else-if="game" class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <img
        v-if="game.photo"
        :src="game.photo"
        :alt="game.name"
        class="h-80 w-full object-cover"
      />
      <div class="p-8">
        <h1 class="text-3xl font-bold tracking-tight">{{ game.name }}</h1>
        <p v-if="game.players || game.duration" class="mt-2 text-sm text-slate-400">
          {{ [game.players, game.duration].filter(Boolean).join(' · ') }}
        </p>
        <p v-if="game.description" class="mt-4 whitespace-pre-line text-slate-300">
          {{ game.description }}
        </p>
        <p v-else class="mt-4 text-slate-500">No description available.</p>

        <a
          v-if="game.bggUrl"
          :href="game.bggUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          View on BoardGameGeek →
        </a>
      </div>
    </article>

    <section v-if="game" class="mt-10">
      <h2 class="mb-4 text-xl font-bold tracking-tight">Expansions</h2>

      <p v-if="expansionsError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ expansionsError }}
      </p>
      <p v-if="deleteError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ deleteError }}
      </p>

      <p v-if="expansionsLoading" class="py-6 text-center text-slate-400">Loading expansions…</p>

      <template v-else>
        <p v-if="expansions.length === 0" class="text-sm text-slate-500">No expansions yet.</p>

        <ul v-else class="grid gap-4 sm:grid-cols-2">
          <li
            v-for="expansion in expansions"
            :key="expansion.id"
            class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
          >
            <img
              v-if="expansion.photo"
              :src="expansion.photo"
              :alt="expansion.name"
              class="h-28 w-full object-cover"
            />
            <div class="p-4">
              <h3 class="font-semibold">{{ expansion.name }}</h3>
              <p v-if="expansion.description" class="mt-1 line-clamp-2 text-sm text-slate-400">
                {{ expansion.description }}
              </p>
              <a
                v-if="expansion.bggUrl"
                :href="expansion.bggUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2 inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                View on BoardGameGeek →
              </a>
            </div>
            <div v-if="auth.isAdmin" class="border-t border-slate-800 p-3">
              <button
                type="button"
                :disabled="deletingId === expansion.id"
                class="w-full rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleDeleteExpansion(expansion)"
              >
                {{ deletingId === expansion.id ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </li>
        </ul>
      </template>

      <div v-if="auth.isAdmin" class="mt-8 grid gap-6 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 class="mb-4 text-lg font-semibold">Add an expansion manually</h3>

          <p v-if="createError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {{ createError }}
          </p>

          <form class="space-y-4" @submit.prevent="handleCreateExpansion">
            <div>
              <label for="expansion-name" class="mb-1 block text-sm font-medium text-slate-300">
                Name
              </label>
              <input
                id="expansion-name"
                v-model="createForm.name"
                type="text"
                required
                maxlength="200"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                placeholder="Expedition Leaders"
              />
            </div>

            <div>
              <label
                for="expansion-description"
                class="mb-1 block text-sm font-medium text-slate-300"
              >
                Description
              </label>
              <textarea
                id="expansion-description"
                v-model="createForm.description"
                maxlength="2000"
                rows="3"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label for="expansion-photo" class="mb-1 block text-sm font-medium text-slate-300">
                Photo URL
              </label>
              <input
                id="expansion-photo"
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
              {{ createLoading ? 'Adding…' : 'Add expansion' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 class="mb-4 text-lg font-semibold">Import from BoardGameGeek</h3>

          <p v-if="searchError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {{ searchError }}
          </p>

          <button
            type="button"
            :disabled="searchLoading"
            class="mb-4 w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="handleSearch"
          >
            {{ searchLoading ? 'Looking up…' : 'Find expansions on BoardGameGeek' }}
          </button>

          <p v-if="!searchLoading && searchAttempted && searchResults.length === 0 && !searchError" class="text-sm text-slate-500">
            No expansions found on BoardGameGeek.
          </p>

          <ul v-if="searchResults.length > 0" class="max-h-80 space-y-2 overflow-y-auto">
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
      </div>
    </section>
  </div>
</template>
