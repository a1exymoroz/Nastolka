import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../../utils/apiFetch'
import { t } from '../../../i18n'

export function useLocationGames() {
  const route = useRoute()

  const locationGames = ref([])
  const locationGamesLoading = ref(true)
  const locationGamesError = ref('')

  const catalogGames = ref([])
  const selectedGameId = ref('')
  const addGameLoading = ref(false)
  const addGameError = ref('')
  const removingGameId = ref(null)

  const gameSearchQuery = ref('')
  const gameSearchResults = ref([])
  const gameSearchLoading = ref(false)
  const gameSearchError = ref('')
  const gameSearchAttempted = ref(false)
  const importingGameBggId = ref(null)

  // Per-game state for the expansions assigned to this location, keyed by game id:
  // { expansions, loading, error, catalogExpansions, selectedExpansionId, addLoading, addError,
  //   removingId, panelOpen, searchResults, searchLoading, searchError, searchAttempted, importingBggId }
  const gameExpansionState = reactive({})

  const availableCatalogGames = computed(() => {
    const assignedIds = new Set(locationGames.value.map((g) => g.id))
    return catalogGames.value.filter((g) => !assignedIds.has(g.id))
  })

  function ensureGameState(gameId) {
    if (!gameExpansionState[gameId]) {
      gameExpansionState[gameId] = {
        expansions: [],
        loading: true,
        error: '',
        catalogExpansions: [],
        selectedExpansionId: '',
        addLoading: false,
        addError: '',
        removingId: null,
        panelOpen: false,
        searchResults: [],
        searchLoading: false,
        searchError: '',
        searchAttempted: false,
        importingBggId: null,
      }
    }
    return gameExpansionState[gameId]
  }

  function toggleExpansionPanel(gameId) {
    const state = ensureGameState(gameId)
    state.panelOpen = !state.panelOpen
  }

  // Bulk load path (whole games list): the location's games response now
  // embeds both each game's assigned expansions and its full catalog in one
  // batched query, so no per-game request is needed at all here.
  function initExpansionStateFromGame(game) {
    const state = ensureGameState(game.id)
    state.expansions = game.expansions ?? []
    state.catalogExpansions = game.catalogExpansions ?? []
    state.loading = false
  }

  // Single-game refresh path (after adding/removing an expansion): re-fetches
  // both the assigned and catalog lists for just that one game.
  async function refreshGameExpansions(gameId) {
    const state = ensureGameState(gameId)
    state.loading = true
    state.error = ''

    try {
      const [assignedRes, catalogRes] = await Promise.all([
        apiFetch(`api/locations/${route.params.id}/games/${gameId}/expansions`),
        apiFetch(`api/games/${gameId}/expansions`),
      ])

      if (!assignedRes.ok) {
        throw new Error(t('locationDetail.gameCard.errors.loadExpansionsFailed'))
      }

      state.expansions = await assignedRes.json()
      state.catalogExpansions = catalogRes.ok ? await catalogRes.json() : []
    } catch (e) {
      state.error = e.message || t('locationDetail.gameCard.errors.loadExpansionsFailed')
    } finally {
      state.loading = false
    }
  }

  function availableCatalogExpansions(gameId) {
    const state = gameExpansionState[gameId]
    if (!state) return []
    const assignedIds = new Set(state.expansions.map((e) => e.id))
    return state.catalogExpansions.filter((e) => !assignedIds.has(e.id))
  }

  async function fetchLocationGames() {
    locationGamesLoading.value = true
    locationGamesError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/games`)

      if (!response.ok) {
        throw new Error(t('locationDetail.games.errors.loadFailed'))
      }

      locationGames.value = await response.json()
      locationGames.value.forEach(initExpansionStateFromGame)
    } catch (e) {
      locationGamesError.value = e.message || t('locationDetail.games.errors.loadFailed')
    } finally {
      locationGamesLoading.value = false
    }
  }

  async function fetchCatalogGames() {
    try {
      const response = await apiFetch('api/games')
      if (!response.ok) return
      catalogGames.value = await response.json()
    } catch {
      // Non-fatal: the "add game" picker just stays empty.
    }
  }

  async function handleAddGame() {
    if (!selectedGameId.value) return

    addGameError.value = ''
    addGameLoading.value = true

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/games/${selectedGameId.value}`,
        { method: 'POST' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('locationDetail.games.errors.addFailed'))
      }

      selectedGameId.value = ''
      await fetchLocationGames()
    } catch (e) {
      addGameError.value = e.message || t('locationDetail.games.errors.addFailed')
    } finally {
      addGameLoading.value = false
    }
  }

  async function handleSearchGames() {
    gameSearchError.value = ''
    gameSearchLoading.value = true
    gameSearchAttempted.value = true
    gameSearchResults.value = []

    try {
      const response = await apiFetch(
        `api/games/search-external?query=${encodeURIComponent(gameSearchQuery.value)}`,
      )

      if (!response.ok) {
        throw new Error(t('locationDetail.games.errors.bggSearchFailed'))
      }

      const results = await response.json()
      // Importing here attaches a top-level game to the location; expansions
      // are excluded — those are imported from within a game's own panel.
      gameSearchResults.value = results.filter((result) => !result.expansion)
    } catch (e) {
      gameSearchError.value = e.message || t('locationDetail.games.errors.bggSearchFailed')
    } finally {
      gameSearchLoading.value = false
    }
  }

  async function handleImportGame(bggId) {
    gameSearchError.value = ''
    importingGameBggId.value = bggId

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/games/import/${bggId}`,
        { method: 'POST' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('locationDetail.games.errors.importFailed'))
      }

      await Promise.all([fetchLocationGames(), fetchCatalogGames()])
    } catch (e) {
      gameSearchError.value = e.message || t('locationDetail.games.errors.importFailed')
    } finally {
      importingGameBggId.value = null
    }
  }

  async function handleRemoveGame(game) {
    if (!window.confirm(t('locationDetail.games.confirmRemove', { name: game.name }))) {
      return
    }

    addGameError.value = ''
    removingGameId.value = game.id

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/games/${game.id}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 404) {
        throw new Error(t('locationDetail.games.errors.removeFailed'))
      }

      delete gameExpansionState[game.id]
      await fetchLocationGames()
    } catch (e) {
      addGameError.value = e.message || t('locationDetail.games.errors.removeFailed')
    } finally {
      removingGameId.value = null
    }
  }

  async function handleAddExpansion(gameId) {
    const state = ensureGameState(gameId)
    if (!state.selectedExpansionId) return

    state.addError = ''
    state.addLoading = true

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/games/${gameId}/expansions/${state.selectedExpansionId}`,
        { method: 'POST' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('locationDetail.gameCard.errors.addExpansionFailed'))
      }

      state.selectedExpansionId = ''
      await refreshGameExpansions(gameId)
    } catch (e) {
      state.addError = e.message || t('locationDetail.gameCard.errors.addExpansionFailed')
    } finally {
      state.addLoading = false
    }
  }

  async function handleSearchExpansions(gameId) {
    const state = ensureGameState(gameId)
    state.searchError = ''
    state.searchLoading = true
    state.searchAttempted = true
    state.searchResults = []

    try {
      const response = await apiFetch(`api/games/${gameId}/expansions/search-external`)

      if (response.status === 400) {
        throw new Error(t('gameDetail.notImportedFromBgg'))
      }

      if (!response.ok) {
        throw new Error(t('locationDetail.games.errors.bggSearchFailed'))
      }

      state.searchResults = await response.json()
    } catch (e) {
      state.searchError = e.message || t('locationDetail.games.errors.bggSearchFailed')
    } finally {
      state.searchLoading = false
    }
  }

  async function handleImportExpansion(gameId, bggId) {
    const state = ensureGameState(gameId)
    state.searchError = ''
    state.importingBggId = bggId

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/games/${gameId}/expansions/import/${bggId}`,
        { method: 'POST' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('gameDetail.importExpansionFailed'))
      }

      await refreshGameExpansions(gameId)
    } catch (e) {
      state.searchError = e.message || t('gameDetail.importExpansionFailed')
    } finally {
      state.importingBggId = null
    }
  }

  async function handleRemoveExpansion(gameId, expansion) {
    if (!window.confirm(t('locationDetail.gameCard.confirmRemoveExpansion', { name: expansion.name }))) {
      return
    }

    const state = ensureGameState(gameId)
    state.addError = ''
    state.removingId = expansion.id

    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/games/${gameId}/expansions/${expansion.id}`,
        { method: 'DELETE' },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error(t('gameDetail.deleteExpansionFailed'))
      }

      await refreshGameExpansions(gameId)
    } catch (e) {
      state.addError = e.message || t('gameDetail.deleteExpansionFailed')
    } finally {
      state.removingId = null
    }
  }

  return {
    locationGames,
    locationGamesLoading,
    locationGamesError,
    catalogGames,
    selectedGameId,
    addGameLoading,
    addGameError,
    removingGameId,
    gameSearchQuery,
    gameSearchResults,
    gameSearchLoading,
    gameSearchError,
    gameSearchAttempted,
    importingGameBggId,
    gameExpansionState,
    availableCatalogGames,
    availableCatalogExpansions,
    toggleExpansionPanel,
    fetchLocationGames,
    fetchCatalogGames,
    handleAddGame,
    handleRemoveGame,
    handleSearchGames,
    handleImportGame,
    handleAddExpansion,
    handleRemoveExpansion,
    handleSearchExpansions,
    handleImportExpansion,
  }
}
