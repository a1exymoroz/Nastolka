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

export { getBody }
