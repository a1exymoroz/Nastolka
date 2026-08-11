<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'
import {
  toDateInputValue,
  toDateTimeInputValue,
  dateInputValueToIso,
  dateTimeInputValueToIso,
} from '../utils/date'
import { HISTORY_STATE_LABEL_KEYS } from './location-detail/composables/useLocationHistory'
import { useEntryPhoto } from './location-detail/composables/useEntryPhoto'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const isEdit = computed(() => !!route.params.historyId)

// Editing an existing entry came from its read-only detail page, so cancel/back
// should return there; logging a brand-new one has no detail page to go back to.
const backTarget = computed(() =>
  isEdit.value
    ? { name: 'location-history-detail', params: { id: route.params.id, historyId: route.params.historyId } }
    : { name: 'location-detail', params: { id: route.params.id } },
)

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
  return toDateInputValue(new Date().toISOString())
}

function nowDateTimeString() {
  return toDateTimeInputValue(new Date().toISOString())
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
    const res = await apiFetch(`api/locations/${route.params.id}/games/${gameId}/expansions`)
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

const {
  photoUrl,
  photoError,
  uploadingPhoto,
  deletingPhoto,
  loadPhoto,
  uploadPhoto,
  deletePhoto,
  cleanup: cleanupPhoto,
} = useEntryPhoto(route.params.historyId)

onMounted(async () => {
  await loadPage()
})
onUnmounted(cleanupPhoto)

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''

  try {
    const [locationRes, gamesRes] = await Promise.all([
      apiFetch(`api/locations/${route.params.id}`),
      apiFetch(`api/locations/${route.params.id}/games`),
    ])

    if (locationRes.status === 404) {
      throw new Error(t('historyForm.locationNotFound'))
    }
    if (!locationRes.ok) {
      throw new Error(t('historyForm.loadLocationFailed'))
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

    const sharesRes = await apiFetch(`api/locations/${route.params.id}/shares`)
    shares.value = sharesRes.ok ? await sharesRes.json() : []

    if (isEdit.value) {
      const historyRes = await apiFetch(`api/locations/${route.params.id}/history`)
      if (!historyRes.ok) {
        throw new Error(t('historyForm.loadHistoryEntryFailed'))
      }
      const entries = await historyRes.json()
      const entry = entries.find((e) => String(e.id) === String(route.params.historyId))
      if (!entry) {
        throw new Error(t('historyForm.historyEntryNotFound'))
      }
      populateForm(entry)
      loadPhoto()
    }
  } catch (e) {
    pageError.value = e.message || t('historyForm.loadFailed')
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
    playedAt: entry.playedAt ? toDateInputValue(entry.playedAt) : todayDateString(),
    startedAt: entry.startedAt ? toDateTimeInputValue(entry.startedAt) : '',
    finishedAt: entry.finishedAt ? toDateTimeInputValue(entry.finishedAt) : '',
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

function handleStateChange() {
  if (form.value.state === 'FINISHED' && !form.value.finishedAt) {
    form.value.finishedAt = nowDateTimeString()
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
    formError.value = t('historyForm.requirePlayerError')
    return
  }

  const usernames = entries.map((p) => p.username)
  if (new Set(usernames).size !== usernames.length) {
    formError.value = t('historyForm.duplicatePlayerError')
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
    playedAt: dateInputValueToIso(form.value.playedAt),
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
    body.startedAt = dateTimeInputValueToIso(form.value.startedAt)
  }
  if (form.value.finishedAt) {
    body.finishedAt = dateTimeInputValueToIso(form.value.finishedAt)
  }

  try {
    const url = isEdit.value
      ? `api/locations/${route.params.id}/history/${route.params.historyId}`
      : `api/locations/${route.params.id}/history`

    const response = await apiFetch(url, {
      method: isEdit.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || t('historyForm.saveFailed'))
    }

    router.push({ name: 'location-detail', params: { id: route.params.id } })
  } catch (e) {
    formError.value = e.message || t('historyForm.saveFailed')
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
      @click="router.push(backTarget)"
    >
      {{ $t('common.backTo', { name: location ? location.name : $t('common.genericLocation') }) }}
    </button>

    <section v-if="pageLoading" class="py-20 text-center text-slate-400">{{ $t('historyForm.loading') }}</section>

    <section v-else-if="pageError" class="py-20 text-center">
      <p class="text-red-400">{{ pageError }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="loadPage"
      >
        {{ $t('common.tryAgain') }}
      </button>
    </section>

    <template v-else>
      <h1 class="mb-6 text-2xl font-bold tracking-tight">
        {{ isEdit ? $t('historyForm.editSession') : $t('historyForm.logSession') }}
      </h1>

      <p v-if="formError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ formError }}
      </p>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="mb-4 text-lg font-semibold">{{ $t('historyForm.gameSectionTitle') }}</h2>
          <div class="space-y-4">
            <div>
              <label for="history-game" class="mb-1 block text-sm font-medium text-slate-300">
                {{ $t('historyForm.gameLabel') }}
              </label>
              <select
                id="history-game"
                v-model="form.gameId"
                required
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="" disabled>{{ $t('historyForm.selectGamePlaceholder') }}</option>
                <option v-for="game in locationGames" :key="game.id" :value="game.id">
                  {{ game.name }}
                </option>
              </select>
            </div>

            <div v-if="form.gameId">
              <label class="mb-1 block text-sm font-medium text-slate-300">{{ $t('historyForm.expansionsUsed') }}</label>
              <p v-if="expansionsLoading" class="text-xs text-slate-500">{{ $t('historyForm.loadingExpansions') }}</p>
              <p v-else-if="gameExpansions.length === 0" class="text-xs text-slate-500">
                {{ $t('historyForm.noExpansionsAssigned') }}
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
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="mb-4 text-lg font-semibold">{{ $t('historyForm.timingSectionTitle') }}</h2>
          <div class="space-y-4">
            <div v-if="isEdit">
              <label for="history-state" class="mb-1 block text-sm font-medium text-slate-300">
                {{ $t('historyForm.stateLabel') }}
              </label>
              <select
                id="history-state"
                v-model="form.state"
                required
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                @change="handleStateChange"
              >
                <option v-for="s in HISTORY_STATES" :key="s" :value="s">
                  {{ HISTORY_STATE_LABEL_KEYS[s] ? t(HISTORY_STATE_LABEL_KEYS[s]) : s }}
                </option>
              </select>
              <p v-if="form.state === 'FINISHED'" class="mt-1 text-xs text-slate-500">
                {{ $t('historyForm.finishingRequiresPlacement') }}
              </p>
            </div>

            <div class="min-w-0">
              <label for="history-played-at" class="mb-1 block text-sm font-medium text-slate-300">
                {{ $t('historyForm.playedAtLabel') }}
              </label>
              <input
                id="history-played-at"
                v-model="form.playedAt"
                type="date"
                class="w-full min-w-0 max-w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
              <p class="mt-1 text-xs text-slate-500">{{ $t('historyForm.defaultsToToday') }}</p>
            </div>

            <div :class="isEdit ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : ''">
              <div class="min-w-0">
                <label for="history-started-at" class="mb-1 block text-sm font-medium text-slate-300">
                  {{ $t('historyForm.startedAtLabel') }}
                </label>
                <input
                  id="history-started-at"
                  v-model="form.startedAt"
                  type="datetime-local"
                  class="w-full min-w-0 max-w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <p class="mt-1 text-xs text-slate-500">
                  {{
                    isEdit
                      ? $t('historyForm.autoSetHint', {
                          inProgress: $t('common.historyStates.inProgress'),
                          finished: $t('common.historyStates.finished'),
                        })
                      : $t('historyForm.defaultsToNow')
                  }}
                </p>
              </div>
              <div v-if="isEdit" class="min-w-0">
                <label for="history-finished-at" class="mb-1 block text-sm font-medium text-slate-300">
                  {{ $t('historyForm.finishedAtLabel') }}
                </label>
                <input
                  id="history-finished-at"
                  v-model="form.finishedAt"
                  type="datetime-local"
                  class="w-full min-w-0 max-w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <p class="mt-1 text-xs text-slate-500">
                  {{ $t('historyForm.autoSetFinishedHint', { finished: $t('common.historyStates.finished') }) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="mb-4 text-lg font-semibold">{{ $t('historyForm.playersSectionTitle') }}</h2>
          <label class="mb-1 block text-sm font-medium text-slate-300">
            {{ $t('historyForm.playersLabel') }}
            <span v-if="form.state === 'FINISHED'">{{ $t('historyForm.inFinishingOrder') }}</span>
          </label>
          <p class="mb-2 text-xs text-slate-500">
            {{ $t('historyForm.eligiblePlayersHint') }}
            <router-link
              v-if="eligiblePlayers.length < 2"
              :to="{ name: 'location-detail', params: { id: route.params.id }, hash: '#sharing' }"
              class="text-indigo-400 hover:text-indigo-300"
            >
              {{ $t('historyForm.shareItFirst') }}
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
              class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="" disabled>{{ $t('historyForm.selectPlayerPlaceholder') }}</option>
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
              :placeholder="$t('historyForm.pointsPlaceholder')"
              :title="$t('historyForm.pointsTitle')"
              class="w-20 shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <template v-if="form.state === 'FINISHED'">
              <button
                type="button"
                :disabled="index === 0"
                class="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                :title="$t('historyForm.moveUp')"
                @click="movePlayerRow(index, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                :disabled="index === form.players.length - 1"
                class="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                :title="$t('historyForm.moveDown')"
                @click="movePlayerRow(index, 1)"
              >
                ↓
              </button>
            </template>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:border-red-500 hover:text-red-300"
              :title="$t('historyForm.removeTitle')"
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
            {{ $t('historyForm.addPlayer') }}
          </button>
        </div>

        <div v-if="isEdit">
          <label for="history-rating" class="mb-1 block text-sm font-medium text-slate-300">
            {{ $t('historyForm.ratingLabel') }}
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

        <div v-if="isEdit" class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="mb-4 text-lg font-semibold">{{ $t('locationDetail.historyEntry.photoSectionTitle') }}</h2>

          <img v-if="photoUrl" :src="photoUrl" alt="" class="h-32 w-32 rounded-lg object-cover" />
          <p v-else class="text-xs text-slate-500">{{ $t('locationDetail.historyEntry.noPhoto') }}</p>

          <div class="mt-3 flex flex-wrap items-center gap-3">
            <label
              class="cursor-pointer text-xs font-medium text-slate-300 hover:text-white"
              :class="{ 'pointer-events-none opacity-50': uploadingPhoto }"
            >
              {{
                uploadingPhoto
                  ? $t('locationDetail.historyEntry.uploading')
                  : photoUrl
                    ? $t('locationDetail.historyEntry.replacePhoto')
                    : $t('locationDetail.historyEntry.addPhoto')
              }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="uploadPhoto($event.target.files[0]); $event.target.value = ''"
              />
            </label>
            <button
              v-if="photoUrl"
              type="button"
              :disabled="deletingPhoto"
              class="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              @click="deletePhoto"
            >
              {{ deletingPhoto ? $t('common.removing') : $t('locationDetail.historyEntry.removePhoto') }}
            </button>
          </div>
          <p v-if="photoError" class="mt-2 text-xs text-red-400">{{ photoError }}</p>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="formLoading"
            class="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ formLoading ? $t('common.saving') : isEdit ? $t('historyForm.saveChanges') : $t('historyForm.logSessionButton') }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            @click="router.push(backTarget)"
          >
            {{ $t('common.cancel') }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
