<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import TopThreePodium2D from '../components/TopThreePodium2D.vue'

const { t } = useI18n()
const router = useRouter()

// Bob's pieceId pins him to the teal critter he actually played as (see
// avatarStyle 'everdell' in TopThreePodium2D); Alice and Carol have none,
// so they're assigned whichever critters remain, never colliding with Bob's.
const SAMPLE_TOP_THREE = [
  { place: 1, name: 'Alice', score: 126 },
  { place: 2, name: 'Bob', score: 84, pieceId: 'teal' },
  { place: 3, name: 'Carol', score: 37 },
]
const SAMPLE_GAME_NAME = 'Everdell'

const AVATAR_STYLE_OPTIONS = ['initials', 'dice', 'preset', 'everdell']
const avatarStyle = ref('initials')
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
          v-for="option in AVATAR_STYLE_OPTIONS"
          :key="option"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
          :class="
            avatarStyle === option
              ? 'border-amber-400 bg-amber-400/10 text-amber-300'
              : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
          "
          @click="avatarStyle = option"
        >
          {{ t(`podium2dPlayground.avatarStyle.${option}`) }}
        </button>
      </div>
    </div>

    <div class="mt-6">
      <TopThreePodium2D :key="avatarStyle" :top-three="SAMPLE_TOP_THREE" :game-name="SAMPLE_GAME_NAME" :avatar-style="avatarStyle" />
    </div>
  </div>
</template>
