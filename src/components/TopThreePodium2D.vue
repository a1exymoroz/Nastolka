<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'

const props = defineProps({
  topThree: {
    type: Array,
    required: true,
  },
  gameName: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()

// Left-to-right stage order (2nd, 1st, 3rd); height sets how tall each step
// reads against the others.
const PLACE_STYLE = {
  1: { order: 2, height: 108, label: '🥇' },
  2: { order: 1, height: 74, label: '🥈' },
  3: { order: 3, height: 56, label: '🥉' },
}

const AVATAR_THEMES = {
  everdell: { bg: '#2f8f5b', icon: '🍃' },
  default: { bg: '#7a3ea1', icon: '👑' },
}

const CONFETTI_COLORS = ['#ffd54a', '#ff6b6b', '#f3e2b3', '#c9a227', '#b73b4f', '#ffffff']
const CONFETTI_PIECE_COUNT = 44
const BALLOONS = [
  { left: '4%', top: '10%', color: '#d4af37', delay: 0 },
  { left: '90%', top: '6%', color: '#b73b4f', delay: 0.6 },
  { left: '14%', top: '32%', color: '#3f5fa0', delay: 1.1 },
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
const medalEls = {}
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
function setMedalEl(place, el) {
  if (el) medalEls[place] = el
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

function spawnConfetti(originEl) {
  if (!confettiHost.value || !originEl) return
  const hostRect = confettiHost.value.getBoundingClientRect()
  const originRect = originEl.getBoundingClientRect()
  const originX = originRect.left + originRect.width / 2 - hostRect.left
  const originY = originRect.top + originRect.height / 2 - hostRect.top

  for (let i = 0; i < CONFETTI_PIECE_COUNT; i++) {
    const isStreamer = i % 5 === 0
    const piece = document.createElement('div')
    piece.className = isStreamer ? 'absolute h-5 w-1.5 rounded-full' : 'absolute h-3 w-2 rounded-sm'
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    piece.style.left = `${originX}px`
    piece.style.top = `${originY}px`
    confettiHost.value.appendChild(piece)
    activeConfettiPieces.add(piece)

    const angle = Math.random() * Math.PI * 2
    const distance = 50 + Math.random() * 100
    gsap
      .timeline({
        onComplete: () => {
          piece.remove()
          activeConfettiPieces.delete(piece)
        },
      })
      .to(piece, {
        x: Math.cos(angle) * distance,
        y: -38 - Math.random() * 28,
        rotation: Math.random() * 360,
        duration: 0.45 + Math.random() * 0.2,
        ease: 'power2.out',
      })
      .to(piece, {
        y: '+=200',
        rotation: `+=${180 + Math.random() * 180}`,
        opacity: 0,
        duration: 1.0,
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
    if (medalEls[place]) gsap.set(medalEls[place], { scale: 0, opacity: 0, rotate: -25 })
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
    if (medalEls[place]) gsap.set(medalEls[place], { scale: 1, opacity: 1, rotate: 0 })
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
    const medal = medalEls[place]
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
    if (medal) {
      tl.to(medal, { scale: 1, opacity: 1, rotate: 0, duration: 0.4, ease: 'back.out(3)' }, startAt + 0.45)
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
          spawnConfetti(avatar ?? podium)
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
      <!-- Backdrop: royal dusk sky, a distant castle skyline, and draped curtains. -->
      <svg class="absolute inset-0 h-full w-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="podium2dSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#33204a" />
            <stop offset="45%" stop-color="#7a3350" />
            <stop offset="75%" stop-color="#d98a3d" />
            <stop offset="100%" stop-color="#ffe9c7" />
          </linearGradient>
          <linearGradient id="podium2dCurtain" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#5c0f1e" />
            <stop offset="100%" stop-color="#8a1f34" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="800" height="450" fill="url(#podium2dSky)" />

        <g class="podium2d-twinkle" fill="#fff6da">
          <circle cx="120" cy="60" r="2.2" />
          <circle cx="620" cy="45" r="1.8" />
          <circle cx="700" cy="110" r="2" />
          <circle cx="260" cy="40" r="1.6" />
          <circle cx="440" cy="30" r="1.8" />
        </g>

        <!-- distant castle silhouette -->
        <g fill="#3d2554" opacity="0.55">
          <rect x="150" y="280" width="500" height="24" />
          <rect x="170" y="240" width="22" height="60" />
          <polygon points="181,215 195,240 167,240" />
          <rect x="600" y="240" width="22" height="60" />
          <polygon points="611,215 625,240 597,240" />
          <rect x="290" y="210" width="30" height="90" />
          <polygon points="305,178 324,210 286,210" />
          <rect x="470" y="210" width="30" height="90" />
          <polygon points="485,178 504,210 466,210" />
          <rect x="368" y="150" width="55" height="150" />
          <polygon points="395,105 428,150 362,150" />
          <rect x="386" y="90" width="6" height="20" />
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

      <div class="absolute left-3 top-3 text-xl opacity-80 sm:text-2xl">{{ theme.icon }}</div>

      <div class="absolute inset-x-0 bottom-0 flex h-full items-end justify-center gap-3 px-4 pb-0 sm:gap-6">
        <div v-for="placement in places" :key="placement.place" class="flex flex-col items-center" :style="{ order: placement.style.order }">
          <div class="mb-1 flex flex-col items-center">
            <div :ref="(el) => setMedalEl(placement.place, el)" class="text-xl sm:text-2xl">
              {{ placement.style.label }}
            </div>
            <div
              :ref="(el) => setAvatarEl(placement.place, el)"
              class="flex h-12 w-12 items-center justify-center rounded-full border-4 border-amber-200 text-base font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg"
              :style="{ background: theme.bg }"
            >
              {{ initials(placement.name) }}
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
  animation-delay: 0.4s;
}
.podium2d-twinkle circle:nth-child(3) {
  animation-delay: 0.8s;
}
.podium2d-twinkle circle:nth-child(4) {
  animation-delay: 1.2s;
}
.podium2d-twinkle circle:nth-child(5) {
  animation-delay: 1.6s;
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
