import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { disposeD8DieMesh } from './createD8DieMesh.js'
import { disposeNumberedDieMesh } from './createNumberedDieMesh.js'
import { getBodyForDiceType, PROCEDURAL_DICE_TYPES } from './getBodies.js'
import { getDiceResult, isDieSettled, PHYSICS_DICE_TYPES } from './getDiceResult.js'

/**
 * Mount the Rapier + Three.js dice playground inside a Vue container.
 *
 * @param {HTMLElement} container
 * @param {{
 *   initialDiceType?: string,
 *   onResult?: (value: number) => void,
 *   onRolling?: () => void,
 * }} options
 * @returns {Promise<{ dispose: () => void, setDiceType: (type: string) => void, roll: () => void }>}
 */
export async function mountPhysicsWithRapierAndThree(
  container,
  { initialDiceType = 'd6', onResult, onRolling } = {},
) {
  let currentDiceType = 'd8'

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.set(0, 3, 6)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const ctrls = new OrbitControls(camera, renderer.domElement)
  ctrls.enableDamping = true

  const resize = () => {
    const w = Math.max(container.clientWidth, 1)
    const h = Math.max(container.clientHeight, 1)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  resize()
  window.addEventListener('resize', resize, false)

  await RAPIER.init()
  const world = new RAPIER.World({ x: 0.0, y: -9.81 * 2.0, z: 0.0 })

  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.1, 5.0).setTranslation(0.0, -2.0, 0.0)
  world.createCollider(groundColliderDesc)

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.1, 10, 5, 1, 5),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  )
  floor.position.set(0.0, -2, 0.0)
  floor.receiveShadow = true
  scene.add(floor)

  const loader = new GLTFLoader()
  const modelUrl = new URL('./die.glb', import.meta.url).href
  const diceGltf = await loader.loadAsync(modelUrl)
  const d6Model = diceGltf.scene

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xaa00ff, 1.0)
  scene.add(hemiLight)

  const light = new THREE.DirectionalLight(0xffffff, 2)
  const d = 15
  light.shadow.camera.left = -d
  light.shadow.camera.right = d
  light.shadow.camera.top = d
  light.shadow.camera.bottom = -d
  light.shadow.camera.near = 2
  light.shadow.camera.far = 30
  light.shadow.mapSize.x = 2048
  light.shadow.mapSize.y = 2048
  light.position.set(3, 8, 10)
  light.castShadow = true
  scene.add(light)

  const bodies = []
  let settledFrames = 0
  let lastReportedResult = null
  const SETTLED_FRAME_COUNT = 10

  function clearBodies() {
    bodies.forEach((body) => {
      world.removeRigidBody(body.rigid)
      scene.remove(body.mesh)
      // Only dispose procedural meshes — d6 reuses cloned GLB geometry.
      if (body.diceType === 'd4') {
        disposeNumberedDieMesh(body.mesh)
      } else if (body.diceType === 'd8') {
        disposeD8DieMesh(body.mesh)
      }
    })
    bodies.length = 0
  }

  function spawnDie() {
    settledFrames = 0
    lastReportedResult = null
    onRolling?.()
    clearBodies()

    const body = getBodyForDiceType(RAPIER, world, {
      diceType: currentDiceType,
      d6Model,
    })
    bodies.push(body)
    scene.add(body.mesh)
  }

  spawnDie()

  const onClick = () => spawnDie()
  window.addEventListener('click', onClick)

  let rafId = 0
  let disposed = false
  const animate = () => {
    if (disposed) {
      return
    }
    rafId = requestAnimationFrame(animate)
    world.step()
    ctrls.update()
    bodies.forEach((body) => body.update())

    if (onResult && bodies.length > 0) {
      const body = bodies[0]
      if (isDieSettled(body.rigid)) {
        settledFrames++
        if (settledFrames >= SETTLED_FRAME_COUNT) {
          const result = getDiceResult(body.rigid, body.diceType)
          if (result !== lastReportedResult) {
            lastReportedResult = result
            onResult(result)
          }
        }
      } else {
        settledFrames = 0
      }
    }

    renderer.render(scene, camera)
  }
  animate()

  return {
    dispose: () => {
      disposed = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('click', onClick)
      window.removeEventListener('resize', resize)
      clearBodies()
      ctrls.dispose()
      renderer.dispose()
      container.replaceChildren()
    },
    setDiceType: (diceType) => {
      if (!PHYSICS_DICE_TYPES.includes(diceType)) {
        return
      }
      currentDiceType = diceType
      spawnDie()
    },
    roll: () => spawnDie(),
  }
}
