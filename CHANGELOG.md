# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## How to update this file

Each pull request that changes user-facing behavior should add an entry under
`[Unreleased]`, in the relevant subsection (`Added`, `Changed`, `Fixed`,
`Removed`). When a release is cut, rename `[Unreleased]` to the new version
number and date, bump `version` in `package.json` to match, and start a fresh
`[Unreleased]` section.

Versions below `0.7.0` predate versioning itself; they were reconstructed
from commit history and split at natural feature boundaries.

## [Unreleased]

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

[Unreleased]: https://github.com/a1exymoroz/Nastolka/compare/767d4591b07fe2cb578905b699dc3e250e7c9b43...HEAD
[0.7.0]: https://github.com/a1exymoroz/Nastolka/compare/f34bbb42e7ecd2151347e682b1c813e9f8829560...767d4591b07fe2cb578905b699dc3e250e7c9b43
[0.6.0]: https://github.com/a1exymoroz/Nastolka/compare/96587da2b9ef9b6147d3e6b966b41f982d4cfbf7...f34bbb42e7ecd2151347e682b1c813e9f8829560
[0.5.0]: https://github.com/a1exymoroz/Nastolka/compare/3fe2447d307683d8b383a4b3c809f31ba69ed924...96587da2b9ef9b6147d3e6b966b41f982d4cfbf7
[0.4.0]: https://github.com/a1exymoroz/Nastolka/compare/5d7b921035741ce91f9a820bfea590bc5a99c0b3...3fe2447d307683d8b383a4b3c809f31ba69ed924
[0.3.0]: https://github.com/a1exymoroz/Nastolka/compare/3614cbc51b8d917bdb5469abec5474461af6d252...5d7b921035741ce91f9a820bfea590bc5a99c0b3
[0.2.0]: https://github.com/a1exymoroz/Nastolka/compare/747c4f9fdf39f66e25d84d3d3490b763230aa425...3614cbc51b8d917bdb5469abec5474461af6d252
[0.1.0]: https://github.com/a1exymoroz/Nastolka/commit/747c4f9fdf39f66e25d84d3d3490b763230aa425
