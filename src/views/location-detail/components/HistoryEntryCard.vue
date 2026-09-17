<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../stores/auth'
import { avatarTintClasses } from '../../../utils/avatarColor'
import {
  formatDuration,
  HISTORY_OUTCOME_BADGE_CLASSES,
  HISTORY_OUTCOME_LABEL_KEYS,
  HISTORY_STATE_BADGE_CLASSES,
  HISTORY_STATE_LABEL_KEYS,
} from '../composables/useLocationHistory'
import { useEntryPhoto } from '../composables/useEntryPhoto'
import PhotoLightbox from './PhotoLightbox.vue'
import HistoryVoteWidget from './HistoryVoteWidget.vue'
import BaseButton from '../../../components/base/BaseButton.vue'

const props = defineProps({
  entry: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
  deletingHistoryId: { type: [String, Number], default: null },
  photoEntryIds: { type: Array, default: null },
  photoEntryIdsLoading: { type: Boolean, default: false },
  votingHistoryIds: { type: Set, default: () => new Set() },
  voteErrors: { type: Object, default: () => ({}) },
})

defineEmits(['view', 'edit', 'delete', 'vote'])

const { t } = useI18n()
const auth = useAuthStore()

const myVote = computed(
  () => props.entry.votes?.find((v) => v.username === auth.user?.username)?.score ?? null,
)

const HISTORY_STATE_ACCENT_CLASSES = {
  CREATED: 'border-l-slate-600',
  IN_PROGRESS: 'border-l-amber-500',
  FINISHED: 'border-l-emerald-500',
}

// Gold/silver/bronze for the podium places; everything else is a neutral
// numbered badge — gives the winner visual weight without reading the text.
const RANK_BADGE_CLASSES = {
  1: 'bg-amber-400/20 text-amber-300 ring-amber-400/40',
  2: 'bg-slate-300/20 text-slate-200 ring-slate-300/40',
  3: 'bg-orange-700/20 text-orange-300 ring-orange-600/40',
}

function rankBadgeClasses(placement) {
  return RANK_BADGE_CLASSES[placement] ?? 'bg-slate-800 text-slate-400 ring-slate-700'
}

const rankedPlayers = computed(() =>
  [...(props.entry.players ?? [])].sort((a, b) => a.placement - b.placement),
)

function stateLabel(state) {
  return HISTORY_STATE_LABEL_KEYS[state] ? t(HISTORY_STATE_LABEL_KEYS[state]) : state
}

function outcomeLabel(outcome) {
  return HISTORY_OUTCOME_LABEL_KEYS[outcome] ? t(HISTORY_OUTCOME_LABEL_KEYS[outcome]) : outcome
}

// View-only here — adding/replacing/removing the photo lives on the entry's
// own pages (HistoryDetail.vue, HistoryForm.vue), not on the summary card.
const { photoUrl, loadPhoto, cleanup } = useEntryPhoto(props.entry.id)
const lightboxOpen = ref(false)

watch(
  () => [props.photoEntryIds, props.photoEntryIdsLoading],
  ([entryIds, loading]) => {
    if (loading) return
    if (entryIds === null || entryIds.includes(String(props.entry.id))) loadPhoto()
  },
  { immediate: true },
)
onUnmounted(cleanup)
</script>

<template>
  <li
    class="flex flex-col gap-3 rounded-xl border border-l-4 border-slate-800 bg-slate-900 p-4"
    :class="HISTORY_STATE_ACCENT_CLASSES[entry.state] ?? 'border-l-slate-600'"
  >
    <div class="flex items-start gap-4">
      <button
        v-if="photoUrl"
        type="button"
        class="h-24 w-24 shrink-0 overflow-hidden rounded-lg"
        :aria-label="$t('locationDetail.historyEntry.viewPhoto')"
        @click="lightboxOpen = true"
      >
        <img :src="photoUrl" alt="" class="h-full w-full object-cover" />
      </button>
      <div
        v-else-if="!photoEntryIdsLoading"
        class="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-600"
        aria-hidden="true"
      >
        <svg
          class="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold">{{ entry.gameName ?? $t('locationDetail.historyEntry.unknownGame') }}</p>
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
            <p class="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <svg
                class="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {{ $d(new Date(entry.playedAt), 'short') }}
            </p>
            <p v-if="entry.durationMinutes != null" class="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <svg
                class="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
              {{ $t('locationDetail.historyEntry.duration', { duration: formatDuration(entry.durationMinutes, t) }) }}
            </p>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-1.5">
            <div v-if="entry.rating" class="flex flex-col items-end leading-tight">
              <span class="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {{ $t('locationDetail.historyEntry.sessionRatingLabel') }}
              </span>
              <span class="text-sm font-semibold text-amber-400">{{ entry.rating }}/10</span>
            </div>
            <div
              v-if="entry.voteCount > 0"
              class="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 ring-1 ring-inset ring-amber-500/30"
              :title="$t('locationDetail.historyEntry.vote.communityAverage')"
            >
              <span class="text-amber-400" aria-hidden="true">★</span>
              <div class="flex flex-col leading-tight">
                <span class="text-[9px] font-semibold uppercase tracking-wide text-amber-300/80">
                  {{ $t('locationDetail.historyEntry.vote.communityAverage') }}
                </span>
                <span class="text-sm font-semibold text-amber-300">
                  {{ entry.averageRating.toFixed(1) }} ({{ entry.voteCount }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ol v-if="entry.state === 'FINISHED' && !entry.outcome" class="list-none space-y-1">
      <li v-for="player in rankedPlayers" :key="player.username" class="flex items-center gap-2 text-sm">
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 ring-inset"
          :class="rankBadgeClasses(player.placement)"
        >
          <svg
            v-if="player.placement === 1"
            class="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
            <path d="M8 4H5a1 1 0 0 0-1 1c0 2.5 1.5 4 4 4.3" />
            <path d="M16 4h3a1 1 0 0 1 1 1c0 2.5-1.5 4-4 4.3" />
            <line x1="12" y1="13" x2="12" y2="17" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="17" x2="12" y2="20" />
          </svg>
          <span :class="{ 'sr-only': player.placement === 1 }">{{ player.placement }}</span>
        </span>
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
          :class="avatarTintClasses(player.username)"
          aria-hidden="true"
        >
          {{ player.username.charAt(0).toUpperCase() }}
        </span>
        <span class="min-w-0 flex-1 truncate text-xs text-slate-500">{{ player.username }}</span>
        <span v-if="player.points != null" class="ml-auto shrink-0 text-xs font-semibold text-slate-300">
          ({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})
        </span>
      </li>
    </ol>
    <ul v-else class="list-none space-y-1">
      <li v-for="player in entry.players ?? []" :key="player.username" class="flex items-center gap-2 text-sm">
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
          :class="avatarTintClasses(player.username)"
          aria-hidden="true"
        >
          {{ player.username.charAt(0).toUpperCase() }}
        </span>
        <span class="min-w-0 flex-1 truncate text-xs text-slate-500">{{ player.username }}</span>
        <span v-if="player.points != null" class="ml-auto shrink-0 text-xs font-semibold text-slate-300">
          ({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})
        </span>
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-2">
      <BaseButton variant="ghost" size="sm" class="hover:bg-slate-800/60" @click="$emit('view', entry)">
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {{ $t('locationDetail.historyEntry.view') }}
      </BaseButton>
      <template v-if="canManage">
        <BaseButton variant="ghost" size="sm" class="hover:bg-slate-800/60" @click="$emit('edit', entry)">
          <svg
            class="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          {{ $t('locationDetail.historyEntry.edit') }}
        </BaseButton>
        <BaseButton
          variant="danger"
          size="sm"
          class="hover:bg-red-500/10"
          :disabled="deletingHistoryId === entry.id"
          @click="$emit('delete', entry)"
        >
          <svg
            class="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          {{ deletingHistoryId === entry.id ? $t('common.deleting') : $t('common.delete') }}
        </BaseButton>
      </template>
    </div>

    <div v-if="entry.state === 'FINISHED'">
      <HistoryVoteWidget
        compact
        :my-vote="myVote"
        :pending="votingHistoryIds.has(entry.id)"
        @vote="(score) => $emit('vote', entry, score)"
      />
      <p v-if="voteErrors[entry.id]" class="mt-1 text-xs text-red-400">{{ voteErrors[entry.id] }}</p>
    </div>

    <PhotoLightbox :url="lightboxOpen ? photoUrl : null" @close="lightboxOpen = false" />
  </li>
</template>
