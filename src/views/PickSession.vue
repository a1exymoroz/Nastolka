<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationDetails } from './location-detail/composables/useLocationDetails'
import { usePickSession } from './location-detail/composables/usePickSession'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'
import CreateSessionForm from './location-detail/components/pick-session/CreateSessionForm.vue'
import WaitingRoom from './location-detail/components/pick-session/WaitingRoom.vue'
import PickBanBoard from './location-detail/components/pick-session/PickBanBoard.vue'
import SessionResult from './location-detail/components/pick-session/SessionResult.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const { location, canManage, fetchLocation } = useLocationDetails()
const pickSession = usePickSession()

const locationGames = ref([])
const gameCount = computed(() => locationGames.value.length)

async function fetchGamesList() {
  try {
    const response = await apiFetch(`api/locations/${route.params.id}/games`)
    if (response.ok) locationGames.value = await response.json()
  } catch {
    // Non-fatal: the create form just skips the "X games available" hint,
    // and candidate cards fall back to showing just the game name.
  }
}

onMounted(async () => {
  await Promise.all([fetchLocation(), fetchGamesList(), pickSession.fetchActiveSession()])
})

function goToLocation() {
  router.push({ name: 'location-detail', params: { id: route.params.id } })
}

function logPlay() {
  router.push({
    name: 'location-history-new',
    params: { id: route.params.id },
    query: { gameId: pickSession.session.value.selectedGameId },
  })
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-6 sm:py-10">
    <button
      type="button"
      class="mb-6 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
      @click="goToLocation"
    >
      {{ $t('common.backTo', { name: location ? location.name : $t('common.genericLocation') }) }}
    </button>

    <h1 class="mb-6 text-2xl font-bold tracking-tight sm:mb-8 sm:text-3xl">
      {{ location ? location.name : 'Nastolka' }}
    </h1>

    <p v-if="pickSession.sessionError.value" class="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:mb-6 sm:px-4 sm:text-sm">
      {{ pickSession.sessionError.value }}
    </p>

    <section v-if="pickSession.sessionLoading.value" class="py-20 text-center text-slate-400">
      {{ $t('pickSession.loading') }}
    </section>

    <CreateSessionForm
      v-else-if="!pickSession.session.value"
      :game-count="gameCount"
      :loading="pickSession.actionPending.value"
      @create="pickSession.createSession"
    />

    <WaitingRoom
      v-else-if="pickSession.session.value.status === 'WAITING_FOR_PLAYERS'"
      :session="pickSession.session.value"
      :is-participant="pickSession.isParticipant.value"
      :is-creator="pickSession.isCreator.value"
      :can-manage-session="pickSession.isCreator.value || canManage"
      :connected="pickSession.sessionConnected.value"
      :action-pending="pickSession.actionPending.value"
      :current-username="auth.user?.username"
      @join="pickSession.join"
      @start="pickSession.start"
      @cancel="pickSession.cancel"
    />

    <PickBanBoard
      v-else-if="pickSession.session.value.status === 'IN_PROGRESS'"
      :session="pickSession.session.value"
      :location-games="locationGames"
      :is-my-turn="pickSession.isMyTurn.value"
      :can-pick="pickSession.canPick"
      :can-manage-session="pickSession.isCreator.value || canManage"
      :connected="pickSession.sessionConnected.value"
      :action-pending="pickSession.actionPending.value"
      @action="pickSession.submitAction"
      @cancel="pickSession.cancel"
    />

    <SessionResult
      v-else
      :session="pickSession.session.value"
      @log-play="logPlay"
      @start-new="pickSession.fetchActiveSession"
    />
  </div>
</template>
