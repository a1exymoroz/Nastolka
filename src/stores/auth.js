import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiUrl } from '../config/api'
import { useToastStore } from './toast'
import { t } from '../i18n'

async function parseError(response, fallback) {
  const data = await response.json().catch(() => ({}))
  return data.message || data.error || fallback
}

// login/register/loginWithGoogle hit the backend directly rather than
// through apiFetch/functionsFetch (no auth token to attach yet), so they
// need their own copy of the network/5xx toast handling those wrappers do.
async function postJson(url, body) {
  const toast = useToastStore()
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    toast.showError(t('common.networkError'))
    throw error
  }

  if (response.status >= 500) {
    toast.showError(t('common.serverError'))
  }

  return response
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const role = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'ADMIN')

  function persist(nextToken, nextRole, nextUsername) {
    token.value = nextToken
    role.value = nextRole
    localStorage.setItem('auth_token', nextToken)
    localStorage.setItem('auth_role', nextRole)
    localStorage.setItem('auth_username', nextUsername)
  }

  function loadTokenFromStorage() {
    // TODO: Load JWT from localStorage and validate expiry
    const savedToken = localStorage.getItem('auth_token')
    const savedRole = localStorage.getItem('auth_role')
    const savedUsername = localStorage.getItem('auth_username')
    if (savedToken) {
      token.value = savedToken
      role.value = savedRole
      user.value = { username: savedUsername, role: savedRole }
    }
  }

  async function login(username, password) {
    const response = await postJson(apiUrl('api/auth/login'), { username, password })

    if (!response.ok) {
      throw new Error(await parseError(response, 'Login failed'))
    }

    const data = await response.json()
    const resolvedUsername = data.username ?? username
    user.value = { username: resolvedUsername, role: data.role }
    persist(data.token, data.role, resolvedUsername)
  }

  async function register(username, password, email) {
    const response = await postJson(apiUrl('api/auth/register'), { username, password, email })

    if (!response.ok) {
      throw new Error(await parseError(response, 'Registration failed'))
    }

    const data = await response.json()
    const resolvedUsername = data.username ?? username
    user.value = { username: resolvedUsername, email, role: data.role }
    persist(data.token, data.role, resolvedUsername)
  }

  async function loginWithGoogle(idToken) {
    const response = await postJson('/.netlify/functions/auth-google', { idToken })

    if (!response.ok) {
      throw new Error(await parseError(response, 'Google sign-in failed'))
    }

    const data = await response.json()
    user.value = { username: data.username, role: data.role }
    persist(data.token, data.role, data.username)
  }

  function logout() {
    token.value = null
    user.value = null
    role.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_username')
  }

  return {
    token,
    user,
    role,
    isAuthenticated,
    isAdmin,
    loadTokenFromStorage,
    login,
    register,
    loginWithGoogle,
    logout,
  }
})
