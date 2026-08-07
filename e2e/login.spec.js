import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('signs in with valid credentials and lands on locations', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login')

  await page.getByLabel('Username').fill('e2e-user')
  await page.getByLabel('Password').fill('correct-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL('/')
  await expect(page.getByRole('heading', { name: 'Nastolka' })).toBeVisible()
  await expect(page.evaluate(() => window.localStorage.getItem('auth_token'))).resolves.toBe(
    'e2e-test-token',
  )
})

test('shows an inline error on invalid credentials', async ({ page }) => {
  await mockApi(page, [
    {
      method: 'POST',
      pattern: '/api/auth/login',
      handler: () => ({ status: 401, json: { message: 'Invalid username or password' } }),
    },
  ])
  await page.goto('/login')

  await page.getByLabel('Username').fill('e2e-user')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Invalid username or password')).toBeVisible()
  expect(page.url()).toContain('/login')
})

test('shows a global error toast when login hits a server error', async ({ page }) => {
  await mockApi(page, [
    { method: 'POST', pattern: '/api/auth/login', handler: () => ({ status: 500, json: {} }) },
  ])
  await page.goto('/login')

  await page.getByLabel('Username').fill('e2e-user')
  await page.getByLabel('Password').fill('any-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('The server had a problem. Please try again shortly.')).toBeVisible()
})
