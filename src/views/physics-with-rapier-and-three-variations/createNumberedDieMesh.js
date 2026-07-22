import * as THREE from 'three'

const FACE_COLOR = '#4ade80'
const NUMBER_COLOR = '#0f172a'
const PLANE_SIZE_RATIO = 2.15
const EDGE_RADIUS_FRACTION = 0.465
const NUMBER_RADIUS_FRACTION = 0.6
const PLANE_OFFSET_RATIO = 0.02

const _up = new THREE.Vector3(0, 1, 0)
const _forward = new THREE.Vector3(0, 0, 1)
const _worldX = new THREE.Vector3(1, 0, 0)
const _desired = new THREE.Vector3()
const _rel = new THREE.Vector3()

function keyOf(v) {
  return `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`
}

/** Per-face vertices, outward normal, centroid, and circumradius (center-to-vertex distance). */
function computeFaceData(geometry) {
  const position = geometry.attributes.position
  const faces = []

  for (let i = 0; i < position.count; i += 3) {
    const vA = new THREE.Vector3().fromBufferAttribute(position, i)
    const vB = new THREE.Vector3().fromBufferAttribute(position, i + 1)
    const vC = new THREE.Vector3().fromBufferAttribute(position, i + 2)

    const center = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3)
    const normal = new THREE.Vector3().subVectors(vC, vB).cross(new THREE.Vector3().subVectors(vA, vB)).normalize()
    // Every face is equilateral, so all three vertices are equidistant from its centroid.
    const circumR = vA.distanceTo(center)

    faces.push({ vertices: [vA, vB, vC], normal, center, circumR })
  }

  return faces
}

/**
 * Real d4 dice print the *other* 3 faces' numbers on each face, one per corner: the
 * corner at a given vertex shows the value of the face directly opposite that vertex
 * (the face that would end up on top if the die were flipped to stand that vertex up).
 * A vertex touches exactly 3 of the tetrahedron's 4 faces, so the missing (opposite)
 * face index is just the sum of all face indices minus the sum of the touching ones.
 * Returns, per face, the value to draw at each of its 3 vertices (same order as
 * face.vertices).
 */
function computeCornerValues(faces) {
  const allFaceIndexSum = faces.reduce((sum, _, i) => sum + i, 0)
  const vertexKeyToTouchingSum = new Map()
  faces.forEach((face, faceIndex) => {
    face.vertices.forEach((v) => {
      const k = keyOf(v)
      vertexKeyToTouchingSum.set(k, (vertexKeyToTouchingSum.get(k) ?? 0) + faceIndex)
    })
  })

  return faces.map((face) =>
    face.vertices.map((v) => allFaceIndexSum - vertexKeyToTouchingSum.get(keyOf(v)) + 1),
  )
}

/** Quaternion that faces a plane outward along `normal` with a consistent world-up. */
function computeFaceBasis(normal) {
  const quaternion = new THREE.Quaternion().setFromUnitVectors(_forward, normal)
  const up = _up.clone().applyQuaternion(quaternion)
  _desired.copy(_up).addScaledVector(normal, -normal.dot(_up))
  if (_desired.lengthSq() < 1e-6) {
    _desired.copy(_worldX).addScaledVector(normal, -normal.dot(_worldX))
  }
  _desired.normalize()
  const angle = Math.atan2(up.clone().cross(_desired).dot(normal), up.dot(_desired))
  quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(normal, angle))

  return {
    quaternion,
    right: new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion),
    up: new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion),
  }
}

/** Angle (from the face's local "up", sweeping toward "right") of a vertex relative to its face center. */
function localVertexAngle(vertex, center, basis) {
  _rel.subVectors(vertex, center)
  return Math.atan2(_rel.dot(basis.right), _rel.dot(basis.up))
}

/**
 * Draw a face texture with one number per corner, each rotated so it reads upright
 * when that corner is rotated to point straight up — matching printed d4 dice, where
 * only the number at the currently-up vertex is legible without turning the die.
 */
function createFaceTexture(cornerAngles) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const center = size / 2
  const edgeRadius = size * EDGE_RADIUS_FRACTION

  ctx.beginPath()
  cornerAngles.forEach(({ angle }, i) => {
    const x = center + Math.sin(angle) * edgeRadius
    const y = center - Math.cos(angle) * edgeRadius
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.closePath()
  ctx.fillStyle = FACE_COLOR
  ctx.fill()
  ctx.lineWidth = 8
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)'
  ctx.stroke()

  ctx.fillStyle = NUMBER_COLOR
  ctx.font = 'bold 60px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const numberRadius = edgeRadius * NUMBER_RADIUS_FRACTION

  cornerAngles.forEach(({ value, angle }) => {
    ctx.save()
    ctx.translate(center + Math.sin(angle) * numberRadius, center - Math.cos(angle) * numberRadius)
    ctx.rotate(angle)
    ctx.fillText(String(value), 0, 0)
    ctx.restore()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Build a d4 mesh: a plain tetrahedron body with a numbered plane overlaid on each
 * face (same technique as the d8 die) showing the other 3 faces' values at their
 * corners, like a real d4. Face index order matches getDiceResult.js (face 0 →
 * value 1, etc.) — that's the value read when this face rests face-down.
 */
export function createNumberedPolyhedronMesh(radius) {
  const geometry = new THREE.TetrahedronGeometry(radius)
  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: FACE_COLOR,
      metalness: 0.15,
      roughness: 0.4,
      flatShading: true,
    }),
  )
  body.castShadow = true

  const group = new THREE.Group()
  group.add(body)

  const faces = computeFaceData(geometry)
  const cornerValues = computeCornerValues(faces)

  faces.forEach((face, index) => {
    const basis = computeFaceBasis(face.normal)
    const cornerAngles = face.vertices.map((vertex, vertexIndex) => ({
      value: cornerValues[index][vertexIndex],
      angle: localVertexAngle(vertex, face.center, basis),
    }))

    const planeSize = face.circumR * PLANE_SIZE_RATIO
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize),
      new THREE.MeshBasicMaterial({
        map: createFaceTexture(cornerAngles),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    plane.position.copy(face.center).addScaledVector(face.normal, radius * PLANE_OFFSET_RATIO)
    plane.quaternion.copy(basis.quaternion)
    group.add(plane)
  })

  group.userData.colliderGeometry = geometry
  return group
}

export function disposeNumberedDieMesh(mesh) {
  mesh.traverse((child) => {
    if (!child.isMesh) {
      return
    }
    child.geometry?.dispose()
    child.material?.map?.dispose()
    child.material?.dispose()
  })
}
