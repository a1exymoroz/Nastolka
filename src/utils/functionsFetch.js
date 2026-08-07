import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { t } from '../i18n'
import router from '../router'

// Sibling to apiFetch.js, but targets this site's own Netlify Functions
// instead of the Java backend, so it needs its own 401 handling (these calls
// never go through apiFetch, and so wouldn't otherwise trigger the global
// logout/redirect on an expired token).
export async function functionsFetch(path, options = {}) {
  const auth = useAuthStore()
  const toast = useToastStore()
  const { headers, ...rest } = options

  let response
  try {
    response = await fetch(`/.netlify/functions/${path}`, {
      ...rest,
      headers: { Authorization: `Bearer ${auth.token}`, ...headers },
    })
  } catch (error) {
    toast.showError(t('common.networkError'))
    throw error
  }

  if (response.status === 401) {
    auth.logout()
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' })
    }
  } else if (response.status >= 500) {
    // Expected app errors (4xx) already get a specific message inline at the
    // call site; a 5xx (including the 502 these functions return when the
    // upstream backend is unreachable) means the backend itself failed.
    toast.showError(t('common.serverError'))
  }

  return response
}
