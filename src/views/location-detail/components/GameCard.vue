<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  game: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
  removingGameId: { type: [String, Number], default: null },
  expansionState: { type: Object, default: null },
  availableExpansions: { type: Array, default: () => [] },
})

defineEmits([
  'remove-game',
  'toggle-panel',
  'add-expansion',
  'remove-expansion',
  'search-expansions',
  'import-expansion',
])

// null until the user picks a tab explicitly, so the default follows
// whichever source actually has something to offer.
const chosenTab = ref(null)
const activeTab = computed(
  () => chosenTab.value ?? (props.availableExpansions.length > 0 ? 'catalog' : 'bgg'),
)
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
          !expansionState.panelOpen
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
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-300">Expansions</h3>
        <button
          v-if="canManage && expansionState.expansions.length > 0"
          type="button"
          class="text-xs font-medium text-slate-500 hover:text-slate-300"
          @click="$emit('toggle-panel', game.id)"
        >
          {{ expansionState.panelOpen ? 'Close' : '+ Add' }}
        </button>
      </div>

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
        <p v-if="expansionState.expansions.length === 0" class="mb-3 text-xs text-slate-500">
          No expansions assigned here yet.
        </p>

        <ul v-else class="mb-3 divide-y divide-slate-800 text-sm">
          <li
            v-for="expansion in expansionState.expansions"
            :key="expansion.id"
            class="flex items-center justify-between py-1.5"
          >
            <span class="truncate text-slate-200">{{ expansion.name }}</span>
            <button
              v-if="canManage"
              type="button"
              :disabled="expansionState.removingId === expansion.id"
              class="ml-3 shrink-0 text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              @click="$emit('remove-expansion', game.id, expansion)"
            >
              {{ expansionState.removingId === expansion.id ? 'Removing…' : 'Remove' }}
            </button>
          </li>
        </ul>

        <div v-if="canManage && (expansionState.expansions.length === 0 || expansionState.panelOpen)">
          <div class="mb-2 flex gap-1">
            <button
              v-if="availableExpansions.length > 0"
              type="button"
              class="rounded-full px-2.5 py-1 text-xs font-medium transition"
              :class="
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              "
              @click="chosenTab = 'catalog'"
            >
              From your collection
            </button>
            <button
              type="button"
              class="rounded-full px-2.5 py-1 text-xs font-medium transition"
              :class="
                activeTab === 'bgg'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              "
              @click="chosenTab = 'bgg'"
            >
              BoardGameGeek
            </button>
          </div>

          <div v-if="activeTab === 'catalog' && availableExpansions.length > 0" class="flex gap-2">
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
              :disabled="!expansionState.selectedExpansionId || expansionState.addLoading"
              class="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              @click="$emit('add-expansion', game.id)"
            >
              {{ expansionState.addLoading ? 'Adding…' : 'Add' }}
            </button>
          </div>

          <div v-else>
            <p
              v-if="expansionState.searchError"
              class="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
            >
              {{ expansionState.searchError }}
            </p>

            <button
              v-if="!expansionState.searchAttempted"
              type="button"
              class="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              @click="$emit('search-expansions', game.id)"
            >
              Find expansions on BoardGameGeek
            </button>

            <template v-else>
              <p v-if="expansionState.searchLoading" class="text-xs text-slate-500">
                Looking up expansions…
              </p>

              <p
                v-else-if="expansionState.searchResults.length === 0 && !expansionState.searchError"
                class="text-xs text-slate-500"
              >
                No expansions found on BoardGameGeek.
              </p>

              <ul
                v-if="expansionState.searchResults.length > 0"
                class="max-h-48 divide-y divide-slate-800 overflow-y-auto text-sm"
              >
                <li
                  v-for="result in expansionState.searchResults"
                  :key="result.bggId"
                  class="flex items-center justify-between py-1.5"
                >
                  <span class="truncate text-slate-200">{{ result.name }}</span>
                  <button
                    type="button"
                    :disabled="expansionState.importingBggId === result.bggId"
                    class="ml-3 shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="$emit('import-expansion', game.id, result.bggId)"
                  >
                    {{ expansionState.importingBggId === result.bggId ? 'Importing…' : 'Import' }}
                  </button>
                </li>
              </ul>

              <button
                type="button"
                class="mt-2 text-xs font-medium text-slate-500 hover:text-slate-300"
                @click="$emit('search-expansions', game.id)"
              >
                Search again
              </button>
            </template>
          </div>
        </div>
      </template>
    </div>
  </li>
</template>
