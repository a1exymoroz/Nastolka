<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import TopThreePodium2D from '../components/TopThreePodium2D.vue'
import { TOKEN_SETS } from '../utils/tokenSets'

const { t } = useI18n()
const router = useRouter()

// Bob's pieceId pins him to the elephant critter he actually played as (see
// avatarStyle 'tokens' + gameId in TopThreePodium2D); Alice and Carol have
// none, so they're assigned whichever tokens remain for the selected game,
// never colliding with Bob's (or, for a non-Everdell token set, just
// assigned like everyone else since his pieceId won't match).
const SAMPLE_TOP_THREE = [
  { place: 1, name: 'Alice', score: 126 },
  { place: 2, name: 'Bob', score: 84, pieceId: 'everdell_elephant' },
  { place: 3, name: 'Carol', score: 37 },
]
const SAMPLE_GAME_NAME = 'Everdell'

// Display names for each TOKEN_SETS game (by its gameKey, see
// tokenSets.js), for the podium's aria-label while previewing its pieces —
// falls back to SAMPLE_GAME_NAME for the base styles that aren't tied to a
// specific game (initials/dice/preset).
const SAMPLE_GAME_NAMES = { everdell: 'Everdell', brassBirmingham: 'Brass Birmingham' }

const BASE_STYLE_OPTIONS = ['initials', 'dice', 'preset']
// One preview button per TOKEN_SETS game, e.g. { bggId: 199792, gameKey: 'everdell' }.
const TOKEN_GAME_OPTIONS = Object.entries(TOKEN_SETS).map(([bggId, set]) => ({
  bggId: Number(bggId),
  gameKey: set.gameKey,
}))

const avatarStyle = ref('initials')
const selectedGameId = ref(null)

function selectBaseStyle(style) {
  avatarStyle.value = style
  selectedGameId.value = null
}
function selectTokenGame(bggId) {
  avatarStyle.value = 'tokens'
  selectedGameId.value = bggId
}

const sampleGameName = computed(() => {
  const gameKey = TOKEN_SETS[selectedGameId.value]?.gameKey
  return SAMPLE_GAME_NAMES[gameKey] ?? SAMPLE_GAME_NAME
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <button
      type="button"
      class="mb-8 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      @click="router.push({ name: 'podium-reveal-compare' })"
    >
      {{ t('common.backTo', { name: t('podiumCompare.title') }) }}
    </button>

    <h1 class="text-2xl font-bold tracking-tight">{{ t('podium2dPlayground.title') }}</h1>
    <p class="mt-2 text-sm text-slate-400">{{ t('podium2dPlayground.description') }}</p>

    <div class="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        {{ t('podium2dPlayground.avatarStyleLabel') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="style in BASE_STYLE_OPTIONS"
          :key="style"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
          :class="
            avatarStyle === style
              ? 'border-amber-400 bg-amber-400/10 text-amber-300'
              : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
          "
          @click="selectBaseStyle(style)"
        >
          {{ t(`podium2dPlayground.avatarStyle.${style}`) }}
        </button>
        <button
          v-for="game in TOKEN_GAME_OPTIONS"
          :key="game.bggId"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
          :class="
            avatarStyle === 'tokens' && selectedGameId === game.bggId
              ? 'border-amber-400 bg-amber-400/10 text-amber-300'
              : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
          "
          @click="selectTokenGame(game.bggId)"
        >
          {{ t(`podium2dPlayground.tokenGame.${game.gameKey}`) }}
        </button>
      </div>
    </div>

    <div class="mt-6">
      <TopThreePodium2D
        :key="`${avatarStyle}-${selectedGameId}`"
        :top-three="SAMPLE_TOP_THREE"
        :game-name="sampleGameName"
        :game-id="selectedGameId"
        :avatar-style="avatarStyle"
      />
    </div>
  </div>
</template>
