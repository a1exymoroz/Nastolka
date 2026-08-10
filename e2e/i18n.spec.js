import { test, expect } from './support/fixtures'

test('switches the login page language directly and persists it across reloads', async ({ page }) => {
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

test('reaches the Settings page from the settings icon and switches language there too', async ({
  page,
}) => {
  await page.goto('/login')

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View tech stack →' })).toBeVisible()

  const ruButton = page.getByRole('button', { name: 'RU' })
  await ruButton.click()

  await expect(ruButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible()

  await page.getByRole('button', { name: 'Назад' }).click()
  await expect(page.getByRole('heading', { name: 'С возвращением' })).toBeVisible()
})
