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

## [Unreleased]

## [0.1.0] - 2026-07-31

First versioned release. Entries below summarize everything shipped before
versioning was introduced, reconstructed from commit history.

### Added

- Core Vue 3 app: routing, Pinia state management, Tailwind styling, and a
  Dice component for game selection.
- JWT-based authentication flow (login/register) against the API.
- Physics-simulated 3D dice rolling with Three.js and Rapier, including
  dynamic dice type selection based on the size of the game pool.
- Locations view for managing where games are kept, plus location detail
  components and composables.
- History tracking for game nights, with async-loaded history photos.
- Photo upload/storage and chat functionality via Netlify Functions.
- Tech stack page (`/stack`) documenting the app's architecture.
- `CHANGELOG.md` to track releases going forward, following Keep a Changelog.
- Semantic versioning: `package.json` version is bumped on each release.
- App version display in the UI (bottom-left corner and the Tech stack page).

### Changed

- Centralized API calls behind a shared `apiFetch` utility for consistent
  authentication handling.
- Reworked expansion search with improved error handling and UI.
- Improved UI layout and component responsiveness across views, including
  GameCard/GamesPanel view-size management.
- Clarified history entry state labels in `HistoryForm`/`HistoryEntryCard`.

### Removed

- Unused `die.glb` asset from the physics variations.

[Unreleased]: https://github.com/a1exymoroz/Nastolka/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/a1exymoroz/Nastolka/releases/tag/v0.1.0
