import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

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

test('navigates to statistics from the location header and shows overview stats', async ({
  authedPage: page,
}) => {
  await mockApi(page)

  await page.goto('/locations/1')
  await page.getByRole('button', { name: '📊 Statistics' }).click()
  await page.waitForURL('/locations/1/statistics')

  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible()
  await expect(page.getByText('5', { exact: true })).toBeVisible()
  await expect(page.getByText('7.5')).toBeVisible()
})

test('renders "—" for null overview averages', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/statistics/overview',
      handler: () => ({
        status: 200,
        json: {
          totalFinishedSessions: 0,
          totalPlayTimeMinutes: 0,
          averageSessionLengthMinutes: null,
          averageRating: null,
        },
      }),
    },
  ])

  await page.goto('/locations/1/statistics')

  await expect(page.getByText('—')).toHaveCount(2)
})

test('games tab shows most played and an empty top-rated state independently', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/statistics/games',
      handler: () => ({
        status: 200,
        json: {
          mostPlayedGames: [{ gameId: 10, gameName: 'Catan', playCount: 5 }],
          topRatedGames: [],
          libraryCoverage: { gamesPlayed: 1, totalGamesInLibrary: 2, coveragePercentage: 50 },
        },
      }),
    },
  ])

  await page.goto('/locations/1/statistics')
  await page.getByRole('button', { name: 'Games' }).click()

  await expect(page.getByText('Catan')).toBeVisible()
  await expect(page.getByText('No games with enough ratings yet.')).toBeVisible()
})

test('activity tab toggles granularity and refetches', async ({ authedPage: page }) => {
  const requestedGranularities = []
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/statistics/activity',
      handler: ({ url }) => {
        const granularity = url.searchParams.get('granularity') ?? 'MONTH'
        requestedGranularities.push(granularity)
        return { status: 200, json: { granularity, buckets: [{ bucketStart: '2026-09-01', sessionCount: 3 }] } }
      },
    },
  ])

  await page.goto('/locations/1/statistics')
  await page.getByRole('button', { name: 'Activity' }).click()
  await expect(page.locator('canvas')).toBeVisible()

  await page.getByRole('button', { name: 'Week', exact: true }).click()
  await expect.poll(() => requestedGranularities.at(-1)).toBe('WEEK')
})

test('a user with no access to the location sees a no-access message', async ({ page }) => {
  await signInAs(page, 'e2e-stranger')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id', handler: () => ({ status: 403, json: { message: 'Forbidden' } }) },
  ])

  await page.goto('/locations/1/statistics')

  await expect(page.getByText("You don't have access to this location's statistics")).toBeVisible()
})
