<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { TOKEN_SETS, assignTokens } from '../utils/tokenSets'

const props = defineProps({
  // Each item: { place, name, score }, plus an optional `pieceId` — the id
  // of the token set entry (see src/utils/tokenSets.js) that player
  // actually used in the game, e.g. 'red' for the everdell set. Only
  // consulted by avatarStyle 'everdell'; without it the player gets a
  // token assigned deterministically (see assignTokens), still unique
  // among the three.
  topThree: {
    type: Array,
    required: true,
  },
  gameName: {
    type: String,
    default: '',
  },
  // 'initials' (colored circle + initials), 'dice' (a die face, themed to
  // player; the generic default for games without their own token art),
  // 'preset' (a small set of classic board-game token icons), or 'everdell'
  // (that game's own critter tokens, each with its own fixed color).
  avatarStyle: {
    type: String,
    default: 'initials',
    validator: (value) => ['initials', 'dice', 'preset', 'everdell'].includes(value),
  },
})

const { t } = useI18n()

// Left-to-right stage order (2nd, 1st, 3rd); height sets how tall each step
// reads against the others.
const PLACE_STYLE = {
  1: { order: 2, height: 108 },
  2: { order: 1, height: 74 },
  3: { order: 3, height: 56 },
}

const AVATAR_THEMES = {
  everdell: { bg: '#2f8f5b', icon: '🍃' },
  default: { bg: '#7a3ea1', icon: '👑' },
}

// Classic board-game token icons, for the 'preset' avatar style.
const PRESET_AVATAR_ICONS = ['🎩', '🚗', '🐕', '⭐', '🚀', '🎨']

const DICE_PIP_POSITIONS = {
  TL: [6, 6],
  TR: [18, 6],
  ML: [6, 12],
  MR: [18, 12],
  C: [12, 12],
  BL: [6, 18],
  BR: [18, 18],
}
const DICE_FACES = {
  1: ['C'],
  2: ['TL', 'BR'],
  3: ['TL', 'C', 'BR'],
  4: ['TL', 'TR', 'BL', 'BR'],
  5: ['TL', 'TR', 'C', 'BL', 'BR'],
  6: ['TL', 'TR', 'ML', 'MR', 'BL', 'BR'],
}

function hashName(name) {
  let hash = 0
  for (const char of name ?? '') hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

function presetAvatarIcon(name) {
  return PRESET_AVATAR_ICONS[hashName(name) % PRESET_AVATAR_ICONS.length]
}

// Everdell critters, for the 'everdell' avatar style. The token set itself
// (shape/color per animal) lives in src/utils/tokenSets.js, shared with
// whatever else needs it; source art is in src/assets/animals/.
const everdellTokenByPlacement = computed(() => assignTokens(TOKEN_SETS.everdell, places.value))

function everdellAnimal(placement) {
  return everdellTokenByPlacement.value.get(placement) ?? TOKEN_SETS.everdell[0]
}

// Bronze shows the fewest pips, gold the most, so the dice read as
// "smaller to bigger" going from 3rd to 1st place.
const PLACE_DICE_FACE = { 1: 6, 2: 4, 3: 2 }

function dicePips(place) {
  const face = PLACE_DICE_FACE[place] ?? 1
  return DICE_FACES[face].map((key) => DICE_PIP_POSITIONS[key])
}

// Gold/silver/bronze dice for the 'dice' avatar style, with a diagonal
// highlight-to-shadow gradient plus inset/drop shadows for a beveled,
// more three-dimensional cube look.
const DICE_PLACE_THEME = {
  1: {
    background: 'linear-gradient(135deg, #fff6d0 0%, #ffe066 28%, #e0b73d 55%, #b8860b 100%)',
    border: '#f7dd8a',
    pip: '#6b4a00',
    boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.85), inset 0 -4px 6px rgba(120,84,0,0.35), 0 6px 10px rgba(120,84,0,0.4)',
  },
  2: {
    background: 'linear-gradient(135deg, #ffffff 0%, #e7e7ea 28%, #c3c6cc 55%, #8d9198 100%)',
    border: '#eceef0',
    pip: '#4b4e53',
    boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.85), inset 0 -4px 6px rgba(70,73,78,0.3), 0 6px 10px rgba(70,73,78,0.35)',
  },
  3: {
    background: 'linear-gradient(135deg, #ffd9ab 0%, #e0955a 28%, #b3652f 55%, #7a3c15 100%)',
    border: '#eeae74',
    pip: '#4a230d',
    boxShadow: 'inset 0 2px 3px rgba(255,220,190,0.7), inset 0 -4px 6px rgba(90,45,15,0.35), 0 6px 10px rgba(90,45,15,0.4)',
  },
}

function diceAvatarStyle(place) {
  const dice = DICE_PLACE_THEME[place] ?? DICE_PLACE_THEME[3]
  return { background: dice.background, borderColor: dice.border, boxShadow: dice.boxShadow }
}

function dicePipColor(place) {
  return (DICE_PLACE_THEME[place] ?? DICE_PLACE_THEME[3]).pip
}

const CONFETTI_COLORS = ['#ffd54a', '#ff6b6b', '#f3e2b3', '#c9a227', '#b73b4f', '#ffffff']
const CONFETTI_PIECE_COUNT = 90
const BALLOONS = [
  { left: '4%', top: '10%', color: '#d4af37', delay: 0 },
  { left: '90%', top: '6%', color: '#b73b4f', delay: 0.6 },
  { left: '14%', top: '32%', color: '#3f5fa0', delay: 1.1 },
  { left: '78%', top: '20%', color: '#2f8f5b', delay: 0.3 },
  { left: '96%', top: '34%', color: '#c9a227', delay: 1.6 },
  { left: '2%', top: '42%', color: '#ff6b6b', delay: 0.9 },
  { left: '50%', top: '4%', color: '#f3e2b3', delay: 0.4 },
  { left: '36%', top: '14%', color: '#b73b4f', delay: 1.3 },
  { left: '64%', top: '38%', color: '#3f5fa0', delay: 0.7 },
  { left: '84%', top: '48%', color: '#d4af37', delay: 1.8 },
]

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const theme = computed(() => AVATAR_THEMES[(props.gameName ?? '').trim().toLowerCase()] ?? AVATAR_THEMES.default)

const places = computed(() =>
  [...props.topThree]
    .filter((placement) => PLACE_STYLE[placement.place])
    .sort((a, b) => a.place - b.place)
    .map((placement) => ({ ...placement, style: PLACE_STYLE[placement.place] })),
)

function initials(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

const displayScores = reactive({})

const confettiHost = ref(null)
const podiumEls = {}
const avatarEls = {}
const nameEls = {}
const scoreEls = {}
const wreathEls = {}
const activeConfettiPieces = new Set()
const activeBubbles = new Set()

function setPodiumEl(place, el) {
  if (el) podiumEls[place] = el
}
function setAvatarEl(place, el) {
  if (el) avatarEls[place] = el
}
function setNameEl(place, el) {
  if (el) nameEls[place] = el
}
function setScoreEl(place, el) {
  if (el) scoreEls[place] = el
}
function setWreathEl(place, el) {
  if (el) wreathEls[place] = el
}

let timeline = null

function clearTracked(set) {
  for (const el of set) {
    gsap.killTweensOf(el)
    el.remove()
  }
  set.clear()
}

function spawnConfetti() {
  if (!confettiHost.value) return
  const hostRect = confettiHost.value.getBoundingClientRect()
  const width = hostRect.width
  const height = hostRect.height

  for (let i = 0; i < CONFETTI_PIECE_COUNT; i++) {
    // Two cannons, bottom-left and bottom-right, firing on alternate pieces.
    const fromLeft = i % 2 === 0
    const originX = fromLeft ? 0 : width
    const originY = height

    const isStreamer = i % 5 === 0
    const piece = document.createElement('div')
    piece.className = isStreamer ? 'absolute h-5 w-1.5 rounded-full' : 'absolute h-3 w-2 rounded-sm'
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    piece.style.left = `${originX}px`
    piece.style.top = `${originY}px`
    confettiHost.value.appendChild(piece)
    activeConfettiPieces.add(piece)

    // Arc up and outward, well past the stage's edges, so pieces fly off
    // screen (top/sides) rather than landing and staying put.
    const finalX = fromLeft
      ? width * (0.4 + Math.random() * 1.3)
      : width * (-0.4 - Math.random() * 1.3)
    const finalY = -height * (0.2 + Math.random() * 0.9)

    // Stagger the launches across ~3s and fly there slowly, rather than
    // bursting out all at once. Fade out near the end of the flight so
    // pieces vanish instead of popping off once off-screen.
    const duration = 1.8 + Math.random() * 1.2
    gsap.to(piece, {
      x: finalX - originX,
      y: finalY - originY,
      rotation: (Math.random() - 0.5) * 380,
      duration,
      delay: (i / CONFETTI_PIECE_COUNT) * 2.6 + Math.random() * 0.3,
      ease: 'power1.in',
      onComplete: () => {
        piece.remove()
        activeConfettiPieces.delete(piece)
      },
    })
    gsap.to(piece, {
      opacity: 0,
      duration: duration * 0.35,
      delay: (i / CONFETTI_PIECE_COUNT) * 2.6 + Math.random() * 0.3 + duration * 0.65,
      ease: 'power1.in',
    })
  }
}

function spawnChampagneBubbles(originEl) {
  if (!confettiHost.value || !originEl) return
  const hostRect = confettiHost.value.getBoundingClientRect()
  const originRect = originEl.getBoundingClientRect()
  const originX = originRect.left + originRect.width / 2 - hostRect.left
  const originY = originRect.top - hostRect.top

  for (let i = 0; i < 10; i++) {
    const bubble = document.createElement('div')
    bubble.className = 'absolute rounded-full border border-white/70 bg-white/40'
    const size = 3 + Math.random() * 4
    bubble.style.width = `${size}px`
    bubble.style.height = `${size}px`
    bubble.style.left = `${originX + (Math.random() - 0.5) * 20}px`
    bubble.style.top = `${originY}px`
    confettiHost.value.appendChild(bubble)
    activeBubbles.add(bubble)

    gsap.to(bubble, {
      x: (Math.random() - 0.5) * 26,
      y: -32 - Math.random() * 22,
      opacity: 0,
      duration: 0.9 + Math.random() * 0.5,
      delay: i * 0.06,
      ease: 'power1.out',
      onComplete: () => {
        bubble.remove()
        activeBubbles.delete(bubble)
      },
    })
  }
}

function resetVisualState() {
  for (const placement of places.value) {
    const { place } = placement
    displayScores[place] = 0
    if (podiumEls[place]) gsap.set(podiumEls[place], { y: 140, opacity: 0, scaleX: 1, scaleY: 1 })
    if (avatarEls[place]) gsap.set(avatarEls[place], { scale: 0, opacity: 0, y: 0 })
    if (nameEls[place]) gsap.set(nameEls[place], { y: 10, opacity: 0 })
    if (scoreEls[place]) gsap.set(scoreEls[place], { opacity: 0 })
    if (wreathEls[place]) gsap.set(wreathEls[place], { scale: 0, opacity: 0 })
  }
}

function applyFinalPose() {
  for (const placement of places.value) {
    const { place } = placement
    displayScores[place] = placement.score
    if (podiumEls[place]) gsap.set(podiumEls[place], { y: 0, opacity: 1, scaleX: 1, scaleY: 1 })
    if (avatarEls[place]) gsap.set(avatarEls[place], { scale: 1, opacity: 1, y: 0 })
    if (nameEls[place]) gsap.set(nameEls[place], { y: 0, opacity: 1 })
    if (scoreEls[place]) gsap.set(scoreEls[place], { opacity: 1 })
    if (wreathEls[place]) gsap.set(wreathEls[place], { scale: 1, opacity: 1 })
  }
}

function buildTimeline() {
  timeline?.kill()
  clearTracked(activeConfettiPieces)
  clearTracked(activeBubbles)
  resetVisualState()

  if (reducedMotion) {
    applyFinalPose()
    return
  }

  const tl = gsap.timeline()
  const order = [3, 2, 1].filter((place) => places.value.some((p) => p.place === place))

  order.forEach((place, index) => {
    const placement = places.value.find((p) => p.place === place)
    const podium = podiumEls[place]
    const avatar = avatarEls[place]
    const name = nameEls[place]
    const score = scoreEls[place]
    const wreath = wreathEls[place]
    if (!placement || !podium) return

    const startAt = index * 0.32

    // A cartoon squash-and-stretch landing: rise past the target, squash
    // flat on impact, pop back to rest — one keyframed tween rather than a
    // plain elastic ease, for a more "multik" bounce than the 3D version's.
    tl.to(
      podium,
      {
        keyframes: {
          '0%': { y: 140, opacity: 0, scaleY: 1, scaleX: 1 },
          '55%': { y: -16, opacity: 1, scaleY: 1.18, scaleX: 0.88 },
          '75%': { y: 4, scaleY: 0.85, scaleX: 1.12 },
          '100%': { y: 0, scaleY: 1, scaleX: 1 },
        },
        duration: 0.65,
        ease: 'power2.out',
      },
      startAt,
    )

    if (wreath) {
      tl.to(wreath, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.6)' }, startAt + 0.3)
    }
    if (avatar) {
      tl.to(avatar, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.4)' }, startAt + 0.35)
    }
    if (name) {
      tl.to(name, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, startAt + 0.5)
    }

    const scoreObj = { value: 0 }
    tl.to(
      scoreObj,
      {
        value: placement.score,
        duration: 0.5,
        ease: 'power1.out',
        onStart: () => {
          if (score) gsap.to(score, { opacity: 1, duration: 0.2 })
        },
        onUpdate: () => {
          displayScores[place] = Math.round(scoreObj.value)
        },
        onComplete: () => {
          if (place !== 1) return
          if (podium) gsap.to(podium, { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' })
          if (avatar) gsap.to(avatar, { y: -14, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out' })
          spawnConfetti()
          spawnChampagneBubbles(avatar ?? podium)
        },
      },
      startAt + 0.65,
    )
  })

  timeline = tl
}

onMounted(() => {
  buildTimeline()
})

onUnmounted(() => {
  timeline?.kill()
  clearTracked(activeConfettiPieces)
  clearTracked(activeBubbles)
})

function replay() {
  buildTimeline()
}
</script>

<template>
  <div class="mb-4">
    <div
      class="relative aspect-[4/3] w-full overflow-hidden rounded-xl border-4 border-amber-300/50 shadow-[0_0_36px_rgba(212,175,55,0.25)] sm:aspect-video"
      role="img"
      :aria-label="t('historyDetail.podium2d.ariaLabel', { gameName })"
    >
      <!-- Backdrop: a warm, lamp-lit game table, with shelves of board-game
           boxes framing each side and a scattered dice/meeple/card motif —
           board-game themed rather than a generic royal/fantasy scene. -->
      <svg class="absolute inset-0 h-full w-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="podium2dSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2e1f14" />
            <stop offset="45%" stop-color="#6b4226" />
            <stop offset="75%" stop-color="#c9863f" />
            <stop offset="100%" stop-color="#f5deb0" />
          </linearGradient>
          <linearGradient id="podium2dCurtain" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#5c0f1e" />
            <stop offset="100%" stop-color="#8a1f34" />
          </linearGradient>
          <filter id="podium2dBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <g id="podium2dDie1">
            <rect x="-9" y="-9" width="18" height="18" rx="3" />
            <circle cx="0" cy="0" r="1.6" fill="#2e1f14" />
          </g>
          <g id="podium2dDie2">
            <rect x="-9" y="-9" width="18" height="18" rx="3" />
            <circle cx="-4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="4" r="1.6" fill="#2e1f14" />
          </g>
          <g id="podium2dDie3">
            <rect x="-9" y="-9" width="18" height="18" rx="3" />
            <circle cx="-4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="0" cy="0" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="4" r="1.6" fill="#2e1f14" />
          </g>
          <g id="podium2dDie4">
            <rect x="-9" y="-9" width="18" height="18" rx="3" />
            <circle cx="-4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="-4" cy="4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="4" r="1.6" fill="#2e1f14" />
          </g>
          <g id="podium2dDie5">
            <rect x="-9" y="-9" width="18" height="18" rx="3" />
            <circle cx="-4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="0" cy="0" r="1.6" fill="#2e1f14" />
            <circle cx="-4" cy="4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="4" r="1.6" fill="#2e1f14" />
          </g>
          <g id="podium2dDie6">
            <rect x="-9" y="-9" width="18" height="18" rx="3" />
            <circle cx="-4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="-4" r="1.6" fill="#2e1f14" />
            <circle cx="-4" cy="0" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="0" r="1.6" fill="#2e1f14" />
            <circle cx="-4" cy="4" r="1.6" fill="#2e1f14" />
            <circle cx="4" cy="4" r="1.6" fill="#2e1f14" />
          </g>
          <g id="podium2dMeeple">
            <circle cx="0" cy="-8" r="4.5" />
            <path d="M-7 10 C-7 -2 7 -2 7 10 Z" />
          </g>
        </defs>

        <rect x="0" y="0" width="800" height="450" fill="url(#podium2dSky)" />

        <!-- soft bokeh glow, for warm ambient table-lamp depth -->
        <g filter="url(#podium2dBlur)" opacity="0.4">
          <circle cx="180" cy="90" r="36" fill="#ffd54a" />
          <circle cx="640" cy="75" r="46" fill="#ffb066" />
          <circle cx="400" cy="55" r="30" fill="#ffe9c7" />
        </g>

        <g class="podium2d-twinkle" fill="#fff6da">
          <circle cx="120" cy="60" r="2.2" />
          <circle cx="620" cy="45" r="1.8" />
          <circle cx="700" cy="110" r="2" />
          <circle cx="260" cy="40" r="1.6" />
          <circle cx="440" cy="30" r="1.8" />
          <circle cx="90" cy="130" r="1.6" />
          <circle cx="330" cy="90" r="1.4" />
          <circle cx="560" cy="35" r="1.6" />
          <circle cx="740" cy="160" r="1.8" />
        </g>

        <!-- a scatter of dice and meeples across the backdrop — the
             board-game motif, kept as clearly-readable small icons rather
             than ambiguous large shapes. Dice cover every pip count 1-6 so
             they read as individual dice rather than repeated stamps. -->
        <g fill="#fff6da" opacity="0.32">
          <use href="#podium2dDie2" x="230" y="80" transform="rotate(-12 230 80) scale(1.3)" />
          <use href="#podium2dMeeple" x="520" y="95" transform="rotate(8 520 95) scale(1.3)" />
          <use href="#podium2dDie4" x="470" y="150" transform="rotate(20 470 150) scale(1.15)" />
          <use href="#podium2dDie6" x="600" y="175" transform="rotate(14 600 175) scale(1.2)" />
          <use href="#podium2dMeeple" x="270" y="165" transform="rotate(-6 270 165) scale(1.15)" />
          <use href="#podium2dDie3" x="400" y="115" transform="rotate(6 400 115) scale(1.1)" />
          <use href="#podium2dDie1" x="60" y="55" transform="rotate(10 60 55) scale(1.1)" />
          <use href="#podium2dDie5" x="650" y="60" transform="rotate(15 650 60) scale(1.2)" />
          <use href="#podium2dDie6" x="750" y="140" transform="rotate(-8 750 140) scale(1.1)" />
          <use href="#podium2dDie2" x="150" y="190" transform="rotate(-10 150 190) scale(1.05)" />
          <use href="#podium2dDie4" x="550" y="195" transform="rotate(5 550 195) scale(1.15)" />
          <use href="#podium2dMeeple" x="90" y="140" transform="rotate(10 90 140) scale(1.1)" />
          <use href="#podium2dMeeple" x="710" y="75" transform="rotate(-12 710 75) scale(1.05)" />
          <use href="#podium2dDie1" x="460" y="185" transform="rotate(10 460 185) scale(1.1)" />
          <use href="#podium2dDie5" x="220" y="115" transform="rotate(20 220 115) scale(1.05)" />
          <use href="#podium2dDie3" x="340" y="55" transform="rotate(-18 340 55) scale(1.1)" />
        </g>

        <!-- curtains -->
        <path d="M0,0 L150,0 Q110,140 96,260 Q88,360 46,450 L0,450 Z" fill="url(#podium2dCurtain)" />
        <path d="M150,0 Q112,150 100,260 Q92,360 60,450" fill="none" stroke="#3d0a15" stroke-width="6" opacity="0.5" />
        <path d="M800,0 L650,0 Q690,140 704,260 Q712,360 754,450 L800,450 Z" fill="url(#podium2dCurtain)" />
        <path d="M650,0 Q688,150 700,260 Q708,360 740,450" fill="none" stroke="#3d0a15" stroke-width="6" opacity="0.5" />
      </svg>

      <div
        v-for="(balloon, index) in BALLOONS"
        :key="index"
        class="podium2d-balloon absolute h-8 w-7 rounded-[50%] opacity-90 sm:h-11 sm:w-9"
        :style="{ left: balloon.left, top: balloon.top, background: balloon.color, animationDelay: `${balloon.delay}s` }"
      />

      <div class="absolute inset-x-0 bottom-0 flex h-full items-end justify-center gap-3 px-4 pb-0 sm:gap-6">
        <div v-for="placement in places" :key="placement.place" class="flex flex-col items-center" :style="{ order: placement.style.order }">
          <div class="mb-1 flex flex-col items-center">
            <div
              :ref="(el) => setAvatarEl(placement.place, el)"
              class="flex h-12 w-12 items-center justify-center text-base font-bold text-white sm:h-16 sm:w-16 sm:text-lg"
              :class="avatarStyle === 'dice' ? 'rounded-xl border-4' : avatarStyle === 'everdell' ? '' : 'rounded-full border-4 border-amber-200 shadow-lg'"
              :style="avatarStyle === 'dice' ? diceAvatarStyle(placement.place) : avatarStyle === 'everdell' ? {} : { background: theme.bg }"
            >
              <span v-if="avatarStyle === 'initials'">{{ initials(placement.name) }}</span>
              <span v-else-if="avatarStyle === 'preset'" class="text-xl sm:text-2xl">{{ presetAvatarIcon(placement.name) }}</span>
              <svg v-else-if="avatarStyle === 'dice'" viewBox="0 0 24 24" class="h-7 w-7 sm:h-10 sm:w-10">
                <circle
                  v-for="(pip, pipIndex) in dicePips(placement.place)"
                  :key="pipIndex"
                  :cx="pip[0]"
                  :cy="pip[1]"
                  r="2.1"
                  :fill="dicePipColor(placement.place)"
                />
              </svg>
              <svg
                v-else
                :viewBox="everdellAnimal(placement).viewBox"
                class="h-10 w-8 drop-shadow-lg sm:h-14 sm:w-11"
                :fill="everdellAnimal(placement).color"
              >
                <path :d="everdellAnimal(placement).path" />
              </svg>
            </div>
            <div :ref="(el) => setNameEl(placement.place, el)" class="mt-1 max-w-[70px] truncate text-[11px] font-semibold text-amber-50 drop-shadow sm:max-w-none sm:text-sm">
              {{ placement.name }}
            </div>
            <div
              :ref="(el) => setScoreEl(placement.place, el)"
              class="font-extrabold drop-shadow"
              :class="placement.place === 1 ? 'text-lg text-amber-300 sm:text-2xl' : 'text-sm text-amber-100 sm:text-lg'"
            >
              {{ displayScores[placement.place] ?? 0 }}
            </div>
          </div>

          <div
            :ref="(el) => setPodiumEl(placement.place, el)"
            class="relative w-14 rounded-t-md sm:w-24"
            :style="{
              height: placement.style.height + 'px',
              background: 'linear-gradient(180deg, #fffaf0 0%, #f1e6cf 55%, #ddc78f 100%)',
              boxShadow: 'inset 0 6px 0 #d4af37, 0 6px 14px rgba(0,0,0,0.35)',
              transformOrigin: 'bottom center',
            }"
          >
            <svg :ref="(el) => setWreathEl(placement.place, el)" viewBox="0 0 60 60" class="absolute left-1/2 top-2 h-8 w-8 -translate-x-1/2 sm:h-11 sm:w-11">
              <g fill="none" stroke="#c9a227" stroke-width="2.2" stroke-linecap="round">
                <path d="M30 52 C 18 50, 8 42, 6 28" />
                <path d="M30 52 C 42 50, 52 42, 54 28" />
              </g>
              <g fill="#c9a227">
                <ellipse cx="8" cy="44" rx="3.2" ry="1.5" transform="rotate(-30 8 44)" />
                <ellipse cx="6" cy="38" rx="3.2" ry="1.5" transform="rotate(-55 6 38)" />
                <ellipse cx="6" cy="31" rx="3" ry="1.4" transform="rotate(-80 6 31)" />
                <ellipse cx="52" cy="44" rx="3.2" ry="1.5" transform="rotate(30 52 44)" />
                <ellipse cx="54" cy="38" rx="3.2" ry="1.5" transform="rotate(55 54 38)" />
                <ellipse cx="54" cy="31" rx="3" ry="1.4" transform="rotate(80 54 31)" />
              </g>
              <text x="30" y="33" text-anchor="middle" dominant-baseline="middle" font-size="22" font-weight="800" fill="#8a6a16">
                {{ placement.place }}
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div ref="confettiHost" class="pointer-events-none absolute inset-0 overflow-hidden" />
    </div>

    <button
      v-if="!reducedMotion"
      type="button"
      class="mt-2 text-xs font-medium text-slate-400 underline transition hover:text-slate-200"
      @click="replay"
    >
      {{ t('historyDetail.podium.replayButton') }}
    </button>
  </div>
</template>

<style scoped>
.podium2d-twinkle circle {
  animation: podium2d-twinkle 2.4s ease-in-out infinite;
}
.podium2d-twinkle circle:nth-child(2) {
  animation-delay: 0.3s;
}
.podium2d-twinkle circle:nth-child(3) {
  animation-delay: 0.6s;
}
.podium2d-twinkle circle:nth-child(4) {
  animation-delay: 0.9s;
}
.podium2d-twinkle circle:nth-child(5) {
  animation-delay: 1.2s;
}
.podium2d-twinkle circle:nth-child(6) {
  animation-delay: 1.5s;
}
.podium2d-twinkle circle:nth-child(7) {
  animation-delay: 1.8s;
}
.podium2d-twinkle circle:nth-child(8) {
  animation-delay: 0.5s;
}
.podium2d-twinkle circle:nth-child(9) {
  animation-delay: 1.0s;
}
@keyframes podium2d-twinkle {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}

.podium2d-balloon {
  animation: podium2d-bob 3.2s ease-in-out infinite;
  box-shadow: inset -4px -6px 0 rgba(0, 0, 0, 0.12);
}
.podium2d-balloon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.4);
}
@keyframes podium2d-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

</style>
