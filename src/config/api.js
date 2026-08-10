import { ref } from 'vue'

const PRIMARY_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090'
const FALLBACK_API_BASE_URL = import.meta.env.VITE_API_BASE_URL_FALLBACK

const HEALTH_CHECK_TIMEOUT_MS = 5000

let resolvedBaseUrl = PRIMARY_API_BASE_URL

// Whether the primary backend was unreachable and we've switched to the
// fallback for the rest of this session. Login.vue uses this to decide
// whether the Render cold-start hint is relevant.
export const usingFallbackBackend = ref(false)

async function isPrimaryHealthy() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)

  try {
    // Routed through a Netlify Function (same-origin) rather than fetched
    // directly, since the backend's /actuator/health doesn't send CORS
    // headers for the app's origin.
    const response = await fetch('/.netlify/functions/backend-health', { signal: controller.signal })
    return response.ok
  } catch (error) {
    console.error('Primary backend health check failed:', error)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

// Resolved once at startup: probes the primary backend and falls back to
// FALLBACK_API_BASE_URL (if configured) when it isn't reachable. Callers
// that build a request URL should await this first so apiUrl() reflects the
// final choice rather than the optimistic default.
export const apiReady = (async () => {
  if (!FALLBACK_API_BASE_URL) return

  const healthy = await isPrimaryHealthy()
  if (!healthy) {
    resolvedBaseUrl = FALLBACK_API_BASE_URL
    usingFallbackBackend.value = true
  }
})()

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${resolvedBaseUrl}${normalized}`
}
