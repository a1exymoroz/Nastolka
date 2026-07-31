<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCard from './GameCard.vue'
import HelpTooltip from '../../../components/base/HelpTooltip.vue'
import AlertBanner from '../../../components/base/AlertBanner.vue'

defineProps({
  games: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  removingGameId: { type: [String, Number], default: null },
  gameExpansionState: { type: Object, required: true },
  getAvailableExpansions: { type: Function, required: true },
})

defineEmits([
  'remove-game',
  'toggle-panel',
  'add-expansion',
  'remove-expansion',
  'search-expansions',
  'import-expansion',
])

const { t } = useI18n()

const VIEW_SIZES = ['big', 'medium', 'small']
const GRID_CLASSES = {
  big: 'grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3',
  medium: 'grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-3 xl:grid-cols-4',
  small: 'grid-cols-1 gap-2',
}
const VIEW_SIZE_LABEL_KEYS = {
  big: 'locationDetail.games.viewSizeBig',
  medium: 'locationDetail.games.viewSizeMedium',
  small: 'locationDetail.games.viewSizeSmall',
}

const storedViewSize = localStorage.getItem('games-view-size')
const viewSize = ref(VIEW_SIZES.includes(storedViewSize) ? storedViewSize : 'big')

function setViewSize(size) {
  viewSize.value = size
  localStorage.setItem('games-view-size', size)
}
</script>

<template>
  <section>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold tracking-tight">{{ $t('locationDetail.games.title') }}</h2>
        <HelpTooltip :text="t('locationDetail.games.helpText')" />
        <span v-if="games.length > 0" class="text-sm text-slate-500">{{ games.length }}</span>
      </div>

      <div
        v-if="games.length > 0"
        role="group"
        :aria-label="t('locationDetail.games.gridSizeGroupLabel')"
        class="flex gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1"
      >
        <button
          type="button"
          class="rounded-md p-1.5 transition"
          :class="
            viewSize === 'big' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          "
          :aria-pressed="viewSize === 'big'"
          :aria-label="t(VIEW_SIZE_LABEL_KEYS.big)"
          :title="t(VIEW_SIZE_LABEL_KEYS.big)"
          @click="setViewSize('big')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="3" y="3" width="14" height="14" rx="2" />
          </svg>
        </button>

        <button
          type="button"
          class="rounded-md p-1.5 transition"
          :class="
            viewSize === 'medium'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          "
          :aria-pressed="viewSize === 'medium'"
          :aria-label="t(VIEW_SIZE_LABEL_KEYS.medium)"
          :title="t(VIEW_SIZE_LABEL_KEYS.medium)"
          @click="setViewSize('medium')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
            <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
            <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
            <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
          </svg>
        </button>

        <button
          type="button"
          class="rounded-md p-1.5 transition"
          :class="
            viewSize === 'small'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          "
          :aria-pressed="viewSize === 'small'"
          :aria-label="t(VIEW_SIZE_LABEL_KEYS.small)"
          :title="t(VIEW_SIZE_LABEL_KEYS.small)"
          @click="setViewSize('small')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="2.5" y="3" width="3.5" height="3.5" rx="0.8" />
            <line x1="8" y1="4.75" x2="17.5" y2="4.75" />
            <rect x="2.5" y="8.25" width="3.5" height="3.5" rx="0.8" />
            <line x1="8" y1="10" x2="17.5" y2="10" />
            <rect x="2.5" y="13.5" width="3.5" height="3.5" rx="0.8" />
            <line x1="8" y1="15.25" x2="17.5" y2="15.25" />
          </svg>
        </button>
      </div>
    </div>

    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">{{ $t('locationDetail.games.loadingGames') }}</p>

    <p
      v-else-if="games.length === 0"
      class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
    >
      {{ $t('locationDetail.games.noGamesAssigned') }}
    </p>

    <ul v-else class="grid" :class="GRID_CLASSES[viewSize]">
      <GameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
        :size="viewSize"
        :can-manage="canManage"
        :removing-game-id="removingGameId"
        :expansion-state="gameExpansionState[game.id]"
        :available-expansions="getAvailableExpansions(game.id)"
        @remove-game="$emit('remove-game', $event)"
        @toggle-panel="$emit('toggle-panel', $event)"
        @add-expansion="$emit('add-expansion', $event)"
        @remove-expansion="(gameId, expansion) => $emit('remove-expansion', gameId, expansion)"
        @search-expansions="$emit('search-expansions', $event)"
        @import-expansion="(gameId, bggId) => $emit('import-expansion', gameId, bggId)"
      />
    </ul>
  </section>
</template>
