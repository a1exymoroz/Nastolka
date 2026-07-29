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
  const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })

  if (!result) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  return new Response(result.data, {
    status: 200,
    headers: {
      'Content-Type': result.metadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
}
