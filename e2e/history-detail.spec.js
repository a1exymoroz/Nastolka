import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

const HISTORY_ENTRY = {
  id: 1,
  gameId: 10,
  gameName: 'Catan',
  state: 'FINISHED',
  playedAt: '2026-07-01T00:00:00Z',
  players: [
    { username: 'e2e-user', placement: 1, points: 10 },
    { username: 'e2e-friend', placement: 2, points: 5 },
  ],
  rating: 7,
  expansions: [],
}

// TEST_LOCATION (mock-api.js) is owned by 'e2e-user' — signs a different
// username in as a shared (non-owner) or unrelated user, mirroring how
// authedPage seeds localStorage in support/fixtures.js.
async function signInAs(page, username) {
  await page.addInitScript(
    ([token, role, name]) => {
      window.localStorage.setItem('auth_token', token)
      window.localStorage.setItem('auth_role', role)
      window.localStorage.setItem('auth_username', name)
    },
    ['e2e-test-token', 'USER', username],
  )
}

test('owner sees read-only session details with a working Edit button', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
  await expect(page.getByText('7/10')).toBeVisible()

  await page.getByRole('button', { name: 'Edit' }).click()
  await page.waitForURL('/locations/1/history/1/edit')
})

test('a shared (non-owner) user sees the session but no Edit button', async ({ page }) => {
  await signInAs(page, 'e2e-friend')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
    { method: 'GET', pattern: '/api/locations/:id/shares', handler: () => ({ status: 200, json: [{ username: 'e2e-friend' }] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
})

test('a user with no relationship to the location sees a no-access message', async ({ page }) => {
  await signInAs(page, 'e2e-stranger')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByText("You don't have access to this session")).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Catan' })).not.toBeVisible()
})

test('the View link on a location history card opens the read-only detail page', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'View', exact: true }).click()

  await page.waitForURL('/locations/1/history/1')
  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
})

test('signing in from a deep link redirects back to the original history detail page', async ({
  page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')
  await page.waitForURL(/\/login\?redirect=/)

  await page.getByLabel('Username').fill('e2e-user')
  await page.getByLabel('Password').fill('correct-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL('/locations/1/history/1')
  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
})
