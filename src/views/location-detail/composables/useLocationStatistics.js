import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../../utils/apiFetch'
import { t } from '../../../i18n'

export function useLocationStatistics() {
  const route = useRoute()

  const overview = ref(null)
  const overviewLoading = ref(false)
  const overviewError = ref('')

  const gameStats = ref(null)
  const gameStatsLoading = ref(false)
  const gameStatsError = ref('')

  const playerStats = ref(null)
  const playerStatsLoading = ref(false)
  const playerStatsError = ref('')

  const activity = ref(null)
  const activityLoading = ref(false)
  const activityError = ref('')
  const activityGranularity = ref('MONTH')

  const expansionsUsage = ref(null)
  const expansionsUsageLoading = ref(false)
  const expansionsUsageError = ref('')

  const contributionCalendar = ref(null)
  const contributionCalendarLoading = ref(false)
  const contributionCalendarError = ref('')

  async function fetchOverview() {
    overviewLoading.value = true
    overviewError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/statistics/overview`)

      if (!response.ok) {
        throw new Error(t('locationStatistics.tabs.overview.loadFailed'))
      }

      overview.value = await response.json()
    } catch (e) {
      overviewError.value = e.message || t('locationStatistics.tabs.overview.loadFailed')
    } finally {
      overviewLoading.value = false
    }
  }

  async function fetchGameStats() {
    gameStatsLoading.value = true
    gameStatsError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/statistics/games`)

      if (!response.ok) {
        throw new Error(t('locationStatistics.tabs.games.loadFailed'))
      }

      gameStats.value = await response.json()
    } catch (e) {
      gameStatsError.value = e.message || t('locationStatistics.tabs.games.loadFailed')
    } finally {
      gameStatsLoading.value = false
    }
  }

  async function fetchPlayerStats() {
    playerStatsLoading.value = true
    playerStatsError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/statistics/players`)

      if (!response.ok) {
        throw new Error(t('locationStatistics.tabs.players.loadFailed'))
      }

      playerStats.value = await response.json()
    } catch (e) {
      playerStatsError.value = e.message || t('locationStatistics.tabs.players.loadFailed')
    } finally {
      playerStatsLoading.value = false
    }
  }

  async function fetchActivity() {
    activityLoading.value = true
    activityError.value = ''

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/statistics/activity?granularity=${activityGranularity.value}`,
      )

      if (!response.ok) {
        throw new Error(t('locationStatistics.tabs.activity.loadFailed'))
      }

      activity.value = await response.json()
    } catch (e) {
      activityError.value = e.message || t('locationStatistics.tabs.activity.loadFailed')
    } finally {
      activityLoading.value = false
    }
  }

  async function fetchExpansionsUsage() {
    expansionsUsageLoading.value = true
    expansionsUsageError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/statistics/expansions`)

      if (!response.ok) {
        throw new Error(t('locationStatistics.tabs.expansions.loadFailed'))
      }

      expansionsUsage.value = await response.json()
    } catch (e) {
      expansionsUsageError.value = e.message || t('locationStatistics.tabs.expansions.loadFailed')
    } finally {
      expansionsUsageLoading.value = false
    }
  }

  async function fetchContributionCalendar() {
    contributionCalendarLoading.value = true
    contributionCalendarError.value = ''

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/statistics/contribution-calendar`,
      )

      if (!response.ok) {
        throw new Error(t('locationStatistics.tabs.calendar.loadFailed'))
      }

      contributionCalendar.value = await response.json()
    } catch (e) {
      contributionCalendarError.value = e.message || t('locationStatistics.tabs.calendar.loadFailed')
    } finally {
      contributionCalendarLoading.value = false
    }
  }

  return {
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
  }
}
