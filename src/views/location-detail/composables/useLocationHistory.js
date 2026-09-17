import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../../utils/apiFetch'
import { t } from '../../../i18n'

export const HISTORY_STATE_BADGE_CLASSES = {
  CREATED: 'bg-slate-700 text-slate-200',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  FINISHED: 'bg-emerald-500/20 text-emerald-400',
}

export const HISTORY_STATE_LABEL_KEYS = {
  CREATED: 'common.historyStates.created',
  IN_PROGRESS: 'common.historyStates.inProgress',
  FINISHED: 'common.historyStates.finished',
}

export const HISTORY_OUTCOME_BADGE_CLASSES = {
  WON: 'bg-emerald-500/20 text-emerald-400',
  LOST: 'bg-rose-500/20 text-rose-400',
}

export const HISTORY_OUTCOME_LABEL_KEYS = {
  WON: 'common.historyOutcomes.won',
  LOST: 'common.historyOutcomes.lost',
}

export function formatDuration(minutes, translate) {
  if (minutes == null) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0
    ? translate('locationDetail.historyEntry.durationHoursMinutes', { hours, minutes: rest })
    : translate('locationDetail.historyEntry.durationMinutesOnly', { minutes: rest })
}

export async function postHistoryVote(locationId, historyId, score) {
  const response = await apiFetch(`api/locations/${locationId}/history/${historyId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || data.error || t('locationDetail.historyEntry.vote.submitFailed'))
  }

  // Full HistoryResponse for the voted-on entry, including the updated
  // votes/averageRating/voteCount — the server is the source of truth, so
  // callers should replace their local entry with this rather than
  // recomputing the aggregate client-side.
  return response.json()
}

export function useLocationHistory() {
  const route = useRoute()

  const history = ref([])
  const historyLoading = ref(true)
  const historyError = ref('')
  const deletingHistoryId = ref(null)
  // A Set, unlike deletingHistoryId, because several cards in the grid can
  // be mid-vote independently at the same time.
  const votingHistoryIds = ref(new Set())
  const voteErrors = ref({})

  async function fetchHistory() {
    historyLoading.value = true
    historyError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/history`)

      if (!response.ok) {
        throw new Error(t('locationDetail.history.loadFailed'))
      }

      // Backend already returns newest-first.
      history.value = await response.json()
    } catch (e) {
      historyError.value = e.message || t('locationDetail.history.loadFailed')
    } finally {
      historyLoading.value = false
    }
  }

  async function handleDeleteHistory(entry) {
    if (!window.confirm(t('locationDetail.history.confirmDelete'))) {
      return
    }

    historyError.value = ''
    deletingHistoryId.value = entry.id

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/history/${entry.id}`,
        { method: 'DELETE' },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error(t('locationDetail.history.deleteFailed'))
      }

      await fetchHistory()
    } catch (e) {
      historyError.value = e.message || t('locationDetail.history.deleteFailed')
    } finally {
      deletingHistoryId.value = null
    }
  }

  async function submitVote(entry, score) {
    voteErrors.value[entry.id] = ''
    votingHistoryIds.value.add(entry.id)

    try {
      const updated = await postHistoryVote(route.params.id, entry.id, score)
      const index = history.value.findIndex((e) => e.id === entry.id)
      if (index !== -1) history.value[index] = updated
    } catch (e) {
      voteErrors.value[entry.id] = e.message || t('locationDetail.historyEntry.vote.submitFailed')
    } finally {
      votingHistoryIds.value.delete(entry.id)
    }
  }

  return {
    history,
    historyLoading,
    historyError,
    deletingHistoryId,
    votingHistoryIds,
    voteErrors,
    fetchHistory,
    handleDeleteHistory,
    submitVote,
  }
}
