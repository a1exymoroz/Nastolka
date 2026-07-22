import * as THREE from 'three'
import { createD8DieMesh } from './createD8DieMesh.js'
import { createNumberedPolyhedronMesh } from './createNumberedDieMesh.js'
import { createPolyhedronDieMesh } from './createPolyhedronDieMesh.js'

/** Random orientation + spin so each die tumbles differently while falling. */
function randomTumble() {
  const euler = new THREE.Euler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  )
  const quaternion = new THREE.Quaternion().setFromEuler(euler)
  // Angular velocity in rad/s — higher values spin faster.
  const angularVelocity = {
    x: (Math.random() - 0.5) * 8,
    y: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
  }
  return { quaternion, angularVelocity }
}

/** Sync Rapier rotation and spin onto a rigid body. */
function applyTumble(rigid, tumble) {
  rigid.setRotation(tumble.quaternion, true)
  rigid.setAngvel(tumble.angularVelocity, true)
}

function createMeshForDiceType(diceType, size) {
  if (diceType === 'd8') {
    return createD8DieMesh(size)
  }
  if (diceType === 'd4') {
    return createNumberedPolyhedronMesh(size)
  }
  return createPolyhedronDieMesh(diceType, size)
}

function createColliderDesc(RAPIER, diceType, mesh, size, density) {
  if (diceType === 'd6') {
    // A box collider is cheaper and more stable than a convex hull for a cube.
    const colliderSize = size * 0.5
    return RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density)
  }

  const points = mesh.userData.colliderGeometry.attributes.position.array
  return RAPIER.ColliderDesc.convexHull(points).setDensity(density)
}

/**
 * Create a dynamic die for any of PHYSICS_DICE_TYPES (d4/d6/d8/d10/d12/d20) — each
 * built as a procedural mesh with numbered faces, no external assets.
 */
function getBodyForDiceType(RAPIER, world, { diceType = 'd6' }) {
  const size = 0.5
  const density = size
  const spawnTumble = randomTumble()
  const mesh = createMeshForDiceType(diceType, size)

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 5.5, 0)
    .setRotation(spawnTumble.quaternion)
  const rigid = world.createRigidBody(rigidBodyDesc)
  const colliderDesc = createColliderDesc(RAPIER, diceType, mesh, size, density)
  world.createCollider(colliderDesc, rigid)
  // Set spin after the collider is attached so the body wakes up tumbling.
  applyTumble(rigid, spawnTumble)

  // Match the visual mesh to the physics body's starting orientation.
  mesh.quaternion.copy(spawnTumble.quaternion)

  function update() {
    const pos = rigid.translation()
    mesh.position.copy(pos)
    const q = rigid.rotation()
    const rotation = new THREE.Quaternion(q.x, q.y, q.z, q.w)
    mesh.quaternion.copy(rotation)
  }

  return { mesh, rigid, update, diceType }
}

export { getBodyForDiceType }
