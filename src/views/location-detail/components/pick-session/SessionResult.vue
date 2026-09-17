<script setup>
import BaseCard from '../../../../components/base/BaseCard.vue'
import BaseButton from '../../../../components/base/BaseButton.vue'

defineProps({
  session: { type: Object, required: true },
})

defineEmits(['logPlay', 'startNew'])
</script>

<template>
  <BaseCard padding="lg" radius="2xl" class="text-center">
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
