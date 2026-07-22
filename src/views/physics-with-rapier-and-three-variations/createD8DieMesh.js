import * as THREE from 'three'

const DIE_COLOR = '#2b47c9'
const NUMBER_COLOR = '#f4f6ff'
// Sized relative to the standalone demo (r = 1.18).
const PLANE_SIZE_RATIO = 0.82 / 1.18
const PLANE_OFFSET_RATIO = 0.014 / 1.18

const _up = new THREE.Vector3(0, 1, 0)
const _forward = new THREE.Vector3(0, 0, 1)
const _desired = new THREE.Vector3()

/** White numeral texture; underline on 6 to distinguish from 9. */
function numberTexture(value) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 155px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(value), 128, 140)
  if (value === 6) {
    ctx.fillRect(78, 200, 100, 12)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Build 8 octant faces; opposite faces sum to 9 (from standalone demo). */
function buildD8FaceData() {
  const combos = []
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      for (const sz of [1, -1]) {
        combos.push([sx, sy, sz])
      }
    }
  }

  const keyOf = (c) => c.join(',')
  const idx = {}
  combos.forEach((c, i) => {
    idx[keyOf(c)] = i
  })

  const nums = new Array(8).fill(0)
  let n = 1
  combos.forEach((c, i) => {
    if (nums[i]) {
      return
    }
    nums[i] = n
    nums[idx[keyOf([-c[0], -c[1], -c[2]])]] = 9 - n
    n++
  })

  return combos.map((c, i) => ({
    value: nums[i],
    normal: new THREE.Vector3(c[0], c[1], c[2]).normalize(),
  }))
}

export const D8_FACES = buildD8FaceData()

function orientNumberPlane(plane, normal, radius) {
  // Distance from center to an octahedron face's plane (inradius) is radius/sqrt(3),
  // not radius/3 — using the unit normal here (vs. the standalone demo's un-normalized
  // combo vector) previously buried the plane inside the opaque body, hiding the number.
  const center = new THREE.Vector3(normal.x, normal.y, normal.z).multiplyScalar(radius / Math.sqrt(3))
  plane.position.copy(center).addScaledVector(normal, radius * PLANE_OFFSET_RATIO)

  const quaternion = new THREE.Quaternion().setFromUnitVectors(_forward, normal)
  const up = _up.clone().applyQuaternion(quaternion)
  _desired.copy(_up).addScaledVector(normal, -normal.dot(_up))
  if (_desired.lengthSq() < 1e-6) {
    _desired.set(1, 0, 0).addScaledVector(normal, -normal.dot(new THREE.Vector3(1, 0, 0)))
  }
  _desired.normalize()
  const angle = Math.atan2(up.clone().cross(_desired).dot(normal), up.dot(_desired))
  quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(normal, angle))
  plane.quaternion.copy(quaternion)
}

/**
 * D8 mesh from d8-dice-standalone.html: blue octahedron body + numbered face planes.
 */
export function createD8DieMesh(radius = 0.5) {
  const die = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.OctahedronGeometry(radius),
    new THREE.MeshPhysicalMaterial({
      color: DIE_COLOR,
      metalness: 0,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      flatShading: true,
    }),
  )
  body.castShadow = true
  die.add(body)

  const planeSize = radius * PLANE_SIZE_RATIO
  D8_FACES.forEach((face) => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize),
      new THREE.MeshBasicMaterial({
        map: numberTexture(face.value),
        transparent: true,
        color: NUMBER_COLOR,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    orientNumberPlane(plane, face.normal, radius)
    die.add(plane)
  })

  die.userData.colliderGeometry = body.geometry
  return die
}

export function disposeD8DieMesh(mesh) {
  mesh.traverse((child) => {
    if (!child.isMesh) {
      return
    }
    child.geometry?.dispose()
    child.material?.map?.dispose()
    child.material?.dispose()
  })
}
