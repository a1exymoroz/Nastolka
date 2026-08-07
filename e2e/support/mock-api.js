// Backend-mocking helper: the Java API this app talks to lives in a
// separate repo/service and isn't available in CI, so every /api/** fetch
// is intercepted here and fulfilled with fixture data instead.

const TEST_LOCATION = { id: 1, name: 'Test Location', description: '', ownerUsername: 'e2e-user' }

function json(status, body) {
  return { status, json: body }
}

function empty(status) {
  return { status }
}

const DEFAULT_ROUTES = [
  {
    method: 'POST',
    pattern: '/api/auth/login',
    handler: () => json(200, { token: 'e2e-test-token', role: 'USER', username: 'e2e-user' }),
  },
  { method: 'GET', pattern: '/api/locations', handler: () => json(200, [TEST_LOCATION]) },
  {
    method: 'POST',
    pattern: '/api/locations',
    handler: async ({ request }) => json(201, { id: 2, ...request.postDataJSON() }),
  },
  { method: 'GET', pattern: '/api/locations/:id', handler: () => json(200, TEST_LOCATION) },
  { method: 'DELETE', pattern: '/api/locations/:id', handler: () => empty(204) },
  {
    method: 'PUT',
    pattern: '/api/locations/:id',
    handler: async ({ request }) => json(200, { ...TEST_LOCATION, ...request.postDataJSON() }),
  },
  {
    method: 'GET',
    pattern: '/api/locations/:id/games',
    handler: () => json(200, [{ id: 10, name: 'Catan', expansions: [], catalogExpansions: [] }]),
  },
  {
    method: 'GET',
    pattern: '/api/games',
    handler: () =>
      json(200, [
        { id: 10, name: 'Catan' },
        { id: 11, name: 'Wingspan' },
      ]),
  },
  { method: 'POST', pattern: '/api/locations/:id/games/:gameId', handler: () => json(200, {}) },
  { method: 'DELETE', pattern: '/api/locations/:id/games/:gameId', handler: () => empty(204) },
  {
    method: 'GET',
    pattern: '/api/locations/:id/games/:gameId/expansions',
    handler: () => json(200, []),
  },
  { method: 'GET', pattern: '/api/locations/:id/shares', handler: () => json(200, []) },
  {
    method: 'POST',
    pattern: '/api/locations/:id/shares',
    handler: async ({ request }) => json(201, request.postDataJSON()),
  },
  { method: 'DELETE', pattern: '/api/locations/:id/shares/:username', handler: () => empty(204) },
  {
    method: 'GET',
    pattern: '/api/users/search',
    handler: ({ url }) => {
      const query = url.searchParams.get('query')
      return json(200, query ? [{ username: 'e2e-friend' }] : [])
    },
  },
  { method: 'GET', pattern: '/api/locations/:id/history', handler: () => json(200, []) },
  {
    method: 'POST',
    pattern: '/api/locations/:id/history',
    handler: async ({ request }) => json(201, { id: 100, ...request.postDataJSON() }),
  },
  {
    method: 'PUT',
    pattern: '/api/locations/:id/history/:historyId',
    handler: async ({ request, params }) =>
      json(200, { id: Number(params.historyId), ...request.postDataJSON() }),
  },
  { method: 'GET', pattern: '/api/locations/:id/chat/messages', handler: () => json(200, []) },
]

function compile({ method, pattern, handler }) {
  const paramNames = []
  const regexSource = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1))
        return '([^/]+)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')

  return { method, regex: new RegExp(`^${regexSource}$`), paramNames, handler }
}

function findRoute(compiledRoutes, method, pathname) {
  for (const route of compiledRoutes) {
    if (route.method !== method) continue
    const match = route.regex.exec(pathname)
    if (!match) continue
    const params = Object.fromEntries(route.paramNames.map((name, i) => [name, match[i + 1]]))
    return { handler: route.handler, params }
  }
  return null
}

// overrides: array of { method, pattern, handler } entries checked before
// the defaults, in the same shape as DEFAULT_ROUTES — lets a test replace
// just one endpoint (e.g. a failure response) without redefining the rest.
export async function mockApi(page, overrides = []) {
  const compiledRoutes = [...overrides, ...DEFAULT_ROUTES].map(compile)

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const match = findRoute(compiledRoutes, method, url.pathname)

    if (!match) {
      console.warn(`[mockApi] no mock registered for ${method} ${url.pathname}`)
      await route.fulfill(json(404, { message: 'No mock registered for this request' }))
      return
    }

    const result = await match.handler({ route, request, params: match.params, url })
    await route.fulfill(result)
  })

  // useLocationChat.js always opens a SockJS connection to `${API_BASE_URL}/ws`
  // on LocationDetail mount — not a plain /api/** fetch. Without this, every
  // LocationDetail-based test would hang waiting on a real (nonexistent)
  // backend and leave a 5s-interval reconnect timer running.
  await page.route('**/ws/info**', (route) => route.fulfill({ status: 404, body: '' }))
  await page.routeWebSocket('**/ws/**', (ws) => ws.close())
}
