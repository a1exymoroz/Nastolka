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
changelog section. See `.github/workflows/version-bump.yml` and
`.github/workflows/tag-release.yml`.

Versions below `0.7.0` predate this automation; they were reconstructed from
commit history and split at natural feature boundaries.

## [Unreleased]

### Changed

- Moved the language switcher, tech stack link, and app version out of a
  floating overlay on every page into a new Settings page, reachable via a
  small settings icon, to reduce clutter on small screens. The language
  switcher also remains directly on the login and register pages, so it
  stays discoverable before signing in.

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

[Unreleased]: https://github.com/a1exymoroz/Nastolka/compare/v0.14.0...HEAD
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
