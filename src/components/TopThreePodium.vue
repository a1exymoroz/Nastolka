<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { mountTopThreePodium } from '../views/top-three-podium/index.js'

const props = defineProps({
  topThree: {
    type: Array,
    required: true,
  },
  gameName: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()

const container = ref(null)
const canReplay = ref(false)
let sceneApi = null

onMounted(() => {
  if (!container.value) return
  sceneApi = mountTopThreePodium(container.value, {
    topThree: props.topThree,
    gameName: props.gameName,
  })
  canReplay.value = sceneApi.canReplay()
})

onUnmounted(() => {
  sceneApi?.dispose()
  sceneApi = null
})

function replay() {
  sceneApi?.playTopThreeAnimation(props.topThree)
}
</script>

<template>
  <div class="mb-4">
    <div
      ref="container"
      class="aspect-video w-full overflow-hidden rounded-xl bg-slate-950"
      role="img"
      :aria-label="t('historyDetail.podium.ariaLabel', { gameName })"
    />
    <button
      v-if="canReplay"
      type="button"
      class="mt-2 text-xs font-medium text-slate-400 underline transition hover:text-slate-200"
      @click="replay"
    >
      {{ t('historyDetail.podium.replayButton') }}
    </button>
  </div>
</template>
