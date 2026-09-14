<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import AlertBanner from '../../../../components/base/AlertBanner.vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  activity: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  granularity: { type: String, default: 'MONTH' },
})

defineEmits(['update:granularity'])

const { t, locale } = useI18n()

function formatBucketLabel(bucketStart) {
  const date = new Date(`${bucketStart}T00:00:00`)
  const options =
    props.granularity === 'WEEK'
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat(locale.value, options).format(date)
}

const chartData = computed(() => ({
  labels: (props.activity?.buckets ?? []).map((bucket) => formatBucketLabel(bucket.bucketStart)),
  datasets: [
    {
      label: t('locationStatistics.tabs.activity.sessionsLabel'),
      backgroundColor: '#6366f1',
      data: (props.activity?.buckets ?? []).map((bucket) => bucket.sessionCount),
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#94a3b8', precision: 0 }, grid: { color: '#1e293b' }, beginAtZero: true },
  },
  plugins: {
    legend: { display: false },
  },
}
</script>

<template>
  <section>
    <div class="mb-4 flex items-center gap-2">
      <button
        v-for="option in ['WEEK', 'MONTH']"
        :key="option"
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        :class="
          granularity === option
            ? 'bg-indigo-600 text-white'
            : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
        "
        @click="$emit('update:granularity', option)"
      >
        {{ $t(`locationStatistics.tabs.activity.granularity${option === 'WEEK' ? 'Week' : 'Month'}`) }}
      </button>
    </div>

    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.activity.loading') }}
    </p>

    <p
      v-else-if="activity && activity.buckets.length === 0"
      class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
    >
      {{ $t('locationStatistics.tabs.activity.noData') }}
    </p>

    <div v-else-if="activity" class="h-72 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>
