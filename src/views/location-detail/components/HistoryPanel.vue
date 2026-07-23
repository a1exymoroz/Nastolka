<script setup>
import HistoryEntryCard from './HistoryEntryCard.vue'

defineProps({
  history: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  photoUrls: { type: Object, default: () => ({}) },
  deletingHistoryId: { type: [String, Number], default: null },
  uploadingPhotoId: { type: [String, Number], default: null },
  deletingPhotoId: { type: [String, Number], default: null },
})

defineEmits(['log-session', 'edit-entry', 'delete-entry', 'upload-photo', 'delete-photo', 'open-lightbox'])
</script>

<template>
  <section>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-xl font-bold tracking-tight">Session history</h2>
      <button
        v-if="canManage"
        type="button"
        class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        @click="$emit('log-session')"
      >
        + Log a session
      </button>
    </div>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <p v-if="loading" class="py-6 text-center text-slate-400">Loading history…</p>

    <p
      v-else-if="history.length === 0"
      class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
    >
      No sessions logged yet.
    </p>

    <ul v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <HistoryEntryCard
        v-for="entry in history"
        :key="entry.id"
        :entry="entry"
        :can-manage="canManage"
        :photo-url="photoUrls[entry.id]"
        :deleting-history-id="deletingHistoryId"
        :uploading-photo-id="uploadingPhotoId"
        :deleting-photo-id="deletingPhotoId"
        @edit="$emit('edit-entry', $event)"
        @delete="$emit('delete-entry', $event)"
        @upload-photo="(entry, file) => $emit('upload-photo', entry, file)"
        @delete-photo="$emit('delete-photo', $event)"
        @open-lightbox="$emit('open-lightbox', $event)"
      />
    </ul>
  </section>
</template>
