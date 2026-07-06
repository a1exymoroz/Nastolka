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

  const isAuthenticated = computed(() => !!token.value)

  function loadTokenFromStorage() {
    // TODO: Load JWT from localStorage and validate expiry
    const saved = localStorage.getItem('auth_token')
    if (saved) {
      token.value = saved
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
    token.value = data.token ?? data.accessToken
    user.value = data.user ?? { username }
    localStorage.setItem('auth_token', token.value)
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
    token.value = data.token ?? data.accessToken
    user.value = data.user ?? { username, email }
    localStorage.setItem('auth_token', token.value)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  return {
    token,
    user,
    isAuthenticated,
    loadTokenFromStorage,
    login,
    register,
    logout,
  }
})
