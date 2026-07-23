<script setup>
defineProps({
  shares: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  shareLoading: { type: Boolean, default: false },
  revokingUsername: { type: String, default: null },
  searchResults: { type: Array, default: () => [] },
  searchLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['search-input', 'pick', 'add', 'revoke'])

const username = defineModel('username', { default: '' })

function handleInput() {
  emit('search-input')
}
</script>

<template>
  <div id="sharing" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <h2 class="mb-4 text-lg font-semibold">Sharing</h2>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <p v-if="loading" class="text-sm text-slate-500">Loading shares…</p>

    <template v-else>
      <p v-if="shares.length === 0" class="mb-4 text-sm text-slate-500">
        Not shared with anyone yet.
      </p>

      <ul v-else class="mb-4 space-y-2">
        <li
          v-for="share in shares"
          :key="share.username ?? share.targetUsername"
          class="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"
        >
          <span class="text-sm text-slate-200">{{ share.username ?? share.targetUsername }}</span>
          <button
            type="button"
            :disabled="revokingUsername === (share.username ?? share.targetUsername)"
            class="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            @click="$emit('revoke', share.username ?? share.targetUsername)"
          >
            {{
              revokingUsername === (share.username ?? share.targetUsername)
                ? 'Revoking…'
                : 'Revoke'
            }}
          </button>
        </li>
      </ul>

      <form class="relative flex gap-2" @submit.prevent="$emit('add')">
        <div class="relative min-w-0 flex-1">
          <input
            v-model="username"
            type="text"
            required
            autocomplete="off"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            placeholder="Search a username to share with…"
            @input="handleInput"
          />
          <ul
            v-if="searchLoading || searchResults.length > 0"
            class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
          >
            <li v-if="searchLoading" class="px-4 py-2 text-xs text-slate-500">Searching…</li>
            <li
              v-for="result in searchResults"
              :key="result"
              class="cursor-pointer px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              @mousedown.prevent="$emit('pick', result)"
            >
              {{ result }}
            </li>
          </ul>
        </div>
        <button
          type="submit"
          :disabled="shareLoading"
          class="shrink-0 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ shareLoading ? 'Sharing…' : 'Share' }}
        </button>
      </form>
    </template>
  </div>
</template>
