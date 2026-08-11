# Sprint 1

**Jul 28 – Aug 10, 2026** · closed out Aug 10, 2026

First sprint across the Nastolka app, API, and Telegram bot — from account auth and i18n through to a Northflank redeploy and a run of production timezone fixes.

## At a glance

- **40** items shipped
- **36** issues closed, **4** PRs merged
- **3** repos touched: Nastolka (28), Nastolka-api (11), Nastolka-telegram (1)

## New features

- i18n: English, Polish, and Russian locales — [Nastolka#1](https://github.com/a1exymoroz/Nastolka/issues/1)
- Google auth (login) — [Nastolka#13](https://github.com/a1exymoroz/Nastolka/issues/13)
- Error popup for backend/frontend errors — [Nastolka#20](https://github.com/a1exymoroz/Nastolka/issues/20)
- First-login guided tour (spotlight tutorial) — [Nastolka#21](https://github.com/a1exymoroz/Nastolka/issues/21)
- Rotate and save history photos — [Nastolka#37](https://github.com/a1exymoroz/Nastolka/issues/37), [PR #39](https://github.com/a1exymoroz/Nastolka/pull/39)
- Login-page hint about Render free-tier cold starts — [Nastolka#31](https://github.com/a1exymoroz/Nastolka/issues/31)
- Auto-fill "Finished at" when marking a session finished — [Nastolka#47](https://github.com/a1exymoroz/Nastolka/issues/47)
- Relocated language switcher, tech stack link, and version off the floating overlay — [Nastolka#50](https://github.com/a1exymoroz/Nastolka/issues/50)
- General UX/UI pass — [Nastolka#4](https://github.com/a1exymoroz/Nastolka/issues/4)
- Look up a Telegram chat's id for linking to a location — [Nastolka-telegram#1](https://github.com/a1exymoroz/Nastolka-telegram/issues/1)

## Bug fixes

- Sharing search included admin and the current user — [Nastolka#10](https://github.com/a1exymoroz/Nastolka/issues/10), [Nastolka-api PR#1](https://github.com/a1exymoroz/Nastolka-api/pull/1)
- Product tour skipped remaining steps for managers after a read-only location — [Nastolka#26](https://github.com/a1exymoroz/Nastolka/issues/26)
- HikariCP kept reusing connections Neon had already closed — [Nastolka-api#6](https://github.com/a1exymoroz/Nastolka-api/issues/6), [PR #7](https://github.com/a1exymoroz/Nastolka-api/pull/7)
- Duplicate `JAVA_API_BASE_URL` / `VITE_API_BASE_URL` env vars consolidated — [Nastolka#34](https://github.com/a1exymoroz/Nastolka/issues/34)
- Netlify Functions 502'd locally when `VITE_API_BASE_URL` was unset — [Nastolka#38](https://github.com/a1exymoroz/Nastolka/issues/38), [PR #39](https://github.com/a1exymoroz/Nastolka/pull/39)
- Render cold-start hint showed even when the fallback backend wasn't in use — [Nastolka#56](https://github.com/a1exymoroz/Nastolka/issues/56)
- Telegram "session finished" notification date included a redundant time — [Nastolka-api#21](https://github.com/a1exymoroz/Nastolka-api/issues/21)
- History form: Started/Finished at cramped on mobile, weak hierarchy — [Nastolka#74](https://github.com/a1exymoroz/Nastolka/issues/74)
- API error responses omitted the failure reason (bare 400/404) — [Nastolka-api#23](https://github.com/a1exymoroz/Nastolka-api/issues/23)
- Session date/times timezone-naive end-to-end — shifted times on save (prod, UK server) — [Nastolka-api#16](https://github.com/a1exymoroz/Nastolka-api/issues/16)
- Primary backend health check timed out too eagerly, silently fell back to Render — [Nastolka#72](https://github.com/a1exymoroz/Nastolka/issues/72)
- `backend-health` function failed silently on health check errors — [Nastolka#67](https://github.com/a1exymoroz/Nastolka/issues/67)
- No "no results" message when a BGG game search returned zero matches — [Nastolka#64](https://github.com/a1exymoroz/Nastolka/issues/64)
- History entry date showed a redundant time (should be date-only) — [Nastolka#63](https://github.com/a1exymoroz/Nastolka/issues/63)
- Photo lightbox: rotate/save buttons hidden after rotating a photo — [Nastolka#62](https://github.com/a1exymoroz/Nastolka/issues/62)
- Session date/times sent and displayed without local timezone conversion — [Nastolka#53](https://github.com/a1exymoroz/Nastolka/issues/53)
- History form date hints showed raw backend enum codes, not translated names — [Nastolka#15](https://github.com/a1exymoroz/Nastolka/issues/15)

## Infrastructure & tooling

- Changelog and semantic versioning adopted — [Nastolka#2](https://github.com/a1exymoroz/Nastolka/issues/2)
- GitHub Actions workflow for versioning/releases — [Nastolka#3](https://github.com/a1exymoroz/Nastolka/issues/3)
- Playwright regression test suite added — [Nastolka#24](https://github.com/a1exymoroz/Nastolka/issues/24)
- Added a way to skip the automated version bump for a merged PR — [Nastolka#70](https://github.com/a1exymoroz/Nastolka/issues/70)
- Deployment migrated from Render to an Oracle Cloud Always Free VM — [Nastolka-api#3](https://github.com/a1exymoroz/Nastolka-api/issues/3)
- Northflank deploy pipeline via GitHub Actions (superseded the Oracle VM) — [Nastolka-api PR#5](https://github.com/a1exymoroz/Nastolka-api/pull/5)
- Health check endpoint, response caching, and app-level rate limiting — [Nastolka-api#11](https://github.com/a1exymoroz/Nastolka-api/issues/11)
- Versioning + CHANGELOG added, TECH_STACK.md refreshed for Northflank — [Nastolka-api#19](https://github.com/a1exymoroz/Nastolka-api/issues/19)

## Process & docs

- Documented that every GitHub issue must be added to the project — [Nastolka-api#25](https://github.com/a1exymoroz/Nastolka-api/issues/25)
- Tech stack page updated with Telegram bot, real-time chat, and current hosting — [Nastolka#59](https://github.com/a1exymoroz/Nastolka/issues/59)

---

Sprint 2 kicked off Aug 11, 2026, with 12 items in flight. See the [project board](https://github.com/users/a1exymoroz/projects/3).
