import RAPIER from '@dimforge/rapier3d-compat'

// Tuned (via a headless-simulation sweep, not guessed) so the fall+tumble+settle
// takes ~4-5s — the "throw" beat of the reveal. The other beats (showing the
// pre-roll legend, lingering on the result) are separate timed delays, not gravity.
export const GRAVITY_Y = -2.5

let rapierInitPromise = null

/** RAPIER.init() loads a wasm module — cache the promise so every caller shares one load. */
export function ensureRapierInit() {
  if (!rapierInitPromise) {
    rapierInitPromise = RAPIER.init()
  }
  return rapierInitPromise
}

/** A fresh physics world with the same gravity + ground plane used everywhere dice roll. */
export function createDiceWorld() {
  const world = new RAPIER.World({ x: 0.0, y: GRAVITY_Y, z: 0.0 })
  world.createCollider(RAPIER.ColliderDesc.cuboid(5.0, 0.1, 5.0).setTranslation(0.0, -2.0, 0.0))
  return world
}
