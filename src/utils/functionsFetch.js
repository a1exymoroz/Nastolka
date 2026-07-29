import { useAuthStore } from '../stores/auth'
import router from '../router'

// Sibling to apiFetch.js, but targets this site's own Netlify Functions
// instead of the Java backend, so it needs its own 401 handling (these calls
// never go through apiFetch, and so wouldn't otherwise trigger the global
// logout/redirect on an expired token).
export async function functionsFetch(path, options = {}) {
  const auth = useAuthStore()
  const { headers, ...rest } = options

  const response = await fetch(`/.netlify/functions/${path}`, {
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
