import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '../../../config/api'
import { useAuthHeaders } from './useAuthHeaders'

export const HISTORY_STATE_BADGE_CLASSES = {
  CREATED: 'bg-slate-700 text-slate-200',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  FINISHED: 'bg-emerald-500/20 text-emerald-400',
}

export const HISTORY_STATE_LABELS = {
  CREATED: 'Created',
  IN_PROGRESS: 'In progress',
  FINISHED: 'Finished',
}

export function formatDuration(minutes) {
  if (minutes == null) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

export function useLocationHistory() {
  const route = useRoute()
  const authHeaders = useAuthHeaders()

  const history = ref([])
  const historyLoading = ref(true)
  const historyError = ref('')
  const deletingHistoryId = ref(null)

  // Authenticated photo downloads can't use a plain <img src>, so fetched
  // photos are kept as object URLs here, keyed by history entry id.
  const photoUrls = reactive({})
  const uploadingPhotoId = ref(null)
  const deletingPhotoId = ref(null)
  const lightboxUrl = ref(null)

  function onLightboxKeydown(e) {
    if (e.key === 'Escape') lightboxUrl.value = null
  }

  async function loadEntryPhoto(entry) {
    try {
      // TODO: confirm photoUrl is a path on this API (vs. an absolute URL) —
      // assuming a relative path like `/api/locations/{id}/history/{id}/photo`.
      const response = await fetch(apiUrl(entry.photoUrl), { headers: authHeaders() })
      if (!response.ok) return

      const blob = await response.blob()
      if (photoUrls[entry.id]) {
        URL.revokeObjectURL(photoUrls[entry.id])
      }
      photoUrls[entry.id] = URL.createObjectURL(blob)
    } catch {
      // Non-fatal: the entry just renders without a photo.
    }
  }

  async function fetchHistory() {
    historyLoading.value = true
    historyError.value = ''

    try {
      const response = await fetch(apiUrl(`api/locations/${route.params.id}/history`), {
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to load history')
      }

      // Backend already returns newest-first.
      history.value = await response.json()
      await Promise.all(
        history.value.filter((entry) => entry.photoUrl).map((entry) => loadEntryPhoto(entry)),
      )
    } catch (e) {
      historyError.value = e.message || 'Failed to load history'
    } finally {
      historyLoading.value = false
    }
  }

  async function handleUploadPhoto(entry, file) {
    if (!file) return

    historyError.value = ''
    uploadingPhotoId.value = entry.id

    try {
      // TODO: confirm the multipart field name — assuming "file".
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        apiUrl(`api/locations/${route.params.id}/history/${entry.id}/photo`),
        { method: 'POST', headers: authHeaders(), body: formData },
      )

      if (!response.ok) {
        throw new Error(response.status === 400 ? 'That file is not an image.' : 'Failed to upload photo')
      }

      await fetchHistory()
    } catch (e) {
      historyError.value = e.message || 'Failed to upload photo'
    } finally {
      uploadingPhotoId.value = null
    }
  }

  async function handleDeletePhoto(entry) {
    if (!window.confirm('Remove this photo?')) return

    historyError.value = ''
    deletingPhotoId.value = entry.id

    try {
      const response = await fetch(
        apiUrl(`api/locations/${route.params.id}/history/${entry.id}/photo`),
        { method: 'DELETE', headers: authHeaders() },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to remove photo')
      }

      if (photoUrls[entry.id]) {
        URL.revokeObjectURL(photoUrls[entry.id])
        delete photoUrls[entry.id]
      }
      await fetchHistory()
    } catch (e) {
      historyError.value = e.message || 'Failed to remove photo'
    } finally {
      deletingPhotoId.value = null
    }
  }

  async function handleDeleteHistory(entry) {
    if (!window.confirm('Delete this history entry? This cannot be undone.')) {
      return
    }

    historyError.value = ''
    deletingHistoryId.value = entry.id

    try {
      const response = await fetch(
        apiUrl(`api/locations/${route.params.id}/history/${entry.id}`),
        { method: 'DELETE', headers: authHeaders() },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete history entry')
      }

      await fetchHistory()
    } catch (e) {
      historyError.value = e.message || 'Failed to delete history entry'
    } finally {
      deletingHistoryId.value = null
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onLightboxKeydown)
  })

  onUnmounted(() => {
    Object.values(photoUrls).forEach((url) => URL.revokeObjectURL(url))
    window.removeEventListener('keydown', onLightboxKeydown)
  })

  return {
    history,
    historyLoading,
    historyError,
    deletingHistoryId,
    photoUrls,
    uploadingPhotoId,
    deletingPhotoId,
    lightboxUrl,
    fetchHistory,
    handleUploadPhoto,
    handleDeletePhoto,
    handleDeleteHistory,
  }
}
