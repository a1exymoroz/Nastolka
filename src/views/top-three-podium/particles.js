import * as THREE from 'three'

const CONFETTI_GRAVITY = -2.0
const CONFETTI_LIFETIME_MS = 2200
const CONFETTI_COLORS = [0xffd54a, 0xff6b6b, 0x4dd0e1, 0x81c784, 0xba68c8, 0xffffff]

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
 * A one-shot confetti burst: small colorful rectangles that tumble outward
 * and fall. Each piece is its own THREE.Mesh (sharing one geometry) rather
 * than a single instanced/points cloud — at this scale (well under 100
 * pieces, only active for ~2s) individual meshes cost nothing measurable,
 * and it sidesteps InstancedMesh's per-instance-color quirks so every piece
 * reliably keeps its own bright, distinct color.
 */
export function createCelebrationParticles(maxCount = 56) {
  const geometry = new THREE.PlaneGeometry(0.2, 0.34)
  const group = new THREE.Group()

  const particles = Array.from({ length: maxCount }, (_, i) => {
    const material = new THREE.MeshBasicMaterial({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      side: THREE.DoubleSide,
      transparent: true,
      toneMapped: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.visible = false
    group.add(mesh)
    return { mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3() }
  })

  let elapsedSinceBurstMs = null
  let activeCount = 0

  function spawnBurst(origin, count = 50) {
    activeCount = Math.min(count, maxCount)
    elapsedSinceBurstMs = 0

    for (let i = 0; i < maxCount; i++) {
      const particle = particles[i]
      particle.mesh.visible = i < activeCount
      if (i >= activeCount) continue

      particle.mesh.position.copy(origin)
      particle.mesh.scale.setScalar(1)
      const angle = Math.random() * Math.PI * 2
      const speed = 1.4 + Math.random() * 2.0
      particle.velocity.set(Math.cos(angle) * speed, 1.8 + Math.random() * 1.4, Math.sin(angle) * speed)
      particle.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      particle.spin.set(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 9,
      )
    }
  }

  function update(deltaMs) {
    if (elapsedSinceBurstMs === null) return
    elapsedSinceBurstMs += deltaMs
    const dt = deltaMs / 1000
    const lifeRatio = Math.min(elapsedSinceBurstMs / CONFETTI_LIFETIME_MS, 1)
    // Hold full size for most of the burst, then shrink away at the very end.
    const scale = lifeRatio > 0.75 ? Math.max(1 - (lifeRatio - 0.75) / 0.25, 0) : 1

    for (let i = 0; i < activeCount; i++) {
      const particle = particles[i]
      particle.velocity.y += CONFETTI_GRAVITY * dt
      particle.mesh.position.addScaledVector(particle.velocity, dt)
      particle.mesh.rotation.x += particle.spin.x * dt
      particle.mesh.rotation.y += particle.spin.y * dt
      particle.mesh.rotation.z += particle.spin.z * dt
      particle.mesh.scale.setScalar(scale)
    }

    if (lifeRatio >= 1) {
      reset()
    }
  }

  function reset() {
    for (let i = 0; i < activeCount; i++) {
      particles[i].mesh.visible = false
    }
    activeCount = 0
    elapsedSinceBurstMs = null
  }

  function dispose() {
    geometry.dispose()
    for (const particle of particles) {
      particle.mesh.material.dispose()
    }
  }

  return { object: group, spawnBurst, update, reset, dispose }
}
