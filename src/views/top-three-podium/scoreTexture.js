import * as THREE from 'three'

const CANVAS_WIDTH = 512
const CANVAS_HEIGHT = 160
const SQUARE_CANVAS_SIZE = 200
const BASE_SPRITE_SCALE = 1.8

/**
 * A canvas-texture text sprite that can be redrawn in place via
 * `sprite.userData.setText(text)` — used for player names, the counting
 * score, and the medal position indicator — so per-frame updates during the
 * score count-up never touch the real DOM.
 *
 * The sprite's aspect ratio is baked into its base scale; animate its size
 * via `sprite.userData.setScale(factor)` rather than `sprite.scale.setScalar`
 * directly, so scaling never distorts the text/glyph.
 *
 * @param {string} initialText
 * @param {{ fontSize?: number, color?: string, fontWeight?: number, square?: boolean }} [opts]
 * @returns {THREE.Sprite}
 */
export function createTextSprite(initialText, opts = {}) {
  const { fontSize = 56, color = '#ffffff', fontWeight = 700, square = false } = opts

  const width = square ? SQUARE_CANVAS_SIZE : CANVAS_WIDTH
  const height = square ? SQUARE_CANVAS_SIZE : CANVAS_HEIGHT

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)

  const baseScaleX = BASE_SPRITE_SCALE
  const baseScaleY = BASE_SPRITE_SCALE * (height / width)
  sprite.scale.set(baseScaleX, baseScaleY, 1)

  function draw(text) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = color
    ctx.font = `${fontWeight} ${fontSize}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)
    texture.needsUpdate = true
  }

  sprite.userData.setText = draw
  sprite.userData.setScale = (factor) => sprite.scale.set(baseScaleX * factor, baseScaleY * factor, 1)
  draw(initialText)

  return sprite
}

export function disposeTextSprite(sprite) {
  if (!sprite) return
  sprite.material.map?.dispose()
  sprite.material.dispose()
}
