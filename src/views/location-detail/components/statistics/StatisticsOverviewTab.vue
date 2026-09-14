<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertBanner from '../../../../components/base/AlertBanner.vue'
import { formatDuration } from '../../composables/useLocationHistory'

const props = defineProps({
  overview: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const { t } = useI18n()

const cards = computed(() => {
  if (!props.overview) return []

  return [
    {
      label: t('locationStatistics.tabs.overview.totalSessions'),
      value: props.overview.totalFinishedSessions,
    },
    {
      label: t('locationStatistics.tabs.overview.totalPlayTime'),
      value: formatDuration(props.overview.totalPlayTimeMinutes, t) ?? '—',
    },
    {
      label: t('locationStatistics.tabs.overview.averageSessionLength'),
      value:
        props.overview.averageSessionLengthMinutes == null
          ? '—'
          : formatDuration(Math.round(props.overview.averageSessionLengthMinutes), t),
    },
    {
      label: t('locationStatistics.tabs.overview.averageRating'),
      value: props.overview.averageRating == null ? '—' : props.overview.averageRating.toFixed(1),
    },
  ]
})
</script>

<template>
  <section>
    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.overview.loading') }}
    </p>

    <div v-else-if="overview" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in cards"
        :key="card.label"
        class="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ card.label }}</p>
        <p class="mt-2 text-2xl font-bold tracking-tight">{{ card.value }}</p>
      </div>
    </div>
  </section>
</template>
