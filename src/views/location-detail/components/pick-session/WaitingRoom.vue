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
  <BaseCard padding="none" radius="2xl" class="p-4 sm:p-6">
    <h2 class="text-base font-semibold sm:text-lg">{{ $t('pickSession.waitingRoom.title') }}</h2>

    <p class="mt-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:mt-4 sm:text-xs">
      {{ $t('pickSession.waitingRoom.participantsTitle') }}
    </p>
    <ul class="mt-2 space-y-1.5">
      <li
        v-for="participant in session.participants"
        :key="participant.userId"
        class="flex items-center gap-2 text-xs text-slate-200 sm:text-sm"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        {{ participant.username }}
        <span v-if="participant.username === currentUsername" class="text-[11px] text-slate-500 sm:text-xs">
          ({{ $t('pickSession.waitingRoom.you') }})
        </span>
        <span
          v-if="participant.username === session.createdByUsername"
          class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400 sm:text-[10px]"
        >
          {{ $t('pickSession.waitingRoom.host') }}
        </span>
      </li>
    </ul>

    <div class="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
      <BaseButton
        v-if="!isParticipant"
        size="sm"
        :disabled="!connected"
        :loading="actionPending"
        @click="$emit('join')"
      >
        {{ $t('pickSession.waitingRoom.join') }}
      </BaseButton>

      <BaseButton
        v-if="isCreator"
        size="sm"
        :disabled="!connected"
        :loading="actionPending"
        @click="$emit('start')"
      >
        {{ $t('pickSession.waitingRoom.start') }}
      </BaseButton>

      <p v-else-if="isParticipant" class="text-xs text-slate-400 sm:text-sm">
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
        class="sm:ml-auto"
        :disabled="!connected"
        @click="$emit('cancel')"
      >
        {{ $t('pickSession.waitingRoom.cancel') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
