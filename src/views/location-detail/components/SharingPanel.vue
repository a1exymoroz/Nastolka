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
      <p v-if="shares.length === 0" class="mb-4 text-sm text-slate-500">
        {{ $t('locationDetail.sharing.notSharedYet') }}
      </p>

      <ul v-else class="mb-4 space-y-2">
        <li
          v-for="share in shares"
          :key="shareKey(share)"
          class="rounded-lg border border-slate-800 px-3 py-2"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-200">{{ shareKey(share) }}</span>
            <button
              type="button"
              :disabled="revokingUsername === shareKey(share)"
              class="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              @click="$emit('revoke', shareKey(share))"
            >
              {{
                revokingUsername === shareKey(share)
                  ? $t('locationDetail.sharing.revoking')
                  : $t('locationDetail.sharing.revoke')
              }}
            </button>
          </div>

          <div v-if="permissionDrafts[shareKey(share)]" class="mt-2 border-t border-slate-800 pt-2">
            <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {{ $t('locationDetail.sharing.permissions') }}
            </p>
            <div class="flex flex-col gap-1.5">
              <label class="flex items-center gap-2 text-xs text-slate-400">
                <input
                  v-model="permissionDrafts[shareKey(share)].canEditInfo"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                {{ $t('locationDetail.sharing.canEditInfoLabel') }}
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-400">
                <input
                  v-model="permissionDrafts[shareKey(share)].canManageGames"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                {{ $t('locationDetail.sharing.canManageGamesLabel') }}
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-400">
                <input
                  v-model="permissionDrafts[shareKey(share)].canManageHistory"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                {{ $t('locationDetail.sharing.canManageHistoryLabel') }}
              </label>
            </div>
            <div class="mt-2 flex justify-end">
              <BaseButton
                variant="secondary"
                size="sm"
                :loading="savingPermissionsUsernames.includes(shareKey(share))"
                :disabled="!isDirty(share)"
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
            class="shrink-0 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ shareLoading ? $t('locationDetail.sharing.sharing') : $t('locationDetail.sharing.share') }}
          </button>
        </div>

        <div class="mt-2">
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {{ $t('locationDetail.sharing.permissions') }}
          </p>
          <div class="flex flex-col gap-1.5">
            <label class="flex items-center gap-2 text-xs text-slate-400">
              <input
                v-model="canEditInfo"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              {{ $t('locationDetail.sharing.canEditInfoLabel') }}
            </label>
            <label class="flex items-center gap-2 text-xs text-slate-400">
              <input
                v-model="canManageGames"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              {{ $t('locationDetail.sharing.canManageGamesLabel') }}
            </label>
            <label class="flex items-center gap-2 text-xs text-slate-400">
              <input
                v-model="canManageHistory"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              {{ $t('locationDetail.sharing.canManageHistoryLabel') }}
            </label>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>
