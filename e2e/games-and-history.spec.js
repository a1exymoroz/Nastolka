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

test('shows a message when a BGG game search returns no results', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/games/search-external',
      handler: () => ({ status: 200, json: [] }),
    },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Manage sharing & games' }).click()

  const addGameForm = page.locator('[data-tour="location-add-game"]')
  await addGameForm.getByPlaceholder(/Search BoardGameGeek/).fill('Зелеваренье')
  await addGameForm.getByRole('button', { name: 'Search' }).click()

  await expect(addGameForm.getByText('No games found on BoardGameGeek.')).toBeVisible()
})

test('links a BGG game search result to its BoardGameGeek page', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/games/search-external',
      handler: () => ({ status: 200, json: [{ bggId: 888, name: 'Wingspan' }] }),
    },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Manage sharing & games' }).click()

  const addGameForm = page.locator('[data-tour="location-add-game"]')
  await addGameForm.getByPlaceholder(/Search BoardGameGeek/).fill('Wingspan')
  await addGameForm.getByRole('button', { name: 'Search' }).click()

  const link = addGameForm.getByRole('link', { name: 'Wingspan' })
  await expect(link).toHaveAttribute('href', 'https://boardgamegeek.com/boardgame/888')
  await expect(link).toHaveAttribute('target', '_blank')
})

test.describe('BGG expansions panel', () => {
  test('closes the panel after opening it for a game with no expansions', async ({
    authedPage: page,
  }) => {
    await mockApi(page, [])
    await page.goto('/locations/1')

    await page.getByRole('button', { name: '+ Add expansion' }).click()
    await expect(page.getByText('No expansions assigned here yet.')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()

    await expect(page.getByText('No expansions assigned here yet.')).not.toBeVisible()
    await expect(page.getByRole('button', { name: '+ Add expansion' })).toBeVisible()
  })

  test('links each search result to its BoardGameGeek page', async ({ authedPage: page }) => {
    await mockApi(page, [
      {
        method: 'GET',
        pattern: '/api/games/:gameId/expansions/search-external',
        handler: () => ({ status: 200, json: [{ bggId: 999, name: 'Seafarers of Catan' }] }),
      },
    ])

    await page.goto('/locations/1')

    await page.getByRole('button', { name: '+ Add expansion' }).click()
    await page.getByRole('button', { name: 'Find expansions on BoardGameGeek' }).click()

    const link = page.getByRole('link', { name: 'Seafarers of Catan' })
    await expect(link).toHaveAttribute('href', 'https://boardgamegeek.com/boardgame/999')
    await expect(link).toHaveAttribute('target', '_blank')
  })
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

test('the edit form has no separate back button and cancel returns to the session detail page', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
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
            players: [{ username: 'e2e-user', placement: 1, points: 10 }],
            expansions: [],
          },
        ],
      }),
    },
  ])

  await page.goto('/locations/1/history/1/edit')

  // Cancel already returns to the same place a "back" button would, so the
  // edit form doesn't show a separate one (unlike logging a brand-new session).
  await expect(page.getByText('← Back to')).not.toBeVisible()

  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.waitForURL('/locations/1/history/1')
})

test('logging a new session still shows a back button to the location', async ({
  authedPage: page,
}) => {
  await mockApi(page)

  await page.goto('/locations/1/history/new')

  await page.getByText('← Back to').click()
  await page.waitForURL('/locations/1')
})

test.describe('session times across the local/UTC boundary', () => {
  // Pinned to a zone ahead of UTC with a known DST offset (Warsaw is UTC+2 in
  // July) so the UTC->local conversion on load and local->UTC conversion on
  // submit are asserted against exact, deterministic values rather than
  // whatever timezone happens to run the test.
  test.use({ timezoneId: 'Europe/Warsaw' })

  test('converts UTC timestamps from the API to local wall-clock time on load', async ({
    authedPage: page,
  }) => {
    await mockApi(page, [
      {
        method: 'GET',
        pattern: '/api/locations/:id/shares',
        handler: () => ({ status: 200, json: [] }),
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
              state: 'IN_PROGRESS',
              // 22:00/22:30 UTC on the 1st is 00:00/00:30 local the next day
              // in Warsaw (UTC+2) — this also exercises the calendar-day
              // rollover, which a naive UTC-string slice would get wrong.
              playedAt: '2026-07-01T22:00:00Z',
              startedAt: '2026-07-01T22:30:00Z',
              players: [{ username: 'e2e-user', points: null }],
              expansions: [],
            },
          ],
        }),
      },
    ])

    await page.goto('/locations/1/history/1/edit')

    await expect(page.getByLabel('Played at')).toHaveValue('2026-07-02')
    await expect(page.getByLabel('Started at')).toHaveValue('2026-07-02T00:30')
  })

  test('sends the played-at date using the local calendar day, not UTC midnight', async ({
    authedPage: page,
  }) => {
    await mockApi(page, [
      {
        method: 'GET',
        pattern: '/api/locations/:id/shares',
        handler: () => ({ status: 200, json: [{ username: 'e2e-friend' }] }),
      },
    ])

    await page.goto('/locations/1/history/new')

    await page.getByLabel('Game').selectOption({ label: 'Catan' })
    await page.getByLabel('Played at').fill('2026-07-02')
    await page.getByRole('combobox').nth(1).selectOption({ label: 'e2e-user' })

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/api/locations/1/history') && req.method() === 'POST',
      ),
      page.getByRole('button', { name: 'Log session' }).click(),
    ])

    // Local midnight on 2026-07-02 in Warsaw (UTC+2) is 2026-07-01T22:00:00Z.
    expect(request.postDataJSON().playedAt).toBe('2026-07-01T22:00:00.000Z')
  })
})

test('auto-fills finished at when marking a session finished', async ({ authedPage: page }) => {
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
            state: 'IN_PROGRESS',
            playedAt: '2026-07-01T00:00:00Z',
            startedAt: '2026-07-01T10:00:00Z',
            players: [{ username: 'e2e-user', points: null }],
            expansions: [],
          },
        ],
      }),
    },
  ])

  await page.goto('/locations/1/history/1/edit')

  const finishedAtInput = page.getByLabel('Finished at')
  await expect(finishedAtInput).toHaveValue('')

  await page.getByLabel('State').selectOption({ label: 'Finished' })

  await expect(finishedAtInput).not.toHaveValue('')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  expect(request.postDataJSON().finishedAt).toBeTruthy()
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

test.describe('history entry date display', () => {
  // Pinned to UTC so the fixture's UTC playedAt renders as the same calendar
  // day regardless of the runner's local timezone.
  test.use({ timezoneId: 'UTC' })

  test('shows the played date without a time', async ({ authedPage: page }) => {
    await mockApi(page, [
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
              playedAt: '2026-08-09T00:00:00Z',
              players: [{ username: 'e2e-user', placement: 1, points: 10 }],
              expansions: [],
            },
          ],
        }),
      },
    ])

    await page.goto('/locations/1')

    // Exact match: pre-fix this rendered "Aug 9, 2026, 12:00 AM", which
    // wouldn't satisfy an exact-text match on the date-only string.
    await expect(page.getByText('Aug 9, 2026', { exact: true })).toBeVisible()
  })
})

test('keeps the history form date/time inputs within a mobile viewport', async ({
  authedPage: page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/shares',
      handler: () => ({ status: 200, json: [] }),
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
            players: [{ username: 'e2e-user', placement: 1, points: 10 }],
            expansions: [],
          },
        ],
      }),
    },
  ])

  // isEdit shows both Started at and Finished at side by side at >= sm — the
  // scenario reported as overflowing on a real phone.
  await page.goto('/locations/1/history/1/edit')
  await expect(page.getByLabel('Finished at')).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('shows an editable photo section on the edit form', async ({ authedPage: page }) => {
  await mockApi(page, [
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
            players: [{ username: 'e2e-user', placement: 1, points: 10 }],
            expansions: [],
          },
        ],
      }),
    },
  ])

  await page.route('**/.netlify/functions/photos-get**', (route) =>
    route.fulfill({ status: 404, json: {} }),
  )

  await page.goto('/locations/1/history/1/edit')

  await expect(page.getByText('No photo yet.')).toBeVisible()
  await expect(page.locator('input[type="file"]')).toBeAttached()
})
