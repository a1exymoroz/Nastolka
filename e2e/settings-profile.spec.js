import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('saves a display name from Settings', async ({ authedPage: page }) => {
  await mockApi(page, [])

  await page.goto('/settings')
  await expect(page.getByLabel('Display name')).toHaveValue('')

  await page.getByLabel('Display name').fill('Ace')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/users/me') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save' }).click(),
  ])

  const body = request.postDataJSON()
  expect(body.displayName).toBe('Ace')

  await expect(page.getByText('Display name saved')).toBeVisible()
})

test('shows an error when saving the display name fails', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'PUT',
      pattern: '/api/users/me',
      handler: () => ({ status: 500, json: { message: 'Something broke' } }),
    },
  ])

  await page.goto('/settings')
  await page.getByLabel('Display name').fill('Ace')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Something broke')).toBeVisible()
})
