import * as THREE from 'three'

/**
 * Create a dynamic dice body: Rapier rigid body + cloned GLTF mesh.
 * Each die spawns at a random position above the floor.
 */
function getBody(RAPIER, world, model) {
  const size = 0.5
  const colliderSize = size * 0.5
  const range = 6
  const density = size * 1
  const x = Math.random() * range - range * 0.5
  const y = Math.random() * range - range * 0.5 + 3
  const z = Math.random() * range - range * 0.5

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z)
  const rigid = world.createRigidBody(rigidBodyDesc)
  const colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density)
  world.createCollider(colliderDesc, rigid)

  // Clone the shared die model so every body has its own transform.
  const mesh = model.clone()
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
    }
  })
  mesh.scale.setScalar(size)

  function update() {
    rigid.resetForces(true)
    const pos = rigid.translation()
    mesh.position.copy(pos)
    const q = rigid.rotation()
    const rote = new THREE.Quaternion(q.x, q.y, q.z, q.w)
    mesh.rotation.setFromQuaternion(rote)

    // Respawn dice that fall through the floor instead of removing them.
    if (pos.y < -10) {
      rigid.setLinvel({ x: 0.0, y: 0.0, z: 0.0 }, true)
      rigid.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, true)
      rigid.setTranslation({ x, y: 10.0, z })
    }
  }
  return { mesh, rigid, update }
}

/**
 * Kinematic sphere that tracks the mouse and collides with dice.
 * Position is set directly each frame rather than driven by forces.
 */
function getMouseBall(RAPIER, world) {
  const mouseSize = 0.5
  const geometry = new THREE.IcosahedronGeometry(mouseSize, 8)
  const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
  })
  const mouseLight = new THREE.PointLight(0xffffff, 1)
  const mouseMesh = new THREE.Mesh(geometry, material)
  mouseMesh.add(mouseLight)

  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
  const mouseRigid = world.createRigidBody(bodyDesc)
  const dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 2.0)
  world.createCollider(dynamicCollider, mouseRigid)

  function update(mousePos) {
    // Lift slightly above the floor hit point so colliders don't z-fight.
    mouseRigid.setTranslation({ x: mousePos.x, y: mousePos.y + 0.5, z: mousePos.z })
    const { x, y, z } = mouseRigid.translation()
    mouseMesh.position.set(x, y, z)
  }
  return { mesh: mouseMesh, update }
}

export { getBody, getMouseBall }
