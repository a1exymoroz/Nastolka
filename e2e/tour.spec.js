import { test, expect } from './support/fixtures'
import { mockApi } from './support/mock-api'

// support/fixtures.js's `page` fixture unconditionally marks every tour step
// passed so other specs never trip the tour overlay. These tests need the
// opposite, so they add a later addInitScript that overrides it on each
// navigation (addInitScript calls run in the order they were added).
async function setTourProgress(page, passedStepIds) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    ['nastolka-tour-progress', JSON.stringify(passedStepIds)],
  )
}

test('shows a step counter scoped to the locations page, not the whole app-wide tour', async ({
  authedPage: page,
}) => {
  await setTourProgress(page, [])
  await mockApi(page)

  await page.goto('/')

  // The locations page has exactly one tour step of its own — the counter
  // should read against that, not the 7-step count across every page.
  await expect(page.getByRole('heading', { name: 'Create your first location' })).toBeVisible()
  await expect(page.getByText('1/1', { exact: true })).toBeVisible()
})

test('shows a step counter scoped to the location detail page, restarting from 1 there', async ({
  authedPage: page,
}) => {
  // Simulates already having completed the locations page's own step.
  await setTourProgress(page, ['create-location'])
  await mockApi(page)

  await page.goto('/locations/1')

  // Location detail has several of its own steps (edit-location,
  // view-statistics, roll-dice, sharing, add-game, chat, history-crud,
  // history-photos); the first one shown here should start back at 1, not
  // continue as "2/7"+ from the locations page.
  await expect(page.getByRole('heading', { name: 'Edit anytime' })).toBeVisible()
  await expect(page.getByText('1/8', { exact: true })).toBeVisible()
})

test('points out the statistics and roll-dice buttons on the location detail page', async ({
  authedPage: page,
}) => {
  await setTourProgress(page, ['create-location', 'edit-location'])
  await mockApi(page)

  await page.goto('/locations/1')

  await expect(page.getByRole('heading', { name: 'Track your plays' })).toBeVisible()
  await expect(page.getByText('2/8', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()

  await expect(page.getByRole('heading', { name: 'Not sure what to play?' })).toBeVisible()
  await expect(page.getByText('3/8', { exact: true })).toBeVisible()
})

test('shows a tour step for the tabs on the statistics page, scoped to that page', async ({
  authedPage: page,
}) => {
  await setTourProgress(page, [
    'create-location',
    'edit-location',
    'view-statistics',
    'roll-dice',
    'sharing',
    'add-game',
    'chat',
    'history-crud',
    'history-photos',
  ])
  await mockApi(page)

  await page.goto('/locations/1/statistics')

  // Only one step targets this page, so the counter reads "1/1" here too,
  // not a continuation of the location detail page's count.
  await expect(page.getByRole('heading', { name: 'Explore the tabs' })).toBeVisible()
  await expect(page.getByText('1/1', { exact: true })).toBeVisible()
})
