<script setup>
defineProps({
  games: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  searchResults: { type: Array, default: () => [] },
  searchLoading: { type: Boolean, default: false },
  searchError: { type: String, default: '' },
  searchAttempted: { type: Boolean, default: false },
  importingBggId: { type: [String, Number], default: null },
})

defineEmits(['add', 'search', 'import'])

const selectedId = defineModel('selectedId', { default: '' })
const searchQuery = defineModel('searchQuery', { default: '' })
</script>

<template>
  <div data-tour="location-add-game" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <h2 class="mb-4 text-lg font-semibold">{{ $t('locationDetail.addGame.title') }}</h2>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <div class="flex gap-2">
      <select
        v-model="selectedId"
        class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
      >
        <option value="" disabled>{{ $t('locationDetail.addGame.selectPlaceholder') }}</option>
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
        {{ loading ? $t('common.adding') : $t('common.add') }}
      </button>
    </div>

    <div class="my-5 flex items-center gap-3 text-xs font-medium uppercase text-slate-600">
      <span class="h-px flex-1 bg-slate-800" />
      {{ $t('locationDetail.addGame.orImportFromBgg') }}
      <span class="h-px flex-1 bg-slate-800" />
    </div>

    <p v-if="searchError" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ searchError }}
    </p>

    <form class="mb-4 flex gap-2" @submit.prevent="$emit('search')">
      <input
        v-model="searchQuery"
        type="text"
        required
        class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        :placeholder="$t('admin.searchBggPlaceholder')"
      />
      <button
        type="submit"
        :disabled="searchLoading"
        class="shrink-0 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ searchLoading ? $t('common.searching') : $t('common.search') }}
      </button>
    </form>

    <ul v-if="searchResults.length > 0" class="max-h-60 divide-y divide-slate-800 overflow-y-auto pr-2 text-sm">
      <li
        v-for="result in searchResults"
        :key="result.bggId"
        class="flex items-center justify-between py-2"
      >
        <a
          :href="`https://boardgamegeek.com/boardgame/${result.bggId}`"
          target="_blank"
          rel="noopener noreferrer"
          :title="$t('common.viewOnBgg')"
          class="truncate text-slate-200 hover:text-indigo-400 hover:underline"
        >
          {{ result.name }}
        </a>
        <button
          type="button"
          :disabled="importingBggId === result.bggId"
          class="ml-3 shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
          @click="$emit('import', result.bggId)"
        >
          {{ importingBggId === result.bggId ? $t('common.importing') : $t('common.import') }}
        </button>
      </li>
    </ul>
    <p
      v-else-if="searchAttempted && !searchLoading && !searchError"
      class="text-xs text-slate-500"
    >
      {{ $t('locationDetail.addGame.noGamesFoundOnBgg') }}
    </p>
  </div>
</template>
