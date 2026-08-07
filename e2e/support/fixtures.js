import { test as base, expect } from '@playwright/test'

// Keep in sync with src/tour/steps.js — marking every step "passed" means
// ProductTour's maybeStart() never finds an unseen step, so its full-page
// overlay can never activate and block clicks/visibility during a test.
const TOUR_STEP_IDS = [
  'create-location',
  'edit-location',
  'sharing',
  'add-game',
  'chat',
  'history-crud',
  'history-photos',
]

export const test = base.extend({
  // Overrides the default `page` fixture so every test gets a deterministic
  // English locale (independent of the runner's OS/browser locale) and a
  // tour that's already been dismissed, without each spec repeating this.
  page: async ({ page }, use) => {
    await page.addInitScript(
      ([localeKey, locale, tourKey, tourValue]) => {
        // Only seed a default locale on the very first load of this context —
        // addInitScript reruns on every navigation (including page.reload()),
        // so unconditionally setting it here would stomp a locale a test
        // switched to via the UI back to the default on its next reload.
        if (!window.localStorage.getItem(localeKey)) {
          window.localStorage.setItem(localeKey, locale)
        }
        window.localStorage.setItem(tourKey, tourValue)
      },
      ['nastolka-locale', 'en', 'nastolka-tour-progress', JSON.stringify(TOUR_STEP_IDS)],
    )
    await use(page)
  },

  // For specs that need to start already signed in — seeds the same
  // localStorage keys src/stores/auth.js persists on a real login, so
  // App.vue's loadTokenFromStorage() rehydrates the session on mount.
  authedPage: async ({ page }, use) => {
    await page.addInitScript(
      ([token, role, username]) => {
        window.localStorage.setItem('auth_token', token)
        window.localStorage.setItem('auth_role', role)
        window.localStorage.setItem('auth_username', username)
      },
      ['e2e-test-token', 'USER', 'e2e-user'],
    )
    await use(page)
  },
})

export { expect }
