import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('changes the username from Settings', async ({ authedPage: page }) => {
  await mockApi(page, [])

  await page.goto('/settings')
  await expect(page.getByLabel('Username')).toHaveValue('e2e-user')

  await page.getByLabel('Username').fill('renamed-user')

  const [request] = await Promise.all([
    page.waitForRequest(
      (req) => req.url().includes('/api/users/me') && req.method() === 'PUT',
    ),
    page.getByRole('button', { name: 'Save' }).click(),
  ])

  const body = request.postDataJSON()
  expect(body.username).toBe('renamed-user')

  await expect(page.getByText('Username updated')).toBeVisible()
  await expect(page.getByLabel('Username')).toHaveValue('renamed-user')
})

test('shows an error when saving the username fails', async ({ authedPage: page }) => {
  await mockApi(page, [
    {
      method: 'PUT',
      pattern: '/api/users/me',
      handler: () => ({ status: 500, json: { message: 'Something broke' } }),
    },
  ])

  await page.goto('/settings')
  await page.getByLabel('Username').fill('renamed-user')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Something broke')).toBeVisible()
})
