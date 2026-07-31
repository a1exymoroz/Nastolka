import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { TOUR_STEPS } from '../tour/steps'

const STORAGE_KEY = 'nastolka-tour-progress'

function parsePassedStepIds(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return value.split(',').map((id) => id.trim()).filter(Boolean)
  }
}

export const useTourStore = defineStore('tour', () => {
  const active = ref(false)
  const stepIndex = ref(0)
  // Lets the current page report facts the tour can't see from the DOM alone (e.g.
  // "can this viewer manage this location"), so gated steps can be skipped instantly
  // instead of polling for an element that will never appear.
  const context = ref({})

  const passedStepIds = ref(parsePassedStepIds(localStorage.getItem(STORAGE_KEY)))
  const passedStepSet = computed(() => new Set(passedStepIds.value))

  const activeSteps = computed(() =>
    TOUR_STEPS.filter((step) => !(step.requiresManage && context.value.canManage === false)),
  )

  const activeUnseenSteps = computed(() =>
    activeSteps.value.filter((step) => !passedStepSet.value.has(step.id)),
  )

  // Indexes into activeSteps (stable — only reshuffled by context/gating changes),
  // not activeUnseenSteps: that list drops a step the instant it's marked passed,
  // so incrementing stepIndex on top of that shrink used to skip an extra step
  // every time (e.g. edit-location -> add-game, silently skipping sharing).
  const currentStep = computed(() => (active.value ? activeSteps.value[stepIndex.value] ?? null : null))
  const total = computed(() => activeSteps.value.length)

  // "Done" must only appear once every one of the 7 canonical steps has been
  // passed — not just the ones reachable in the viewer's current context.
  // Checking only the steps *after* the current one in TOUR_STEPS was the bug:
  // manage-gated steps positioned earlier (edit-location, sharing, add-game)
  // were ignored, so a read-only viewer's last visible step ("chat") could
  // read as "Done" while those steps were still unseen.
  const isFinalStep = computed(() => {
    if (!currentStep.value) return false
    return TOUR_STEPS.every((step) => step.id === currentStep.value.id || passedStepSet.value.has(step.id))
  })

  function persistPassedSteps() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passedStepIds.value))
  }

  function markStepPassed(step) {
    if (!step || passedStepSet.value.has(step.id)) return
    passedStepIds.value = [...passedStepIds.value, step.id]
    persistPassedSteps()
  }

  // First index at or after fromIndex whose step hasn't been passed yet, or -1.
  function firstUnseenIndex(steps, fromIndex = 0) {
    for (let i = fromIndex; i < steps.length; i += 1) {
      if (!passedStepSet.value.has(steps[i].id)) return i
    }
    return -1
  }

  function watchActiveSteps(steps) {
    if (!active.value) return
    const index = firstUnseenIndex(steps)
    if (index === -1) {
      active.value = false
      return
    }
    stepIndex.value = index
  }

  // Reruns whenever gating changes (e.g. canManage flips on a new location),
  // since that's the only thing that changes which steps are in activeSteps.
  watch(activeSteps, watchActiveSteps, { flush: 'sync' })

  function maybeStart() {
    if (active.value) return
    const index = firstUnseenIndex(activeSteps.value)
    if (index === -1) return
    active.value = true
    stepIndex.value = index
  }

  function setContext(patch) {
    context.value = { ...context.value, ...patch }
  }

  function next() {
    markStepPassed(currentStep.value)
    const index = firstUnseenIndex(activeSteps.value, stepIndex.value + 1)
    if (index === -1) {
      finish()
      return
    }
    stepIndex.value = index
  }

  function prev() {
    if (stepIndex.value > 0) stepIndex.value -= 1
  }

  function skip() {
    finish()
  }

  function finish() {
    if (activeUnseenSteps.value.length) {
      passedStepIds.value = Array.from(
        new Set([...passedStepIds.value, ...activeUnseenSteps.value.map((step) => step.id)]),
      )
      persistPassedSteps()
    }
    active.value = false
  }

  return {
    active,
    stepIndex,
    context,
    passedStepIds,
    passedStepSet,
    activeSteps,
    currentStep,
    total,
    isFinalStep,
    maybeStart,
    setContext,
    next,
    prev,
    skip,
    finish,
  }
})
