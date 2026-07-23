import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '../../../config/api'
import { useAuthHeaders } from './useAuthHeaders'

export function useLocationGames() {
  const route = useRoute()
  const authHeaders = useAuthHeaders()

  const locationGames = ref([])
  const locationGamesLoading = ref(true)
  const locationGamesError = ref('')

  const catalogGames = ref([])
  const selectedGameId = ref('')
  const addGameLoading = ref(false)
  const addGameError = ref('')
  const removingGameId = ref(null)

  // Per-game state for the expansions assigned to this location, keyed by game id:
  // { expansions, loading, error, catalogExpansions, selectedExpansionId, addLoading, addError, removingId, panelOpen }
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
        fetch(apiUrl(`api/locations/${route.params.id}/games/${gameId}/expansions`), {
          headers: authHeaders(),
        }),
        fetch(apiUrl(`api/games/${gameId}/expansions`), { headers: authHeaders() }),
      ])

      if (!assignedRes.ok) {
        throw new Error('Failed to load expansions')
      }

      state.expansions = await assignedRes.json()
      state.catalogExpansions = catalogRes.ok ? await catalogRes.json() : []
    } catch (e) {
      state.error = e.message || 'Failed to load expansions'
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
      const response = await fetch(apiUrl(`api/locations/${route.params.id}/games`), {
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to load games for this location')
      }

      locationGames.value = await response.json()
      locationGames.value.forEach(initExpansionStateFromGame)
    } catch (e) {
      locationGamesError.value = e.message || 'Failed to load games for this location'
    } finally {
      locationGamesLoading.value = false
    }
  }

  async function fetchCatalogGames() {
    try {
      const response = await fetch(apiUrl('api/games'), { headers: authHeaders() })
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
      const response = await fetch(
        apiUrl(`api/locations/${route.params.id}/games/${selectedGameId.value}`),
        { method: 'POST', headers: authHeaders() },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to add game')
      }

      selectedGameId.value = ''
      await fetchLocationGames()
    } catch (e) {
      addGameError.value = e.message || 'Failed to add game'
    } finally {
      addGameLoading.value = false
    }
  }

  async function handleRemoveGame(game) {
    if (!window.confirm(`Remove "${game.name}" from this location?`)) {
      return
    }

    addGameError.value = ''
    removingGameId.value = game.id

    try {
      const response = await fetch(apiUrl(`api/locations/${route.params.id}/games/${game.id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to remove game')
      }

      delete gameExpansionState[game.id]
      await fetchLocationGames()
    } catch (e) {
      addGameError.value = e.message || 'Failed to remove game'
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
      const response = await fetch(
        apiUrl(
          `api/locations/${route.params.id}/games/${gameId}/expansions/${state.selectedExpansionId}`,
        ),
        { method: 'POST', headers: authHeaders() },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to add expansion')
      }

      state.selectedExpansionId = ''
      await refreshGameExpansions(gameId)
    } catch (e) {
      state.addError = e.message || 'Failed to add expansion'
    } finally {
      state.addLoading = false
    }
  }

  async function handleRemoveExpansion(gameId, expansion) {
    if (!window.confirm(`Remove "${expansion.name}" from this location?`)) {
      return
    }

    const state = ensureGameState(gameId)
    state.addError = ''
    state.removingId = expansion.id

    try {
      const response = await fetch(
        apiUrl(`api/locations/${route.params.id}/games/${gameId}/expansions/${expansion.id}`),
        { method: 'DELETE', headers: authHeaders() },
      )

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to remove expansion')
      }

      await refreshGameExpansions(gameId)
    } catch (e) {
      state.addError = e.message || 'Failed to remove expansion'
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
    gameExpansionState,
    availableCatalogGames,
    availableCatalogExpansions,
    toggleExpansionPanel,
    fetchLocationGames,
    fetchCatalogGames,
    handleAddGame,
    handleRemoveGame,
    handleAddExpansion,
    handleRemoveExpansion,
  }
}
