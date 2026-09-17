import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test.describe('confirm dialog', () => {
  test('shows the item name and Cancel closes it without deleting', async ({ authedPage: page }) => {
    let deleteCalled = false
    await mockApi(page, [
      {
        method: 'DELETE',
        pattern: '/api/locations/:id',
        handler: () => {
          deleteCalled = true
          return { status: 204 }
        },
      },
    ])

    await page.goto('/')
    await page.getByRole('button', { name: 'Delete' }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Test Location')

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
    expect(deleteCalled).toBe(false)
    await expect(page.getByText('Test Location')).toBeVisible()
  })

  test('Delete removes the item and closes the dialog', async ({ authedPage: page }) => {
    let deleteCalled = false
    await mockApi(page, [
      {
        method: 'DELETE',
        pattern: '/api/locations/:id',
        handler: () => {
          deleteCalled = true
          return { status: 204 }
        },
      },
    ])

    await page.goto('/')
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    expect(deleteCalled).toBe(true)
  })

  test('Escape key cancels the dialog', async ({ authedPage: page }) => {
    await mockApi(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Delete' }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('backdrop click cancels the dialog', async ({ authedPage: page }) => {
    await mockApi(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Delete' }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await page.getByTestId('confirm-dialog-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(dialog).not.toBeVisible()
  })
})
