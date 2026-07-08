import * as THREE from 'three'
import { D8_FACES } from './createD8DieMesh.js'

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const WORLD_DOWN = new THREE.Vector3(0, -1, 0)

const _worldNormal = new THREE.Vector3()
const _edgeA = new THREE.Vector3()
const _edgeB = new THREE.Vector3()
const _vertexA = new THREE.Vector3()
const _vertexB = new THREE.Vector3()
const _vertexC = new THREE.Vector3()

/** Build outward face normals from a non-indexed BufferGeometry (3 verts per face). */
function extractFaceNormals(geometry) {
  const position = geometry.attributes.position
  const normals = []

  for (let i = 0; i < position.count; i += 3) {
    _vertexA.fromBufferAttribute(position, i)
    _vertexB.fromBufferAttribute(position, i + 1)
    _vertexC.fromBufferAttribute(position, i + 2)
    _edgeA.subVectors(_vertexC, _vertexB)
    _edgeB.subVectors(_vertexA, _vertexB)
    normals.push(new THREE.Vector3().crossVectors(_edgeA, _edgeB).normalize())
  }

  return normals
}

function mapNormalsToValues(normals) {
  return normals.map((normal, index) => ({
    normal,
    value: index + 1,
  }))
}

/**
 * Local face normals for die.glb mapped to D6 values.
 * Calibrate once if the reported value does not match the visible face.
 */
export const D6_FACES = [
  { value: 1, normal: new THREE.Vector3(0, 0, 1) },
  { value: 2, normal: new THREE.Vector3(0, 0, -1) },
  { value: 3, normal: new THREE.Vector3(-1, 0, 0) },
  { value: 4, normal: new THREE.Vector3(0, -1, 0) },
  { value: 5, normal: new THREE.Vector3(1, 0, 0) },
  { value: 6, normal: new THREE.Vector3(0, 1, 0) },
]

// Face order matches createNumberedDieMesh.js material groups (face 0 → 1, face 1 → 2, …).
export const D4_FACES = mapNormalsToValues(extractFaceNormals(new THREE.TetrahedronGeometry(1)))
// D8_FACES imported from createD8DieMesh.js (octant layout, opposite faces sum to 9).
export { D8_FACES }

export const DICE_FACE_MAPS = {
  d4: D4_FACES,
  d6: D6_FACES,
  d8: D8_FACES,
}

export const PHYSICS_DICE_TYPES = ['d4', 'd6', 'd8']

/** True when linear and angular speed are both near zero. */
export function isDieSettled(rigid, threshold = 0.05) {
  const lin = rigid.linvel()
  const ang = rigid.angvel()
  const linSpeed = Math.hypot(lin.x, lin.y, lin.z)
  const angSpeed = Math.hypot(ang.x, ang.y, ang.z)
  return linSpeed < threshold && angSpeed < threshold
}

/**
 * Pick the winning face for the given die type.
 * D4 rests on one face, so read the face pointing down; D6/D8 read the top face.
 */
export function getDiceResultFromQuaternion(quaternion, diceType = 'd6') {
  const faces = DICE_FACE_MAPS[diceType] ?? D6_FACES
  const reference = diceType === 'd4' ? WORLD_DOWN : WORLD_UP
  let bestValue = null
  let bestDot = -Infinity

  for (const face of faces) {
    _worldNormal.copy(face.normal).applyQuaternion(quaternion).normalize()
    const dot = _worldNormal.dot(reference)
    if (dot > bestDot) {
      bestDot = dot
      bestValue = face.value
    }
  }

  return bestValue
}

/** Read the winning value from a Rapier rigid body's current rotation. */
export function getDiceResult(rigid, diceType = 'd6') {
  const q = rigid.rotation()
  const quaternion = new THREE.Quaternion(q.x, q.y, q.z, q.w)
  return getDiceResultFromQuaternion(quaternion, diceType)
}
