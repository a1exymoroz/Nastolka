import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('sets a Telegram chat id from the location edit form', async ({ authedPage: page }) => {
  await mockApi(page, [])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Edit location' }).click()

  await page.getByLabel('Telegram Chat ID').fill('-100123456789')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/locations/1') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ])

  const body = request.postDataJSON()
  expect(body.telegramChatId).toBe('-100123456789')

  // The mocked PUT handler echoes the request body back as the updated
  // location, so the page leaves edit mode and re-shows "Edit location".
  await expect(page.getByRole('button', { name: 'Edit location' })).toBeVisible()
})

test('shows a Telegram icon on the locations list only for locations with a chat configured', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations',
      handler: () =>
        ({
          status: 200,
          json: [
            { id: 1, name: 'Test Location', description: '', ownerUsername: 'e2e-user' },
            {
              id: 2,
              name: 'Wired Up Location',
              description: '',
              ownerUsername: 'e2e-user',
              telegramChatId: '-100123456789',
            },
          ],
        }),
    },
  ])

  await page.goto('/')

  const plainCard = page.locator('li', { hasText: 'Test Location' })
  const wiredCard = page.locator('li', { hasText: 'Wired Up Location' })

  await expect(plainCard.getByRole('img', { name: 'Notifies a Telegram chat' })).toHaveCount(0)
  await expect(wiredCard.getByRole('img', { name: 'Notifies a Telegram chat' })).toBeVisible()
})
