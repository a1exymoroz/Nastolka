import { createSeededRandom } from './seededRandom'

// Fixed tint set for per-sender chat avatars, deterministically hashed from the
// username so the same person always gets the same color. Deliberately excludes
// indigo (reserved for the own-message bubble accent) and amber (reserved for
// the admin badge) so avatar colors never collide with those meanings.
const AVATAR_TINTS = [
  'bg-teal-500/15 text-teal-300',
  'bg-purple-500/15 text-purple-300',
  'bg-rose-500/15 text-rose-300',
  'bg-sky-500/15 text-sky-300',
  'bg-lime-500/15 text-lime-300',
  'bg-fuchsia-500/15 text-fuchsia-300',
]

export function avatarTintClasses(username) {
  const index = Math.floor(createSeededRandom(username)() * AVATAR_TINTS.length)
  return AVATAR_TINTS[index]
}
