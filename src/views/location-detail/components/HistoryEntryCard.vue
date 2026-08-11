<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { functionsFetch } from '../../../utils/functionsFetch'
import {
  formatDuration,
  HISTORY_STATE_BADGE_CLASSES,
  HISTORY_STATE_LABEL_KEYS,
} from '../composables/useLocationHistory'
import PhotoLightbox from './PhotoLightbox.vue'

const props = defineProps({
  entry: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
  deletingHistoryId: { type: [String, Number], default: null },
})

defineEmits(['view', 'edit', 'delete'])

const route = useRoute()
const { t } = useI18n()

const HISTORY_STATE_ACCENT_CLASSES = {
  CREATED: 'border-l-slate-600',
  IN_PROGRESS: 'border-l-amber-500',
  FINISHED: 'border-l-emerald-500',
}

function stateLabel(state) {
  return HISTORY_STATE_LABEL_KEYS[state] ? t(HISTORY_STATE_LABEL_KEYS[state]) : state
}

// Each card owns its own photo end to end (fetch, upload, delete, view/rotate)
// rather than the whole list's photos being loaded and threaded down from the
// page — authenticated downloads can't use a plain <img src>, so this is kept
// as an object URL.
const photoUrl = ref(null)
const photoError = ref('')
const uploadingPhoto = ref(false)
const deletingPhoto = ref(false)
const lightboxOpen = ref(false)

async function loadPhoto() {
  try {
    const response = await functionsFetch(
      `photos-get?locationId=${route.params.id}&entryId=${props.entry.id}`,
    )
    if (!response.ok) return

    const blob = await response.blob()
    if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
    photoUrl.value = URL.createObjectURL(blob)
  } catch {
    // Non-fatal: the card just renders without a photo.
  }
}

async function uploadPhoto(file) {
  if (!file) return

  photoError.value = ''
  uploadingPhoto.value = true

  try {
    const response = await functionsFetch(
      `photos-upload?locationId=${route.params.id}&entryId=${props.entry.id}`,
      { method: 'POST', body: file, headers: { 'Content-Type': file.type } },
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
  if (!window.confirm(t('locationDetail.historyEntry.confirmRemovePhoto'))) return

  photoError.value = ''
  deletingPhoto.value = true

  try {
    const response = await functionsFetch(
      `photos-delete?locationId=${route.params.id}&entryId=${props.entry.id}`,
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

onMounted(loadPhoto)

onUnmounted(() => {
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
})
</script>

<template>
  <li
    class="flex items-start gap-4 rounded-xl border border-l-4 border-slate-800 bg-slate-900 p-4"
    :class="HISTORY_STATE_ACCENT_CLASSES[entry.state] ?? 'border-l-slate-600'"
  >
    <button
      v-if="photoUrl"
      type="button"
      class="h-24 w-24 shrink-0 overflow-hidden rounded-lg"
      :aria-label="$t('locationDetail.historyEntry.viewPhoto')"
      @click="lightboxOpen = true"
    >
      <img :src="photoUrl" alt="" class="h-full w-full object-cover" />
    </button>
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <p class="font-semibold">{{ entry.gameName ?? $t('locationDetail.historyEntry.unknownGame') }}</p>
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
              :class="HISTORY_STATE_BADGE_CLASSES[entry.state] ?? 'bg-slate-700 text-slate-200'"
            >
              {{ stateLabel(entry.state) }}
            </span>
          </div>
          <p class="text-xs text-slate-500">{{ $d(new Date(entry.playedAt), 'short') }}</p>
          <p v-if="entry.durationMinutes != null" class="text-xs text-slate-500">
            {{ $t('locationDetail.historyEntry.duration', { duration: formatDuration(entry.durationMinutes, t) }) }}
          </p>
        </div>
        <span v-if="entry.rating" class="shrink-0 text-sm font-medium text-amber-400">
          {{ entry.rating }}/10
        </span>
      </div>

      <ol
        v-if="entry.state === 'FINISHED'"
        class="mt-1 list-inside list-decimal text-sm text-slate-400"
      >
        <li
          v-for="player in [...(entry.players ?? [])].sort((a, b) => a.placement - b.placement)"
          :key="player.username"
        >
          {{ player.username }}
          <span v-if="player.points != null" class="text-slate-500">({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})</span>
        </li>
      </ol>
      <ul v-else class="mt-1 list-none space-y-0.5 text-sm text-slate-400">
        <li v-for="player in entry.players ?? []" :key="player.username">
          {{ player.username }}
          <span v-if="player.points != null" class="text-slate-500">({{ $t('locationDetail.historyEntry.points', { count: player.points }, player.points) }})</span>
        </li>
      </ul>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          @click="$emit('view', entry)"
        >
          {{ $t('locationDetail.historyEntry.view') }}
        </button>
        <template v-if="canManage">
          <button
            type="button"
            class="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            @click="$emit('edit', entry)"
          >
            {{ $t('locationDetail.historyEntry.edit') }}
          </button>
          <button
            type="button"
            :disabled="deletingHistoryId === entry.id"
            class="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            @click="$emit('delete', entry)"
          >
            {{ deletingHistoryId === entry.id ? $t('common.deleting') : $t('common.delete') }}
          </button>
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
        </template>
      </div>
      <p v-if="photoError" class="mt-2 text-xs text-red-400">{{ photoError }}</p>
    </div>

    <PhotoLightbox
      :url="lightboxOpen ? photoUrl : null"
      :can-manage="canManage"
      :saving="uploadingPhoto"
      :error="photoError"
      @close="lightboxOpen = false"
      @save-rotation="uploadPhoto"
    />
  </li>
</template>
