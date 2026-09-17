<script setup>
import { ref } from 'vue'
import BaseCard from '../../../../components/base/BaseCard.vue'
import BaseButton from '../../../../components/base/BaseButton.vue'

const props = defineProps({
  gameCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['create'])

const targetRemainingCount = ref(Math.min(3, props.gameCount) || 1)
const excludeAlreadyPlayed = ref(false)

function submit() {
  emit('create', {
    targetRemainingCount: Number(targetRemainingCount.value) || 1,
    excludeAlreadyPlayed: excludeAlreadyPlayed.value,
  })
}
</script>

<template>
  <BaseCard padding="none" radius="2xl" class="p-4 sm:p-6">
    <h2 class="text-base font-semibold sm:text-lg">{{ $t('pickSession.createForm.title') }}</h2>
    <p class="mt-1 text-xs text-slate-400 sm:text-sm">
      {{ $t('pickSession.createForm.description') }}
    </p>

    <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:px-4 sm:text-sm">{{ error }}</p>

    <form class="mt-4 space-y-4 sm:mt-6 sm:space-y-5" @submit.prevent="submit">
      <div>
        <label for="pick-session-target-count" class="block text-xs font-medium text-slate-300 sm:text-sm">
          {{ $t('pickSession.createForm.targetCountLabel') }}
        </label>
        <input
          id="pick-session-target-count"
          v-model="targetRemainingCount"
          type="number"
          min="1"
          :max="gameCount || undefined"
          class="mt-1.5 w-28 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:w-32 sm:py-2"
        />
        <p v-if="gameCount" class="mt-1.5 text-[11px] text-slate-500 sm:text-xs">
          {{ $t('pickSession.createForm.targetCountHint', { count: gameCount }) }}
        </p>
      </div>

      <label class="flex items-center gap-2 text-xs text-slate-300 sm:text-sm">
        <input
          v-model="excludeAlreadyPlayed"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
        />
        {{ $t('pickSession.createForm.excludeAlreadyPlayedLabel') }}
      </label>

      <BaseButton size="sm" :loading="loading" @click="submit">
        {{ $t('pickSession.createForm.submit') }}
      </BaseButton>
    </form>
  </BaseCard>
</template>
