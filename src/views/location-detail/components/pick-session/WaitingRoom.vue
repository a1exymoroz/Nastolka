<script setup>
import BaseCard from '../../../../components/base/BaseCard.vue'
import BaseButton from '../../../../components/base/BaseButton.vue'

defineProps({
  session: { type: Object, required: true },
  isParticipant: { type: Boolean, default: false },
  isCreator: { type: Boolean, default: false },
  canManageSession: { type: Boolean, default: false },
  connected: { type: Boolean, default: false },
  actionPending: { type: Boolean, default: false },
  currentUsername: { type: String, default: '' },
})

defineEmits(['join', 'start', 'cancel'])
</script>

<template>
  <BaseCard padding="lg" radius="2xl">
    <h2 class="text-lg font-semibold">{{ $t('pickSession.waitingRoom.title') }}</h2>

    <p class="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
      {{ $t('pickSession.waitingRoom.participantsTitle') }}
    </p>
    <ul class="mt-2 space-y-1.5">
      <li
        v-for="participant in session.participants"
        :key="participant.userId"
        class="flex items-center gap-2 text-sm text-slate-200"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        {{ participant.username }}
        <span v-if="participant.username === currentUsername" class="text-xs text-slate-500">
          ({{ $t('pickSession.waitingRoom.you') }})
        </span>
        <span
          v-if="participant.username === session.createdByUsername"
          class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400"
        >
          {{ $t('pickSession.waitingRoom.host') }}
        </span>
      </li>
    </ul>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <BaseButton v-if="!isParticipant" :disabled="!connected" :loading="actionPending" @click="$emit('join')">
        {{ $t('pickSession.waitingRoom.join') }}
      </BaseButton>

      <BaseButton
        v-if="isCreator"
        :disabled="!connected"
        :loading="actionPending"
        @click="$emit('start')"
      >
        {{ $t('pickSession.waitingRoom.start') }}
      </BaseButton>

      <p v-else-if="isParticipant" class="text-sm text-slate-400">
        {{
          $t('pickSession.waitingRoom.waitingForHost', {
            username: session.createdByUsername,
          })
        }}
      </p>

      <BaseButton
        v-if="canManageSession"
        variant="danger"
        size="sm"
        class="ml-auto"
        :disabled="!connected"
        @click="$emit('cancel')"
      >
        {{ $t('pickSession.waitingRoom.cancel') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
