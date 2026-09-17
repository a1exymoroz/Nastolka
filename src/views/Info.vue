<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TOKEN_SETS } from '../utils/tokenSets'
import TokenIcon from '../components/TokenIcon.vue'

const router = useRouter()
const { t } = useI18n()

// Game display names aren't available anywhere else in the frontend (they
// come from the backend's BGG import, not a static catalog), so they're
// hardcoded here alongside the already-static token art in TOKEN_SETS.
const meepleGames = Object.values(TOKEN_SETS).map((set) => ({
  ...set,
  name: t(`info.games.${set.gameKey}`),
}))
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <header class="mb-10">
      <button
        type="button"
        class="text-sm text-slate-400 underline transition hover:text-slate-200"
        @click="router.push({ name: 'locations' })"
      >
        {{ $t('info.backToLocations') }}
      </button>
      <h1 class="mt-4 text-2xl font-bold tracking-tight">{{ $t('info.title') }}</h1>
      <p class="mt-1 text-sm text-slate-400">{{ $t('info.subtitle') }}</p>
    </header>

    <section class="mb-10">
      <h2 class="mb-1 text-lg font-semibold">{{ $t('info.meeples.title') }}</h2>
      <p class="mb-6 text-sm text-slate-400">{{ $t('info.meeples.subtitle') }}</p>

      <div
        v-for="game in meepleGames"
        :key="game.gameKey"
        :data-testid="`meeple-game-${game.gameKey}`"
        class="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >
        <h3 class="mb-4 font-semibold">{{ game.name }}</h3>
        <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <li v-for="token in game.tokens" :key="token.id" class="flex items-center gap-3">
            <TokenIcon :token="token" class="h-8 w-8 shrink-0" />
            <span class="text-sm text-slate-200">{{ t(`meeples.${game.gameKey}.${token.slug}`) }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Next info section goes here, e.g.:
    <section class="mb-10">
      <h2 class="mb-1 text-lg font-semibold">{{ $t('info.someTopic.title') }}</h2>
      ...
    </section>
    -->
  </div>
</template>
