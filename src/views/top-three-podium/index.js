import * as THREE from 'three'
import { createTimeline, easeOutCubic, easeOutBack, easeInOutCubic, easeOutElastic } from './timeline.js'
import { getLayout } from './podiumLayout.js'
import { createAvatarSprite, disposeAvatarSprite } from './avatarThemes.js'
import { createTextSprite, disposeTextSprite } from './scoreTexture.js'
import { createAmbientParticles, createCelebrationParticles } from './particles.js'

const BURIED_OFFSET = 2.0
const BASE_KEY_LIGHT_INTENSITY = 0.9
const HERO_KEY_LIGHT_INTENSITY = 1.15
const AMBIENT_PARTICLE_OPACITY = 0.25
const AMBIENT_PARTICLE_OPACITY_SETTLED = 0.12
const NARROW_BREAKPOINT_PX = 480

const CAMERA_KEYFRAMES = {
  start: { pos: new THREE.Vector3(0, 1.1, 6.5), lookAt: new THREE.Vector3(0, 1.3, 0) },
  reveal: { pos: new THREE.Vector3(0, 2.6, 7.5), lookAt: new THREE.Vector3(0, 1.0, 0) },
  hero: { pos: new THREE.Vector3(1.4, 3.0, 6.5), lookAt: new THREE.Vector3(0, 1.0, 0) },
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * Mount the pure Three.js top-3 podium reveal inside a Vue container.
 *
 * @param {HTMLElement} container
 * @param {{ topThree?: { place: number, name: string, score: number }[], gameName?: string }} [options]
 * @returns {{ dispose: () => void, playTopThreeAnimation: (topThree?: object[]) => void, canReplay: () => boolean }}
 */
export function mountTopThreePodium(container, { topThree = [], gameName = '' } = {}) {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b0f1a)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  const cameraLookAt = new THREE.Vector3()

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  container.appendChild(renderer.domElement)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x11161f, roughness: 0.95 }),
  )
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  const ambientLight = new THREE.AmbientLight(0x8891a8, 0.6)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, BASE_KEY_LIGHT_INTENSITY)
  keyLight.position.set(3, 6, 4)
  scene.add(keyLight)

  const ambientParticles = createAmbientParticles()
  ambientParticles.points.material.opacity = AMBIENT_PARTICLE_OPACITY
  scene.add(ambientParticles.points)

  const celebrationParticles = createCelebrationParticles()
  scene.add(celebrationParticles.points)

  let podiums = []
  let timeline = null
  let startTimeMs = performance.now()
  let lastFrameMs = startTimeMs
  let disposed = false
  let rafId = 0

  function resize() {
    const w = Math.max(container.clientWidth, 1)
    const h = Math.max(container.clientHeight, 1)
    camera.aspect = w / h
    camera.fov = w < NARROW_BREAKPOINT_PX ? 62 : 50
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  function disposePodium(podium) {
    scene.remove(podium.group)
    podium.platform.geometry.dispose()
    podium.platform.material.dispose()
    disposeAvatarSprite(podium.avatarSprite)
    disposeTextSprite(podium.nameSprite)
    disposeTextSprite(podium.scoreSprite)
    disposeTextSprite(podium.medalSprite)
  }

  function buildPodiums(placements) {
    for (const podium of podiums) {
      disposePodium(podium)
    }

    const layout = getLayout(container.clientWidth)

    return placements
      .filter((placement) => layout[placement.place])
      .map((placement) => {
        const layoutEntry = layout[placement.place]
        const isFirst = placement.place === 1

        const group = new THREE.Group()

        const platform = new THREE.Mesh(
          new THREE.BoxGeometry(layoutEntry.width, layoutEntry.finalHeight, layoutEntry.depth),
          new THREE.MeshStandardMaterial({ color: layoutEntry.color, roughness: 0.5, metalness: 0.15 }),
        )
        platform.position.y = layoutEntry.finalHeight / 2
        group.add(platform)

        const avatarBaseY = layoutEntry.finalHeight + 0.6
        const avatarSprite = createAvatarSprite(placement.name, gameName)
        avatarSprite.scale.setScalar(0.001)
        avatarSprite.position.set(0, avatarBaseY, 0)
        group.add(avatarSprite)

        const medalSprite = createTextSprite(MEDALS[placement.place] ?? '', { fontSize: 120, square: true })
        medalSprite.material.opacity = 0
        medalSprite.userData.setScale(0.001)
        medalSprite.position.set(0.55, avatarBaseY + 0.45, 0.1)
        group.add(medalSprite)

        const nameFinalY = layoutEntry.finalHeight + 1.15
        const nameSprite = createTextSprite(placement.name, { fontSize: 42 })
        nameSprite.material.opacity = 0
        nameSprite.position.set(0, nameFinalY, 0)
        group.add(nameSprite)

        const scoreFinalY = layoutEntry.finalHeight + 1.5
        const scoreSprite = createTextSprite('0', {
          fontSize: isFirst ? 62 : 46,
          color: isFirst ? '#ffd54a' : '#ffffff',
        })
        scoreSprite.material.opacity = 0
        scoreSprite.position.set(0, scoreFinalY, 0)
        if (isFirst) scoreSprite.scale.multiplyScalar(1.15)
        group.add(scoreSprite)

        const baseY = 0
        const buriedY = baseY - BURIED_OFFSET
        group.position.set(layoutEntry.x, buriedY, 0)
        scene.add(group)

        return {
          place: placement.place,
          group,
          platform,
          avatarSprite,
          medalSprite,
          nameSprite,
          scoreSprite,
          avatarBaseY,
          nameFinalY,
          scoreFinalY,
          buriedY,
          baseY,
          finalScore: placement.score,
          displayedScore: 0,
        }
      })
  }

  function buildTimeline(podiumStates) {
    const steps = []
    const riseWindows = { 3: [300, 900], 2: [600, 1200], 1: [900, 1700] }
    const avatarWindows = { 3: [900, 1200], 2: [1200, 1500], 1: [1700, 2000] }
    const nameWindows = { 3: [1200, 1500], 2: [1500, 1800], 1: [2000, 2300] }
    const scoreWindows = { 3: [2200, 2600], 2: [2400, 2800], 1: [2600, 3000] }

    for (const podium of podiumStates) {
      const [riseStart, riseEnd] = riseWindows[podium.place]
      steps.push({
        start: riseStart,
        end: riseEnd,
        update(t) {
          const eased = easeOutElastic(t)
          podium.group.position.y = podium.buriedY + (podium.baseY - podium.buriedY) * eased
        },
      })

      const [avatarStart, avatarEnd] = avatarWindows[podium.place]
      steps.push({
        start: avatarStart,
        end: avatarEnd,
        update(t) {
          const eased = easeOutBack(t)
          const scale = Math.max(eased, 0.001)
          podium.avatarSprite.scale.setScalar(scale)
          podium.medalSprite.userData.setScale(Math.max(eased, 0.001) * 0.4)
          podium.medalSprite.material.opacity = Math.min(1, Math.max(t * 1.5, 0))
        },
      })

      const [nameStart, nameEnd] = nameWindows[podium.place]
      steps.push({
        start: nameStart,
        end: nameEnd,
        update(t) {
          const eased = easeOutCubic(t)
          podium.nameSprite.material.opacity = eased
          podium.nameSprite.position.y = podium.nameFinalY - 0.3 * (1 - eased)
        },
      })

      const [scoreStart, scoreEnd] = scoreWindows[podium.place]
      steps.push({
        start: scoreStart,
        end: scoreEnd,
        update(t) {
          const eased = easeOutCubic(t)
          podium.scoreSprite.material.opacity = eased
          const value = Math.round(podium.finalScore * eased)
          if (value !== podium.displayedScore) {
            podium.displayedScore = value
            podium.scoreSprite.userData.setText(String(value))
          }
        },
      })
    }

    // Camera move A: subtle rise as 1st place lands (900-1700ms).
    steps.push({
      start: 900,
      end: 1700,
      update(t) {
        const eased = easeInOutCubic(t)
        camera.position.lerpVectors(CAMERA_KEYFRAMES.start.pos, CAMERA_KEYFRAMES.reveal.pos, eased)
        cameraLookAt.lerpVectors(CAMERA_KEYFRAMES.start.lookAt, CAMERA_KEYFRAMES.reveal.lookAt, eased)
        camera.lookAt(cameraLookAt)
      },
    })

    const firstPlacePodium = podiumStates.find((podium) => podium.place === 1)
    let burstFired = false

    // Celebration burst (one-shot at t=3000, right as 1st place's score
    // finishes counting) + camera move B + a slight lighting lift.
    steps.push({
      start: 3000,
      end: 3800,
      update(t) {
        if (!burstFired) {
          burstFired = true
          if (firstPlacePodium) {
            const origin = firstPlacePodium.group.position.clone()
            origin.y += firstPlacePodium.avatarBaseY
            celebrationParticles.spawnBurst(origin, 45)
          }
        }
        const eased = easeInOutCubic(t)
        camera.position.lerpVectors(CAMERA_KEYFRAMES.reveal.pos, CAMERA_KEYFRAMES.hero.pos, eased)
        cameraLookAt.lerpVectors(CAMERA_KEYFRAMES.reveal.lookAt, CAMERA_KEYFRAMES.hero.lookAt, eased)
        camera.lookAt(cameraLookAt)
        keyLight.intensity = BASE_KEY_LIGHT_INTENSITY + (HERO_KEY_LIGHT_INTENSITY - BASE_KEY_LIGHT_INTENSITY) * eased
      },
    })

    if (firstPlacePodium) {
      steps.push({
        start: 3000,
        end: 3500,
        update(t) {
          const bounce = Math.sin(t * Math.PI)
          firstPlacePodium.platform.scale.setScalar(1 + bounce * 0.04)
          firstPlacePodium.avatarSprite.position.y = firstPlacePodium.avatarBaseY + bounce * 0.15
        },
      })
    }

    // Ambient particles settle to a calmer level as the reveal finishes.
    steps.push({
      start: 4500,
      end: 5000,
      update(t) {
        const eased = easeOutCubic(t)
        ambientParticles.points.material.opacity =
          AMBIENT_PARTICLE_OPACITY - (AMBIENT_PARTICLE_OPACITY - AMBIENT_PARTICLE_OPACITY_SETTLED) * eased
      },
    })

    return createTimeline(steps)
  }

  function applyIdleMotion(elapsedMs) {
    if (elapsedMs < 3800) return
    const t = elapsedMs / 1000
    for (const podium of podiums) {
      podium.avatarSprite.position.y = podium.avatarBaseY + Math.sin(t * 1.5 + podium.place) * 0.03
    }
  }

  function applyFinalPose() {
    camera.position.copy(CAMERA_KEYFRAMES.hero.pos)
    cameraLookAt.copy(CAMERA_KEYFRAMES.hero.lookAt)
    camera.lookAt(cameraLookAt)
    keyLight.intensity = HERO_KEY_LIGHT_INTENSITY
    ambientParticles.points.material.opacity = AMBIENT_PARTICLE_OPACITY_SETTLED

    for (const podium of podiums) {
      podium.group.position.y = podium.baseY
      podium.avatarSprite.scale.setScalar(1)
      podium.medalSprite.userData.setScale(0.4)
      podium.medalSprite.material.opacity = 1
      podium.nameSprite.material.opacity = 1
      podium.nameSprite.position.y = podium.nameFinalY
      podium.scoreSprite.material.opacity = 1
      podium.displayedScore = podium.finalScore
      podium.scoreSprite.userData.setText(String(podium.finalScore))
    }

    renderer.render(scene, camera)
  }

  function animate(now) {
    if (disposed) return
    rafId = requestAnimationFrame(animate)

    const elapsedMs = now - startTimeMs
    const deltaMs = now - lastFrameMs
    lastFrameMs = now

    timeline.run(elapsedMs)
    applyIdleMotion(elapsedMs)
    ambientParticles.update(elapsedMs)
    celebrationParticles.update(deltaMs)

    renderer.render(scene, camera)
  }

  function play(nextTopThree) {
    startTimeMs = performance.now()
    lastFrameMs = startTimeMs

    celebrationParticles.reset()
    ambientParticles.points.material.opacity = AMBIENT_PARTICLE_OPACITY
    keyLight.intensity = BASE_KEY_LIGHT_INTENSITY
    camera.position.copy(CAMERA_KEYFRAMES.start.pos)
    cameraLookAt.copy(CAMERA_KEYFRAMES.start.lookAt)
    camera.lookAt(cameraLookAt)

    podiums = buildPodiums(nextTopThree)
    timeline = buildTimeline(podiums)

    if (reducedMotion) {
      applyFinalPose()
    } else if (!rafId) {
      rafId = requestAnimationFrame(animate)
    }
  }

  resize()
  window.addEventListener('resize', resize)
  play(topThree)

  return {
    dispose() {
      disposed = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      for (const podium of podiums) {
        disposePodium(podium)
      }
      ambientParticles.dispose()
      celebrationParticles.dispose()
      floor.geometry.dispose()
      floor.material.dispose()
      renderer.dispose()
      container.replaceChildren()
    },
    playTopThreeAnimation(nextTopThree) {
      play(nextTopThree ?? topThree)
    },
    canReplay: () => !reducedMotion,
  }
}
