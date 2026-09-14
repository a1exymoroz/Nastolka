<script setup>
import AlertBanner from '../../../../components/base/AlertBanner.vue'

defineProps({
  gameStats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
</script>

<template>
  <section>
    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.games.loading') }}
    </p>

    <div v-else-if="gameStats" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 class="mb-3 text-sm font-semibold text-slate-200">
          {{ $t('locationStatistics.tabs.games.mostPlayed') }}
        </h3>
        <p
          v-if="gameStats.mostPlayedGames.length === 0"
          class="py-4 text-center text-sm text-slate-500"
        >
          {{ $t('locationStatistics.tabs.games.noData') }}
        </p>
        <ol v-else class="space-y-2">
          <li
            v-for="(game, index) in gameStats.mostPlayedGames"
            :key="game.gameId"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="text-slate-500">{{ index + 1 }}.</span>
              <span class="truncate text-slate-200">{{ game.gameName }}</span>
            </span>
            <span class="shrink-0 text-slate-400">
              {{ $t('locationStatistics.tabs.games.playCount', { count: game.playCount }) }}
            </span>
          </li>
        </ol>
      </div>

      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 class="mb-3 text-sm font-semibold text-slate-200">
          {{ $t('locationStatistics.tabs.games.topRated') }}
        </h3>
        <p
          v-if="gameStats.topRatedGames.length === 0"
          class="py-4 text-center text-sm text-slate-500"
        >
          {{ $t('locationStatistics.tabs.games.noRatedGames') }}
        </p>
        <ol v-else class="space-y-2">
          <li
            v-for="(game, index) in gameStats.topRatedGames"
            :key="game.gameId"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="text-slate-500">{{ index + 1 }}.</span>
              <span class="truncate text-slate-200">{{ game.gameName }}</span>
            </span>
            <span class="shrink-0 text-slate-400">
              {{ game.averageRating.toFixed(1) }} ({{ game.ratingCount }})
            </span>
          </li>
        </ol>
      </div>

      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
        <h3 class="mb-3 text-sm font-semibold text-slate-200">
          {{ $t('locationStatistics.tabs.games.libraryCoverage') }}
        </h3>
        <p class="text-sm text-slate-400">
          {{
            $t('locationStatistics.tabs.games.libraryCoverageSummary', {
              played: gameStats.libraryCoverage.gamesPlayed,
              total: gameStats.libraryCoverage.totalGamesInLibrary,
            })
          }}
        </p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            class="h-full rounded-full bg-indigo-500"
            :style="{ width: `${gameStats.libraryCoverage.coveragePercentage ?? 0}%` }"
          />
        </div>
        <p class="mt-1 text-xs text-slate-500">
          {{
            gameStats.libraryCoverage.coveragePercentage == null
              ? '—'
              : `${gameStats.libraryCoverage.coveragePercentage}%`
          }}
        </p>
      </div>
    </div>
  </section>
</template>
