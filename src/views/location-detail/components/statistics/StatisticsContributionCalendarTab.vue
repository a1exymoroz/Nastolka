<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertBanner from '../../../../components/base/AlertBanner.vue'

const props = defineProps({
  contributionCalendar: { type: Array, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const { t } = useI18n()

const LEVEL_CLASSES = [
  'bg-slate-800',
  'bg-emerald-900',
  'bg-emerald-700',
  'bg-emerald-500',
  'bg-emerald-400',
]

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

// Builds a fixed trailing 365-day window ending today, left-padded to the
// most recent Sunday so full weeks render as clean 7-row columns like
// GitHub's own contribution graph.
const weeks = computed(() => {
  if (!props.contributionCalendar) return []

  const countByDate = new Map(
    props.contributionCalendar.map((entry) => [entry.date, entry.sessionCount]),
  )
  const maxCount = Math.max(0, ...props.contributionCalendar.map((entry) => entry.sessionCount))

  function levelFor(count) {
    if (!count) return 0
    if (maxCount <= 0) return 1
    const ratio = count / maxCount
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - 364)
  // Pad back to the preceding Sunday so every column has 7 rows.
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())

  const days = []
  const cursor = new Date(start)
  while (cursor <= today) {
    const key = toDateKey(cursor)
    const inWindow = cursor >= new Date(today.getTime() - 364 * 86400000)
    days.push({
      date: key,
      count: inWindow ? (countByDate.get(key) ?? 0) : null,
      level: inWindow ? levelFor(countByDate.get(key) ?? 0) : null,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const result = []
  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7))
  }
  return result
})
</script>

<template>
  <section>
    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.calendar.loading') }}
    </p>

    <div v-else-if="contributionCalendar" class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div class="inline-grid grid-flow-col gap-1" :style="{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }">
        <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
          <div
            v-for="day in week"
            :key="day.date"
            class="h-3 w-3 rounded-sm"
            :class="day.level == null ? 'bg-transparent' : LEVEL_CLASSES[day.level]"
            :title="day.count == null ? '' : t('locationStatistics.tabs.calendar.dayTooltip', { date: day.date, count: day.count })"
          />
        </template>
      </div>
    </div>
  </section>
</template>
