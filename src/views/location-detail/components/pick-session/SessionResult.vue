<script setup>
import { computed, ref } from 'vue'
import BaseCard from '../../../../components/base/BaseCard.vue'
import BaseButton from '../../../../components/base/BaseButton.vue'
import PickSessionDiceReveal from './PickSessionDiceReveal.vue'

const props = defineProps({
  session: { type: Object, required: true },
})

defineEmits(['logPlay', 'startNew'])

// Fresh each time this component mounts (a live COMPLETED broadcast, or
// landing on an already-completed session), so the roll always plays before
// the reveal — mirrors the old client-side dice roll, but now it's a shared,
// purely cosmetic "everyone watches together" moment: the winner was already
// decided server-side, this doesn't pick it.
const rolling = ref(props.session.status === 'COMPLETED')

const survivorCount = computed(
  () => props.session.candidates.filter((c) => c.action !== 'BANNED').length,
)
</script>

<template>
  <PickSessionDiceReveal
    v-if="rolling"
    :game-count="survivorCount"
    @done="rolling = false"
  />

  <BaseCard v-else padding="lg" radius="2xl" class="text-center">
    <template v-if="session.status === 'COMPLETED'">
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {{ $t('pickSession.result.title') }}
      </p>
      <p class="mt-2 text-3xl font-bold tracking-tight text-amber-400">
        {{ session.selectedGameName }}
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <BaseButton @click="$emit('logPlay')">
          {{ $t('pickSession.result.logThisPlay') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="$emit('startNew')">
          {{ $t('pickSession.cancelled.startNew') }}
        </BaseButton>
      </div>
    </template>

    <template v-else>
      <p class="text-lg font-semibold text-slate-200">
        {{ $t('pickSession.cancelled.title') }}
      </p>
      <BaseButton class="mt-6" variant="secondary" @click="$emit('startNew')">
        {{ $t('pickSession.cancelled.startNew') }}
      </BaseButton>
    </template>
  </BaseCard>
</template>
