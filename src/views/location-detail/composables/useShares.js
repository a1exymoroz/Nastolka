import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../../utils/apiFetch'
import { t } from '../../../i18n'

export function useShares() {
  const route = useRoute()

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
      const response = await apiFetch(`api/locations/${route.params.id}/shares`)

      if (!response.ok) {
        throw new Error(t('locationDetail.sharing.loadSharesFailed'))
      }

      shares.value = await response.json()
    } catch (e) {
      sharesError.value = e.message || t('locationDetail.sharing.loadSharesFailed')
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
        const response = await apiFetch(`api/users/search?query=${encodeURIComponent(query)}`)
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
      const response = await apiFetch(`api/locations/${route.params.id}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: shareUsername.value.trim() }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('locationDetail.sharing.shareFailed'))
      }

      shareUsername.value = ''
      userSearchResults.value = []
      await fetchShares()
    } catch (e) {
      sharesError.value = e.message || t('locationDetail.sharing.shareFailed')
    } finally {
      shareLoading.value = false
    }
  }

  async function handleRevokeShare(targetUsername) {
    if (!window.confirm(t('locationDetail.sharing.confirmRevoke', { name: targetUsername }))) {
      return
    }

    sharesError.value = ''
    revokingUsername.value = targetUsername

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/shares/${encodeURIComponent(targetUsername)}`,
        { method: 'DELETE' },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error(t('locationDetail.sharing.revokeFailed'))
      }

      await fetchShares()
    } catch (e) {
      sharesError.value = e.message || t('locationDetail.sharing.revokeFailed')
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
