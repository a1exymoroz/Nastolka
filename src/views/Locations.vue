<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const locations = ref([])
const loading = ref(true)
const error = ref('')

// TODO: the API contract doesn't specify field length limits for locations
// the way it does for games — no maxlength enforced here beyond "required".
const createForm = ref({ name: '', description: '' })
const createLoading = ref(false)
const createError = ref('')

const deletingId = ref(null)
const deleteError = ref('')

// TODO: confirm the exact field the backend uses for the owner's username on
// LocationResponse (assuming `ownerUsername`, falling back to `owner.username`).
function isOwner(location) {
  const ownerUsername = location.ownerUsername ?? location.owner?.username
  return ownerUsername === auth.user?.username
}

function canManage(location) {
  return auth.isAdmin || isOwner(location)
}

// Owner beats admin-override beats "you were shared this" — a location can
// only match one of these for a given viewer.
function accessLabel(location) {
  if (isOwner(location)) return t('locations.owner')
  if (auth.isAdmin) return t('locations.adminAccess')
  return t('locations.sharedWithYou')
}

function accessBadgeClass(location) {
  if (isOwner(location)) return 'bg-indigo-500/20 text-indigo-300'
  if (auth.isAdmin) return 'bg-amber-500/20 text-amber-400'
  return 'bg-slate-700 text-slate-300'
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}

onMounted(async () => {
  await fetchLocations()
})

async function fetchLocations() {
  loading.value = true
  error.value = ''

  try {
    const response = await apiFetch('api/locations')

    if (!response.ok) {
      throw new Error(t('locations.loadFailed'))
    }

    locations.value = await response.json()
  } catch (e) {
    error.value = e.message || t('locations.loadFailed')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  createError.value = ''
  createLoading.value = true

  try {
    const response = await apiFetch('api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.value.name,
        description: createForm.value.description || null,
      }),
    })

    if (response.status === 409) {
      throw new Error(t('locations.limitError'))
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || t('locations.createFailed'))
    }

    createForm.value = { name: '', description: '' }
    await fetchLocations()
  } catch (e) {
    createError.value = e.message || t('locations.createFailed')
  } finally {
    createLoading.value = false
  }
}

async function handleDelete(location) {
  if (!window.confirm(t('common.confirmDeleteNamed', { name: location.name }))) {
    return
  }

  deleteError.value = ''
  deletingId.value = location.id

  try {
    const response = await apiFetch(`api/locations/${location.id}`, {
      method: 'DELETE',
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(t('locations.deleteFailed'))
    }

    await fetchLocations()
  } catch (e) {
    deleteError.value = e.message || t('locations.deleteFailed')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <header class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ $t('locations.title') }}</h1>
        <p class="mt-1 text-slate-400">{{ $t('locations.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          v-if="auth.isAdmin"
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="router.push({ name: 'admin' })"
        >
          {{ $t('common.admin') }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          @click="router.push({ name: 'dice-playground' })"
        >
          {{ $t('common.dicePlayground') }}
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

    <div class="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 class="mb-4 text-lg font-semibold">{{ $t('locations.addLocation') }}</h2>
      <p class="mb-4 text-xs text-slate-500">{{ $t('locations.limitNotice') }}</p>

      <p v-if="createError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ createError }}
      </p>

      <form class="space-y-4" @submit.prevent="handleCreate">
        <div>
          <label for="location-name" class="mb-1 block text-sm font-medium text-slate-300">
            {{ $t('common.name') }}
          </label>
          <input
            id="location-name"
            v-model="createForm.name"
            type="text"
            required
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            :placeholder="$t('locations.namePlaceholder')"
          />
        </div>

        <div>
          <label for="location-description" class="mb-1 block text-sm font-medium text-slate-300">
            {{ $t('common.description') }}
          </label>
          <textarea
            id="location-description"
            v-model="createForm.description"
            rows="3"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            :placeholder="$t('common.optionalDescriptionPlaceholder')"
          />
        </div>

        <button
          type="submit"
          :disabled="createLoading"
          class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ createLoading ? $t('common.adding') : $t('locations.addLocationButton') }}
        </button>
      </form>
    </div>

    <p v-if="deleteError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ deleteError }}
    </p>

    <section v-if="loading" class="py-20 text-center text-slate-400">{{ $t('locations.loadingLocations') }}</section>

    <section v-else-if="error" class="py-20 text-center">
      <p class="text-red-400">{{ error }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="fetchLocations"
      >
        {{ $t('common.tryAgain') }}
      </button>
    </section>

    <p v-else-if="locations.length === 0" class="py-20 text-center text-slate-500">
      {{ $t('locations.noLocationsYet') }}
    </p>

    <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="location in locations"
        :key="location.id"
        class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-600"
      >
        <router-link :to="{ name: 'location-detail', params: { id: location.id } }" class="block p-5">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold">{{ location.name }}</h3>
            <span
              class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
              :class="accessBadgeClass(location)"
            >
              {{ accessLabel(location) }}
            </span>
          </div>
          <p v-if="location.description" class="mt-1 line-clamp-2 text-sm text-slate-400">
            {{ location.description }}
          </p>
        </router-link>
        <div v-if="canManage(location)" class="border-t border-slate-800 p-3">
          <button
            type="button"
            :disabled="deletingId === location.id"
            class="w-full rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            @click="handleDelete(location)"
          >
            {{ deletingId === location.id ? $t('common.deleting') : $t('common.delete') }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
