<script setup>
import { formatDuration, HISTORY_STATE_BADGE_CLASSES } from '../composables/useLocationHistory'

defineProps({
  entry: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
  photoUrl: { type: String, default: null },
  deletingHistoryId: { type: [String, Number], default: null },
  uploadingPhotoId: { type: [String, Number], default: null },
  deletingPhotoId: { type: [String, Number], default: null },
})

defineEmits(['edit', 'delete', 'upload-photo', 'delete-photo', 'open-lightbox'])

const HISTORY_STATE_ACCENT_CLASSES = {
  CREATED: 'border-l-slate-600',
  IN_PROGRESS: 'border-l-amber-500',
  FINISHED: 'border-l-emerald-500',
}
</script>

<template>
  <li
    class="flex items-start gap-4 rounded-xl border border-l-4 border-slate-800 bg-slate-900 p-4"
    :class="HISTORY_STATE_ACCENT_CLASSES[entry.state] ?? 'border-l-slate-600'"
  >
    <img
      v-if="photoUrl"
      :src="photoUrl"
      alt=""
      class="h-16 w-16 shrink-0 cursor-pointer rounded-lg object-cover"
      @click="$emit('open-lightbox', photoUrl)"
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <p class="font-semibold">{{ entry.gameName ?? 'Unknown game' }}</p>
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
              :class="HISTORY_STATE_BADGE_CLASSES[entry.state] ?? 'bg-slate-700 text-slate-200'"
            >
              {{ entry.state }}
            </span>
          </div>
          <p class="text-xs text-slate-500">{{ new Date(entry.playedAt).toLocaleString() }}</p>
          <p v-if="entry.durationMinutes != null" class="text-xs text-slate-500">
            Duration: {{ formatDuration(entry.durationMinutes) }}
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
          <span v-if="player.points != null" class="text-slate-500">({{ player.points }} pts)</span>
        </li>
      </ol>
      <ul v-else class="mt-1 list-none space-y-0.5 text-sm text-slate-400">
        <li v-for="player in entry.players ?? []" :key="player.username">
          {{ player.username }}
          <span v-if="player.points != null" class="text-slate-500">({{ player.points }} pts)</span>
        </li>
      </ul>
      <div v-if="canManage" class="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          @click="$emit('edit', entry)"
        >
          Edit
        </button>
        <button
          type="button"
          :disabled="deletingHistoryId === entry.id"
          class="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          @click="$emit('delete', entry)"
        >
          {{ deletingHistoryId === entry.id ? 'Deleting…' : 'Delete' }}
        </button>
        <label
          class="cursor-pointer text-xs font-medium text-slate-300 hover:text-white"
          :class="{ 'pointer-events-none opacity-50': uploadingPhotoId === entry.id }"
        >
          {{
            uploadingPhotoId === entry.id
              ? 'Uploading…'
              : photoUrl
                ? 'Replace photo'
                : 'Add photo'
          }}
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="$emit('upload-photo', entry, $event.target.files[0]); $event.target.value = ''"
          />
        </label>
        <button
          v-if="photoUrl"
          type="button"
          :disabled="deletingPhotoId === entry.id"
          class="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          @click="$emit('delete-photo', entry)"
        >
          {{ deletingPhotoId === entry.id ? 'Removing…' : 'Remove photo' }}
        </button>
      </div>
    </div>
  </li>
</template>
