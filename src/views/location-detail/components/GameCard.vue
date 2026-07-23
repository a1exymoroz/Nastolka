<script setup>
defineProps({
  game: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
  removingGameId: { type: [String, Number], default: null },
  expansionState: { type: Object, default: null },
  availableExpansions: { type: Array, default: () => [] },
})

defineEmits(['remove-game', 'toggle-panel', 'add-expansion', 'remove-expansion'])
</script>

<template>
  <li
    class="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-700"
  >
    <div class="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-800">
      <img
        v-if="game.photo"
        :src="game.photo"
        :alt="game.name"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full items-center justify-center text-4xl text-slate-700">🎲</div>
      <button
        v-if="canManage"
        type="button"
        :disabled="removingGameId === game.id"
        class="absolute right-2 top-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-red-400 opacity-0 backdrop-blur transition hover:bg-slate-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-100 group-hover:opacity-100"
        @click="$emit('remove-game', game)"
      >
        {{ removingGameId === game.id ? 'Removing…' : 'Remove' }}
      </button>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <router-link
        :to="{ name: 'game-detail', params: { id: game.id } }"
        class="font-semibold hover:text-indigo-400"
      >
        {{ game.name }}
      </router-link>
      <p v-if="game.description" class="mt-1 line-clamp-2 text-sm text-slate-400">
        {{ game.description }}
      </p>
      <button
        v-if="
          canManage &&
          expansionState &&
          !expansionState.loading &&
          expansionState.expansions.length === 0 &&
          !expansionState.panelOpen &&
          availableExpansions.length > 0
        "
        type="button"
        class="mt-2 self-start text-xs font-medium text-indigo-400 hover:text-indigo-300"
        @click="$emit('toggle-panel', game.id)"
      >
        + Add expansion
      </button>
    </div>

    <div
      v-if="
        expansionState &&
        (expansionState.loading ||
          expansionState.expansions.length > 0 ||
          (canManage && expansionState.panelOpen))
      "
      class="border-t border-slate-800 bg-slate-950/40 p-4"
    >
      <h3 class="mb-3 text-sm font-semibold text-slate-300">Expansions here</h3>

      <p
        v-if="expansionState.error"
        class="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
      >
        {{ expansionState.error }}
      </p>
      <p
        v-if="expansionState.addError"
        class="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
      >
        {{ expansionState.addError }}
      </p>

      <p v-if="expansionState.loading" class="text-xs text-slate-500">Loading expansions…</p>

      <template v-else>
        <p v-if="expansionState.expansions.length === 0" class="text-xs text-slate-500">
          No expansions assigned here yet.
        </p>

        <ul v-else class="mb-4 space-y-2">
          <li
            v-for="expansion in expansionState.expansions"
            :key="expansion.id"
            class="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"
          >
            <span class="truncate text-sm text-slate-200">{{ expansion.name }}</span>
            <button
              v-if="canManage"
              type="button"
              :disabled="expansionState.removingId === expansion.id"
              class="ml-3 shrink-0 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              @click="$emit('remove-expansion', game.id, expansion)"
            >
              {{ expansionState.removingId === expansion.id ? 'Removing…' : 'Remove' }}
            </button>
          </li>
        </ul>

        <div v-if="canManage" class="flex gap-2">
          <select
            v-model="expansionState.selectedExpansionId"
            class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="" disabled>Select an expansion…</option>
            <option
              v-for="expansion in availableExpansions"
              :key="expansion.id"
              :value="expansion.id"
            >
              {{ expansion.name }}
            </option>
          </select>
          <button
            type="button"
            :disabled="
              !expansionState.selectedExpansionId || expansionState.addLoading
            "
            class="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="$emit('add-expansion', game.id)"
          >
            {{ expansionState.addLoading ? 'Adding…' : 'Add' }}
          </button>
        </div>
      </template>
    </div>
  </li>
</template>
