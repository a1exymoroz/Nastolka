<script setup>
import { ref, watch } from 'vue'
import BaseButton from '../../../components/base/BaseButton.vue'

const props = defineProps({
  shares: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  shareLoading: { type: Boolean, default: false },
  revokingUsername: { type: String, default: null },
  savingPermissionsUsernames: { type: Array, default: () => [] },
  searchResults: { type: Array, default: () => [] },
  searchLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['search-input', 'pick', 'add', 'revoke', 'update-permissions'])

const username = defineModel('username', { default: '' })
const canEditInfo = defineModel('canEditInfo', { default: false })
const canManageGames = defineModel('canManageGames', { default: false })
const canManageHistory = defineModel('canManageHistory', { default: false })

function shareKey(share) {
  return share.username ?? share.targetUsername
}

const permissionDrafts = ref({})

watch(
  () => props.shares,
  (shares) => {
    for (const share of shares) {
      const key = shareKey(share)
      if (permissionDrafts.value[key]) continue
      permissionDrafts.value[key] = {
        canEditInfo: !!share.canEditInfo,
        canManageGames: !!share.canManageGames,
        canManageHistory: !!share.canManageHistory,
      }
    }
  },
  { immediate: true },
)

function isDirty(share) {
  const key = shareKey(share)
  const draft = permissionDrafts.value[key]
  if (!draft) return false
  return (
    draft.canEditInfo !== !!share.canEditInfo ||
    draft.canManageGames !== !!share.canManageGames ||
    draft.canManageHistory !== !!share.canManageHistory
  )
}

function saveShare(share) {
  const key = shareKey(share)
  const draft = permissionDrafts.value[key]
  emit('update-permissions', { username: key, ...draft })
}

function handleInput() {
  emit('search-input')
}
</script>

<template>
  <div id="sharing" data-tour="location-sharing" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <h2 class="mb-4 text-lg font-semibold">{{ $t('locationDetail.sharing.title') }}</h2>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <p v-if="loading" class="text-sm text-slate-500">{{ $t('locationDetail.sharing.loadingShares') }}</p>

    <template v-else>
      <p v-if="shares.length === 0" class="mb-5 text-sm text-slate-500">
        {{ $t('locationDetail.sharing.notSharedYet') }}
      </p>

      <ul v-else class="mb-5 max-h-[500px] space-y-3 overflow-y-auto pr-1">
        <li
          v-for="share in shares"
          :key="shareKey(share)"
          class="rounded-xl border border-slate-800 bg-slate-800/30 p-4 transition hover:border-slate-700"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-300"
                aria-hidden="true"
              >
                {{ shareKey(share).charAt(0).toUpperCase() }}
              </span>
              <span class="truncate text-sm font-medium text-slate-100">{{ shareKey(share) }}</span>
            </div>

            <button
              type="button"
              :disabled="revokingUsername === shareKey(share)"
              :aria-label="$t('locationDetail.sharing.revoke')"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              @click="$emit('revoke', shareKey(share))"
            >
              <svg
                v-if="revokingUsername !== shareKey(share)"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
                />
              </svg>
              {{
                revokingUsername === shareKey(share)
                  ? $t('locationDetail.sharing.revoking')
                  : $t('locationDetail.sharing.revoke')
              }}
            </button>
          </div>

          <div v-if="permissionDrafts[shareKey(share)]" class="mt-3 border-t border-slate-800 pt-3">
            <div class="flex flex-wrap gap-1.5">
              <label
                v-for="perm in [
                  { key: 'canEditInfo', label: $t('locationDetail.sharing.canEditInfoLabel') },
                  { key: 'canManageGames', label: $t('locationDetail.sharing.canManageGamesLabel') },
                  { key: 'canManageHistory', label: $t('locationDetail.sharing.canManageHistoryLabel') },
                ]"
                :key="perm.key"
                class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition select-none"
                :class="
                  permissionDrafts[shareKey(share)][perm.key]
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                "
              >
                <input v-model="permissionDrafts[shareKey(share)][perm.key]" type="checkbox" class="sr-only" />
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path
                    v-if="permissionDrafts[shareKey(share)][perm.key]"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M5 13l4 4L19 7"
                  />
                  <circle v-else cx="12" cy="12" r="9" stroke-width="1.5" />
                </svg>
                {{ perm.label }}
              </label>
            </div>

            <div v-if="isDirty(share)" class="mt-3 flex justify-end">
              <BaseButton
                variant="primary"
                size="sm"
                :loading="savingPermissionsUsernames.includes(shareKey(share))"
                @click="saveShare(share)"
              >
                {{
                  savingPermissionsUsernames.includes(shareKey(share))
                    ? $t('locationDetail.sharing.savingPermissions')
                    : $t('locationDetail.sharing.savePermissions')
                }}
              </BaseButton>
            </div>
          </div>
        </li>
      </ul>

      <form @submit.prevent="$emit('add')">
        <div class="relative flex gap-2">
          <div class="relative min-w-0 flex-1">
            <input
              v-model="username"
              type="text"
              required
              autocomplete="off"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              :placeholder="$t('locationDetail.sharing.searchPlaceholder')"
              @input="handleInput"
            />
            <ul
              v-if="searchLoading || searchResults.length > 0"
              class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
            >
              <li v-if="searchLoading" class="px-4 py-2 text-xs text-slate-500">{{ $t('common.searching') }}</li>
              <li
                v-for="result in searchResults"
                :key="result"
                class="cursor-pointer px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                @mousedown.prevent="$emit('pick', result)"
              >
                {{ result }}
              </li>
            </ul>
          </div>
          <button
            type="submit"
            :disabled="shareLoading"
            class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ shareLoading ? $t('locationDetail.sharing.sharing') : $t('locationDetail.sharing.share') }}
          </button>
        </div>

        <div class="mt-3">
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {{ $t('locationDetail.sharing.permissions') }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <label
              class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition select-none"
              :class="
                canEditInfo
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              "
            >
              <input v-model="canEditInfo" type="checkbox" class="sr-only" />
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path
                  v-if="canEditInfo"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                />
                <circle v-else cx="12" cy="12" r="9" stroke-width="1.5" />
              </svg>
              {{ $t('locationDetail.sharing.canEditInfoLabel') }}
            </label>
            <label
              class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition select-none"
              :class="
                canManageGames
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              "
            >
              <input v-model="canManageGames" type="checkbox" class="sr-only" />
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path
                  v-if="canManageGames"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                />
                <circle v-else cx="12" cy="12" r="9" stroke-width="1.5" />
              </svg>
              {{ $t('locationDetail.sharing.canManageGamesLabel') }}
            </label>
            <label
              class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition select-none"
              :class="
                canManageHistory
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              "
            >
              <input v-model="canManageHistory" type="checkbox" class="sr-only" />
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path
                  v-if="canManageHistory"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                />
                <circle v-else cx="12" cy="12" r="9" stroke-width="1.5" />
              </svg>
              {{ $t('locationDetail.sharing.canManageHistoryLabel') }}
            </label>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>
