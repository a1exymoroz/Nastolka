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
  1: { order: 2, height: 168, color: '#ffd54a', label: '🥇' },
  2: { order: 1, height: 116, color: '#c7ccd6', label: '🥈' },
  3: { order: 3, height: 88, color: '#cd7f32', label: '🥉' },
}

const AVATAR_THEMES = {
  everdell: { bg: '#2f8f5b', icon: '🍃' },
  default: { bg: '#5b6ea8', icon: '🎲' },
}

const CONFETTI_COLORS = ['#ffd54a', '#ff6b6b', '#4dd0e1', '#81c784', '#ba68c8', '#ffffff']
const CONFETTI_PIECE_COUNT = 40

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
const activeConfettiPieces = new Set()

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

let timeline = null

function clearConfetti() {
  for (const piece of activeConfettiPieces) {
    gsap.killTweensOf(piece)
    piece.remove()
  }
  activeConfettiPieces.clear()
}

function spawnConfetti(originEl) {
  if (!confettiHost.value || !originEl) return
  const hostRect = confettiHost.value.getBoundingClientRect()
  const originRect = originEl.getBoundingClientRect()
  const originX = originRect.left + originRect.width / 2 - hostRect.left
  const originY = originRect.top + originRect.height / 2 - hostRect.top

  for (let i = 0; i < CONFETTI_PIECE_COUNT; i++) {
    const piece = document.createElement('div')
    piece.className = 'absolute h-3 w-2 rounded-sm'
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
        y: -70 - Math.random() * 50,
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

function resetVisualState() {
  for (const placement of places.value) {
    const { place } = placement
    displayScores[place] = 0
    if (podiumEls[place]) gsap.set(podiumEls[place], { y: 140, opacity: 0, scaleX: 1, scaleY: 1 })
    if (avatarEls[place]) gsap.set(avatarEls[place], { scale: 0, opacity: 0, y: 0 })
    if (medalEls[place]) gsap.set(medalEls[place], { scale: 0, opacity: 0, rotate: -25 })
    if (nameEls[place]) gsap.set(nameEls[place], { y: 10, opacity: 0 })
    if (scoreEls[place]) gsap.set(scoreEls[place], { opacity: 0 })
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
  }
}

function buildTimeline() {
  timeline?.kill()
  clearConfetti()
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
  clearConfetti()
})

function replay() {
  buildTimeline()
}
</script>

<template>
  <div class="mb-4">
    <div
      class="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-b from-sky-300 to-amber-50"
      role="img"
      :aria-label="t('historyDetail.podium2d.ariaLabel', { gameName })"
    >
      <div ref="confettiHost" class="pointer-events-none absolute inset-0 overflow-hidden" />

      <div class="absolute right-3 top-3 text-2xl opacity-70">{{ theme.icon }}</div>

      <div class="absolute inset-x-0 bottom-0 flex h-full items-end justify-center gap-3 px-4 pb-0 sm:gap-6">
        <div v-for="placement in places" :key="placement.place" class="flex flex-col items-center" :style="{ order: placement.style.order }">
          <div class="mb-1 flex flex-col items-center">
            <div :ref="(el) => setMedalEl(placement.place, el)" class="text-xl sm:text-2xl">
              {{ placement.style.label }}
            </div>
            <div
              :ref="(el) => setAvatarEl(placement.place, el)"
              class="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-base font-bold text-white shadow-lg sm:h-16 sm:w-16 sm:text-lg"
              :style="{ background: theme.bg }"
            >
              {{ initials(placement.name) }}
            </div>
            <div :ref="(el) => setNameEl(placement.place, el)" class="mt-1 max-w-[70px] truncate text-[11px] font-semibold text-slate-800 sm:max-w-none sm:text-sm">
              {{ placement.name }}
            </div>
            <div
              :ref="(el) => setScoreEl(placement.place, el)"
              class="font-extrabold"
              :class="placement.place === 1 ? 'text-lg text-amber-500 sm:text-2xl' : 'text-sm text-slate-700 sm:text-lg'"
            >
              {{ displayScores[placement.place] ?? 0 }}
            </div>
          </div>

          <div
            :ref="(el) => setPodiumEl(placement.place, el)"
            class="w-14 rounded-t-lg border-2 border-black/10 sm:w-24"
            :style="{ height: placement.style.height + 'px', background: placement.style.color, transformOrigin: 'bottom center' }"
          />
        </div>
      </div>
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
