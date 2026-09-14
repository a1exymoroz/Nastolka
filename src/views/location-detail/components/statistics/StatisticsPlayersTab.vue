<script setup>
import AlertBanner from '../../../../components/base/AlertBanner.vue'

defineProps({
  playerStats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
</script>

<template>
  <section>
    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.players.loading') }}
    </p>

    <div v-else-if="playerStats" class="space-y-6">
      <p
        v-if="playerStats.leaderboard.length === 0"
        class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
      >
        {{ $t('locationStatistics.tabs.players.noData') }}
      </p>

      <div v-else class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">{{ $t('locationStatistics.tabs.players.player') }}</th>
              <th class="px-4 py-3 font-medium">{{ $t('locationStatistics.tabs.players.gamesPlayed') }}</th>
              <th class="px-4 py-3 font-medium">{{ $t('locationStatistics.tabs.players.wins') }}</th>
              <th class="px-4 py-3 font-medium">{{ $t('locationStatistics.tabs.players.winRate') }}</th>
              <th class="px-4 py-3 font-medium">{{ $t('locationStatistics.tabs.players.totalPoints') }}</th>
              <th class="px-4 py-3 font-medium">{{ $t('locationStatistics.tabs.players.averagePoints') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="player in playerStats.leaderboard" :key="player.username">
              <td class="px-4 py-3 font-medium text-slate-200">{{ player.username }}</td>
              <td class="px-4 py-3 text-slate-400">{{ player.gamesPlayed }}</td>
              <td class="px-4 py-3 text-slate-400">{{ player.wins }}</td>
              <td class="px-4 py-3 text-slate-400">{{ player.winRatePercentage.toFixed(1) }}%</td>
              <td class="px-4 py-3 text-slate-400">{{ player.totalPoints }}</td>
              <td class="px-4 py-3 text-slate-400">{{ player.averagePoints.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="playerStats.mostActive.length > 0" class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 class="mb-3 text-sm font-semibold text-slate-200">
          {{ $t('locationStatistics.tabs.players.mostActive') }}
        </h3>
        <ol class="space-y-2">
          <li
            v-for="(player, index) in playerStats.mostActive"
            :key="player.username"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="flex items-center gap-2">
              <span class="text-slate-500">{{ index + 1 }}.</span>
              <span class="text-slate-200">{{ player.username }}</span>
            </span>
            <span class="shrink-0 text-slate-400">
              {{ $t('locationStatistics.tabs.players.gamesPlayedCount', { count: player.gamesPlayed }) }}
            </span>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
