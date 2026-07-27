import { apiUrl } from '../config/api'
import { useAuthStore } from '../stores/auth'
import router from '../router'

// Wraps fetch with the auth bearer token and a global 401 handler: any
// authenticated request that comes back Unauthorized means the token is
// missing/expired, so we clear the session and bounce to the login page
// instead of letting every call site handle that case separately.
export async function apiFetch(path, options = {}) {
  const auth = useAuthStore()
  const { headers, ...rest } = options

  const response = await fetch(apiUrl(path), {
    ...rest,
    headers: { Authorization: `Bearer ${auth.token}`, ...headers },
  })

  if (response.status === 401) {
    auth.logout()
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' })
    }
  }

  return response
}
