// The Java backend's /actuator/health doesn't send CORS headers, so the
// browser can't call it directly from the app's origin. This function checks
// it server-side (no CORS involved) and the client asks us instead.
import { API_BASE_URL } from './_lib/apiBaseUrl.js'

export default async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/actuator/health`)
    return new Response(null, { status: response.ok ? 200 : 502 })
  } catch {
    return new Response(null, { status: 502 })
  }
}
