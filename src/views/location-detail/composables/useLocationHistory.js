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

export function formatDuration(minutes, translate) {
  if (minutes == null) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0
    ? translate('locationDetail.historyEntry.durationHoursMinutes', { hours, minutes: rest })
    : translate('locationDetail.historyEntry.durationMinutesOnly', { minutes: rest })
}

export function useLocationHistory() {
  const route = useRoute()

  const history = ref([])
  const historyLoading = ref(true)
  const historyError = ref('')
  const deletingHistoryId = ref(null)

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

  return {
    history,
    historyLoading,
    historyError,
    deletingHistoryId,
    fetchHistory,
    handleDeleteHistory,
  }
}
