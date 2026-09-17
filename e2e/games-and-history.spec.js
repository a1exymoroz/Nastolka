import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('does not probe history entries without photos', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({
        status: 200,
        json: [{ id: 12, gameId: 10, gameName: 'Catan', state: 'CREATED', players: [] }],
      }),
    },
  ])

  let photoGetRequests = 0
  await page.route('**/.netlify/functions/photos-list**', (route) =>
    route.fulfill({ status: 200, json: { entryIds: [] } }),
  )
  await page.route('**/.netlify/functions/photos-get**', (route) => {
    photoGetRequests += 1
    return route.fulfill({ status: 500, json: {} })
  })

  await page.goto('/locations/1')
  await expect(page.getByText('Catan')).toBeVisible()
  expect(photoGetRequests).toBe(0)
})

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

test('switches the games panel to a thumbnails-only view', async ({ authedPage: page }) => {
  await mockApi(page, [])
  await page.goto('/locations/1')

  await expect(page.getByRole('link', { name: 'Catan' })).toBeVisible()

  await page.getByRole('button', { name: 'Thumbnails' }).click()

  // The thumbnail view drops the name/expansion chrome, leaving just a
  // cover-image link through to the game's detail page.
  await expect(page.getByRole('link', { name: 'Catan' })).not.toBeVisible()
  await expect(page.locator('a[href="/games/10"]')).toBeVisible()
})

test('scrolls the games list instead of growing the page when there are many games', async ({
  authedPage: page,
}) => {
  const manyGames = Array.from({ length: 20 }, (_, i) => ({
    id: 10 + i,
    name: `Game ${i + 1}`,
    expansions: [],
    catalogExpansions: [],
  }))

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({ status: 200, json: manyGames }),
    },
  ])

  await page.goto('/locations/1')

  const lastGameLink = page.getByRole('link', { name: 'Game 20', exact: true })
  await expect(page.getByRole('link', { name: 'Game 1', exact: true })).toBeVisible()

  const scrollContainer = lastGameLink.locator(
    'xpath=ancestor::*[contains(@class, "overflow-y-auto")][1]',
  )
  const { scrollHeight, clientHeight } = await scrollContainer.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }))
  expect(scrollHeight).toBeGreaterThan(clientHeight)

  await lastGameLink.scrollIntoViewIfNeeded()
  await expect(lastGameLink).toBeVisible()
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

  // Save navigates to the newly created entry's detail page (mock returns id: 100).
  await page.waitForURL('/locations/1/history/100')

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

  // Save navigates to the edited entry's own detail page, not the location page.
  await page.waitForURL('/locations/1/history/1')

  expect(request.postDataJSON().rating).toBe(9)
})

test('picks a meeple for a player when editing an Everdell session', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({ status: 200, json: [{ id: 20, bggId: 199792, name: 'Everdell', expansions: [], catalogExpansions: [] }] }),
    },
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
            gameId: 20,
            gameName: 'Everdell',
            state: 'FINISHED',
            playedAt: '2026-07-01T00:00:00Z',
            players: [
              { username: 'e2e-user', placement: 1, points: 10, meeples: 'everdell_squirrel' },
              { username: 'e2e-friend', placement: 2, points: 5 },
            ],
            expansions: [],
          },
        ],
      }),
    },
  ])

  await page.goto('/locations/1/history/1/edit')

  const meepleButtons = page.getByTitle('Meeples (optional)')
  // First player's meeple ('everdell_squirrel') is prefilled from the response as its name.
  await expect(meepleButtons.nth(0)).toHaveText('Squirrel')

  // Second player has none set — its dropdown must disable the meeple the
  // first player already holds, so the same meeple can't be picked twice.
  await meepleButtons.nth(1).click()
  await expect(page.getByRole('option', { name: 'Squirrel' })).toBeDisabled()

  // Pick a different, still-available meeple from the dropdown.
  await page.getByRole('option', { name: 'Elephant' }).click()
  await expect(meepleButtons.nth(1)).toHaveText('Elephant')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  expect(request.postDataJSON().players.map((p) => p.meeples)).toEqual([
    'everdell_squirrel',
    'everdell_elephant',
  ])
})

test('shows a help tooltip about meeple exclusivity when editing a game with a token set', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({ status: 200, json: [{ id: 20, bggId: 199792, name: 'Everdell', expansions: [], catalogExpansions: [] }] }),
    },
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({
        status: 200,
        json: [
          {
            id: 1,
            gameId: 20,
            gameName: 'Everdell',
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

  await page.getByRole('button', { name: "What's this?" }).hover()
  await expect(page.getByRole('tooltip')).toContainText('one player per session')
})

test('hides the meeple help tooltip for a game without a token set', async ({ authedPage: page }) => {
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

  // Catan has no known token set, so the meeple picker (and its tooltip) never renders.
  await expect(page.getByRole('button', { name: "What's this?" })).toHaveCount(0)
})

test('only offers meeples for the currently selected game', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({
        status: 200,
        json: [
          { id: 10, name: 'Catan', expansions: [], catalogExpansions: [] },
          { id: 20, bggId: 199792, name: 'Everdell', expansions: [], catalogExpansions: [] },
        ],
      }),
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
            gameName: 'Catan',
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

  // Catan has no known token set, so no meeple picker shows at all.
  await expect(page.getByTitle('Meeples (optional)')).toHaveCount(0)

  await page.getByLabel('Game').selectOption({ label: 'Everdell' })

  // Switching to Everdell reveals the picker, offering only its own 4
  // critters — nothing leaked in from another game's set.
  const meepleButton = page.getByTitle('Meeples (optional)')
  await expect(meepleButton).toHaveCount(1)
  await meepleButton.click()
  // Scoped to the picker's own listbox — a native <select>'s <option>s also
  // carry an implicit 'option' role, so an unscoped query would over-match.
  const meepleOptions = page.getByRole('listbox').getByRole('option')
  await expect(meepleOptions).toHaveCount(4)
  for (const name of ['Squirrel', 'Rabbit', 'Hedgehog', 'Elephant']) {
    await expect(meepleOptions.filter({ hasText: name })).toBeVisible()
  }
})

test('only offers meeples for Brass: Birmingham when it is the currently selected game', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({
        status: 200,
        json: [{ id: 30, bggId: 224517, name: 'Brass: Birmingham', expansions: [], catalogExpansions: [] }],
      }),
    },
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({
        status: 200,
        json: [
          {
            id: 1,
            gameId: 30,
            gameName: 'Brass: Birmingham',
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

  const meepleButton = page.getByTitle('Meeples (optional)')
  await expect(meepleButton).toHaveCount(1)
  await meepleButton.click()
  const meepleOptions = page.getByRole('listbox').getByRole('option')
  await expect(meepleOptions).toHaveCount(8)
  for (const name of [
    'Robert Owen',
    'Richard Arkwright',
    'Sir Henry Bessemer',
    'James Watt',
    'Isambard Kingdom Brunel',
    'George Stephenson',
    'Eliza Tinsley',
    'Eleanor Coade',
  ]) {
    await expect(meepleOptions.filter({ hasText: name })).toBeVisible()
  }

  // Each token's portrait is bordered in its character's faction color,
  // matching the physical game's discs.
  await expect(meepleOptions.filter({ hasText: 'Robert Owen' }).locator('img')).toHaveCSS('border-color', 'rgb(147, 51, 234)')
  await expect(meepleOptions.filter({ hasText: 'Richard Arkwright' }).locator('img')).toHaveCSS('border-color', 'rgb(220, 38, 38)')
})

test('picks a meeple for a player when editing a Brass: Birmingham session', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({ status: 200, json: [{ id: 30, bggId: 224517, name: 'Brass: Birmingham', expansions: [], catalogExpansions: [] }] }),
    },
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
            gameId: 30,
            gameName: 'Brass: Birmingham',
            state: 'FINISHED',
            playedAt: '2026-07-01T00:00:00Z',
            players: [
              { username: 'e2e-user', placement: 1, points: 10, meeples: 'brassbirmingham_owen' },
              { username: 'e2e-friend', placement: 2, points: 5 },
            ],
            expansions: [],
          },
        ],
      }),
    },
  ])

  await page.goto('/locations/1/history/1/edit')

  const meepleButtons = page.getByTitle('Meeples (optional)')
  // First player's meeple ('brassbirmingham_owen') is prefilled from the response as its name.
  await expect(meepleButtons.nth(0)).toHaveText('Robert Owen')

  // Second player has none set — pick one from the dropdown.
  await meepleButtons.nth(1).click()
  await page.getByRole('option', { name: 'James Watt' }).click()
  await expect(meepleButtons.nth(1)).toHaveText('James Watt')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  expect(request.postDataJSON().players.map((p) => p.meeples)).toEqual([
    'brassbirmingham_owen',
    'brassbirmingham_watt',
  ])
})

test('offers Brass: Birmingham\'s meeples for Brass: Lancashire too, since they share the same tokens', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({
        status: 200,
        json: [{ id: 31, bggId: 28720, name: 'Brass: Lancashire', expansions: [], catalogExpansions: [] }],
      }),
    },
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({
        status: 200,
        json: [
          {
            id: 1,
            gameId: 31,
            gameName: 'Brass: Lancashire',
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

  const meepleButton = page.getByTitle('Meeples (optional)')
  await expect(meepleButton).toHaveCount(1)
  await meepleButton.click()
  const meepleOptions = page.getByRole('listbox').getByRole('option')
  await expect(meepleOptions).toHaveCount(8)
  for (const name of [
    'Robert Owen',
    'Richard Arkwright',
    'Sir Henry Bessemer',
    'James Watt',
    'Isambard Kingdom Brunel',
    'George Stephenson',
    'Eliza Tinsley',
    'Eleanor Coade',
  ]) {
    await expect(meepleOptions.filter({ hasText: name })).toBeVisible()
  }
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

  // Points are required once a session is finished, so fill one in before saving.
  await page.getByTitle('Points (optional)').fill('10')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  expect(request.postDataJSON().finishedAt).toBeTruthy()
})

test('requires points for every player before finishing a session', async ({
  authedPage: page,
}) => {
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

  let putSent = false
  page.on('request', (req) => {
    if (req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT') {
      putSent = true
    }
  })

  await page.goto('/locations/1/history/1/edit')

  await page.getByLabel('State').selectOption({ label: 'Finished' })
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(
    page.getByText('Points are required for every player once the session is finished.'),
  ).toBeVisible()
  expect(putSent).toBe(false)

  const pointsInput = page.getByTitle('Points (optional)')
  await expect(pointsInput).toHaveClass(/border-red-500/)
  await expect(pointsInput).toHaveAttribute('aria-invalid', 'true')

  await pointsInput.fill('10')
  await expect(pointsInput).not.toHaveClass(/border-red-500/)
})

test('sends outcome without requiring points for a cooperative/solo session', async ({
  authedPage: page,
}) => {
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

  await page.getByLabel('State').selectOption({ label: 'Finished' })
  await page.getByLabel('Outcome (optional)').selectOption({ label: 'Won' })

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1/history/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  const body = request.postDataJSON()
  expect(body.outcome).toBe('WON')
  expect(body.players[0].placement).toBeNull()
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

test.describe('history card community rating', () => {
  const FINISHED_ENTRY = {
    id: 1,
    gameId: 10,
    gameName: 'Catan',
    state: 'FINISHED',
    playedAt: '2026-07-01T00:00:00Z',
    players: [{ username: 'e2e-user', placement: 1, points: 10 }],
    expansions: [],
  }

  test('shows the community average badge on a history card once it has votes', async ({
    authedPage: page,
  }) => {
    await mockApi(page, [
      {
        method: 'GET',
        pattern: '/api/locations/:id/history',
        handler: () => ({
          status: 200,
          json: [{ ...FINISHED_ENTRY, averageRating: 7.5, voteCount: 4 }],
        }),
      },
    ])

    await page.goto('/locations/1')

    await expect(page.getByText('★7.5 (4)')).toBeVisible()
  })

  test('does not show the community average badge before any votes exist', async ({
    authedPage: page,
  }) => {
    await mockApi(page, [
      {
        method: 'GET',
        pattern: '/api/locations/:id/history',
        handler: () => ({ status: 200, json: [{ ...FINISHED_ENTRY, rating: 6 }] }),
      },
    ])

    await page.goto('/locations/1')

    // The legacy editor-set rating badge still shows on its own...
    await expect(page.getByText('6/10')).toBeVisible()
    // ...but no community-average badge, since voteCount is absent/zero.
    await expect(page.getByText(/★\d/)).toHaveCount(0)
  })

  test('submits a vote from the history list card and reflects it inline', async ({
    authedPage: page,
  }) => {
    const voteRequests = []

    await mockApi(page, [
      {
        method: 'GET',
        pattern: '/api/locations/:id/history',
        handler: () => ({ status: 200, json: [FINISHED_ENTRY] }),
      },
      {
        method: 'POST',
        pattern: '/api/locations/:id/history/:historyId/votes',
        handler: async ({ request }) => {
          const { score } = request.postDataJSON()
          voteRequests.push(score)
          return {
            status: 200,
            json: {
              ...FINISHED_ENTRY,
              votes: [{ username: 'e2e-user', score, votedAt: '2026-07-02T00:00:00Z' }],
              averageRating: score,
              voteCount: 1,
            },
          }
        },
      },
    ])

    await page.goto('/locations/1')

    await page.getByRole('button', { name: 'Rate 9 out of 10' }).click()

    expect(voteRequests).toEqual([9])
    await expect(page.getByText('★9.0 (1)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rate 9 out of 10' })).toHaveAttribute('aria-pressed', 'true')
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
