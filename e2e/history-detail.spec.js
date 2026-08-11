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

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Remove photo' }).click()

  await expect(page.getByText('No photo yet.')).toBeVisible()
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
