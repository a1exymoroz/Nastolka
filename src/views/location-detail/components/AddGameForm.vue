<script setup>
defineProps({
  games: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['add'])

const selectedId = defineModel('selectedId', { default: '' })
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <h2 class="mb-4 text-lg font-semibold">Add a game to this location</h2>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <div class="flex gap-2">
      <select
        v-model="selectedId"
        class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
      >
        <option value="" disabled>Select a game from the catalog…</option>
        <option v-for="game in games" :key="game.id" :value="game.id">
          {{ game.name }}
        </option>
      </select>
      <button
        type="button"
        :disabled="!selectedId || loading"
        class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        @click="$emit('add')"
      >
        {{ loading ? 'Adding…' : 'Add' }}
      </button>
    </div>
  </div>
</template>
