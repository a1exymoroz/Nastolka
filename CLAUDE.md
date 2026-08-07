# Git workflow

`main` is protected on GitHub: direct pushes are blocked for everyone, including the repo owner. All changes must land via a pull request.

When starting work on a new issue (even if it's related to something just finished):
1. `git checkout main && git pull` to sync with the latest `main`, then create a new branch off it (e.g. `feature/short-description` or `fix/short-description`) — never commit directly to `main`, and never keep adding new, unrelated work to an existing branch (especially one whose PR has already merged).
2. Commit work on that branch as normal.
3. When ready, push the branch and open a pull request with `gh pr create`. Do not merge it — the user reviews and merges.
4. Every PR must link to the GitHub issue(s) it addresses. Include a closing keyword (e.g. `Closes #12`, `Fixes #7`) in the PR body so the issue auto-closes on merge. If no related issue exists yet, create one first (and add it to the relevant project) before opening the PR.

# Versioning and releases

Releases are automated (`.github/workflows/version-bump.yml` and `tag-release.yml`) — see `CHANGELOG.md` for how the pipeline works.

Before opening a PR that changes user-facing behavior, add an entry for it under the `[Unreleased]` section of `CHANGELOG.md` (in the relevant `Added`/`Changed`/`Fixed`/`Removed` subsection). Skip this only for changes with no user-facing effect (pure CI/tooling/internal refactors).

Also set the PR's version-bump label based on what the PR actually contains:

- `semver:major` — breaking change (removes/renames a public API, route, or behavior other consumers depend on).
- `semver:minor` — new feature or capability, backward compatible.
- `semver:patch` — bug fix, refactor, docs, chore, or anything else backward compatible.
- No label — treated as `semver:patch` by the automation. Leave it unlabeled only when the change is a clear patch-level change; when in doubt, apply the label explicitly rather than relying on the default.

# Internationalization (i18n)

The app supports English, Polish, and Russian via `vue-i18n` — see `docs/i18n.md` for the full convention.

Whenever a change adds, edits, or removes user-facing text (template copy, placeholders, button labels, error/validation messages, confirm dialogs, etc.), update all three locale files together in the same PR:

- `src/i18n/locales/en.json`
- `src/i18n/locales/pl.json`
- `src/i18n/locales/ru.json`

Never add or edit a key in only one locale file — the three files must always have the same key set (verify with a quick diff of the key structure if unsure). Use `$t('namespace.key')` in templates or `t('namespace.key')` (via `useI18n()` in components, or the exported `t` from `src/i18n` in composables/non-component code) — never hardcode new user-facing strings directly in a component. Before opening the PR, check devtools console in each locale for `[intlify] Not found` warnings to confirm no keys were missed.
