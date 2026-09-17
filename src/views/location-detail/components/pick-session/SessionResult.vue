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

// id + completedAt come through byte-identical in the same broadcast every
// participant receives, so this seed — and therefore the roll — is the same
// for everyone watching.
const rollSeed = computed(() => `${props.session.id}:${props.session.completedAt}`)
</script>

<template>
  <PickSessionDiceReveal
    v-if="rolling"
    :game-count="survivorCount"
    :seed="rollSeed"
    @done="rolling = false"
  />

  <BaseCard v-else padding="none" radius="2xl" class="p-4 text-center sm:p-6">
    <template v-if="session.status === 'COMPLETED'">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
        {{ $t('pickSession.result.title') }}
      </p>
      <p class="mt-2 text-2xl font-bold tracking-tight text-amber-400 sm:text-3xl">
        {{ session.selectedGameName }}
      </p>
      <div class="mt-4 flex flex-wrap justify-center gap-2 sm:mt-6 sm:gap-3">
        <BaseButton size="sm" @click="$emit('logPlay')">
          {{ $t('pickSession.result.logThisPlay') }}
        </BaseButton>
        <BaseButton size="sm" variant="secondary" @click="$emit('startNew')">
          {{ $t('pickSession.cancelled.startNew') }}
        </BaseButton>
      </div>
    </template>

    <template v-else>
      <p class="text-base font-semibold text-slate-200 sm:text-lg">
        {{ $t('pickSession.cancelled.title') }}
      </p>
      <BaseButton class="mt-4 sm:mt-6" size="sm" variant="secondary" @click="$emit('startNew')">
        {{ $t('pickSession.cancelled.startNew') }}
      </BaseButton>
    </template>
  </BaseCard>
</template>
