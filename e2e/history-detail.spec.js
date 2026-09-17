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

test('shows the top-3 podium reveal for a finished session with fewer than 3 players', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()

  const podiumContainer = page.locator('[aria-label="Catan top 3 podium (2D)"]')
  await expect(podiumContainer).toBeVisible()
  await expect(podiumContainer.locator('svg').first()).toBeVisible()

  await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible()
  await page.getByRole('button', { name: 'Replay' }).click()

  // the plain-text player list stays visible alongside the podium
  await expect(page.getByText('e2e-user (10 pts)')).toBeVisible()
  await expect(page.getByText('e2e-friend (5 pts)')).toBeVisible()
})

test('shows a help tooltip explaining the podium reveal', async ({ authedPage: page }) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await page.getByRole('button', { name: "What's this?" }).hover()
  await expect(page.getByRole('tooltip')).toContainText('Replay to watch it again')
})

test('shows all 3 podiums for a finished session with exactly 3 placed players', async ({
  authedPage: page,
}) => {
  const threePlayerEntry = {
    ...HISTORY_ENTRY,
    players: [
      { username: 'e2e-user', placement: 1, points: 20 },
      { username: 'e2e-friend', placement: 2, points: 12 },
      { username: 'e2e-third', placement: 3, points: 5 },
    ],
  }
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({ status: 200, json: [threePlayerEntry] }),
    },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
  const podiumContainer = page.locator('[aria-label="Catan top 3 podium (2D)"]')
  await expect(podiumContainer).toBeVisible()
  await expect(podiumContainer.locator('svg').first()).toBeVisible()
  await expect(page.getByText('e2e-third (5 pts)')).toBeVisible()
})

test('podium shows the Everdell critter token matching a player\'s recorded meeples', async ({
  authedPage: page,
}) => {
  const everdellEntry = {
    ...HISTORY_ENTRY,
    gameName: 'Everdell',
    players: [
      { username: 'e2e-user', placement: 1, points: 20, meeples: 'everdell_squirrel' },
      { username: 'e2e-friend', placement: 2, points: 12 },
    ],
  }
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/games',
      handler: () => ({
        status: 200,
        json: [{ id: 10, bggId: 199792, name: 'Everdell', expansions: [], catalogExpansions: [] }],
      }),
    },
    {
      method: 'GET',
      pattern: '/api/locations/:id/history',
      handler: () => ({ status: 200, json: [everdellEntry] }),
    },
  ])

  await page.goto('/locations/1/history/1')

  const podiumContainer = page.locator('[aria-label="Everdell top 3 podium (2D)"]')
  await expect(podiumContainer).toBeVisible()
  // '#de553c' is the fixed color of the everdell token set's 'everdell_squirrel'
  // piece (src/utils/tokenSets.js) — the 1st-place player recorded that
  // meeples value, so the podium should render exactly that token for them.
  await expect(podiumContainer.locator('svg[fill="#de553c"]')).toBeVisible()

  // The plain-text player list below the podium names the meeple, with its
  // own icon, too — not just the podium avatar.
  const firstPlayerItem = page.getByText('e2e-user (20 pts) — Squirrel')
  await expect(firstPlayerItem).toBeVisible()
  await expect(firstPlayerItem.locator('svg[fill="#de553c"]')).toBeVisible()
  await expect(page.getByText('e2e-friend (12 pts)')).toBeVisible()
})

test('keeps the top-3 podium within a mobile viewport', async ({ authedPage: page }) => {
  await page.setViewportSize({ width: 375, height: 667 })

  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  const podiumContainer = page.locator('[aria-label="Catan top 3 podium (2D)"]')
  await expect(podiumContainer).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('shows an outcome badge and an unranked player list for a cooperative/solo session', async ({
  authedPage: page,
}) => {
  const coopEntry = {
    ...HISTORY_ENTRY,
    outcome: 'WON',
    players: [
      { username: 'e2e-user', placement: null, points: null },
      { username: 'e2e-friend', placement: null, points: null },
    ],
  }
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [coopEntry] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
  await expect(page.getByText('Won', { exact: true })).toBeVisible()

  // no numbered ranking and no podium for an outcome-based (coop/solo) session
  await expect(page.locator('ol')).toHaveCount(0)
  await expect(page.locator('[aria-label="Catan top 3 podium (2D)"]')).not.toBeVisible()

  await expect(page.getByText('e2e-user', { exact: true })).toBeVisible()
  await expect(page.getByText('e2e-friend', { exact: true })).toBeVisible()
})

test('a shared (non-owner) user sees the session but no Edit button', async ({ page }) => {
  // View access is derived purely from whether the location itself loads —
  // same as LocationDetail.vue — so a shared user just needs the location
  // GET to succeed for them, same as it does for the owner in mockApi's
  // default handler.
  await signInAs(page, 'e2e-friend')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
})

test('a user with no relationship to the location sees a no-access message', async ({ page }) => {
  // Simulates the backend rejecting the location fetch for a user it's not
  // shared with — the frontend has no independent access check of its own.
  await signInAs(page, 'e2e-stranger')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id', handler: () => ({ status: 403, json: { message: 'Forbidden' } }) },
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByText("You don't have access to this session")).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Catan' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: /Rate \d+ out of 10/ })).toHaveCount(0)
})

test('a shared (non-owner) user can submit a vote, updating the average and count', async ({
  page,
}) => {
  // Voting requires only view access — same rule as viewing the page itself
  // (see the 'no Edit button' test above) — so a shared, non-managing user
  // must still be able to cast a vote.
  await signInAs(page, 'e2e-friend')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
    {
      method: 'POST',
      pattern: '/api/locations/:id/history/:historyId/votes',
      handler: async ({ request }) => {
        const { score } = request.postDataJSON()
        return {
          status: 200,
          json: {
            ...HISTORY_ENTRY,
            votes: [{ username: 'e2e-friend', score, votedAt: '2026-07-02T00:00:00Z' }],
            averageRating: score,
            voteCount: 1,
          },
        }
      },
    },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByText('No ratings yet')).toBeVisible()

  await page.getByRole('button', { name: 'Rate 8 out of 10' }).click()

  await expect(page.getByText(/8\.0/)).toBeVisible()
  await expect(page.getByText(/\(1 vote\)/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rate 8 out of 10' })).toHaveAttribute('aria-pressed', 'true')
})

test('re-voting updates the existing vote instead of duplicating it', async ({ page }) => {
  await signInAs(page, 'e2e-friend')
  const voteRequests = []

  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
    {
      method: 'POST',
      pattern: '/api/locations/:id/history/:historyId/votes',
      handler: async ({ request }) => {
        const { score } = request.postDataJSON()
        voteRequests.push(score)
        return {
          status: 200,
          json: {
            ...HISTORY_ENTRY,
            votes: [{ username: 'e2e-friend', score, votedAt: '2026-07-02T00:00:00Z' }],
            averageRating: score,
            voteCount: 1,
          },
        }
      },
    },
  ])

  await page.goto('/locations/1/history/1')

  await page.getByRole('button', { name: 'Rate 5 out of 10' }).click()
  await expect(page.getByText(/5\.0/)).toBeVisible()

  await page.getByRole('button', { name: 'Rate 8 out of 10' }).click()
  await expect(page.getByText(/8\.0/)).toBeVisible()
  await expect(page.getByText(/\(1 vote\)/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rate 5 out of 10' })).toHaveAttribute('aria-pressed', 'false')

  expect(voteRequests).toEqual([5, 8])
})

test('labels the personal rating widget on the detail page too', async ({ authedPage: page }) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByText('Your rating')).toBeVisible()
})

test('highlights the session winner with a distinct rank badge on the detail page', async ({
  authedPage: page,
}) => {
  const rankedEntry = {
    ...HISTORY_ENTRY,
    players: [
      { username: 'e2e-user', placement: 1, points: 20 },
      { username: 'e2e-friend', placement: 2, points: 12 },
    ],
  }
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [rankedEntry] }) },
  ])

  await page.goto('/locations/1/history/1')

  // Scoped to `ol li` (the ranked player rows) so it doesn't also match the
  // podium reveal above it, which has its own svg icons.
  const firstPlace = page.locator('ol li').filter({ hasText: 'e2e-user' })
  const secondPlace = page.locator('ol li').filter({ hasText: 'e2e-friend' })
  await expect(firstPlace.locator('svg')).toHaveCount(1)
  await expect(secondPlace.locator('svg')).toHaveCount(0)
})

test('a failed vote submission shows an inline error and leaves the previous vote unchanged', async ({
  page,
}) => {
  await signInAs(page, 'e2e-friend')
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
    {
      method: 'POST',
      pattern: '/api/locations/:id/history/:historyId/votes',
      handler: () => ({ status: 500, json: {} }),
    },
  ])

  await page.goto('/locations/1/history/1')

  await page.getByRole('button', { name: 'Rate 8 out of 10' }).click()

  await expect(page.getByText('Failed to submit your rating')).toBeVisible()
  await expect(page.getByText('No ratings yet')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rate 8 out of 10' })).toHaveAttribute('aria-pressed', 'false')
})

test('hides the voting widget for a session that is not finished', async ({ authedPage: page }) => {
  const inProgressEntry = { ...HISTORY_ENTRY, state: 'IN_PROGRESS' }
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [inProgressEntry] }) },
  ])

  await page.goto('/locations/1/history/1')

  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Rate \d+ out of 10/ })).toHaveCount(0)
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

test('owner can add and then remove a session photo from the detail page', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  let hasPhoto = false
  const photoSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#4f46e5"/></svg>'

  await page.route('**/.netlify/functions/photos-get**', (route) =>
    hasPhoto
      ? route.fulfill({ status: 200, contentType: 'image/svg+xml', body: photoSvg })
      : route.fulfill({ status: 404, json: {} }),
  )
  await page.route('**/.netlify/functions/photos-upload**', (route) => {
    hasPhoto = true
    return route.fulfill({ status: 200, json: {} })
  })
  await page.route('**/.netlify/functions/photos-delete**', (route) => {
    hasPhoto = false
    return route.fulfill({ status: 204 })
  })

  await page.goto('/locations/1/history/1')

  await expect(page.getByText('No photo yet.')).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'photo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(photoSvg),
  })

  await expect(page.getByText('Replace photo')).toBeVisible()
  await expect(page.getByText('No photo yet.')).not.toBeVisible()

  await page.getByRole('button', { name: 'Remove photo' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Remove', exact: true }).click()

  await expect(page.getByText('No photo yet.')).toBeVisible()
})

test('rejects a non-image file picked for the session photo without calling the server', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  await page.route('**/.netlify/functions/photos-get**', (route) =>
    route.fulfill({ status: 404, json: {} }),
  )

  let uploadCalled = false
  await page.route('**/.netlify/functions/photos-upload**', (route) => {
    uploadCalled = true
    return route.fulfill({ status: 200, json: {} })
  })

  await page.goto('/locations/1/history/1')

  await expect(page.getByText('No photo yet.')).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('just some text, not an image'),
  })

  await expect(page.getByText('That file is not an image.')).toBeVisible()
  await expect(page.getByText('No photo yet.')).toBeVisible()
  expect(uploadCalled).toBe(false)
})

test('keeps the rotate/save buttons clickable after rotating a lightbox photo', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    { method: 'GET', pattern: '/api/locations/:id/history', handler: () => ({ status: 200, json: [HISTORY_ENTRY] }) },
  ])

  // A wide, short image: rotated 90°, its visual footprint becomes tall and
  // narrow, overflowing well past its allotted height into the button row
  // below it — this is what reproduces the paint-order bug on unpatched code.
  const photoSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="100">' +
    '<rect width="2000" height="100" fill="#4f46e5"/></svg>'

  await page.route('**/.netlify/functions/photos-get**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: photoSvg }),
  )

  await page.goto('/locations/1/history/1')
  await page.getByRole('button', { name: 'View photo' }).click()

  await page.getByRole('button', { name: 'Rotate right' }).click()

  // A real click, subject to Playwright's actionability checks: if the
  // rotated photo visually covers this button, the click is intercepted by
  // the photo and times out instead of landing on the button.
  await page.getByRole('button', { name: 'Save rotated photo' }).click({ timeout: 5000 })
})
