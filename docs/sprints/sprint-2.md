# Sprint 2

**Aug 11 – Sep 14, 2026** · closed out Sep 14, 2026

Second sprint across the Nastolka app, API, and Telegram bot — the Telegram bot integration landed, plus a read-only history detail page, a denser Games panel view, a production database migration off Neon, and a run of UI polish and bug fixes.

## At a glance

- **10** items shipped
- **10** issues closed, **8** PRs merged
- **3** repos touched: Nastolka (5), Nastolka-telegram (4), Nastolka-api (1)

## New features

- Telegram bot integration — [Nastolka#5](https://github.com/a1exymoroz/Nastolka/issues/5)
- Read-only history session detail page with a shareable, auth-gated link — [Nastolka#85](https://github.com/a1exymoroz/Nastolka/issues/85), [PR #86](https://github.com/a1exymoroz/Nastolka/pull/86)
- Thumbnails-only view size for the Games panel — [Nastolka#88](https://github.com/a1exymoroz/Nastolka/issues/88), [PR #89](https://github.com/a1exymoroz/Nastolka/pull/89)
- Prettified `/history` message formatting in Telegram — [Nastolka-telegram#15](https://github.com/a1exymoroz/Nastolka-telegram/issues/15), [PR #16](https://github.com/a1exymoroz/Nastolka-telegram/pull/16)

## Bug fixes

- Settings back link always returned to the locations list instead of the previous page — [Nastolka#82](https://github.com/a1exymoroz/Nastolka/issues/82), [PR #83](https://github.com/a1exymoroz/Nastolka/pull/83)
- UI polish pass: BGG expansions panel, mobile date fields, dice playground — [Nastolka#77](https://github.com/a1exymoroz/Nastolka/issues/77), [PR #78](https://github.com/a1exymoroz/Nastolka/pull/78)

## Infrastructure & tooling

- Evaluated Google Cloud Run as the Telegram bot's deploy target — [Nastolka-telegram#3](https://github.com/a1exymoroz/Nastolka-telegram/issues/3)
- Removed leftover `fly.toml` after the Cloud Run migration — [Nastolka-telegram#10](https://github.com/a1exymoroz/Nastolka-telegram/issues/10), [PR #11](https://github.com/a1exymoroz/Nastolka-telegram/pull/11)
- Migrated the production database off Neon to Supabase after its free-tier compute allowance was exhausted — [Nastolka-api#30](https://github.com/a1exymoroz/Nastolka-api/issues/30), [PR #31](https://github.com/a1exymoroz/Nastolka-api/pull/31)

## Process & docs

- Documented the contribution workflow: branch/issue/PR process and versioning/changelog rules — [Nastolka-telegram#8](https://github.com/a1exymoroz/Nastolka-telegram/issues/8), [PR #9](https://github.com/a1exymoroz/Nastolka-telegram/pull/9)

---

Sprint 3 kicked off Sep 14, 2026, with 12 items in flight. See the [project board](https://github.com/users/a1exymoroz/projects/3).
