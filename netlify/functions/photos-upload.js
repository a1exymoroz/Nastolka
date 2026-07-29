import { getStore } from '@netlify/blobs'
import { authorizeLocationAccess } from './_lib/authorize.js'

const MAX_BYTES = 10 * 1024 * 1024

export default async (request) => {
  const url = new URL(request.url)
  const locationId = url.searchParams.get('locationId')
  const entryId = url.searchParams.get('entryId')
  if (!locationId || !entryId) {
    return new Response(JSON.stringify({ error: 'locationId and entryId are required' }), {
      status: 400,
    })
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'That file is not an image.' }), { status: 400 })
  }

  const auth = await authorizeLocationAccess(locationId, request.headers.get('authorization'))
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: auth.status })
  }

  const buffer = await request.arrayBuffer()
  if (buffer.byteLength > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'File is too large.' }), { status: 413 })
  }

  const store = getStore('photos')
  const key = `locations/${locationId}/history/${entryId}`
  await store.set(key, buffer, { metadata: { contentType } })

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
