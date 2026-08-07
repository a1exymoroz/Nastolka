import { test, expect } from './support/fixtures'

test('switches the login page language and persists it across reloads', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  const plButton = page.getByRole('button', { name: 'PL' })
  await plButton.click()

  await expect(plButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Witaj ponownie' })).toBeVisible()
  await expect(page.evaluate(() => window.localStorage.getItem('nastolka-locale'))).resolves.toBe(
    'pl',
  )

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Witaj ponownie' })).toBeVisible()
})
