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
  <BaseCard padding="lg" radius="2xl">
    <h2 class="text-lg font-semibold">{{ $t('pickSession.createForm.title') }}</h2>
    <p class="mt-1 text-sm text-slate-400">
      {{ $t('pickSession.createForm.description') }}
    </p>

    <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{{ error }}</p>

    <form class="mt-6 space-y-5" @submit.prevent="submit">
      <div>
        <label for="pick-session-target-count" class="block text-sm font-medium text-slate-300">
          {{ $t('pickSession.createForm.targetCountLabel') }}
        </label>
        <input
          id="pick-session-target-count"
          v-model="targetRemainingCount"
          type="number"
          min="1"
          :max="gameCount || undefined"
          class="mt-1.5 w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />
        <p v-if="gameCount" class="mt-1.5 text-xs text-slate-500">
          {{ $t('pickSession.createForm.targetCountHint', { count: gameCount }) }}
        </p>
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-300">
        <input
          v-model="excludeAlreadyPlayed"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
        />
        {{ $t('pickSession.createForm.excludeAlreadyPlayedLabel') }}
      </label>

      <BaseButton :loading="loading" @click="submit">
        {{ $t('pickSession.createForm.submit') }}
      </BaseButton>
    </form>
  </BaseCard>
</template>
