<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  myVote: { type: Number, default: null },
  pending: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})

defineEmits(['vote'])

const { t } = useI18n()
</script>

<template>
  <div>
    <p class="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      <span class="text-amber-400" aria-hidden="true">★</span>
      {{ t('locationDetail.historyEntry.vote.yourRatingLabel') }}
    </p>
    <div class="flex flex-wrap gap-1.5" :class="{ 'opacity-60': pending }">
      <button
        v-for="score in 10"
        :key="score"
        type="button"
        :disabled="pending"
        class="flex items-center justify-center rounded-md font-semibold transition disabled:cursor-not-allowed"
        :class="[
          compact ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm',
          score === myVote
            ? 'bg-indigo-500 text-white ring-2 ring-indigo-300/70 shadow-[0_0_0_3px_rgba(99,102,241,0.25)]'
            : 'bg-slate-800 text-slate-400 ring-1 ring-inset ring-slate-700/80 hover:bg-slate-700 hover:text-slate-200',
        ]"
        :aria-label="t('locationDetail.historyEntry.vote.scoreAriaLabel', { score })"
        :aria-pressed="score === myVote"
        @click="$emit('vote', score)"
      >
        {{ score }}
      </button>
    </div>
  </div>
</template>
