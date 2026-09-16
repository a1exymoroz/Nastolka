<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { apiFetch } from '../utils/apiFetch'
import { useLocationStatistics } from './location-detail/composables/useLocationStatistics'
import StatisticsOverviewTab from './location-detail/components/statistics/StatisticsOverviewTab.vue'
import StatisticsGamesTab from './location-detail/components/statistics/StatisticsGamesTab.vue'
import StatisticsPlayersTab from './location-detail/components/statistics/StatisticsPlayersTab.vue'
import StatisticsActivityTab from './location-detail/components/statistics/StatisticsActivityTab.vue'
import StatisticsExpansionsTab from './location-detail/components/statistics/StatisticsExpansionsTab.vue'
import StatisticsContributionCalendarTab from './location-detail/components/statistics/StatisticsContributionCalendarTab.vue'
import HelpTooltip from '../components/base/HelpTooltip.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const location = ref(null)
const pageLoading = ref(true)
const pageError = ref('')
const noAccess = ref(false)

const {
  overview,
  overviewLoading,
  overviewError,
  fetchOverview,
  gameStats,
  gameStatsLoading,
  gameStatsError,
  fetchGameStats,
  playerStats,
  playerStatsLoading,
  playerStatsError,
  fetchPlayerStats,
  activity,
  activityLoading,
  activityError,
  activityGranularity,
  fetchActivity,
  expansionsUsage,
  expansionsUsageLoading,
  expansionsUsageError,
  fetchExpansionsUsage,
  contributionCalendar,
  contributionCalendarLoading,
  contributionCalendarError,
  fetchContributionCalendar,
} = useLocationStatistics()

const TABS = [
  { key: 'overview', fetch: fetchOverview },
  { key: 'games', fetch: fetchGameStats },
  { key: 'players', fetch: fetchPlayerStats },
  { key: 'activity', fetch: fetchActivity },
  { key: 'expansions', fetch: fetchExpansionsUsage },
  { key: 'calendar', fetch: fetchContributionCalendar },
]

const activeTab = ref('overview')
const loadedTabs = new Set()

function selectTab(key) {
  activeTab.value = key
  if (!loadedTabs.has(key)) {
    loadedTabs.add(key)
    TABS.find((tab) => tab.key === key).fetch()
  }
}

function onGranularityChange(value) {
  activityGranularity.value = value
  fetchActivity()
}

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''
  noAccess.value = false

  try {
    const response = await apiFetch(`api/locations/${route.params.id}`)
    if (response.status === 403) {
      noAccess.value = true
      return
    }
    if (response.status === 404) {
      throw new Error(t('locationStatistics.locationNotFound'))
    }
    if (!response.ok) {
      throw new Error(t('locationStatistics.loadFailed'))
    }
    location.value = await response.json()
    selectTab('overview')
  } catch (e) {
    pageError.value = e.message || t('locationStatistics.loadFailed')
  } finally {
    pageLoading.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <button
      type="button"
      class="mb-8 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      @click="router.push({ name: 'location-detail', params: { id: route.params.id } })"
    >
      {{ $t('common.backTo', { name: location ? location.name : $t('common.genericLocation') }) }}
    </button>

    <section v-if="pageLoading" class="py-20 text-center text-slate-400">
      {{ $t('locationStatistics.loading') }}
    </section>

    <section v-else-if="noAccess" class="py-20 text-center">
      <p class="text-lg font-semibold text-slate-200">{{ $t('locationStatistics.noAccessTitle') }}</p>
      <p class="mt-2 text-sm text-slate-400">{{ $t('locationStatistics.noAccessMessage') }}</p>
    </section>

    <section v-else-if="pageError" class="py-20 text-center">
      <p class="text-red-400">{{ pageError }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="loadPage"
      >
        {{ $t('common.tryAgain') }}
      </button>
    </section>

    <template v-else-if="location">
      <div class="mb-6 flex items-center gap-2">
        <h1 class="text-2xl font-bold tracking-tight">{{ $t('locationStatistics.title') }}</h1>
        <HelpTooltip :text="t('locationStatistics.helpText')" />
      </div>

      <div class="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
          :class="
            activeTab === tab.key
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          "
          @click="selectTab(tab.key)"
        >
          {{ $t(`locationStatistics.tabs.${tab.key}.title`) }}
        </button>
      </div>

      <StatisticsOverviewTab
        v-if="activeTab === 'overview'"
        :overview="overview"
        :loading="overviewLoading"
        :error="overviewError"
      />
      <StatisticsGamesTab
        v-else-if="activeTab === 'games'"
        :game-stats="gameStats"
        :loading="gameStatsLoading"
        :error="gameStatsError"
      />
      <StatisticsPlayersTab
        v-else-if="activeTab === 'players'"
        :player-stats="playerStats"
        :loading="playerStatsLoading"
        :error="playerStatsError"
      />
      <StatisticsActivityTab
        v-else-if="activeTab === 'activity'"
        :activity="activity"
        :loading="activityLoading"
        :error="activityError"
        :granularity="activityGranularity"
        @update:granularity="onGranularityChange"
      />
      <StatisticsExpansionsTab
        v-else-if="activeTab === 'expansions'"
        :expansions-usage="expansionsUsage"
        :loading="expansionsUsageLoading"
        :error="expansionsUsageError"
      />
      <StatisticsContributionCalendarTab
        v-else-if="activeTab === 'calendar'"
        :contribution-calendar="contributionCalendar"
        :loading="contributionCalendarLoading"
        :error="contributionCalendarError"
      />
    </template>
  </div>
</template>
