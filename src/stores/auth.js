import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiUrl } from '../config/api'

async function parseError(response, fallback) {
  const data = await response.json().catch(() => ({}))
  return data.message || data.error || fallback
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
    const response = await fetch(apiUrl('api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      throw new Error(await parseError(response, 'Login failed'))
    }

    const data = await response.json()
    const resolvedUsername = data.username ?? username
    user.value = { username: resolvedUsername, role: data.role }
    persist(data.token, data.role, resolvedUsername)
  }

  async function register(username, password, email) {
    const response = await fetch(apiUrl('api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    })

    if (!response.ok) {
      throw new Error(await parseError(response, 'Registration failed'))
    }

    const data = await response.json()
    const resolvedUsername = data.username ?? username
    user.value = { username: resolvedUsername, email, role: data.role }
    persist(data.token, data.role, resolvedUsername)
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
    logout,
  }
})
