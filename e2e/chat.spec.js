import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('groups consecutive same-sender messages under one header and collapses admin name+badge to badge only', async ({
  authedPage: page,
}) => {
  await mockApi(page, [
    {
      method: 'GET',
      pattern: '/api/locations/:id/chat/messages',
      handler: () => ({
        status: 200,
        json: [
          {
            id: 1,
            senderUsername: 'admin',
            senderAdmin: true,
            content: 'Welcome!',
            createdAt: '2026-09-17T15:50:00.0000000',
          },
          {
            id: 2,
            senderUsername: 'admin',
            senderAdmin: true,
            content: 'Let us know if you have questions.',
            createdAt: '2026-09-17T15:50:30.0000000',
          },
          {
            id: 3,
            senderUsername: 'e2e-user',
            senderAdmin: false,
            content: 'Thanks!',
            createdAt: '2026-09-17T15:52:00.0000000',
          },
        ],
      }),
    },
  ])

  await page.goto('/locations/1')
  const chatPanel = page.locator('[data-tour="location-chat"]')

  await expect(chatPanel.getByText('Welcome!')).toBeVisible()
  await expect(chatPanel.getByText('Let us know if you have questions.')).toBeVisible()
  await expect(chatPanel.getByText('Thanks!')).toBeVisible()

  // Two consecutive admin messages collapse into a single "Admin" badge/header, not two.
  await expect(chatPanel.getByText('Admin', { exact: true })).toHaveCount(1)
  // Admin sender shows the badge only — no separate literal "admin" username text.
  await expect(chatPanel.getByText('admin', { exact: true })).toHaveCount(0)

  // The non-own admin sender gets an avatar initial.
  await expect(chatPanel.getByText('A', { exact: true })).toBeVisible()

  // Each header (one for the admin group, one for the own message) shows a timestamp.
  await expect(chatPanel.getByText(/\d{1,2}:\d{2}\s?(AM|PM)?/i).first()).toBeVisible()
})
