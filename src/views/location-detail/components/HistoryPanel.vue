<script setup>
import { useI18n } from 'vue-i18n'
import HistoryEntryCard from './HistoryEntryCard.vue'
import HelpTooltip from '../../../components/base/HelpTooltip.vue'
import AlertBanner from '../../../components/base/AlertBanner.vue'
import BaseButton from '../../../components/base/BaseButton.vue'

defineProps({
  history: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  deletingHistoryId: { type: [String, Number], default: null },
})

defineEmits(['log-session', 'view-entry', 'edit-entry', 'delete-entry'])

const { t } = useI18n()
</script>

<template>
  <section>
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold tracking-tight">{{ $t('locationDetail.history.title') }}</h2>
        <HelpTooltip :text="t('locationDetail.history.helpText')" />
      </div>
      <BaseButton v-if="canManage" size="sm" data-tour="history-log-session" @click="$emit('log-session')">
        {{ $t('locationDetail.history.logSession') }}
      </BaseButton>
    </div>

    <AlertBanner v-if="error" class="mb-4">{{ error }}</AlertBanner>

    <p v-if="loading" class="py-6 text-center text-slate-400">{{ $t('locationDetail.history.loadingHistory') }}</p>

    <p
      v-else-if="history.length === 0"
      class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
    >
      {{ $t('locationDetail.history.noSessionsYet') }}
    </p>

    <ul v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <HistoryEntryCard
        v-for="entry in history"
        :key="entry.id"
        :entry="entry"
        :can-manage="canManage"
        :deleting-history-id="deletingHistoryId"
        @view="$emit('view-entry', $event)"
        @edit="$emit('edit-entry', $event)"
        @delete="$emit('delete-entry', $event)"
      />
    </ul>
  </section>
</template>
