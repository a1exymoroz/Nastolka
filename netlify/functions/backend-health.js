// The Java backend's /actuator/health doesn't send CORS headers, so the
// browser can't call it directly from the app's origin. This function checks
// it server-side (no CORS involved) and the client asks us instead.
import { API_BASE_URL } from './_lib/apiBaseUrl.js'

export default async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/actuator/health`)
    if (!response.ok) {
      console.error(`Backend health check failed: ${API_BASE_URL} returned ${response.status} ${response.statusText}`)
    }
    return new Response(null, { status: response.ok ? 200 : 502 })
  } catch (error) {
    console.error(`Backend health check failed: ${API_BASE_URL}`, error)
    return new Response(null, { status: 502 })
  }
}
