import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { apiUrl } from '../../../config/api'
import { apiFetch } from '../../../utils/apiFetch'
import { useAuthStore } from '../../../stores/auth'
import { t } from '../../../i18n'

export function useLocationChat() {
  const route = useRoute()
  const auth = useAuthStore()

  const chatMessages = ref([])
  const chatLoading = ref(true)
  const chatError = ref('')
  const chatConnected = ref(false)

  let stompClient = null

  function disconnectChat() {
    stompClient?.deactivate()
    stompClient = null
    chatConnected.value = false
  }

  function connectChat(locationId) {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(apiUrl('ws')),
      connectHeaders: { Authorization: `Bearer ${auth.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        chatConnected.value = true
        stompClient.subscribe(`/topic/locations/${locationId}/chat`, (message) => {
          chatMessages.value.push(JSON.parse(message.body))
        })
      },
      onStompError: () => {
        chatError.value = t('locationDetail.chat.connectionError')
      },
      onWebSocketClose: () => {
        chatConnected.value = false
      },
    })
    stompClient.activate()
  }

  // Called from loadAll() on mount and whenever route.params.id changes, so
  // switching locations tears down the old subscription before opening a new one.
  async function fetchChat() {
    disconnectChat()
    chatLoading.value = true
    chatError.value = ''
    chatMessages.value = []

    try {
      const response = await apiFetch(`api/locations/${route.params.id}/chat/messages`)

      if (!response.ok) {
        throw new Error(t('locationDetail.chat.loadFailed'))
      }

      chatMessages.value = await response.json()
      connectChat(route.params.id)
    } catch (e) {
      chatError.value = e.message || t('locationDetail.chat.loadFailed')
    } finally {
      chatLoading.value = false
    }
  }

  function sendChatMessage(content) {
    const trimmed = content.trim()
    if (!trimmed || !stompClient?.connected) return

    stompClient.publish({
      destination: `/app/locations/${route.params.id}/chat.send`,
      body: JSON.stringify({ content: trimmed }),
    })
  }

  onUnmounted(disconnectChat)

  return {
    chatMessages,
    chatLoading,
    chatError,
    chatConnected,
    fetchChat,
    sendChatMessage,
  }
}
