import { getStore } from '@netlify/blobs'
import { authorizeLocationAccess } from './_lib/authorize.js'

export default async (request) => {
  const url = new URL(request.url)
  const locationId = url.searchParams.get('locationId')
  const entryId = url.searchParams.get('entryId')
  if (!locationId || !entryId) {
    return new Response(JSON.stringify({ error: 'locationId and entryId are required' }), {
      status: 400,
    })
  }

  const auth = await authorizeLocationAccess(locationId, request.headers.get('authorization'))
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: auth.status })
  }

  const store = getStore('photos')
  const key = `locations/${locationId}/history/${entryId}`
  await store.delete(key)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
