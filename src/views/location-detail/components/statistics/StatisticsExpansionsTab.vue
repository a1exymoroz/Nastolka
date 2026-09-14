<script setup>
import AlertBanner from '../../../../components/base/AlertBanner.vue'

defineProps({
  expansionsUsage: { type: Array, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
</script>

<template>
  <section>
    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">
      {{ $t('locationStatistics.tabs.expansions.loading') }}
    </p>

    <p
      v-else-if="expansionsUsage && expansionsUsage.length === 0"
      class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
    >
      {{ $t('locationStatistics.tabs.expansions.noData') }}
    </p>

    <ol v-else-if="expansionsUsage" class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <li
        v-for="(expansion, index) in expansionsUsage"
        :key="expansion.expansionId"
        class="flex items-center justify-between gap-3 py-2 text-sm"
        :class="{ 'border-t border-slate-800': index > 0 }"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="text-slate-500">{{ index + 1 }}.</span>
          <span class="truncate text-slate-200">{{ expansion.expansionName }}</span>
        </span>
        <span class="shrink-0 text-slate-400">
          {{ $t('locationStatistics.tabs.expansions.useCount', { count: expansion.useCount }) }}
        </span>
      </li>
    </ol>
  </section>
</template>
