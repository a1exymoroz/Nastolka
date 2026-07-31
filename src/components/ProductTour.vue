<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useTourStore } from '../stores/tour'

const route = useRoute()
const tour = useTourStore()

const targetRect = ref(null)
const tooltipEl = ref(null)
const tooltipSize = ref({ width: 320, height: 160 })

const visible = computed(
  () => !!tour.currentStep && tour.currentStep.route === route.name && !!targetRect.value,
)

const PADDING = 8
const MARGIN = 12

let rafId = null
let retriesLeft = 0

function cancelLocate() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

function attemptLocate(step) {
  const el = document.querySelector(`[data-tour="${step.target}"]`)
  if (el) {
    targetRect.value = el.getBoundingClientRect()
    measureTooltip()
    return
  }
  if (retriesLeft <= 0) {
    // Target never showed up (e.g. the user can't manage this location) — skip it rather than get stuck.
    tour.next()
    return
  }
  retriesLeft -= 1
  rafId = requestAnimationFrame(() => attemptLocate(step))
}

function locate() {
  cancelLocate()
  const step = tour.currentStep
  if (!step || step.route !== route.name) {
    targetRect.value = null
    return
  }
  if (step.requiresManage && tour.context.canManage === false) {
    // Known in advance this element will never render for this viewer — skip
    // immediately instead of polling the DOM for something that isn't coming.
    tour.next()
    return
  }
  retriesLeft = 30
  attemptLocate(step)
}

function measureTooltip() {
  nextTick(() => {
    if (tooltipEl.value) {
      tooltipSize.value = { width: tooltipEl.value.offsetWidth, height: tooltipEl.value.offsetHeight }
    }
  })
}

function refreshRect() {
  const step = tour.currentStep
  if (!step) return
  const el = document.querySelector(`[data-tour="${step.target}"]`)
  if (el) targetRect.value = el.getBoundingClientRect()
}

watch(
  () => [tour.currentStep, route.name],
  () => nextTick(locate),
  { immediate: true },
)

function onKeydown(event) {
  if (event.key === 'Escape') tour.skip()
}

window.addEventListener('resize', refreshRect)
window.addEventListener('scroll', refreshRect, true)
window.addEventListener('keydown', onKeydown)

onBeforeUnmount(() => {
  cancelLocate()
  window.removeEventListener('resize', refreshRect)
  window.removeEventListener('scroll', refreshRect, true)
  window.removeEventListener('keydown', onKeydown)
})

const spotlightStyle = computed(() => {
  if (!targetRect.value) return {}
  const r = targetRect.value
  return {
    top: `${r.top - PADDING}px`,
    left: `${r.left - PADDING}px`,
    width: `${r.width + PADDING * 2}px`,
    height: `${r.height + PADDING * 2}px`,
  }
})

const tooltipStyle = computed(() => {
  if (!targetRect.value) return {}
  const r = targetRect.value
  const { width, height } = tooltipSize.value
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = r.bottom + PADDING + MARGIN
  if (top + height > vh - MARGIN) {
    top = r.top - PADDING - MARGIN - height
  }
  top = Math.max(MARGIN, Math.min(top, vh - height - MARGIN))

  const left = Math.max(MARGIN, Math.min(r.left, vw - width - MARGIN))

  return { top: `${top}px`, left: `${left}px` }
})
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[80]">
    <div
      class="pointer-events-none absolute rounded-lg outline outline-2 outline-indigo-500 transition-all duration-200"
      :style="{ ...spotlightStyle, boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.8)' }"
    ></div>

    <div
      ref="tooltipEl"
      class="absolute w-80 max-w-[calc(100vw-24px)] rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl transition-all duration-200"
      :style="tooltipStyle"
    >
      <p class="mb-1 text-xs font-medium text-indigo-400">{{ tour.stepIndex + 1 }}/{{ tour.total }}</p>
      <h3 class="mb-1 text-sm font-semibold text-slate-100">{{ $t(tour.currentStep.titleKey) }}</h3>
      <p class="mb-4 text-sm text-slate-400">{{ $t(tour.currentStep.bodyKey) }}</p>

      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="text-xs font-medium text-slate-500 transition hover:text-slate-300"
          @click="tour.skip()"
        >
          {{ $t('tour.skip') }}
        </button>
        <div class="flex gap-2">
          <button
            v-if="tour.stepIndex > 0"
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            @click="tour.prev()"
          >
            {{ $t('tour.back') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
            @click="tour.next()"
          >
            {{ tour.stepIndex === tour.total - 1 ? $t('tour.done') : $t('tour.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
