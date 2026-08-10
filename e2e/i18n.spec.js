import { test, expect } from './support/fixtures'

test('switches the app language from settings and persists it across reloads', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  const plButton = page.getByRole('button', { name: 'PL' })
  await plButton.click()

  await expect(plButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Ustawienia' })).toBeVisible()
  await expect(page.evaluate(() => window.localStorage.getItem('nastolka-locale'))).resolves.toBe(
    'pl',
  )

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Ustawienia' })).toBeVisible()

  await page.getByRole('button', { name: 'Wstecz' }).click()
  await expect(page.getByRole('heading', { name: 'Witaj ponownie' })).toBeVisible()
})
