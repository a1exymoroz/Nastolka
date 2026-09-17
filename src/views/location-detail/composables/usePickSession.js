import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { apiUrl } from '../../../config/api'
import { apiFetch } from '../../../utils/apiFetch'
import { useAuthStore } from '../../../stores/auth'
import { t } from '../../../i18n'

export function usePickSession() {
  const route = useRoute()
  const auth = useAuthStore()

  const session = ref(null)
  const sessionLoading = ref(true)
  const sessionError = ref('')
  const sessionConnected = ref(false)
  const actionPending = ref(false)

  let stompClient = null
  let pendingTimeout = null

  function clearPendingTimeout() {
    clearTimeout(pendingTimeout)
    pendingTimeout = null
  }

  const isParticipant = computed(() =>
    session.value?.participants?.some((p) => p.username === auth.user?.username) ?? false,
  )
  const isCreator = computed(() => session.value?.createdByUsername === auth.user?.username)
  const isMyTurn = computed(
    () =>
      session.value?.status === 'IN_PROGRESS' &&
      session.value.currentTurnUsername === auth.user?.username,
  )

  function canPick(candidate) {
    if (!session.value || candidate.action !== 'UNDECIDED') return false
    const undecidedCount = session.value.candidates.filter((c) => c.action === 'UNDECIDED').length
    const remainingBansNeeded = session.value.requiredBanCount - session.value.banCount
    return undecidedCount - 1 >= remainingBansNeeded
  }

  function disconnect() {
    clearPendingTimeout()
    stompClient?.deactivate()
    stompClient = null
    sessionConnected.value = false
  }

  async function refreshSession(sessionId) {
    try {
      const response = await apiFetch(
        `api/locations/${route.params.id}/pick-sessions/${sessionId}`,
      )
      if (response.ok) session.value = await response.json()
    } catch {
      // Non-fatal: the next broadcast frame will bring us back in sync.
    }
  }

  function connect(sessionId) {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(apiUrl('ws')),
      connectHeaders: { Authorization: `Bearer ${auth.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        sessionConnected.value = true
        stompClient.subscribe(
          `/topic/locations/${route.params.id}/pick-sessions/${sessionId}`,
          (message) => {
            clearPendingTimeout()
            session.value = JSON.parse(message.body)
            sessionError.value = ''
            actionPending.value = false
          },
        )
        // Business-rule failures (not your turn, game already decided, no
        // eligible games, ...) are delivered here rather than as a STOMP
        // ERROR frame, which would otherwise kill the connection on every
        // routine validation failure.
        stompClient.subscribe('/user/queue/pick-session-errors', (message) => {
          clearPendingTimeout()
          const body = JSON.parse(message.body)
          sessionError.value = body.message || t('pickSession.connectionError')
          actionPending.value = false
        })
        // The simple broker doesn't replay missed frames, so resync via REST
        // on every (re)connect in case something happened while disconnected.
        refreshSession(sessionId)
      },
      onStompError: (frame) => {
        clearPendingTimeout()
        sessionError.value = frame.headers?.message || t('pickSession.connectionError')
        actionPending.value = false
      },
      onWebSocketClose: () => {
        sessionConnected.value = false
      },
    })
    stompClient.activate()
  }

  // Called on mount and whenever the active session needs re-checking (e.g.
  // after a create-session 409 conflict, or after a session is cancelled).
  async function fetchActiveSession() {
    disconnect()
    sessionLoading.value = true
    sessionError.value = ''

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/pick-sessions/active`)

      if (response.status === 204) {
        session.value = null
        return
      }

      if (!response.ok) {
        throw new Error(t('pickSession.loadFailed'))
      }

      session.value = await response.json()
      connect(session.value.id)
    } catch (e) {
      sessionError.value = e.message || t('pickSession.loadFailed')
    } finally {
      sessionLoading.value = false
    }
  }

  async function createSession({ excludeAlreadyPlayed, targetRemainingCount }) {
    sessionError.value = ''
    actionPending.value = true

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/pick-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeAlreadyPlayed, targetRemainingCount }),
      })

      if (response.status === 409) {
        // Someone else just created one — join it instead of erroring out.
        await fetchActiveSession()
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || t('pickSession.createFailed'))
      }

      session.value = await response.json()
      connect(session.value.id)
    } catch (e) {
      sessionError.value = e.message || t('pickSession.createFailed')
    } finally {
      actionPending.value = false
    }
  }

  // The server should always broadcast a fresh state (or error out) in response
  // to a publish, but if a request is silently dropped or fails server-side
  // without an ERROR frame, this stops the UI from spinning forever with no
  // feedback: after a few seconds with no reply, surface an error and re-sync.
  function publish(destinationSuffix, body) {
    if (!session.value || !stompClient?.connected) return
    const sessionId = session.value.id
    actionPending.value = true
    clearPendingTimeout()
    pendingTimeout = setTimeout(() => {
      actionPending.value = false
      sessionError.value = t('pickSession.actionTimeout')
      refreshSession(sessionId)
    }, 8000)
    stompClient.publish({
      destination: `/app/locations/${route.params.id}/pick-sessions/${sessionId}/${destinationSuffix}`,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  }

  function join() {
    publish('join')
  }

  function start() {
    publish('start')
  }

  function cancel() {
    publish('cancel')
  }

  function submitAction(gameId, action) {
    publish('action', { gameId, action })
  }

  // canPick's math is the same for every undecided candidate (it only
  // depends on the pool-wide undecided/ban counts, not which game), so once
  // it's false it's false for all of them at once — from that point on,
  // banning is the only legal move for the rest of the session. Rather than
  // making whoever's turn it is notice that and click Ban on each one in
  // turn, auto-submit it the moment it becomes their turn.
  watch(session, (value) => {
    if (
      value?.status !== 'IN_PROGRESS' ||
      value.currentTurnUsername !== auth.user?.username ||
      actionPending.value
    ) {
      return
    }

    const undecided = value.candidates.filter((c) => c.action === 'UNDECIDED')
    if (undecided.length > 0 && undecided.every((c) => !canPick(c))) {
      submitAction(undecided[0].gameId, 'BANNED')
    }
  })

  onUnmounted(disconnect)

  return {
    session,
    sessionLoading,
    sessionError,
    sessionConnected,
    actionPending,
    isParticipant,
    isCreator,
    isMyTurn,
    canPick,
    fetchActiveSession,
    createSession,
    join,
    start,
    cancel,
    submitAction,
  }
}
