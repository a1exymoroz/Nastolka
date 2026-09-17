import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

test('navigates to the info page from the header button and back', async ({ authedPage: page }) => {
  await mockApi(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'Info' }).click()
  await page.waitForURL('/info')
  await expect(page.getByRole('heading', { name: 'Info' })).toBeVisible()

  await page.getByText('← Back to locations').click()
  await page.waitForURL('/')
})

test('lists every meeple for each game with a known token set', async ({ authedPage: page }) => {
  await mockApi(page)
  await page.goto('/info')

  const everdellCard = page.getByTestId('meeple-game-everdell')
  await expect(everdellCard.getByRole('heading', { name: 'Everdell' })).toBeVisible()
  for (const name of ['Squirrel', 'Rabbit', 'Hedgehog', 'Elephant']) {
    await expect(everdellCard.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(everdellCard.locator('li')).toHaveCount(4)

  const brassCard = page.getByTestId('meeple-game-brassBirmingham')
  await expect(brassCard.getByRole('heading', { name: 'Brass: Birmingham' })).toBeVisible()
  for (const name of [
    'Robert Owen',
    'Richard Arkwright',
    'Sir Henry Bessemer',
    'James Watt',
    'Isambard Kingdom Brunel',
    'George Stephenson',
    'Eliza Tinsley',
    'Eleanor Coade',
  ]) {
    await expect(brassCard.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(brassCard.locator('li')).toHaveCount(8)
})
