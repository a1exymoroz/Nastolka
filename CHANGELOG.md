# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## How to update this file

Each pull request that changes user-facing behavior should add an entry under
`[Unreleased]`, in the relevant subsection (`Added`, `Changed`, `Fixed`,
`Removed`).

Cutting a release is automated: when a PR merges into `main`, a workflow
bumps `package.json` (major/minor/patch, chosen by a `semver:*` label on the
PR — defaults to patch), moves the `[Unreleased]` section into a new dated
version entry, and opens a `chore(release): vX.Y.Z` PR for review. Merging
that PR tags the release and publishes a GitHub Release from the matching
changelog section. Label a PR `semver:skip` to opt it out of triggering a
version bump entirely (e.g. a PR that's just one of several landing before a
release is cut together). See `.github/workflows/version-bump.yml` and
`.github/workflows/tag-release.yml`.

Versions below `0.7.0` predate this automation; they were reconstructed from
commit history and split at natural feature boundaries.

## [Unreleased]

### Added

- The chat panel and the "manage sharing & games" section on a location page now remember
  whether they're expanded or collapsed across reloads.
- Assigned expansions now link to their own game page, the same way games do.
- Game cards show a small badge with how many expansions are assigned.
- BoardGameGeek search results show a game's release year when it's available.
- The location statistics contribution calendar now shows a hover popover for each day,
  listing the session count and every distinct game played, instead of a plain browser tooltip.

### Changed

- Delete/remove confirmations (history entries, shares, photos, games, expansions, locations)
  now use an on-brand in-app dialog instead of the browser's native confirmation popup.

### Fixed

- Searching BoardGameGeek for a game already added to the current location — whether it
  matches by BoardGameGeek id or just by name (e.g. a manually-added game with the same
  title) — now shows "Already added" instead of letting you re-import or re-add it as a
  duplicate.
- BoardGameGeek search results in Admin, a game's expansion search, and the location
  add-game form now actually show the release year next to a result's name — it was
  silently never rendering due to a field-name mismatch with the API response.

## [0.29.0] - 2026-09-17

### Added

- A new "Info" page, linked from the home page header, with reference info about the app —
  starting with a list of each supported game's meeples.
- Location owners can grant edit-info/manage-games/manage-history permissions to shared users,
  both when sharing and afterward.
- Brass: Lancashire now shows the same industrialist character tokens as Brass: Birmingham
  in the meeple picker and podium reveal.
- Any user with view access to a location can now rate a finished game session 1-10, from
  either the history list card or the session detail page — separate from the existing
  editor-set rating. The community average and vote count show alongside it.

### Changed

- Redesigned the location chat panel (per-sender avatars, grouped consecutive messages,
  timestamps) and the "Manage sharing & games" accordion (clearer heading hierarchy, SVG
  chevron, resized panel columns) for better readability.
- Redesigned the session history card and detail page with matching styles: labeled
  session vs. community ratings, added calendar/clock icons for date and duration, gave
  the winner a trophy-styled rank badge, de-emphasized raw usernames in favor of points,
  converted the card's View/Edit/Delete links to proper buttons, and gave the personal
  rating control a visible "Your rating" label and larger, higher-contrast tap targets so
  it no longer reads as a pagination control.

## [0.28.2] - 2026-09-17

### Changed

- The "Log this play" button on the pick-session result screen is now only shown to the
  session's creator, since they're the one who follows up by logging the play.

### Fixed

- Pick-session candidates that get auto-banned by the server once no real choice is left now
  show "Automatically banned" instead of the broken "Banned by null" label.

## [0.28.1] - 2026-09-17

### Changed

- The pick-session dice reveal now shows the table before the roll starts and displays which
  survivor game each number corresponds to, so the pool is visible while the dice is falling
  rather than only after. The roll itself also falls more slowly and settles over a few seconds
  instead of snapping down almost instantly.
- The "Games to survive to the roll" field on the create-session form now has a minimum of 2 —
  a session can't be created that would leave nothing to actually pick between.

## [0.28.0] - 2026-09-17

### Added

- Real-time cooperative pick sessions for choosing what to play at a location, replacing the old
  client-side "pick some games and roll a dice" flow: a member starts a session specifying how
  many games should survive to the final roll and whether to exclude games already marked
  finished in the location's history, other members join, then everyone takes turns picking
  (protecting) or banning games from the location's catalog in a randomized turn order until the
  target pool size is reached, at which point the server randomly rolls the winner. Reachable from
  the same "Pick a game" button on the location page as before.

### Fixed

- The global error toast no longer crashes with "crypto.randomUUID is not a function" when the
  app is opened over plain HTTP outside a secure context (e.g. via a LAN IP on a phone).

## [0.27.0] - 2026-09-16

### Changed

- Brass: Birmingham player tokens now show their character's faction-colored frame (matching
  the physical game's discs) wherever they're displayed — the meeple picker, session history,
  and podium reveal.

## [0.26.1] - 2026-09-16

### Fixed

- Native date/time pickers in the session log form no longer overflow their card on iOS
  Safari, where the browser's built-in control ignored the field's declared width.

## [0.26.0] - 2026-09-16

### Added

- History log entries can now record a session-level outcome (Won/Lost) for cooperative or
  solo games played against the game itself, where there's no individual score to rank
  players by. Once an outcome is set, finishing the session no longer requires entering
  points for every player, and the session detail/history views show a Won/Lost badge
  instead of a ranked player list.

## [0.25.0] - 2026-09-16

### Added

- Contextual help tooltips on the statistics page, the meeple picker in the session
  form, the podium reveal, and the Telegram Chat ID field on the location edit form.
- Guided tour steps for the "Statistics" and "Roll dice here" buttons on the location
  detail page, and for the tabs on the statistics page.

### Fixed

- The guided tour's step counter (e.g. "1/7") now counts steps on the current
  page only, instead of the app-wide total across every page.

## [0.24.1] - 2026-09-16

## [0.24.0] - 2026-09-16

### Added

- The locations list now shows each location's last-updated date, and the location detail
  page also shows the time and who made the update.

### Changed

- The session detail page's top-3 podium graphic is more compact on mobile screens, so it
  no longer dominates the page on phones.

## [0.23.1] - 2026-09-16

### Changed

- Saving a session (logging a new one or editing an existing one) now takes you to that
  session's detail page instead of back to the location page.
- A meeple already picked for one player in a session can no longer be picked for another
  player in the same session.

### Removed

- Removed the manual up/down reordering controls for player rows in the history form, since
  finishing order is now determined by points on the backend.

## [0.23.0] - 2026-09-16

### Added

- Brass: Birmingham now has its own set of meeples — portraits of Robert Owen,
  Richard Arkwright, Sir Henry Bessemer, James Watt, Isambard Kingdom Brunel,
  George Stephenson, Eliza Tinsley, and Eleanor Coade — selectable in the
  history form and shown on the podium reveal, alongside Everdell's.

## [0.22.2] - 2026-09-16

### Changed

- The games list on the Location Detail page now scrolls within a max-height container
  instead of growing indefinitely, so it stays reachable when a location has many games.

## [0.22.1] - 2026-09-15

### Changed

- The history entry detail page now shows the podium/player list, then the game info, then the
  session photo, instead of leading with the photo.

## [0.22.0] - 2026-09-15

## [0.21.0] - 2026-09-15

### Added

- Logging or editing a session now lets you pick an optional meeple per player from a small,
  game-specific set (starting with Everdell's 4 critter tokens). The pick shows up next to the
  player in the session's player list and picks the matching token on the podium reveal.

### Changed

- The "Profile" section on the Settings page now lets you change your login username instead of
  setting a separate optional display name, which has been removed.

## [0.20.0] - 2026-09-14

### Added

- A "Profile" section on the Settings page lets you set an optional display name, separate from
  your login username.
- Finishing a session now shows an animated 3D podium reveal for the top 3 placements on the
  session's detail page.

## [0.19.1] - 2026-09-14

### Fixed

- Photo uploads from a modern phone camera (24-48MP originals) were failing with a 413 "too
  large" error after re-encoding to JPEG, since converting format alone doesn't reduce
  resolution. Photos are now also downscaled (max 2400px on the longest side) before upload.

## [0.19.0] - 2026-09-14

### Added

- Location statistics page: overview, game stats, player leaderboard, activity trend, expansions
  usage, and a GitHub-style contribution calendar, each loaded lazily as its tab is opened.
  Accessible via a new "Statistics" button on the location page.

## [0.18.3] - 2026-09-14

### Fixed

- HEIC photo uploads (0.18.1) were still failing on real iPhone photos: no browser, Safari
  included, can actually decode HEIC via a plain canvas, so that fix's canvas-only approach never
  worked for the format it was meant to fix. Photo uploads now fall back to a dedicated WASM HEIF
  decoder (`libheif-js`) when the canvas path can't decode the file, verified end-to-end against a
  real iPhone HDR photo.

## [0.18.2] - 2026-09-14

## [0.18.1] - 2026-09-14

### Fixed

- Photo uploads failing on iPhone for photos saved in HEIC format. Selected photos are now
  re-encoded to JPEG in the browser before upload, which also makes them viewable in browsers that
  can't render the original source format.
- Finishing a session without entering points for every player is now caught client-side, instead
  of only failing after a save attempt, and the missing points inputs are now highlighted.

## [0.18.0] - 2026-08-12

### Added

- Thumbnails view size for the Games panel: a dense grid of just game cover images, alongside the
  existing big/medium/list sizes.

## [0.17.0] - 2026-08-11

### Added

- Read-only history session detail page (`/locations/:id/history/:historyId`), viewable by the
  location's owner, admins, and anyone it's shared with, with an Edit button for owners/admins
  linking to the existing edit form.

### Changed

- Adding, replacing, and removing a session's photo now happens on the session's own page (its
  read-only detail page or edit form) instead of on its summary card in the location's history
  list, which now only shows the photo read-only.

### Fixed

- Signing in from a login page reached via a protected link (e.g. a shared history session URL)
  now returns you to that original page instead of always landing on the locations list.

## [0.16.5] - 2026-08-11

### Fixed

- Settings page "back" link now returns to wherever you came from (e.g. a location's detail
  page) instead of always jumping to the locations list.

## [0.16.4] - 2026-08-11

### Fixed

- Expansions "Find on BoardGameGeek" panel: fixed the scrollbar overlapping the Import button in
  search-result lists, made the panel closeable again once opened for a game with no expansions
  yet, and turned each search result's name into a link to its BoardGameGeek page. Game search
  results (adding a game to a location, and the admin catalog import) got the same BGG link.
- Session history form: date and time inputs no longer overflow the viewport on mobile.
- Dice-roll game picker: reworked spacing and made the "which number picks which game" legend
  independently scrollable so it no longer overlaps the result card on small screens.

## [0.16.3] - 2026-08-10

### Changed

- Reworked the session log/edit form's layout: the Started at / Finished at fields now stack
  full-width on narrow screens instead of being squeezed into two cramped columns, and related
  fields are grouped into labeled sections (Game, Timing, Players) for easier scanning.

### Fixed

- Raised the primary backend health check's timeout (5s → 10s) so a cold Netlify Function
  invocation doesn't get mistaken for a dead backend and silently fall back to the old Render
  deploy for the rest of the session. The check's failure is now also logged to the console.

## [0.16.2] - 2026-08-10

### Fixed

- The photo lightbox's Rotate/Save buttons no longer get visually hidden behind a rotated photo.
- Session history dates now show only the date (e.g. "Aug 9, 2026") instead of also showing an
  always-midnight time.
- Searching for a game to import from BoardGameGeek now shows a "No games found" message when
  the search returns no results, instead of silently showing nothing.

## [0.16.1] - 2026-08-10

## [0.16.0] - 2026-08-10

### Changed

- The login page's Render cold-start hint now only appears when the primary backend actually
  fails its health check and the app has fallen back to the Render deploy, instead of always
  showing regardless of which backend is in use.
- The tech stack page now documents the Telegram bot integration, real-time location chat
  (Spring WebSocket + STOMP / stompjs + sockjs), and the current Northflank-primary,
  Render-fallback backend hosting setup, replacing stale references to Render as the primary host.

## [0.15.1] - 2026-08-10

### Fixed

- Session played/started/finished times now convert correctly between the
  API's UTC timestamps and your local wall-clock time, instead of showing
  and sending the raw UTC time as if it were local. Previously this could
  shift a saved time by your timezone's offset (and even show the wrong
  calendar date) after saving or reloading.

## [0.15.0] - 2026-08-10

### Changed

- Moved the language switcher and app version out of a floating overlay
  shown on every page into a new Settings page, reachable via a small
  settings icon, to reduce clutter on small screens. The tech stack link
  stays directly visible on desktop screens, and the language switcher
  also remains directly on the login and register pages, so it stays
  discoverable before signing in.

## [0.14.0] - 2026-08-07

### Added

- Location owners can now set a Telegram Chat ID on a location's edit form, so new history
  entries logged there are posted to that chat automatically (backend: Nastolka-api#13).
- Locations with a Telegram chat configured now show a Telegram icon next to their name on the
  locations list.

### Changed

- Editing a history entry now fills in "Finished at" with the current date/time as soon as the
  state is switched to Finished, instead of leaving it blank until manually set.

## [0.13.1] - 2026-08-07

### Added

- End-to-end regression test suite (Playwright) covering login, adding games and logging play
  history, sharing a location, and switching languages. CI now runs it on every pull request,
  and the `build`/`e2e` checks must pass before a PR can be merged into `main`.

## [0.13.0] - 2026-08-07

### Added

- Global error popup that appears whenever a backend request fails (network errors, server
  errors) or an unexpected frontend error occurs, instead of failing silently.

## [0.12.0] - 2026-08-07

### Added

- Rotate a history photo from the lightbox and save the rotated version.

### Fixed

- Netlify Functions (photo/history/auth proxying) returning a 502 in local dev when
  `VITE_API_BASE_URL` isn't set, instead of falling back to `http://localhost:8090` like the
  client already does.

## [0.11.2] - 2026-08-07

## [0.11.1] - 2026-07-31

### Added

- Hint on the login page explaining that the backend runs on Render's free tier and may
  take up to ~50 seconds to wake up after inactivity.

## [0.11.0] - 2026-07-31

### Added

- Sign in with Google on the login page, alongside the existing username/password login.
  First Google sign-in creates a new account, or links to an existing account with the same
  email.

## [0.10.1] - 2026-07-31

### Fixed

- Product tour no longer finishes early for read-only viewers and skips the
  remaining manage-only steps when they later visit a location they manage;
  "Done" now only shows once all 7 steps have actually been passed, and
  navigating between locations no longer silently skips a step.

## [0.10.0] - 2026-07-31

### Added

- First-login guided tour: a dismissible, seven-step spotlight walkthrough covering creating a
  location, editing it, sharing it, adding a game, chat, logging/editing/deleting a session, and
  adding/removing a photo. Shown once automatically and never again after it's completed or
  skipped.

## [0.9.0] - 2026-07-31

### Added

- App description on the login page introducing what Nastolka is and what you can do with it.
- In-context help (dismissible info panels and inline tooltips) on the Locations and Location
  Detail pages, explaining locations, the games/expansions catalog, and session history at a glance.

### Changed

- Visual and interaction polish pass across Login/Register, Locations, Games, and History screens:
  a small shared component set (buttons, cards, alert banners) for consistent styling, unified
  empty/error state treatment, and a more accessible photo lightbox (Escape to close, keyboard-
  operable trigger, labeled close button).

### Fixed

- Register page failing to render entirely: the unescaped `@` in the email field's placeholder
  translation was misparsed by vue-i18n as linked-message syntax.
## [0.8.1] - 2026-07-31

### Fixed

- History form date hints ("Auto-set on first...") now show the app's translated session-state
  names instead of raw backend enum codes (e.g. `IN_PROGRESS`/`FINISHED`).

## [0.8.0] - 2026-07-31

### Added

- Multi-language support (English, Polish, Russian) via `vue-i18n`, with a language switcher
  available on every page — including pre-login — and the selection persisted across reloads.

## [0.7.0] - 2026-07-31

### Added

- `CHANGELOG.md` to track releases going forward, following Keep a Changelog.
- Semantic versioning: `package.json` version is bumped on each release.
- App version display in the UI (bottom-left corner and the Tech stack page).

## [0.6.0] - 2026-07-29

### Added

- Photo upload/storage and chat functionality via Netlify Functions.
- Asynchronous loading of history photos.

### Changed

- GameCard/GamesPanel view-size management and layout adjustments.

### Removed

- Unused `die.glb` asset from the physics variations.

## [0.5.0] - 2026-07-27

### Changed

- Centralized API calls behind a shared `apiFetch` utility for consistent
  authentication handling.

## [0.4.0] - 2026-07-23

### Added

- Locations view for managing where games are kept, plus location detail
  components and composables.
- Tech stack page (`/stack`) documenting the app's architecture.
- Redirects configuration for `index.html`.

### Changed

- Reworked expansion search with improved error handling and UI.
- Improved UI layout and component responsiveness across views.
- Clarified history entry state labels in `HistoryForm`/`HistoryEntryCard`.

## [0.3.0] - 2026-07-08

### Added

- Physics-simulated 3D dice rolling with Three.js and Rapier.
- Dynamic dice type selection based on the size of the game pool.

## [0.2.0] - 2026-07-06

### Added

- JWT-based authentication flow (login/register) against the API.

## [0.1.0] - 2026-06-25

### Added

- Initial Vue 3 app scaffold: routing, Pinia state management, Tailwind
  styling, and a Dice component for game selection.

[Unreleased]: https://github.com/a1exymoroz/Nastolka/compare/v0.29.0...HEAD
[0.29.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.28.2...v0.29.0
[0.28.2]: https://github.com/a1exymoroz/Nastolka/compare/v0.28.1...v0.28.2
[0.28.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.28.0...v0.28.1
[0.28.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.26.1...v0.27.0
[0.26.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.26.0...v0.26.1
[0.26.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.24.1...v0.25.0
[0.24.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.23.1...v0.24.0
[0.23.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.23.0...v0.23.1
[0.23.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.22.2...v0.23.0
[0.22.2]: https://github.com/a1exymoroz/Nastolka/compare/v0.22.1...v0.22.2
[0.22.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.22.0...v0.22.1
[0.22.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.19.1...v0.20.0
[0.19.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.18.3...v0.19.0
[0.18.3]: https://github.com/a1exymoroz/Nastolka/compare/v0.18.2...v0.18.3
[0.18.2]: https://github.com/a1exymoroz/Nastolka/compare/v0.18.1...v0.18.2
[0.18.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.16.5...v0.17.0
[0.16.5]: https://github.com/a1exymoroz/Nastolka/compare/v0.16.4...v0.16.5
[0.16.4]: https://github.com/a1exymoroz/Nastolka/compare/v0.16.3...v0.16.4
[0.16.3]: https://github.com/a1exymoroz/Nastolka/compare/v0.16.2...v0.16.3
[0.16.2]: https://github.com/a1exymoroz/Nastolka/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.15.1...v0.16.0
[0.15.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.13.1...v0.14.0
[0.13.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.11.2...v0.12.0
[0.11.2]: https://github.com/a1exymoroz/Nastolka/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/a1exymoroz/Nastolka/releases/tag/v0.1.0
