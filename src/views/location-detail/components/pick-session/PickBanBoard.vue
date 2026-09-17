<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from '../../../../components/base/BaseCard.vue'
import BaseButton from '../../../../components/base/BaseButton.vue'

const props = defineProps({
  session: { type: Object, required: true },
  locationGames: { type: Array, default: () => [] },
  isMyTurn: { type: Boolean, default: false },
  canPick: { type: Function, required: true },
  canManageSession: { type: Boolean, default: false },
  connected: { type: Boolean, default: false },
  actionPending: { type: Boolean, default: false },
})

defineEmits(['action', 'cancel'])

const { t } = useI18n()

const pickedCount = computed(
  () => props.session.candidates.filter((c) => c.action === 'PICKED').length,
)

const pickBlocked = computed(() =>
  props.session.candidates.some((c) => c.action === 'UNDECIDED' && !props.canPick(c)),
)

const gamesById = computed(() => new Map(props.locationGames.map((g) => [g.id, g])))

// Candidates only carry gameId/gameName — photo and bggId come from the
// location's games list, joined by id.
function gameInfo(candidate) {
  return gamesById.value.get(candidate.gameId)
}

function bggUrl(candidate) {
  const bggId = gameInfo(candidate)?.bggId
  return bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null
}

function badgeKey(action) {
  return action === 'PICKED' ? 'pickedBy' : 'bannedBy'
}

function pickHint(candidate) {
  return props.canPick(candidate) ? '' : t('pickSession.board.pickDisabledHint')
}
</script>

<template>
  <BaseCard padding="lg" radius="2xl">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        {{
          isMyTurn
            ? $t('pickSession.board.yourTurn')
            : $t('pickSession.board.waitingForTurn', {
                username: session.currentTurnUsername,
              })
        }}
      </h2>
      <p class="text-sm text-slate-400">
        {{ $t('pickSession.board.pickedProgress', { picked: pickedCount, target: session.targetRemainingCount }) }}
        <span class="mx-1.5 text-slate-600" aria-hidden="true">·</span>
        {{ $t('pickSession.board.progress', { banned: session.banCount, required: session.requiredBanCount }) }}
      </p>
    </div>

    <ul class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="candidate in session.candidates"
        :key="candidate.gameId"
        class="overflow-hidden rounded-xl border p-4"
        :class="
          candidate.action === 'UNDECIDED'
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-800 bg-slate-900/50 opacity-70'
        "
      >
        <img
          v-if="gameInfo(candidate)?.photo"
          :src="gameInfo(candidate).photo"
          :alt="candidate.gameName"
          class="-mx-4 -mt-4 mb-3 h-28 w-[calc(100%+2rem)] object-cover"
        />

        <a
          v-if="bggUrl(candidate)"
          :href="bggUrl(candidate)"
          target="_blank"
          rel="noopener noreferrer"
          :title="$t('common.viewOnBgg')"
          class="font-semibold text-slate-100 hover:text-indigo-400 hover:underline"
        >
          {{ candidate.gameName }}
        </a>
        <p v-else class="font-semibold">{{ candidate.gameName }}</p>

        <p
          v-if="candidate.action !== 'UNDECIDED'"
          class="mt-2 text-xs font-semibold uppercase tracking-wide"
          :class="candidate.action === 'PICKED' ? 'text-emerald-400' : 'text-red-400'"
        >
          {{
            $t(`pickSession.board.${badgeKey(candidate.action)}`, {
              username: candidate.actedByUsername,
            })
          }}
        </p>

        <div v-else-if="isMyTurn" class="mt-3 flex gap-2">
          <BaseButton
            size="sm"
            :title="pickHint(candidate)"
            :disabled="!connected || !canPick(candidate)"
            :loading="actionPending"
            @click="$emit('action', candidate.gameId, 'PICKED')"
          >
            {{ $t('pickSession.board.pick') }}
          </BaseButton>
          <BaseButton
            variant="danger"
            size="sm"
            :disabled="!connected"
            :loading="actionPending"
            @click="$emit('action', candidate.gameId, 'BANNED')"
          >
            {{ $t('pickSession.board.ban') }}
          </BaseButton>
        </div>
      </li>
    </ul>

    <p v-if="isMyTurn && pickBlocked" class="mt-4 text-sm text-amber-400">
      {{ $t('pickSession.board.pickBlockedNotice') }}
    </p>

    <BaseButton
      v-if="canManageSession"
      variant="danger"
      size="sm"
      class="mt-6"
      :disabled="!connected"
      @click="$emit('cancel')"
    >
      {{ $t('pickSession.board.cancel') }}
    </BaseButton>
  </BaseCard>
</template>
