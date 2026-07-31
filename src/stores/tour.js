import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TOUR_STEPS } from '../tour/steps'

const STORAGE_KEY = 'nastolka-tour-completed'

export const useTourStore = defineStore('tour', () => {
  const active = ref(false)
  const stepIndex = ref(0)

  const currentStep = computed(() => (active.value ? (TOUR_STEPS[stepIndex.value] ?? null) : null))
  const total = TOUR_STEPS.length

  function maybeStart() {
    if (localStorage.getItem(STORAGE_KEY) === '1') return
    active.value = true
    stepIndex.value = 0
  }

  function next() {
    if (stepIndex.value >= TOUR_STEPS.length - 1) {
      finish()
      return
    }
    stepIndex.value += 1
  }

  function prev() {
    if (stepIndex.value > 0) stepIndex.value -= 1
  }

  function skip() {
    finish()
  }

  function finish() {
    active.value = false
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return { active, stepIndex, currentStep, total, maybeStart, next, prev, skip, finish }
})
