import RAPIER from '@dimforge/rapier3d-compat'
import { createDiceWorld, ensureRapierInit } from './createWorld.js'
import { getBodyForDiceType } from './getBodies.js'
import { getDiceResult, isDieSettled, SETTLED_FRAME_COUNT } from './getDiceResult.js'

// Generous cap so a roll that (implausibly) never settles can't hang the caller —
// real rolls settle in well under a second's worth of steps.
const MAX_STEPS = 1800

/**
 * Run the exact same die-drop physics as the live visual roll, but headless
 * (no rendering, stepped in a tight loop) purely to find out in advance which
 * face a given seed lands on. Given the same seed and dice type, this produces
 * the same result as the animated roll (both use a fixed physics timestep, so
 * the outcome depends only on the step sequence, not on wall-clock/frame timing) —
 * that lets the UI show a truthful number-to-game legend *before* the animation
 * plays, instead of only after.
 */
export async function simulateDiceRoll({ diceType, rng }) {
  await ensureRapierInit()

  const world = createDiceWorld()
  const body = getBodyForDiceType(RAPIER, world, { diceType, rng })

  let settledFrames = 0
  for (let i = 0; i < MAX_STEPS; i++) {
    world.step()
    if (isDieSettled(body.rigid)) {
      settledFrames++
      if (settledFrames >= SETTLED_FRAME_COUNT) {
        break
      }
    } else {
      settledFrames = 0
    }
  }

  return getDiceResult(body.rigid, diceType)
}
