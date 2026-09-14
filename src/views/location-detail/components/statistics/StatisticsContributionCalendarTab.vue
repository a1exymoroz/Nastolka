<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertBanner from '../../../../components/base/AlertBanner.vue'

const props = defineProps({
  contributionCalendar: { type: Array, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const { t, locale } = useI18n()

const LEVEL_CLASSES = [
  'bg-slate-800',
  'bg-emerald-900',
  'bg-emerald-700',
  'bg-emerald-500',
  'bg-emerald-400',
]

// Only Mon/Wed/Fri are labeled, matching GitHub's own contribution graph —
// labeling every row would crowd the narrow row height.
const WEEKDAY_LABEL_INDEXES = new Set([1, 3, 5])

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

// 2023-01-01 was a Sunday — used purely as a stable index-to-weekday
// reference for locale-aware weekday abbreviations, unrelated to the actual
// calendar window being rendered.
const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) =>
    WEEKDAY_LABEL_INDEXES.has(i) ? formatter.format(new Date(Date.UTC(2023, 0, 1 + i))) : '',
  )
})

const totalSessions = computed(() =>
  (props.contributionCalendar ?? []).reduce((sum, entry) => sum + entry.sessionCount, 0),
)

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

// One label per week column, shown only where the month changes from the
// previous column so it reads as a header over that stretch of weeks.
const monthLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: 'short' })
  let previousMonth = null

  return weeks.value.map((week) => {
    const month = new Date(`${week[0].date}T00:00:00Z`).getUTCMonth()
    if (month === previousMonth) return ''
    previousMonth = month
    return formatter.format(new Date(`${week[0].date}T00:00:00Z`))
  })
})
</script>

<template>
  <section>
    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.calendar.loading') }}
    </p>

    <div v-else-if="contributionCalendar" class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p class="mb-3 text-sm text-slate-400">
        {{ t('locationStatistics.tabs.calendar.totalSessions', { count: totalSessions }) }}
      </p>

      <div class="inline-flex gap-2">
        <div class="grid gap-1" :style="{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }">
          <span
            v-for="(label, index) in weekdayLabels"
            :key="index"
            class="h-3 text-[10px] leading-3 text-slate-500"
          >
            {{ label }}
          </span>
        </div>

        <div>
          <div class="mb-1 grid grid-flow-col gap-1" :style="{ gridAutoColumns: '0.75rem' }">
            <span
              v-for="(label, index) in monthLabels"
              :key="index"
              class="whitespace-nowrap text-[10px] text-slate-500"
            >
              {{ label }}
            </span>
          </div>

          <div class="grid grid-flow-col gap-1" :style="{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }">
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
      </div>

      <div class="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
        <span>{{ t('locationStatistics.tabs.calendar.less') }}</span>
        <div v-for="levelClass in LEVEL_CLASSES" :key="levelClass" class="h-3 w-3 rounded-sm" :class="levelClass" />
        <span>{{ t('locationStatistics.tabs.calendar.more') }}</span>
      </div>
    </div>
  </section>
</template>
