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

  await sharingPanel.getByRole('checkbox', { name: 'Can edit info' }).check()
  await sharingPanel.getByRole('button', { name: 'Share' }).click()

  await expect(sharingPanel.getByText('e2e-friend', { exact: true })).toBeVisible()
  await expect(sharingPanel.getByRole('button', { name: 'Revoke' })).toBeVisible()
  expect(shares).toEqual([
    { username: 'e2e-friend', canEditInfo: true, canManageGames: false, canManageHistory: false },
  ])
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

test('grants permissions on an existing share', async ({ authedPage: page }) => {
  let shares = [
    { username: 'e2e-friend', canEditInfo: false, canManageGames: false, canManageHistory: false },
  ]

  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/shares',
      handler: () => ({ status: 200, json: shares }),
    },
    {
      method: 'PATCH',
      pattern: '/api/locations/:id/shares/:username',
      handler: async ({ request, params }) => {
        shares = shares.map((share) =>
          share.username === params.username ? { ...share, ...request.postDataJSON() } : share,
        )
        return { status: 200, json: shares.find((share) => share.username === params.username) }
      },
    },
  ])

  await page.goto('/locations/1')
  await page.getByRole('button', { name: 'Manage sharing & games' }).click()

  const sharingPanel = page.locator('[data-tour="location-sharing"]')
  const shareRow = sharingPanel.locator('li', { hasText: 'e2e-friend' })
  const saveButton = shareRow.getByRole('button', { name: 'Save' })
  const canManageGamesCheckbox = shareRow.getByRole('checkbox', { name: 'Can manage games' })

  await expect(saveButton).toBeDisabled()

  await canManageGamesCheckbox.check()
  await expect(saveButton).toBeEnabled()

  await saveButton.click()

  await expect(saveButton).toBeDisabled()
  await expect(canManageGamesCheckbox).toBeChecked()
})
