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

[Unreleased]: https://github.com/a1exymoroz/Nastolka/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/a1exymoroz/Nastolka/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/a1exymoroz/Nastolka/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/a1exymoroz/Nastolka/releases/tag/v0.1.0
