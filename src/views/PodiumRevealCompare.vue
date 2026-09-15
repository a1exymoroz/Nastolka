<script setup>
import { useI18n } from 'vue-i18n'
import TopThreePodium from '../components/TopThreePodium.vue'
import TopThreePodium2D from '../components/TopThreePodium2D.vue'

const { t } = useI18n()

const SAMPLE_TOP_THREE = [
  { place: 1, name: 'Alice', score: 126 },
  { place: 2, name: 'Bob', score: 84 },
  { place: 3, name: 'Carol', score: 37 },
]
const SAMPLE_GAME_NAME = 'Everdell'
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <h1 class="text-2xl font-bold tracking-tight">{{ t('podiumCompare.title') }}</h1>
    <p class="mt-2 text-sm text-slate-400">{{ t('podiumCompare.description') }}</p>

    <div class="mt-8 grid gap-8 md:grid-cols-2">
      <section>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {{ t('podiumCompare.version3d') }}
        </h2>
        <TopThreePodium :top-three="SAMPLE_TOP_THREE" :game-name="SAMPLE_GAME_NAME" />
      </section>

      <section>
        <router-link
          :to="{ name: 'podium-reveal-2d' }"
          class="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:text-amber-300"
        >
          {{ t('podiumCompare.version2d') }}
          <span aria-hidden="true">→</span>
        </router-link>
        <TopThreePodium2D :top-three="SAMPLE_TOP_THREE" :game-name="SAMPLE_GAME_NAME" />
      </section>
    </div>
  </div>
</template>
