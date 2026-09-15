import * as THREE from 'three'

/**
 * Game-themed avatar registry. Each theme draws a small icon + background
 * for a canvas-texture avatar sprite; unrecognized game names fall back to
 * `default`, a generic board-game/meeple theme.
 *
 * Keyed by lowercased, trimmed game name — extend this map to add more
 * per-game themes later.
 */
export const AVATAR_THEMES = {
  everdell: {
    bg: ['#0f3d2e', '#1f6b4a'],
    accent: '#e8c468',
    drawIcon(ctx, size) {
      // A simple woodland leaf, evoking Everdell's forest-critter theme.
      const cx = size / 2
      const cy = size * 0.32
      const r = size * 0.16
      ctx.fillStyle = '#5fae6f'
      ctx.beginPath()
      ctx.ellipse(cx, cy, r, r * 1.5, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#2f6b3f'
      ctx.lineWidth = size * 0.015
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.6, cy - r * 0.9)
      ctx.lineTo(cx + r * 0.6, cy + r * 0.9)
      ctx.stroke()
    },
  },
  default: {
    bg: ['#26324a', '#3c4f74'],
    accent: '#f2c14e',
    drawIcon(ctx, size) {
      // A generic meeple silhouette.
      const cx = size / 2
      const headY = size * 0.24
      const headR = size * 0.1
      ctx.fillStyle = '#f2c14e'
      ctx.beginPath()
      ctx.arc(cx, headY, headR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - size * 0.16, size * 0.52)
      ctx.quadraticCurveTo(cx, size * 0.3, cx + size * 0.16, size * 0.52)
      ctx.lineTo(cx + size * 0.22, size * 0.5)
      ctx.lineTo(cx + size * 0.1, size * 0.5)
      ctx.lineTo(cx + size * 0.08, size * 0.5)
      ctx.closePath()
      ctx.fill()
    },
  },
}

export function getAvatarTheme(gameName) {
  const key = (gameName ?? '').trim().toLowerCase()
  return AVATAR_THEMES[key] ?? AVATAR_THEMES.default
}

function getInitials(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

const AVATAR_CANVAS_SIZE = 256

/**
 * @param {string} name - player display name, used for initials
 * @param {string} gameName - the session's game name, selects the theme
 * @returns {THREE.Sprite}
 */
export function createAvatarSprite(name, gameName) {
  const theme = getAvatarTheme(gameName)
  const size = AVATAR_CANVAS_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.48

  const gradient = ctx.createLinearGradient(0, 0, 0, size)
  gradient.addColorStop(0, theme.bg[0])
  gradient.addColorStop(1, theme.bg[1])
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = theme.accent
  ctx.lineWidth = size * 0.03
  ctx.stroke()

  theme.drawIcon(ctx, size)

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${size * 0.26}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(getInitials(name), cx, size * 0.68)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  return sprite
}

export function disposeAvatarSprite(sprite) {
  if (!sprite) return
  sprite.material.map?.dispose()
  sprite.material.dispose()
}
