import * as THREE from 'three'

const GRAVITY = -1.4
const BURST_LIFETIME_MS = 1600
const PARKED_Y = -1000

/**
 * Subtle ambient particles, visible from frame 0, drifting slowly via a slow
 * whole-cloud rotation (cheap: no per-particle simulation needed).
 */
export function createAmbientParticles(count = 120) {
  const positions = new Float32Array(count * 3)
  const radius = 6
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * radius * 2
    positions[i3 + 1] = Math.random() * 3.5
    positions[i3 + 2] = (Math.random() - 0.5) * radius * 2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.03,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geometry, material)

  function update(elapsedMs) {
    points.rotation.y = elapsedMs * 0.00004
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
  }

  return { points, update, dispose }
}

/**
 * A one-shot celebration burst, pre-allocated as a single Points cloud
 * (never one mesh per particle) so it stays lightweight. Inactive/finished
 * particle slots are parked far below the scene rather than tracked with a
 * per-vertex size, keeping this a plain PointsMaterial (no custom shader).
 */
export function createCelebrationParticles(maxCount = 60) {
  const positions = new Float32Array(maxCount * 3)
  const velocities = new Float32Array(maxCount * 3)

  for (let i = 0; i < maxCount; i++) {
    positions[i * 3 + 1] = PARKED_Y
  }

  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(positions, 3)
  geometry.setAttribute('position', positionAttribute)
  const material = new THREE.PointsMaterial({
    color: 0xffd54a,
    size: 0.08,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geometry, material)

  let elapsedSinceBurstMs = null
  let activeCount = 0

  function spawnBurst(origin, count = 45) {
    activeCount = Math.min(count, maxCount)
    elapsedSinceBurstMs = 0
    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3
      positions[i3] = origin.x
      positions[i3 + 1] = origin.y
      positions[i3 + 2] = origin.z
      const angle = Math.random() * Math.PI * 2
      const speed = 0.8 + Math.random() * 1.4
      velocities[i3] = Math.cos(angle) * speed
      velocities[i3 + 1] = 1.6 + Math.random() * 1.2
      velocities[i3 + 2] = Math.sin(angle) * speed
    }
    positionAttribute.needsUpdate = true
  }

  function update(deltaMs) {
    if (elapsedSinceBurstMs === null) return
    elapsedSinceBurstMs += deltaMs
    const dt = deltaMs / 1000
    const lifeRatio = Math.min(elapsedSinceBurstMs / BURST_LIFETIME_MS, 1)
    material.opacity = 0.9 * (1 - lifeRatio)

    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3
      velocities[i3 + 1] += GRAVITY * dt
      positions[i3] += velocities[i3] * dt
      positions[i3 + 1] += velocities[i3 + 1] * dt
      positions[i3 + 2] += velocities[i3 + 2] * dt
    }
    positionAttribute.needsUpdate = true

    if (lifeRatio >= 1) {
      reset()
    }
  }

  function reset() {
    for (let i = 0; i < activeCount; i++) {
      positions[i * 3 + 1] = PARKED_Y
    }
    positionAttribute.needsUpdate = true
    material.opacity = 0
    activeCount = 0
    elapsedSinceBurstMs = null
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
  }

  return { points, spawnBurst, update, reset, dispose }
}
