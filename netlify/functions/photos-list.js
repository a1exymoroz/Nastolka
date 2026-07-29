import { getStore } from '@netlify/blobs'
import { authorizeLocationAccess } from './_lib/authorize.js'

export default async (request) => {
  const url = new URL(request.url)
  const locationId = url.searchParams.get('locationId')
  if (!locationId) {
    return new Response(JSON.stringify({ error: 'locationId is required' }), { status: 400 })
  }

  const auth = await authorizeLocationAccess(locationId, request.headers.get('authorization'))
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: auth.status })
  }

  const prefix = `locations/${locationId}/history/`
  const store = getStore('photos')
  const { blobs } = await store.list({ prefix })
  const entryIds = blobs.map((blob) => blob.key.slice(prefix.length))

  return new Response(JSON.stringify({ entryIds }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
