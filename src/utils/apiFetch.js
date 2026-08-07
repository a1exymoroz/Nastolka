import { apiUrl } from '../config/api'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { t } from '../i18n'
import router from '../router'

// Wraps fetch with the auth bearer token and a global 401 handler: any
// authenticated request that comes back Unauthorized means the token is
// missing/expired, so we clear the session and bounce to the login page
// instead of letting every call site handle that case separately.
export async function apiFetch(path, options = {}) {
  const auth = useAuthStore()
  const toast = useToastStore()
  const { headers, ...rest } = options

  let response
  try {
    response = await fetch(apiUrl(path), {
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
    // call site; a 5xx means the backend itself failed, which nothing else
    // surfaces to the user.
    toast.showError(t('common.serverError'))
  }

  return response
}
