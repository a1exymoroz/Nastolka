import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../../utils/apiFetch'
import { functionsFetch } from '../../../utils/functionsFetch'
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

  // Authenticated photo downloads can't use a plain <img src>, so fetched
  // photos are kept as object URLs here, keyed by history entry id.
  const photoUrls = reactive({})
  const uploadingPhotoId = ref(null)
  const deletingPhotoId = ref(null)

  // Tracks which entry is open, not just its URL, so the lightbox can save a
  // rotated photo back to the right entry and pick up the reloaded photoUrl.
  const lightboxEntry = ref(null)
  const lightboxUrl = computed(() =>
    lightboxEntry.value ? (photoUrls[lightboxEntry.value.id] ?? null) : null,
  )

  function openLightbox(entry) {
    lightboxEntry.value = entry
  }

  function closeLightbox() {
    lightboxEntry.value = null
  }

  function onLightboxKeydown(e) {
    if (e.key === 'Escape') closeLightbox()
  }

  async function loadEntryPhoto(entry) {
    try {
      const response = await functionsFetch(
        `photos-get?locationId=${route.params.id}&entryId=${entry.id}`,
      )
      if (!response.ok) {
        if (photoUrls[entry.id]) {
          URL.revokeObjectURL(photoUrls[entry.id])
          delete photoUrls[entry.id]
        }
        return
      }

      const blob = await response.blob()
      if (photoUrls[entry.id]) {
        URL.revokeObjectURL(photoUrls[entry.id])
      }
      photoUrls[entry.id] = URL.createObjectURL(blob)
    } catch {
      // Non-fatal: the entry just renders without a photo.
    }
  }

  async function loadHistoryPhotos() {
    try {
      const listResponse = await functionsFetch(`photos-list?locationId=${route.params.id}`)
      const { entryIds } = listResponse.ok ? await listResponse.json() : { entryIds: [] }
      await Promise.all(
        history.value
          .filter((entry) => entryIds.includes(String(entry.id)))
          .map((entry) => loadEntryPhoto(entry)),
      )
    } catch {
      // Non-fatal: entries just render without photos.
    }
  }

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
      return
    } finally {
      historyLoading.value = false
    }

    // Photos load separately so the list shows up without waiting on them.
    loadHistoryPhotos()
  }

  async function handleUploadPhoto(entry, file) {
    if (!file) return

    historyError.value = ''
    uploadingPhotoId.value = entry.id

    try {
      const response = await functionsFetch(
        `photos-upload?locationId=${route.params.id}&entryId=${entry.id}`,
        { method: 'POST', body: file, headers: { 'Content-Type': file.type } },
      )

      if (!response.ok) {
        throw new Error(
          response.status === 400
            ? t('locationDetail.historyEntry.notAnImage')
            : t('locationDetail.historyEntry.uploadPhotoFailed'),
        )
      }

      await loadEntryPhoto(entry)
    } catch (e) {
      historyError.value = e.message || t('locationDetail.historyEntry.uploadPhotoFailed')
    } finally {
      uploadingPhotoId.value = null
    }
  }

  async function handleDeletePhoto(entry) {
    if (!window.confirm(t('locationDetail.historyEntry.confirmRemovePhoto'))) return

    historyError.value = ''
    deletingPhotoId.value = entry.id

    try {
      const response = await functionsFetch(
        `photos-delete?locationId=${route.params.id}&entryId=${entry.id}`,
        { method: 'DELETE' },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error(t('locationDetail.historyEntry.removePhotoFailed'))
      }

      if (photoUrls[entry.id]) {
        URL.revokeObjectURL(photoUrls[entry.id])
        delete photoUrls[entry.id]
      }
    } catch (e) {
      historyError.value = e.message || t('locationDetail.historyEntry.removePhotoFailed')
    } finally {
      deletingPhotoId.value = null
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
    lightboxEntry,
    lightboxUrl,
    openLightbox,
    closeLightbox,
    fetchHistory,
    handleUploadPhoto,
    handleDeletePhoto,
    handleDeleteHistory,
  }
}
