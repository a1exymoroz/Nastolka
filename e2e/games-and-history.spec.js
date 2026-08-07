import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('adds a catalog game to the location', async ({ authedPage: page }) => {
  // Location starts with only Catan assigned; Wingspan is in the catalog but
  // not yet added, so it's the option AddGameForm's <select> should offer.
  let locationGames = [{ id: 10, name: 'Catan', expansions: [], catalogExpansions: [] }]

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({ status: 200, json: locationGames }),
    },
    {
      method: 'POST',
      pattern: '/api/locations/:id/games/:gameId',
      handler: ({ params }) => {
        locationGames = [
          ...locationGames,
          { id: Number(params.gameId), name: 'Wingspan', expansions: [], catalogExpansions: [] },
        ]
        return { status: 200, json: {} }
      },
    },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Manage sharing & games' }).click()

  const addGameForm = page.locator('[data-tour="location-add-game"]')
  await addGameForm.getByRole('combobox').selectOption({ label: 'Wingspan' })
  await addGameForm.getByRole('button', { name: 'Add' }).click()

  await expect(page.getByRole('link', { name: 'Wingspan' })).toBeVisible()
})

test('logs a play session with two players', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/shares',
      handler: () => ({ status: 200, json: [{ username: 'e2e-friend' }] }),
    },
  ])

  // Navigate straight to the history form — the dice-roll selection step
  // (GameSelector.vue's 3D physics roll) is a separate flow, out of scope here.
  await page.goto('/locations/1/history/new')

  await page.getByLabel('Game').selectOption({ label: 'Catan' })
  await page.getByLabel('Played at').fill('2026-08-01')

  // Player rows have no <label>; the first combobox after "Game" (index 0)
  // is the first player row's select.
  await page.getByRole('combobox').nth(1).selectOption({ label: 'e2e-user' })
  await page.getByText('+ Add player').click()
  await page.getByRole('combobox').nth(2).selectOption({ label: 'e2e-friend' })

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history') && req.method() === 'POST',
    ),
    page.getByRole('button', { name: 'Log session' }).click(),
  ])

  await page.waitForURL('/locations/1')

  const body = request.postDataJSON()
  const usernames = body.players.map((p) => p.username)
  expect(usernames).toEqual(['e2e-user', 'e2e-friend'])
  expect(body.players.every((p) => p.placement === null)).toBe(true)
})

test('edits an existing history entry', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/shares',
      handler: () => ({ status: 200, json: [{ username: 'e2e-friend' }] }),
    },
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({
        status: 200,
        json: [
          {
            id: 1,
            gameId: 10,
            state: 'FINISHED',
            playedAt: '2026-07-01T00:00:00Z',
            players: [
              { username: 'e2e-user', placement: 1, points: 10 },
              { username: 'e2e-friend', placement: 2, points: 5 },
            ],
            rating: 7,
            expansions: [],
          },
        ],
      }),
    },
  ])

  await page.goto('/locations/1/history/1/edit')

  await expect(page.getByLabel('State')).toBeVisible()
  const ratingInput = page.getByLabel('Rating (1–10)')
  await expect(ratingInput).toHaveValue('7')
  await ratingInput.fill('9')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  expect(request.postDataJSON().rating).toBe(9)
})

test('shows a global error toast when a location games request fails', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({ status: 500, json: {} }),
    },
  ])

  await page.goto('/locations/1')

  await expect(page.getByText('The server had a problem. Please try again shortly.')).toBeVisible()
})
