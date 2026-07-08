import * as THREE from 'three'

/**
 * Minimal Three.js scene for the dice roll area.
 * Returns scene handles so we can add dice meshes in a later step.
 */
export function createDiceScene(container) {
  // Root scene that holds lights, floor, and future dice meshes.
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('red')

  // Use the container size so the canvas fits its parent immediately.
  const width = container.clientWidth
  const height = container.clientHeight

  // Slightly elevated camera angle to view the floor and die clearly.
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 4, 6)
  camera.lookAt(0, 0, 0)

  // Antialiasing helps keep edges smooth on small shapes like dice.
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  // Clamp pixel ratio to balance sharpness and performance.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Basic lighting setup: soft global fill + stronger directional key light.
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1)
  keyLight.position.set(4, 8, 4)
  scene.add(ambient, keyLight)

  // Simple floor gives depth cues before we add actual dice geometry.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.01
  scene.add(floor)

  // Step 3: place a static D6 on the table.
  const d6 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.05,
    }),
  )
  // Start above the floor so the cube can fall onto the table.
  d6.position.set(0, 3.8, 0)
  d6.rotation.set(0.35, 0.6, 0.15)
  scene.add(d6)

  let animationId = 0
  const clock = new THREE.Clock()
  const floorTopY = 0.5
  let velocityY = 0
  const gravity = -14
  const bounceFactor = 0.32

  function render() {
    // Draw the current frame.
    renderer.render(scene, camera)
  }

  function animate() {
    // Keep rendering continuously so future animations are visible.
    animationId = requestAnimationFrame(animate)

    const delta = Math.min(clock.getDelta(), 0.05)
    if (d6.position.y > floorTopY || Math.abs(velocityY) > 0.01) {
      velocityY += gravity * delta
      d6.position.y += velocityY * delta

      // Spin while falling to make the drop feel alive.
      d6.rotation.x += 2.8 * delta
      d6.rotation.z += 1.9 * delta

      // Bounce and dampen energy until the die settles on the table.
      if (d6.position.y <= floorTopY) {
        d6.position.y = floorTopY
        if (Math.abs(velocityY) < 0.8) {
          velocityY = 0
        } else {
          velocityY = -velocityY * bounceFactor
        }
      }
    }

    render()
  }

  animate()

  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  window.addEventListener('resize', resize)

  function dispose() {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', resize)
    d6.geometry.dispose()
    d6.material.dispose()
    floor.geometry.dispose()
    floor.material.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, d6, render, dispose }
}
