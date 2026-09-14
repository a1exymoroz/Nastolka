/**
 * Per-place podium geometry/layout. Place 1 is centered and tallest, place 2
 * sits to the left at medium height, place 3 sits to the right and lowest.
 */

export const PODIUM_LAYOUT = {
  1: { x: 0, finalHeight: 1.2, width: 1.5, depth: 1.5, color: 0xffd54a },
  2: { x: -1.9, finalHeight: 0.8, width: 1.25, depth: 1.25, color: 0xc7ccd6 },
  3: { x: 1.9, finalHeight: 0.5, width: 1.25, depth: 1.25, color: 0xcd7f32 },
}

export const PODIUM_LAYOUT_NARROW = {
  1: { x: 0, finalHeight: 1.1, width: 1.2, depth: 1.2, color: 0xffd54a },
  2: { x: -1.25, finalHeight: 0.75, width: 1.0, depth: 1.0, color: 0xc7ccd6 },
  3: { x: 1.25, finalHeight: 0.45, width: 1.0, depth: 1.0, color: 0xcd7f32 },
}

const NARROW_BREAKPOINT_PX = 480

export function getLayout(containerWidthPx) {
  return containerWidthPx < NARROW_BREAKPOINT_PX ? PODIUM_LAYOUT_NARROW : PODIUM_LAYOUT
}
