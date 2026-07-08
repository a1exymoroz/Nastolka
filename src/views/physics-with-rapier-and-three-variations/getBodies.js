import * as THREE from 'three'
import { createD8DieMesh } from './createD8DieMesh.js'
import { createNumberedPolyhedronMesh } from './createNumberedDieMesh.js'

const PROCEDURAL_DICE_TYPES = new Set(['d4', 'd8'])

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

function createMeshForDiceType(diceType, d6Model, size) {
  if (diceType === 'd6') {
    // die.glb already includes numbered faces.
    const mesh = d6Model.clone()
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
      }
    })
    mesh.scale.setScalar(size)
    return mesh
  }

  if (diceType === 'd8') {
    return createD8DieMesh(size)
  }

  return createNumberedPolyhedronMesh(size)
}

function getColliderGeometry(mesh, diceType) {
  if (diceType === 'd8') {
    return mesh.userData.colliderGeometry
  }
  return mesh.geometry
}

function createColliderDesc(RAPIER, diceType, mesh, size, density) {
  if (diceType === 'd6') {
    const colliderSize = size * 0.5
    return RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density)
  }

  const geometry = getColliderGeometry(mesh, diceType)
  const points = geometry.attributes.position.array
  return RAPIER.ColliderDesc.convexHull(points).setDensity(density)
}

/**
 * Create a dynamic die for d4, d6 (GLB), or d8.
 * d4 uses a numbered tetrahedron; d8 reuses the standalone demo mesh; d6 uses die.glb.
 */
function getBodyForDiceType(RAPIER, world, { diceType = 'd6', d6Model }) {
  const size = 0.5
  const density = size
  const spawnTumble = randomTumble()
  const mesh = createMeshForDiceType(diceType, d6Model, size)

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 3.8, 0)
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

export { getBodyForDiceType, PROCEDURAL_DICE_TYPES }
