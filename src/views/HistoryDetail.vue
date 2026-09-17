<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'
import {
  formatDuration,
  HISTORY_OUTCOME_BADGE_CLASSES,
  HISTORY_OUTCOME_LABEL_KEYS,
  HISTORY_STATE_BADGE_CLASSES,
  HISTORY_STATE_LABEL_KEYS,
  postHistoryVote,
} from './location-detail/composables/useLocationHistory'
import { useEntryPhoto } from './location-detail/composables/useEntryPhoto'
import PhotoLightbox from './location-detail/components/PhotoLightbox.vue'
import HistoryVoteWidget from './location-detail/components/HistoryVoteWidget.vue'
import TopThreePodium2D from '../components/TopThreePodium2D.vue'
import HelpTooltip from '../components/base/HelpTooltip.vue'
import { getMeepleOptions, TOKEN_SETS } from '../utils/tokenSets'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const location = ref(null)
const entry = ref(null)
const locationGames = ref([])
const pageLoading = ref(true)
const pageError = ref('')
const noAccess = ref(false)

const ownerUsername = computed(
  () => location.value?.ownerUsername ?? location.value?.owner?.username,
)

const canManage = computed(() => {
  if (!location.value) return false
  return auth.isAdmin || ownerUsername.value === auth.user?.username
})

const voting = ref(false)
const voteError = ref('')

const myVote = computed(
  () => entry.value?.votes?.find((v) => v.username === auth.user?.username)?.score ?? null,
)

async function submitVote(score) {
  // Vue Router can reuse this component instance across
  // /locations/:id/history/:historyId navigations, so a slow in-flight
  // request must not clobber a freshly-loaded different entry.
  const historyId = entry.value.id
  voting.value = true
  voteError.value = ''

  try {
    const updated = await postHistoryVote(route.params.id, historyId, score)
    if (entry.value?.id === historyId) entry.value = updated
  } catch (e) {
    voteError.value = e.message || t('locationDetail.historyEntry.vote.submitFailed')
  } finally {
    voting.value = false
  }
}

const orderedPlayers = computed(() => {
  if (!entry.value) return []
  return entry.value.state === 'FINISHED' && !entry.value.outcome
    ? [...(entry.value.players ?? [])].sort((a, b) => a.placement - b.placement)
    : (entry.value.players ?? [])
})

function stateLabel(state) {
  return HISTORY_STATE_LABEL_KEYS[state] ? t(HISTORY_STATE_LABEL_KEYS[state]) : state
}

function outcomeLabel(outcome) {
  return HISTORY_OUTCOME_LABEL_KEYS[outcome] ? t(HISTORY_OUTCOME_LABEL_KEYS[outcome]) : outcome
}

const topThreePlacements = computed(() => {
  if (!entry.value || entry.value.state !== 'FINISHED') return []
  return orderedPlayers.value
    .filter((player) => player.placement != null && player.placement <= 3)
    .map((player) => ({
      place: player.placement,
      name: player.username,
      score: player.points ?? 0,
      pieceId: player.meeples || undefined,
    }))
})

// Resolved via the location's game catalog (loaded in loadPage), matching
// on the stable numeric gameId rather than the display name — see
// tokenSets.js for why TOKEN_SETS itself is keyed by BoardGameGeek id.
const entryGameBggId = computed(
  () => locationGames.value.find((g) => String(g.id) === String(entry.value?.gameId))?.bggId ?? null,
)

// A game with a known token set (see tokenSets.js) unlocks its own pieces
// on the podium (see TopThreePodium2D); every other game falls back to the
// generic themed-dice avatars.
const podiumAvatarStyle = computed(() => (TOKEN_SETS[entryGameBggId.value] ? 'tokens' : 'dice'))

const gameMeepleOptions = computed(() => getMeepleOptions(entryGameBggId.value))

// Returns the matching option (icon + id) for a player's recorded meeples,
// or null if it doesn't match one (e.g. the game's token set changed since
// it was recorded) — callers fall back to the raw stored value for the
// label in that case, so a player's pick never silently disappears.
function meepleOption(player) {
  if (!player.meeples) return null
  return gameMeepleOptions.value.find((o) => o.id === player.meeples) ?? null
}

function meepleLabel(player) {
  const option = meepleOption(player)
  return option ? t(`meeples.${option.gameKey}.${option.slug}`) : player.meeples
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
const lightboxOpen = ref(false)

onMounted(loadPage)
onUnmounted(cleanupPhoto)

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''
  noAccess.value = false

  try {
    const locationRes = await apiFetch(`api/locations/${route.params.id}`)
    if (locationRes.status === 403) {
      noAccess.value = true
      return
    }
    if (locationRes.status === 404) {
      throw new Error(t('historyDetail.locationNotFound'))
    }
    if (!locationRes.ok) {
      throw new Error(t('historyDetail.loadLocationFailed'))
    }
    location.value = await locationRes.json()

    // Anyone who can load the location at all (owner, admin, or anyone it's
    // shared with — enforced server-side, same as LocationDetail.vue) can
    // view its history read-only; only editing is further restricted below.
    //
    // No single-entry GET endpoint — load the list and find this one, same
    // as HistoryForm.vue does for edit.
    const [historyRes, gamesRes] = await Promise.all([
      apiFetch(`api/locations/${route.params.id}/history`),
      apiFetch(`api/locations/${route.params.id}/games`),
    ])
    if (!historyRes.ok) {
      throw new Error(t('historyDetail.loadHistoryEntryFailed'))
    }
    const entries = await historyRes.json()
    const found = entries.find((e) => String(e.id) === String(route.params.historyId))
    if (!found) {
      throw new Error(t('historyDetail.historyEntryNotFound'))
    }
    entry.value = found
    // Only used to resolve entry.gameId -> bggId for the podium/meeple
    // token lookup (see entryGameBggId) — fails soft (falls back to the
    // generic dice avatars) rather than blocking the whole page.
    locationGames.value = gamesRes.ok ? await gamesRes.json() : []
    loadPhoto()
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
          <h2 class="mb-4 text-lg font-semibold">{{ $t('historyForm.playersSectionTitle') }}</h2>

          <template v-if="topThreePlacements.length > 0">
            <p
              class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500"
            >
              {{ $t('historyDetail.podium.title') }}
              <HelpTooltip :text="t('historyDetail.podium.helpText')" />
            </p>
            <TopThreePodium2D
              :top-three="topThreePlacements"
              :game-name="entry.gameName ?? ''"
              :game-id="entryGameBggId"
              :avatar-style="podiumAvatarStyle"
            />
          </template>

          <ol v-if="entry.state === 'FINISHED' && !entry.outcome" class="list-inside list-decimal space-y-1 text-sm text-slate-300">
            <li v-for="player in orderedPlayers" :key="player.username">
              {{ player.username }}
              <span v-if="player.points != null" class="text-slate-500">
                ({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})
              </span>
              <span v-if="player.meeples" class="inline-flex items-center gap-1 text-slate-500">
                —
                <img
                  v-if="meepleOption(player)?.image"
                  :src="meepleOption(player).image"
                  alt=""
                  class="h-3.5 w-3.5 rounded-sm object-cover"
                  :class="{ border: meepleOption(player).frameColor }"
                  :style="{ borderColor: meepleOption(player).frameColor }"
                />
                <svg
                  v-else-if="meepleOption(player)"
                  :viewBox="meepleOption(player).viewBox"
                  class="h-3.5 w-3.5"
                  :fill="meepleOption(player).color"
                >
                  <path :d="meepleOption(player).path" />
                </svg>
                {{ meepleLabel(player) }}
              </span>
            </li>
          </ol>
          <ul v-else class="list-none space-y-1 text-sm text-slate-300">
            <li v-for="player in orderedPlayers" :key="player.username">
              {{ player.username }}
              <span v-if="player.points != null" class="text-slate-500">
                ({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})
              </span>
              <span v-if="player.meeples" class="inline-flex items-center gap-1 text-slate-500">
                —
                <img
                  v-if="meepleOption(player)?.image"
                  :src="meepleOption(player).image"
                  alt=""
                  class="h-3.5 w-3.5 rounded-sm object-cover"
                  :class="{ border: meepleOption(player).frameColor }"
                  :style="{ borderColor: meepleOption(player).frameColor }"
                />
                <svg
                  v-else-if="meepleOption(player)"
                  :viewBox="meepleOption(player).viewBox"
                  class="h-3.5 w-3.5"
                  :fill="meepleOption(player).color"
                >
                  <path :d="meepleOption(player).path" />
                </svg>
                {{ meepleLabel(player) }}
              </span>
            </li>
          </ul>
        </div>

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
            <span
              v-if="entry.outcome"
              class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
              :class="HISTORY_OUTCOME_BADGE_CLASSES[entry.outcome] ?? 'bg-slate-700 text-slate-200'"
            >
              {{ outcomeLabel(entry.outcome) }}
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

          <div v-if="entry.state === 'FINISHED'" class="mt-4 border-t border-slate-800 pt-4">
            <p class="text-xs font-medium text-slate-500">{{ $t('locationDetail.historyEntry.vote.sectionTitle') }}</p>
            <p class="mt-1 text-sm text-slate-300">
              <template v-if="entry.voteCount > 0">
                {{ $t('locationDetail.historyEntry.vote.communityAverage') }}:
                ★{{ entry.averageRating.toFixed(1) }}
                ({{ $t('locationDetail.historyEntry.vote.voteCount', { count: entry.voteCount }, entry.voteCount) }})
              </template>
              <template v-else>{{ $t('locationDetail.historyEntry.vote.noRatingsYet') }}</template>
            </p>
            <HistoryVoteWidget class="mt-2" :my-vote="myVote" :pending="voting" @vote="submitVote" />
            <p v-if="voteError" class="mt-2 text-xs text-red-400">{{ voteError }}</p>
          </div>
        </div>
      </div>

      <div v-if="photoUrl || canManage" class="mt-6">
        <button
          v-if="photoUrl"
          type="button"
          class="block w-full overflow-hidden rounded-2xl"
          :aria-label="$t('locationDetail.historyEntry.viewPhoto')"
          @click="lightboxOpen = true"
        >
          <img :src="photoUrl" alt="" class="h-64 w-full object-cover sm:h-80" />
        </button>
        <p
          v-else
          class="rounded-2xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('locationDetail.historyEntry.noPhoto') }}
        </p>

        <div v-if="canManage" class="mt-3 flex flex-wrap items-center gap-3">
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
    </template>

    <PhotoLightbox
      :url="lightboxOpen ? photoUrl : null"
      :can-manage="canManage"
      :saving="uploadingPhoto"
      :error="photoError"
      @close="lightboxOpen = false"
      @save-rotation="uploadPhoto"
    />
  </div>
</template>
