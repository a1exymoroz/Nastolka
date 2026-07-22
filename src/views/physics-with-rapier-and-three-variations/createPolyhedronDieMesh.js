import * as THREE from 'three'

const NUMBER_COLOR = '#f4f6ff'
const PLANE_OFFSET_RATIO = 0.02

const _up = new THREE.Vector3(0, 1, 0)
const _forward = new THREE.Vector3(0, 0, 1)
const _worldX = new THREE.Vector3(1, 0, 0)
const _desired = new THREE.Vector3()

/**
 * Per-die config: how to build the raw geometry, and how face values are assigned.
 * `sum`: opposite faces add up to this (standard die convention). `base`: lowest value.
 */
const DICE_CONFIG = {
  d6: { makeGeometry: () => new THREE.BoxGeometry(1, 1, 1), sum: 7, base: 1, faceColor: '#e2e8f0' },
  d12: { makeGeometry: () => new THREE.DodecahedronGeometry(1), sum: 13, base: 1, faceColor: '#a855f7' },
  d20: { makeGeometry: () => new THREE.IcosahedronGeometry(1), sum: 21, base: 1, faceColor: '#ef4444' },
}
const D10_CONFIG = { sum: 11, base: 1, faceColor: '#f59e0b' }

/**
 * Build a d10 (bipyramid-like, apex top/bottom + two pentagon rings). Each kite face
 * is only *approximately* planar, so its two triangles don't share an exact normal —
 * unlike groupFaces (used for d6/d12/d20), this builds the 10 kite faces directly
 * from their 4 corners with one averaged "outward" normal each, instead of trying to
 * merge triangles by matching normals (which would split each kite into two facets).
 */
function makeD10() {
  const R = 0.62
  const h = 0.17
  const H = 0.63
  const upperRing = []
  const lowerRing = []
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 * Math.PI) / 180
    upperRing.push(new THREE.Vector3(R * Math.cos(a), h, R * Math.sin(a)))
  }
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 + 36) * Math.PI) / 180
    lowerRing.push(new THREE.Vector3(R * Math.cos(a), -h, R * Math.sin(a)))
  }
  const top = new THREE.Vector3(0, H, 0)
  const bottom = new THREE.Vector3(0, -H, 0)

  const kites = []
  for (let i = 0; i < 5; i++) {
    kites.push([top, upperRing[i], lowerRing[i], upperRing[(i + 1) % 5]])
  }
  for (let i = 0; i < 5; i++) {
    kites.push([bottom, lowerRing[i], upperRing[(i + 1) % 5], lowerRing[(i + 1) % 5]])
  }

  const position = []
  const faces = []
  kites.forEach((kite) => {
    const center = new THREE.Vector3().add(kite[0]).add(kite[1]).add(kite[2]).add(kite[3]).multiplyScalar(0.25)
    const outward = center.clone().normalize()
    for (const [a, b, c] of [
      [0, 1, 2],
      [0, 2, 3],
    ]) {
      let vA = kite[a]
      let vB = kite[b]
      let vC = kite[c]
      const normal = new THREE.Vector3().subVectors(vB, vA).cross(new THREE.Vector3().subVectors(vC, vA))
      if (normal.dot(outward) < 0) {
        ;[vB, vC] = [vC, vB]
      }
      position.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z, vC.x, vC.y, vC.z)
    }
    const circumR = Math.max(...kite.map((v) => v.distanceTo(center)))
    faces.push({ normal: outward, center, circumR, vertexCount: 4 })
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  return { geometry, faces }
}

/** BoxGeometry/DodecahedronGeometry/IcosahedronGeometry are indexed; the custom d10 kite geometry isn't. */
function ensureNonIndexed(geometry) {
  return geometry.index ? geometry.toNonIndexed() : geometry
}

/** Scale a geometry so its bounding sphere matches `targetRadius`, whatever its native parameterization. Returns the scale factor applied. */
function normalizeRadius(geometry, targetRadius) {
  geometry.computeBoundingSphere()
  const scale = targetRadius / geometry.boundingSphere.radius
  geometry.scale(scale, scale, scale)
  return scale
}

/**
 * Group a triangulated (non-indexed) convex geometry's triangles back into their
 * original n-gon faces by clustering triangles that share a normal, then dedupe
 * their vertices. Works for boxes (2 tris/face), pentagons (3 tris/face), etc.
 */
function groupFaces(geometry) {
  const position = geometry.attributes.position
  const vA = new THREE.Vector3()
  const vB = new THREE.Vector3()
  const vC = new THREE.Vector3()
  const byNormalKey = new Map()

  for (let i = 0; i < position.count; i += 3) {
    vA.fromBufferAttribute(position, i)
    vB.fromBufferAttribute(position, i + 1)
    vC.fromBufferAttribute(position, i + 2)
    const normal = new THREE.Vector3().subVectors(vB, vA).cross(new THREE.Vector3().subVectors(vC, vA)).normalize()
    const key = `${normal.x.toFixed(2)},${normal.y.toFixed(2)},${normal.z.toFixed(2)}`

    let entry = byNormalKey.get(key)
    if (!entry) {
      entry = { normal, vertices: new Map() }
      byNormalKey.set(key, entry)
    }
    ;[vA, vB, vC].forEach((v) => {
      const vKey = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`
      if (!entry.vertices.has(vKey)) {
        entry.vertices.set(vKey, v.clone())
      }
    })
  }

  return [...byNormalKey.values()].map(({ normal, vertices }) => {
    const verts = [...vertices.values()]
    const center = verts.reduce((sum, v) => sum.add(v), new THREE.Vector3()).multiplyScalar(1 / verts.length)
    const circumR = Math.max(...verts.map((v) => v.distanceTo(center)))
    return { normal, center, circumR, vertexCount: verts.length }
  })
}

/**
 * Assign each face a value so opposite faces (most anti-parallel normals) sum to
 * `sum`, starting from `base` — the standard convention for dice with paired faces.
 */
function assignNumbers(faces, { sum, base }) {
  const values = new Array(faces.length)
  const used = new Array(faces.length).fill(false)
  let next = base

  for (let i = 0; i < faces.length; i++) {
    if (used[i]) {
      continue
    }
    let opposite = -1
    let worstDot = Infinity
    for (let j = 0; j < faces.length; j++) {
      if (j === i || used[j]) {
        continue
      }
      const dot = faces[i].normal.dot(faces[j].normal)
      if (dot < worstDot) {
        worstDot = dot
        opposite = j
      }
    }
    used[i] = true
    values[i] = next
    if (opposite >= 0) {
      used[opposite] = true
      values[opposite] = sum - next
    }
    next++
  }

  return values
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
  return quaternion
}

/**
 * Build a die's geometry + face list, scaled to `targetRadius`. d10 bypasses
 * groupFaces (see makeD10) and instead scales its precomputed kite faces by the
 * same factor applied to the geometry, since normal is scale-invariant but
 * center/circumR aren't.
 */
function buildDie(diceType, targetRadius) {
  if (diceType === 'd10') {
    const { geometry, faces } = makeD10()
    const scale = normalizeRadius(geometry, targetRadius)
    const scaledFaces = faces.map((face) => ({
      normal: face.normal,
      center: face.center.clone().multiplyScalar(scale),
      circumR: face.circumR * scale,
      vertexCount: face.vertexCount,
    }))
    return { geometry, faces: scaledFaces, config: D10_CONFIG }
  }

  const config = DICE_CONFIG[diceType]
  const geometry = ensureNonIndexed(config.makeGeometry())
  normalizeRadius(geometry, targetRadius)
  return { geometry, faces: groupFaces(geometry), config }
}

/** White numeral texture; underline on 6/9 so they don't get misread upside down. */
function createNumberTexture(value) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  const label = String(value)
  ctx.font = `bold ${label.length > 1 ? 112 : 155}px Helvetica, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 128, label.length > 1 ? 132 : 140)
  if (value === 6 || value === 9) {
    ctx.fillRect(80, 202, 96, 12)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Compute this die type's { normal, value } faces once, for getDiceResult.js to read results from. */
function computeDieFaces(diceType) {
  const { faces, config } = buildDie(diceType, 1)
  const values = assignNumbers(faces, config)
  return faces.map((face, i) => ({ normal: face.normal, value: values[i] }))
}

export const D6_FACES = computeDieFaces('d6')
export const D10_FACES = computeDieFaces('d10')
export const D12_FACES = computeDieFaces('d12')
export const D20_FACES = computeDieFaces('d20')

export const POLYHEDRON_DICE_TYPES = ['d6', 'd10', 'd12', 'd20']

/**
 * Build a die mesh for d6/d10/d12/d20: a plain polyhedron body with a numbered plane
 * overlaid on each face (same technique as the d4/d8 dice), values assigned so
 * opposite faces sum to a constant, like real dice.
 */
export function createPolyhedronDieMesh(diceType, radius) {
  const { geometry, faces, config } = buildDie(diceType, radius)

  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: config.faceColor,
      metalness: 0,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      flatShading: true,
    }),
  )
  body.castShadow = true

  const group = new THREE.Group()
  group.add(body)

  const values = assignNumbers(faces, config)

  faces.forEach((face, index) => {
    const inradius = face.circumR * Math.cos(Math.PI / face.vertexCount)
    const planeSize = inradius * 1.32
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize),
      new THREE.MeshBasicMaterial({
        map: createNumberTexture(values[index]),
        transparent: true,
        color: NUMBER_COLOR,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    plane.position.copy(face.center).addScaledVector(face.normal, radius * PLANE_OFFSET_RATIO)
    plane.quaternion.copy(computeFaceBasis(face.normal))
    group.add(plane)
  })

  group.userData.colliderGeometry = geometry
  return group
}

export function disposePolyhedronDieMesh(mesh) {
  mesh.traverse((child) => {
    if (!child.isMesh) {
      return
    }
    child.geometry?.dispose()
    child.material?.map?.dispose()
    child.material?.dispose()
  })
}
