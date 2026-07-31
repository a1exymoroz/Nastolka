// Like _lib/authorize.js, this function doesn't verify the Google ID token
// itself: the Java backend owns the user table and account-linking logic, so
// verification against Google's public certs and account creation/linking
// both happen there. This function only forwards the token and passes the
// Java response straight through.
export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const body = await request.json().catch(() => ({}))
  const { idToken } = body
  if (!idToken) {
    return new Response(JSON.stringify({ error: 'idToken is required' }), { status: 400 })
  }

  let response
  try {
    response = await fetch(`${process.env.JAVA_API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Auth service unavailable' }), { status: 502 })
  }

  const data = await response.text()
  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
