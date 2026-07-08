import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getBody, getMouseBall } from './getBodies.js'

/**
 * Mount the Rapier + Three.js dice playground inside a Vue container.
 * Returns a cleanup function for route unmount.
 */
export async function mountPhysicsWithRapierAndThree(container) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.set(0, 3, 6)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const ctrls = new OrbitControls(camera, renderer.domElement)
  ctrls.enableDamping = true

  // Size the canvas to the Vue container instead of the full window.
  const resize = () => {
    const w = Math.max(container.clientWidth, 1)
    const h = Math.max(container.clientHeight, 1)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  resize()
  window.addEventListener('resize', resize, false)

  // Rapier must be initialized before creating a physics world.
  await RAPIER.init()
  const gravity = { x: 0.0, y: -9.81 * 2.0, z: 0.0 }
  const world = new RAPIER.World(gravity)

  // Static floor collider — invisible to rendering, but drives collisions.
  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.1, 5.0).setTranslation(0.0, -2.0, 0.0)
  world.createCollider(groundColliderDesc)

  // Visual floor mesh aligned with the physics collider.
  const floorGeo = new THREE.BoxGeometry(10, 0.1, 10, 5, 1, 5)
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.position.set(0.0, -2, 0.0)
  floor.receiveShadow = true
  scene.add(floor)

  // import.meta.url lets Vite resolve the GLB asset at build time.
  const loader = new GLTFLoader()
  const modelUrl = new URL('./die.glb', import.meta.url).href
  const diceGltf = await loader.loadAsync(modelUrl)
  const dice = diceGltf.scene

  // Spawn many dice clones; each gets its own rigid body in getBody().
  // const numBodies = 100
  const numBodies = 2
  const bodies = []
  for (let i = 0; i < numBodies; i++) {
    const body = getBody(RAPIER, world, dice)
    bodies.push(body)
    scene.add(body.mesh)
  }

  // Kinematic ball that follows the mouse and pushes dice around.
  const mouseBall = getMouseBall(RAPIER, world)
  scene.add(mouseBall.mesh)

  // Raycast from the camera through the cursor onto the floor plane.
  const mousePos = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()

  const handleRaycast = () => {
    raycaster.setFromCamera(mousePos, camera)
    const intersects = raycaster.intersectObjects([floor], true)
    if (intersects.length > 0) {
      mouseBall.update(intersects[0].point)
    }
  }

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xaa00ff, 1.0)
  scene.add(hemiLight)

  // Directional light with a wide shadow frustum to cover the play area.
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

  // Normalized device coordinates: x/y in [-1, 1] for raycasting.
  const onMouseMove = (evt) => {
    mousePos.x = (evt.clientX / window.innerWidth) * 2 - 1
    mousePos.y = -(evt.clientY / window.innerHeight) * 2 + 1
  }
  window.addEventListener('mousemove', onMouseMove, false)

  let rafId = 0
  let disposed = false
  const animate = () => {
    if (disposed) {
      return
    }
    rafId = requestAnimationFrame(animate)
    world.step()
    ctrls.update()
    handleRaycast()
    bodies.forEach((b) => b.update())
    renderer.render(scene, camera)
  }
  animate()

  return () => {
    disposed = true
    cancelAnimationFrame(rafId)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', resize)
    ctrls.dispose()
    renderer.dispose()
    container.replaceChildren()
  }
}
