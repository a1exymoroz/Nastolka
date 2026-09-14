/**
 * Keyframe timeline runner + easing functions for the top-3 podium reveal.
 *
 * All step boundaries are expressed in milliseconds against a single overall
 * clock, driven by `performance.now()` in index.js — never by frame count, so
 * the animation reads correctly regardless of display refresh rate.
 */

export function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}

export function easeOutCubic(t) {
  const p = t - 1
  return p * p * p + 1
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOutBack(t, overshoot = 1.70158) {
  const c1 = overshoot
  const c3 = c1 + 1
  const p = t - 1
  return 1 + c3 * p * p * p + c1 * p * p
}

export function easeOutElastic(t) {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/**
 * @param {{ start: number, end: number, update: (localProgress: number, elapsedMs: number) => void }[]} steps
 */
export function createTimeline(steps) {
  return {
    run(elapsedMs) {
      for (const step of steps) {
        if (elapsedMs < step.start) continue
        const span = step.end - step.start
        const localProgress = span <= 0 ? 1 : clamp01((elapsedMs - step.start) / span)
        step.update(localProgress, elapsedMs)
      }
    },
  }
}
