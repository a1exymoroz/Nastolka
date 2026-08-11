<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'
import {
  formatDuration,
  HISTORY_STATE_BADGE_CLASSES,
  HISTORY_STATE_LABEL_KEYS,
} from './location-detail/composables/useLocationHistory'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const location = ref(null)
const shares = ref([])
const entry = ref(null)
const pageLoading = ref(true)
const pageError = ref('')
const noAccess = ref(false)

const ownerUsername = computed(
  () => location.value?.ownerUsername ?? location.value?.owner?.username,
)

// Viewable by the owner, admins, or anyone the location is shared with —
// the same population as HistoryForm.vue's eligiblePlayers.
const canView = computed(() => {
  if (!location.value) return false
  if (auth.isAdmin || ownerUsername.value === auth.user?.username) return true
  return shares.value.some((s) => (s.username ?? s.targetUsername) === auth.user?.username)
})

const canManage = computed(() => {
  if (!location.value) return false
  return auth.isAdmin || ownerUsername.value === auth.user?.username
})

const orderedPlayers = computed(() => {
  if (!entry.value) return []
  return entry.value.state === 'FINISHED'
    ? [...(entry.value.players ?? [])].sort((a, b) => a.placement - b.placement)
    : (entry.value.players ?? [])
})

function stateLabel(state) {
  return HISTORY_STATE_LABEL_KEYS[state] ? t(HISTORY_STATE_LABEL_KEYS[state]) : state
}

onMounted(loadPage)

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''
  noAccess.value = false

  try {
    const locationRes = await apiFetch(`api/locations/${route.params.id}`)
    if (locationRes.status === 404) {
      throw new Error(t('historyDetail.locationNotFound'))
    }
    if (!locationRes.ok) {
      throw new Error(t('historyDetail.loadLocationFailed'))
    }
    location.value = await locationRes.json()

    const sharesRes = await apiFetch(`api/locations/${route.params.id}/shares`)
    shares.value = sharesRes.ok ? await sharesRes.json() : []

    if (!canView.value) {
      noAccess.value = true
      return
    }

    // No single-entry GET endpoint — load the list and find this one, same
    // as HistoryForm.vue does for edit.
    const historyRes = await apiFetch(`api/locations/${route.params.id}/history`)
    if (!historyRes.ok) {
      throw new Error(t('historyDetail.loadHistoryEntryFailed'))
    }
    const entries = await historyRes.json()
    const found = entries.find((e) => String(e.id) === String(route.params.historyId))
    if (!found) {
      throw new Error(t('historyDetail.historyEntryNotFound'))
    }
    entry.value = found
  } catch (e) {
    pageError.value = e.message || t('historyDetail.loadFailed')
  } finally {
    pageLoading.value = false
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
      {{ $t('common.backTo', { name: location ? location.name : $t('common.genericLocation') }) }}
    </button>

    <section v-if="pageLoading" class="py-20 text-center text-slate-400">{{ $t('historyDetail.loading') }}</section>

    <section v-else-if="noAccess" class="py-20 text-center">
      <p class="text-lg font-semibold text-slate-200">{{ $t('historyDetail.noAccessTitle') }}</p>
      <p class="mt-2 text-sm text-slate-400">{{ $t('historyDetail.noAccessMessage') }}</p>
    </section>

    <section v-else-if="pageError" class="py-20 text-center">
      <p class="text-red-400">{{ pageError }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="loadPage"
      >
        {{ $t('common.tryAgain') }}
      </button>
    </section>

    <template v-else-if="entry">
      <div class="mb-6 flex items-start justify-between gap-3">
        <h1 class="text-2xl font-bold tracking-tight">{{ $t('historyDetail.title') }}</h1>
        <button
          v-if="canManage"
          type="button"
          class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          @click="
            router.push({
              name: 'location-history-edit',
              params: { id: route.params.id, historyId: route.params.historyId },
            })
          "
        >
          {{ $t('historyDetail.editButton') }}
        </button>
      </div>

      <div class="space-y-6">
        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold">
              {{ entry.gameName ?? $t('locationDetail.historyEntry.unknownGame') }}
            </h2>
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
              :class="HISTORY_STATE_BADGE_CLASSES[entry.state] ?? 'bg-slate-700 text-slate-200'"
            >
              {{ stateLabel(entry.state) }}
            </span>
          </div>

          <dl class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-xs font-medium text-slate-500">{{ $t('historyForm.playedAtLabel') }}</dt>
              <dd class="mt-0.5 text-sm text-slate-200">{{ $d(new Date(entry.playedAt), 'short') }}</dd>
            </div>
            <div v-if="entry.durationMinutes != null">
              <dt class="text-xs font-medium text-slate-500">{{ $t('historyDetail.durationLabel') }}</dt>
              <dd class="mt-0.5 text-sm text-slate-200">{{ formatDuration(entry.durationMinutes, t) }}</dd>
            </div>
            <div v-if="entry.startedAt">
              <dt class="text-xs font-medium text-slate-500">{{ $t('historyForm.startedAtLabel') }}</dt>
              <dd class="mt-0.5 text-sm text-slate-200">{{ $d(new Date(entry.startedAt), 'shortDateTime') }}</dd>
            </div>
            <div v-if="entry.finishedAt">
              <dt class="text-xs font-medium text-slate-500">{{ $t('historyForm.finishedAtLabel') }}</dt>
              <dd class="mt-0.5 text-sm text-slate-200">{{ $d(new Date(entry.finishedAt), 'shortDateTime') }}</dd>
            </div>
            <div v-if="entry.rating">
              <dt class="text-xs font-medium text-slate-500">{{ $t('historyForm.ratingLabel') }}</dt>
              <dd class="mt-0.5 text-sm text-slate-200">{{ entry.rating }}/10</dd>
            </div>
          </dl>

          <div v-if="entry.expansions?.length" class="mt-4">
            <p class="text-xs font-medium text-slate-500">{{ $t('historyForm.expansionsUsed') }}</p>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <span
                v-for="expansion in entry.expansions"
                :key="expansion.id"
                class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200"
              >
                {{ expansion.name }}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="mb-4 text-lg font-semibold">{{ $t('historyForm.playersSectionTitle') }}</h2>

          <ol v-if="entry.state === 'FINISHED'" class="list-inside list-decimal space-y-1 text-sm text-slate-300">
            <li v-for="player in orderedPlayers" :key="player.username">
              {{ player.username }}
              <span v-if="player.points != null" class="text-slate-500">
                ({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})
              </span>
            </li>
          </ol>
          <ul v-else class="list-none space-y-1 text-sm text-slate-300">
            <li v-for="player in orderedPlayers" :key="player.username">
              {{ player.username }}
              <span v-if="player.points != null" class="text-slate-500">
                ({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})
              </span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
