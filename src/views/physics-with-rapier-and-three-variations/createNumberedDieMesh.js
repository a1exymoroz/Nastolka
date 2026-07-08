import * as THREE from 'three'

const FACE_COLOR = '#4ade80'

/** Canvas texture with a single face value — one material per polyhedron face. */
export function createNumberTexture(value, backgroundColor = FACE_COLOR) {
  const canvas = document.createElement('canvas')
  const size = 256
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)'
  ctx.lineWidth = 8
  ctx.strokeRect(6, 6, size - 12, size - 12)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 140px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(value), size / 2, size / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Override spherical UVs so each face samples the full numbered texture. */
function assignPlanarFaceUVs(geometry, faceCount) {
  const uv = geometry.attributes.uv
  for (let face = 0; face < faceCount; face++) {
    const base = face * 3
    uv.setXY(base + 0, 0, 0)
    uv.setXY(base + 1, 1, 0)
    uv.setXY(base + 2, 0.5, 1)
  }
  uv.needsUpdate = true
}

/**
 * Build a d4 mesh with numbered faces.
 * Face index order matches getDiceResult.js (face 0 → value 1, etc.).
 */
export function createNumberedPolyhedronMesh(radius) {
  const faceCount = 4
  const geometry = new THREE.TetrahedronGeometry(radius)
  const materials = []

  for (let face = 0; face < faceCount; face++) {
    geometry.addGroup(face * 3, 3, face)
    materials.push(
      new THREE.MeshPhysicalMaterial({
        map: createNumberTexture(face + 1),
        metalness: 0.15,
        roughness: 0.4,
      }),
    )
  }

  assignPlanarFaceUVs(geometry, faceCount)

  const mesh = new THREE.Mesh(geometry, materials)
  mesh.castShadow = true
  return mesh
}

export function disposeNumberedDieMesh(mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  materials.forEach((material) => {
    material.map?.dispose()
    material.dispose()
  })
  mesh.geometry.dispose()
}
