import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  async function login(email, password) {
    // TODO: Call your authentication API
  // const response = await fetch('/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // })
  // const data = await response.json()
  // token.value = data.token
  // user.value = data.user
  // localStorage.setItem('auth_token', data.token)

    // Placeholder for development — remove once API is wired up
    token.value = 'dev-token'
    user.value = { email }
    localStorage.setItem('auth_token', token.value)
  }

  async function register(email, password) {
    // TODO: Call your registration API
  // const response = await fetch('/api/auth/register', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // })
  // const data = await response.json()
  // token.value = data.token
  // user.value = data.user
  // localStorage.setItem('auth_token', data.token)

    // Placeholder for development — remove once API is wired up
    token.value = 'dev-token'
    user.value = { email }
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
