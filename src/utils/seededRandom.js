// Small deterministic PRNG (mulberry32, seeded via FNV-1a hash of a string) —
// not cryptographic, just enough to make a physics dice roll reproducible
// across every viewer who was given the same seed string.

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Returns a Math.random()-shaped function that always produces the same
 * sequence for a given seed string. */
export function createSeededRandom(seedString) {
  return mulberry32(hashString(String(seedString)))
}
