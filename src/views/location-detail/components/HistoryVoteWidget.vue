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
  <div class="flex flex-wrap gap-1" :class="{ 'opacity-60': pending }">
    <button
      v-for="score in 10"
      :key="score"
      type="button"
      :disabled="pending"
      class="flex items-center justify-center rounded font-semibold transition disabled:cursor-not-allowed"
      :class="[
        compact ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs',
        score === myVote
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
      ]"
      :aria-label="t('locationDetail.historyEntry.vote.scoreAriaLabel', { score })"
      :aria-pressed="score === myVote"
      @click="$emit('vote', score)"
    >
      {{ score }}
    </button>
  </div>
</template>
