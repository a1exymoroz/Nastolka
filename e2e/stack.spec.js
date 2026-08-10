import { test, expect } from './support/fixtures'

test('stack page documents the Telegram bot, real-time chat, and current hosting setup', async ({
  page,
}) => {
  await page.goto('/stack')

  await expect(page.getByRole('heading', { name: 'Tech stack' })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Telegram bot', exact: true })).toBeVisible()
  await expect(
    page.locator('a[href="https://github.com/a1exymoroz/Nastolka-telegram"]'),
  ).toBeVisible()

  await expect(page.getByRole('cell', { name: 'Real-time' }).first()).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'STOMP.js + SockJS (location chat over WebSocket)' }),
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'Spring WebSocket + STOMP (location chat)' }),
  ).toBeVisible()

  await expect(page.getByText('Northflank + Neon (backend, Render fallback)')).toBeVisible()
})
