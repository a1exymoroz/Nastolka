import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '../../../config/api'
import { useAuthHeaders } from './useAuthHeaders'

export function useShares() {
  const route = useRoute()
  const authHeaders = useAuthHeaders()

  const shares = ref([])
  const sharesLoading = ref(false)
  const sharesError = ref('')
  const shareUsername = ref('')
  const shareLoading = ref(false)
  const revokingUsername = ref(null)

  const userSearchResults = ref([])
  const userSearchLoading = ref(false)
  let userSearchTimer = null

  async function fetchShares() {
    sharesLoading.value = true
    sharesError.value = ''

    try {
      const response = await fetch(apiUrl(`api/locations/${route.params.id}/shares`), {
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to load shares')
      }

      shares.value = await response.json()
    } catch (e) {
      sharesError.value = e.message || 'Failed to load shares'
    } finally {
      sharesLoading.value = false
    }
  }

  function onShareUsernameInput() {
    userSearchResults.value = []
    clearTimeout(userSearchTimer)

    const query = shareUsername.value.trim()
    if (!query) {
      userSearchLoading.value = false
      return
    }

    userSearchLoading.value = true
    userSearchTimer = setTimeout(async () => {
      try {
        const response = await fetch(
          apiUrl(`api/users/search?query=${encodeURIComponent(query)}`),
          { headers: authHeaders() },
        )
        const results = response.ok ? await response.json() : []
        // API returns [{ username }], not plain strings — normalize to strings
        // since the rest of this component (picking, dedup, :key) works with them.
        userSearchResults.value = results.map((u) => (typeof u === 'string' ? u : u.username))
      } catch {
        userSearchResults.value = []
      } finally {
        userSearchLoading.value = false
      }
    }, 300)
  }

  function pickShareSuggestion(username) {
    shareUsername.value = username
    userSearchResults.value = []
  }

  async function handleAddShare() {
    if (!shareUsername.value.trim()) return

    sharesError.value = ''
    shareLoading.value = true

    try {
      // TODO: confirm the POST /shares request body shape — assuming { username }.
      const response = await fetch(apiUrl(`api/locations/${route.params.id}/shares`), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username: shareUsername.value.trim() }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to share location')
      }

      shareUsername.value = ''
      userSearchResults.value = []
      await fetchShares()
    } catch (e) {
      sharesError.value = e.message || 'Failed to share location'
    } finally {
      shareLoading.value = false
    }
  }

  async function handleRevokeShare(targetUsername) {
    if (!window.confirm(`Stop sharing this location with "${targetUsername}"?`)) {
      return
    }

    sharesError.value = ''
    revokingUsername.value = targetUsername

    try {
      const response = await fetch(
        apiUrl(`api/locations/${route.params.id}/shares/${encodeURIComponent(targetUsername)}`),
        { method: 'DELETE', headers: authHeaders() },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to revoke share')
      }

      await fetchShares()
    } catch (e) {
      sharesError.value = e.message || 'Failed to revoke share'
    } finally {
      revokingUsername.value = null
    }
  }

  onUnmounted(() => {
    clearTimeout(userSearchTimer)
  })

  return {
    shares,
    sharesLoading,
    sharesError,
    shareUsername,
    shareLoading,
    revokingUsername,
    userSearchResults,
    userSearchLoading,
    fetchShares,
    onShareUsernameInput,
    pickShareSuggestion,
    handleAddShare,
    handleRevokeShare,
  }
}
