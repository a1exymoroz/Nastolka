<script setup>
import { ref, computed } from 'vue'
import AlertBanner from '../../../components/base/AlertBanner.vue'

const props = defineProps({
  game: { type: Object, required: true },
  size: { type: String, default: 'big' },
  canManage: { type: Boolean, default: false },
  removingGameId: { type: [String, Number], default: null },
  expansionState: { type: Object, default: null },
  availableExpansions: { type: Array, default: () => [] },
})

const isList = computed(() => props.size === 'small')

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
    <!-- List row (small) -->
    <div v-if="isList" class="flex items-center gap-3 p-2">
      <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800">
        <img
          v-if="game.photo"
          :src="game.photo"
          :alt="game.name"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full items-center justify-center text-xl text-slate-700">
          🎲
        </div>
      </div>

      <router-link
        :to="{ name: 'game-detail', params: { id: game.id } }"
        class="min-w-0 flex-1 truncate font-semibold hover:text-indigo-400"
      >
        {{ game.name }}
      </router-link>

      <button
        v-if="
          canManage &&
          expansionState &&
          !expansionState.loading &&
          expansionState.expansions.length === 0 &&
          !expansionState.panelOpen
        "
        type="button"
        class="shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300"
        @click="$emit('toggle-panel', game.id)"
      >
        {{ $t('locationDetail.gameCard.addExpansionShort') }}
      </button>

      <button
        v-if="canManage"
        type="button"
        :disabled="removingGameId === game.id"
        class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-400 opacity-70 transition hover:bg-slate-950/60 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
        @click="$emit('remove-game', game)"
      >
        {{ removingGameId === game.id ? $t('common.removing') : $t('common.remove') }}
      </button>
    </div>

    <!-- Card (big / medium) -->
    <template v-else>
      <div class="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-800">
        <img
          v-if="game.photo"
          :src="game.photo"
          :alt="game.name"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full items-center justify-center text-4xl text-slate-700">
          🎲
        </div>
        <button
          v-if="canManage"
          type="button"
          :disabled="removingGameId === game.id"
          class="absolute right-2 top-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-red-400 opacity-0 backdrop-blur transition hover:bg-slate-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-100 group-hover:opacity-100"
          @click="$emit('remove-game', game)"
        >
          {{ removingGameId === game.id ? $t('common.removing') : $t('common.remove') }}
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
          {{ $t('locationDetail.gameCard.addExpansion') }}
        </button>
      </div>
    </template>

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
        <h3 class="text-sm font-semibold text-slate-300">{{ $t('locationDetail.gameCard.expansions') }}</h3>
        <button
          v-if="canManage && expansionState.expansions.length > 0"
          type="button"
          class="text-xs font-medium text-slate-500 hover:text-slate-300"
          @click="$emit('toggle-panel', game.id)"
        >
          {{ expansionState.panelOpen ? $t('locationDetail.gameCard.close') : $t('locationDetail.gameCard.addShort') }}
        </button>
      </div>

      <AlertBanner v-if="expansionState.error" size="sm" class="mb-3">{{ expansionState.error }}</AlertBanner>
      <AlertBanner v-if="expansionState.addError" size="sm" class="mb-3">{{ expansionState.addError }}</AlertBanner>

      <p v-if="expansionState.loading" class="text-xs text-slate-500">{{ $t('locationDetail.gameCard.lookingUpExpansions') }}</p>

      <template v-else>
        <p v-if="expansionState.expansions.length === 0" class="mb-3 text-xs text-slate-500">
          {{ $t('locationDetail.gameCard.noExpansionsAssigned') }}
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
              {{ expansionState.removingId === expansion.id ? $t('common.removing') : $t('common.remove') }}
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
              {{ $t('locationDetail.gameCard.fromYourCollection') }}
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
              {{ $t('locationDetail.gameCard.boardGameGeek') }}
            </button>
          </div>

          <div v-if="activeTab === 'catalog' && availableExpansions.length > 0" class="flex gap-2">
            <select
              v-model="expansionState.selectedExpansionId"
              class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="" disabled>{{ $t('locationDetail.gameCard.selectExpansionPlaceholder') }}</option>
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
              {{ expansionState.addLoading ? $t('common.adding') : $t('common.add') }}
            </button>
          </div>

          <div v-else>
            <AlertBanner v-if="expansionState.searchError" size="sm" class="mb-2">
              {{ expansionState.searchError }}
            </AlertBanner>

            <button
              v-if="!expansionState.searchAttempted"
              type="button"
              class="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              @click="$emit('search-expansions', game.id)"
            >
              {{ $t('locationDetail.gameCard.findExpansionsOnBgg') }}
            </button>

            <template v-else>
              <p v-if="expansionState.searchLoading" class="text-xs text-slate-500">
                {{ $t('locationDetail.gameCard.lookingUpExpansions') }}
              </p>

              <p
                v-else-if="expansionState.searchResults.length === 0 && !expansionState.searchError"
                class="text-xs text-slate-500"
              >
                {{ $t('locationDetail.gameCard.noExpansionsFoundOnBgg') }}
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
                    {{ expansionState.importingBggId === result.bggId ? $t('common.importing') : $t('common.import') }}
                  </button>
                </li>
              </ul>

              <button
                type="button"
                class="mt-2 text-xs font-medium text-slate-500 hover:text-slate-300"
                @click="$emit('search-expansions', game.id)"
              >
                {{ $t('locationDetail.gameCard.searchAgain') }}
              </button>
            </template>
          </div>
        </div>
      </template>
    </div>
  </li>
</template>
