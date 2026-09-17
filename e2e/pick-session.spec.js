import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

function json(status, body) {
  return { status, json: body }
}

test('shows the create form when no pick session is active', async ({ authedPage: page }) => {
  await mockApi(page, [])

  await page.goto('/locations/1/play')

  await expect(page.getByRole('heading', { name: 'Start a pick session' })).toBeVisible()
})

test('creates a pick session and shows the waiting room', async ({ authedPage: page }) => {
  await mockApi(page, [])

  await page.goto('/locations/1/play')
  await expect(page.getByRole('heading', { name: 'Start a pick session' })).toBeVisible()

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/pick-sessions') && req.method() === 'POST',
    ),
    page.getByRole('button', { name: 'Start session' }).click(),
  ])

  expect(request.postDataJSON()).toEqual({ targetRemainingCount: 1, excludeAlreadyPlayed: false })

  await expect(page.getByRole('heading', { name: 'Waiting for players' })).toBeVisible()
  await expect(page.getByText('e2e-user')).toBeVisible()
})

test('falls back to the already-active session when create hits a conflict', async ({
  authedPage: page,
}) => {
  const activeSession = {
    id: 501,
    locationId: 1,
    status: 'WAITING_FOR_PLAYERS',
    excludeAlreadyPlayed: false,
    targetRemainingCount: 1,
    requiredBanCount: null,
    banCount: 0,
    currentTurnUsername: null,
    createdByUsername: 'someone-else',
    createdAt: '2026-01-15T00:00:00Z',
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    selectedGameId: null,
    selectedGameName: null,
    participants: [
      { userId: 2, username: 'someone-else', turnOrder: null, joinedAt: '2026-01-15T00:00:00Z' },
    ],
    candidates: [],
  }

  let createAttempted = false

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/pick-sessions/active',
      handler: () => (createAttempted ? json(200, activeSession) : json(204)),
    },
    {
      method: 'POST',
      pattern: '/api/locations/:id/pick-sessions',
      handler: () => {
        createAttempted = true
        return json(409, { message: 'A pick session is already active for this location' })
      },
    },
  ])

  await page.goto('/locations/1/play')
  await expect(page.getByRole('heading', { name: 'Start a pick session' })).toBeVisible()

  await page.getByRole('button', { name: 'Start session' }).click()

  await expect(page.getByRole('heading', { name: 'Waiting for players' })).toBeVisible()
  await expect(page.getByText('someone-else')).toBeVisible()
})
