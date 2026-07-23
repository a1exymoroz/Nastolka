import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { apiUrl } from '../../../config/api'
import { useAuthHeaders } from './useAuthHeaders'

export function useLocationDetails() {
  const route = useRoute()
  const auth = useAuthStore()
  const authHeaders = useAuthHeaders()

  const location = ref(null)
  const locationLoading = ref(true)
  const locationError = ref('')

  // TODO: confirm the exact field the backend uses for the owner's username on
  // LocationResponse (assuming `ownerUsername`, falling back to `owner.username`).
  const canManage = computed(() => {
    if (!location.value) return false
    const ownerUsername = location.value.ownerUsername ?? location.value.owner?.username
    return auth.isAdmin || ownerUsername === auth.user?.username
  })

  const editForm = ref({ name: '', description: '' })
  const editLoading = ref(false)
  const editError = ref('')
  const editing = ref(false)

  async function fetchLocation() {
    locationLoading.value = true
    locationError.value = ''

    try {
      const response = await fetch(apiUrl(`api/locations/${route.params.id}`), {
        headers: authHeaders(),
      })

      if (response.status === 404) {
        throw new Error('Location not found')
      }

      if (!response.ok) {
        throw new Error('Failed to load location')
      }

      location.value = await response.json()
      editForm.value = { name: location.value.name, description: location.value.description ?? '' }
    } catch (e) {
      locationError.value = e.message || 'Failed to load location'
    } finally {
      locationLoading.value = false
    }
  }

  async function handleUpdateLocation() {
    editError.value = ''
    editLoading.value = true

    try {
      const response = await fetch(apiUrl(`api/locations/${route.params.id}`), {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: editForm.value.name,
          description: editForm.value.description || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to update location')
      }

      location.value = await response.json()
      editing.value = false
    } catch (e) {
      editError.value = e.message || 'Failed to update location'
    } finally {
      editLoading.value = false
    }
  }

  return {
    location,
    locationLoading,
    locationError,
    canManage,
    editForm,
    editLoading,
    editError,
    editing,
    fetchLocation,
    handleUpdateLocation,
  }
}
