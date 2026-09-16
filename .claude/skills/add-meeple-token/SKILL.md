---
name: add-meeple-token
description: Add a new game piece (meeple/critter) sprite to a game's token set — either a new piece for a game that already has some (e.g. a 5th Everdell critter) or the first set for a brand-new game. Covers the SVG sprite requirements, wiring it into src/utils/tokenSets.js, the three i18n locale files, and the e2e test that asserts an exact count of pieces. Use when the user gives an SVG/sprite for a board-game piece/token/meeple/critter/figurine and wants it added, or asks "how do I add another piece/animal/token".
---

# Adding a meeple/token sprite

This project shows each player's actual game piece on the podium reveal
(`TopThreePodium2D.vue`, avatar style `'everdell'` today) and lets it be
picked in the history form (`MeepleSelect.vue`). Both read from one shared
registry: `src/utils/tokenSets.js`. Adding a piece means updating that
registry plus a few things that must stay in sync with it.

Read `src/utils/tokenSets.js` in full before starting — it's short, and its
own comments explain the `id`/`slug` split and why `assignTokens` never lets
two players share a piece.

## 1. Get the sprite into the right shape

Each token renders as a single `<svg :viewBox="..."><path :d="..." /></svg>`
with one flat fill. The source sprite must already be **one `<path>` with
one solid `fill`** — no groups, gradients, strokes, or multiple paths. If
you're given a multi-path SVG, flatten it first (e.g. in Inkscape: select
all, `Path > Union`, then `Path > Object to Path` if any shape isn't a path
yet) until it's down to one `<path d="...">`.

Save the source file — even though the component doesn't import it, it's
the reference copy for future edits — under `src/assets/animals/`, named
`<gameKey>_<slug>.svg` (e.g. `everdell_fox.svg`). `gameKey` and `slug` are
the exact strings you'll use in step 2, so decide those first.

## 2. Add the entry to `TOKEN_SETS`

In `src/utils/tokenSets.js`:

- **New piece for an existing game**: add an object to that game's array
  (e.g. `TOKEN_SETS.everdell.push(...)` — literally, add another element to
  the array literal).
- **Brand-new game**: add a new top-level key. It must equal that game's
  `name` from the backend, **lowercased and trimmed** — `getMeepleOptions`
  looks it up that way, matching how `HistoryDetail.vue` and
  `HistoryForm.vue` derive `gameKey` from the selected game's name.

Each token object:

```js
{
  id: '<gameKey>_<slug>',   // e.g. 'everdell_fox' — namespaced so ids never collide across games
  slug: '<slug>',            // e.g. 'fox' — resolves the display name via i18n, see step 3
  viewBox: '<from the SVG>', // copy the source SVG's own viewBox attribute verbatim
  color: '<hex fill>',       // copy the source SVG path's fill
  path: '<from the SVG>',    // copy the source SVG's path `d` attribute verbatim
}
```

Copy `viewBox`, `color`, and `path` straight out of the sprite file from
step 1 — don't renormalize the coordinates, the component doesn't need them
normalized to `0 0`.

## 3. Add the display name to all three locales

The `name` shown in the picker comes from `t(\`meeples.${gameKey}.${slug}\`)`.
Add that key to **all three** locale files — `src/i18n/locales/en.json`,
`pl.json`, `ru.json` — under `meeples.<gameKey>.<slug>`, following the
existing `meeples.everdell.*` block in each file. Never add it to only one
locale (this project's convention, checked by the usual devtools
`[intlify] Not found` sweep before opening a PR).

## 4. If this is a brand-new game, also update the hardcoded switch

`HistoryDetail.vue` currently decides the podium's `avatarStyle` with:

```js
const podiumAvatarStyle = computed(() =>
  (entry.value?.gameName ?? '').trim().toLowerCase() === 'everdell' ? 'everdell' : 'dice',
)
```

This is a literal `'everdell'` check, not "does `TOKEN_SETS` have this
game" — so a new game's tokens won't show on the podium until this line
also recognizes it. Either add the new `gameKey` to the comparison, or (better,
if you're touching this more than once) generalize it to check
`Object.keys(TOKEN_SETS).includes(gameKey)`. `MeepleSelect.vue`'s picker
already works automatically for any game with a `TOKEN_SETS` entry — only
this podium-side switch is hardcoded today.

## 5. Update the e2e test that counts pieces

`e2e/games-and-history.spec.js` has a test, `'only offers meeples for the
currently selected game'`, that asserts the picker shows **exactly** as many
options as the game's token set has, by name:

```js
await expect(meepleOptions).toHaveCount(4)
for (const name of ['Squirrel', 'Rabbit', 'Hedgehog', 'Elephant']) {
```

Adding a piece to an existing game's set *will* break this test if you
don't bump the count and add the new name to that list. If you added a
brand-new game instead, consider adding an equivalent case for it, mirroring
this test and `'picks a meeple for a player when editing an Everdell
session'`.

## 6. Verify

1. `npm run test:e2e` — confirms steps 2–5 stayed in sync.
2. Dev server → a history entry for that game → edit → meeple picker shows
   the new option with its icon and localized name in each locale.
3. `src/views/PodiumReveal2D.vue`'s `SAMPLE_TOP_THREE` is a quick way to
   preview a specific piece on the podium without going through the form:
   set a sample player's `pieceId` to the new token's `id` and check
   `/podium-reveal-2d` with avatar style "Everdell meeple".

## 7. Changelog and versioning

Adding a piece is user-facing (it appears in the meeple picker and podium),
so add an entry under `[Unreleased]` in `CHANGELOG.md` per this repo's
`CLAUDE.md`, and label the PR `semver:minor` for a new piece/game, or
`semver:patch` if it's a pure fix to an existing one.
