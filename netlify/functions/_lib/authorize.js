// Netlify Functions can't verify the Java backend's JWT themselves (they
// don't hold its signing secret), so authorization is proxied: the caller's
// Authorization header is forwarded to an endpoint the Java backend already
// protects, and its response tells us whether the token is valid and whether
// this user may access this location.
export async function authorizeLocationAccess(locationId, authHeader) {
  if (!authHeader) return { ok: false, status: 401 }

  let response
  try {
    response = await fetch(`${process.env.JAVA_API_BASE_URL}/api/locations/${locationId}`, {
      headers: { Authorization: authHeader },
    })
  } catch {
    return { ok: false, status: 502 }
  }

  if (response.status === 200) return { ok: true }
  if (response.status === 401) return { ok: false, status: 401 }
  // 403/404 (and anything else) collapse to 403 so a caller can't tell the
  // difference between "not yours" and "doesn't exist".
  return { ok: false, status: 403 }
}
