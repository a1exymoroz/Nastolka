import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../../utils/apiFetch'
import { t } from '../../../i18n'
import { useConfirm } from '../../../composables/useConfirm'

export function useShares() {
  const route = useRoute()
  const confirm = useConfirm()

  const shares = ref([])
  const sharesLoading = ref(false)
  const sharesError = ref('')
  const shareUsername = ref('')
  const shareCanEditInfo = ref(false)
  const shareCanManageGames = ref(false)
  const shareCanManageHistory = ref(false)
  const shareLoading = ref(false)
  const revokingUsername = ref(null)
  const savingPermissionsUsernames = ref(new Set())

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
      const response = await apiFetch(`api/locations/${route.params.id}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: shareUsername.value.trim(),
          canEditInfo: shareCanEditInfo.value,
          canManageGames: shareCanManageGames.value,
          canManageHistory: shareCanManageHistory.value,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('locationDetail.sharing.shareFailed'))
      }

      shareUsername.value = ''
      shareCanEditInfo.value = false
      shareCanManageGames.value = false
      shareCanManageHistory.value = false
      userSearchResults.value = []
      await fetchShares()
    } catch (e) {
      sharesError.value = e.message || t('locationDetail.sharing.shareFailed')
    } finally {
      shareLoading.value = false
    }
  }

  async function handleUpdateSharePermissions(targetUsername, flags) {
    sharesError.value = ''
    savingPermissionsUsernames.value = new Set(savingPermissionsUsernames.value).add(targetUsername)

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/shares/${encodeURIComponent(targetUsername)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flags),
        },
      )

      if (!response.ok) {
        throw new Error(t('locationDetail.sharing.updatePermissionsFailed'))
      }

      await fetchShares()
    } catch (e) {
      sharesError.value = e.message || t('locationDetail.sharing.updatePermissionsFailed')
    } finally {
      const next = new Set(savingPermissionsUsernames.value)
      next.delete(targetUsername)
      savingPermissionsUsernames.value = next
    }
  }

  async function handleRevokeShare(targetUsername) {
    const confirmed = await confirm({
      title: t('locationDetail.sharing.confirmRevokeTitle', { name: targetUsername }),
      message: t('locationDetail.sharing.confirmRevokeMessage'),
      confirmText: t('locationDetail.sharing.revoke'),
      variant: 'neutral',
    })
    if (!confirmed) return

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
    shareCanEditInfo,
    shareCanManageGames,
    shareCanManageHistory,
    shareLoading,
    revokingUsername,
    savingPermissionsUsernames,
    userSearchResults,
    userSearchLoading,
    fetchShares,
    onShareUsernameInput,
    pickShareSuggestion,
    handleAddShare,
    handleRevokeShare,
    handleUpdateSharePermissions,
  }
}
