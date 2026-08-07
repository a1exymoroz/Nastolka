import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('shows debounced search suggestions and adds a share', async ({ authedPage: page }) => {
  let shares = []

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/shares',
      handler: () => ({ status: 200, json: shares }),
    },
    {
      method: 'POST',
      pattern: '/api/locations/:id/shares',
      handler: async ({ request }) => {
        shares = [...shares, request.postDataJSON()]
        return { status: 201, json: request.postDataJSON() }
      },
    },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Manage sharing & games' }).click()

  const sharingPanel = page.locator('[data-tour="location-sharing"]')
  await sharingPanel.getByPlaceholder('Search a username to share with…').fill('e2e-fr')

  await sharingPanel.getByText('e2e-friend', { exact: true }).click()
  await expect(sharingPanel.getByPlaceholder('Search a username to share with…')).toHaveValue(
    'e2e-friend',
  )

  await sharingPanel.getByRole('button', { name: 'Share' }).click()

  await expect(sharingPanel.getByText('e2e-friend', { exact: true })).toBeVisible()
  await expect(sharingPanel.getByRole('button', { name: 'Revoke' })).toBeVisible()
})

test('revokes an existing share', async ({ authedPage: page }) => {
  let shares = [{ username: 'e2e-friend' }]

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/shares',
      handler: () => ({ status: 200, json: shares }),
    },
    {
      method: 'DELETE',
      pattern: '/api/locations/:id/shares/:username',
      handler: () => {
        shares = []
        return { status: 204 }
      },
    },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Manage sharing & games' }).click()
  page.once('dialog', (dialog) => dialog.accept())

  const sharingPanel = page.locator('[data-tour="location-sharing"]')
  await sharingPanel.getByRole('button', { name: 'Revoke' }).click()

  await expect(sharingPanel.getByText('Not shared with anyone yet.')).toBeVisible()
})
