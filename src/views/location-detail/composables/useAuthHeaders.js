import { useAuthStore } from '../../../stores/auth'

export function useAuthHeaders() {
  const auth = useAuthStore()
  return (extra = {}) => ({ Authorization: `Bearer ${auth.token}`, ...extra })
}
