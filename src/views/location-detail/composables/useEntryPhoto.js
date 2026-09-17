import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { functionsFetch } from '../../../utils/functionsFetch'
import { normalizePhotoImage } from '../../../utils/normalizePhotoImage'
import { useConfirm } from '../../../composables/useConfirm'

// Shared by every place a single history entry's photo can be viewed and/or
// managed (HistoryEntryCard.vue's list view, HistoryDetail.vue, and
// HistoryForm.vue's edit mode) — authenticated downloads can't use a plain
// <img src>, so the fetched photo is kept as an object URL.
export function useEntryPhoto(entryId) {
  const route = useRoute()
  const { t } = useI18n()
  const confirm = useConfirm()

  const photoUrl = ref(null)
  const photoError = ref('')
  const uploadingPhoto = ref(false)
  const deletingPhoto = ref(false)

  async function loadPhoto() {
    try {
      const response = await functionsFetch(
        `photos-get?locationId=${route.params.id}&entryId=${entryId}`,
      )
      if (!response.ok) return

      const blob = await response.blob()
      if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
      photoUrl.value = URL.createObjectURL(blob)
    } catch {
      // Non-fatal: it just renders without a photo.
    }
  }

  async function uploadPhoto(file) {
    if (!file) return

    photoError.value = ''
    uploadingPhoto.value = true

    try {
      // Re-encode to a real JPEG first: browsers report an unreliable (or
      // empty, e.g. iPhone HEIC in Mobile Safari) `file.type` for some
      // source formats, and the raw bytes may not render in every viewer's
      // browser anyway. This also gives us an immediate, offline "not an
      // image" signal for genuinely non-image files.
      let jpegBlob
      try {
        jpegBlob = await normalizePhotoImage(file)
      } catch {
        throw new Error(t('locationDetail.historyEntry.notAnImage'))
      }

      const response = await functionsFetch(
        `photos-upload?locationId=${route.params.id}&entryId=${entryId}`,
        { method: 'POST', body: jpegBlob, headers: { 'Content-Type': jpegBlob.type } },
      )

      if (!response.ok) {
        throw new Error(
          response.status === 400
            ? t('locationDetail.historyEntry.notAnImage')
            : t('locationDetail.historyEntry.uploadPhotoFailed'),
        )
      }

      await loadPhoto()
    } catch (e) {
      photoError.value = e.message || t('locationDetail.historyEntry.uploadPhotoFailed')
    } finally {
      uploadingPhoto.value = false
    }
  }

  async function deletePhoto() {
    const confirmed = await confirm({
      title: t('locationDetail.historyEntry.confirmRemovePhotoTitle'),
      message: t('locationDetail.historyEntry.confirmRemovePhotoMessage'),
      confirmText: t('common.remove'),
      variant: 'neutral',
    })
    if (!confirmed) return

    photoError.value = ''
    deletingPhoto.value = true

    try {
      const response = await functionsFetch(
        `photos-delete?locationId=${route.params.id}&entryId=${entryId}`,
        { method: 'DELETE' },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error(t('locationDetail.historyEntry.removePhotoFailed'))
      }

      if (photoUrl.value) {
        URL.revokeObjectURL(photoUrl.value)
        photoUrl.value = null
      }
    } catch (e) {
      photoError.value = e.message || t('locationDetail.historyEntry.removePhotoFailed')
    } finally {
      deletingPhoto.value = false
    }
  }

  function cleanup() {
    if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  }

  return {
    photoUrl,
    photoError,
    uploadingPhoto,
    deletingPhoto,
    loadPhoto,
    uploadPhoto,
    deletePhoto,
    cleanup,
  }
}
