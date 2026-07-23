<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationDetails } from './location-detail/composables/useLocationDetails'
import { useShares } from './location-detail/composables/useShares'
import { useLocationGames } from './location-detail/composables/useLocationGames'
import { useLocationHistory } from './location-detail/composables/useLocationHistory'
import LocationHeader from './location-detail/components/LocationHeader.vue'
import LocationEditForm from './location-detail/components/LocationEditForm.vue'
import SharingPanel from './location-detail/components/SharingPanel.vue'
import AddGameForm from './location-detail/components/AddGameForm.vue'
import GamesPanel from './location-detail/components/GamesPanel.vue'
import HistoryPanel from './location-detail/components/HistoryPanel.vue'
import PhotoLightbox from './location-detail/components/PhotoLightbox.vue'

const route = useRoute()
const router = useRouter()

const showManage = ref(route.hash === '#sharing')

const {
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
} = useLocationDetails()

const {
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
} = useShares()

const {
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
} = useLocationGames()

const {
  history,
  historyLoading,
  historyError,
  deletingHistoryId,
  photoUrls,
  uploadingPhotoId,
  deletingPhotoId,
  lightboxUrl,
  fetchHistory,
  handleUploadPhoto,
  handleDeletePhoto,
  handleDeleteHistory,
} = useLocationHistory()

async function loadAll() {
  await Promise.all([
    fetchLocation().then(() => {
      if (canManage.value) return fetchShares()
    }),
    fetchLocationGames(),
    fetchCatalogGames(),
    fetchHistory(),
  ])
}

onMounted(loadAll)

watch(() => route.params.id, loadAll)

function goToEditHistoryEntry(entry) {
  router.push({
    name: 'location-history-edit',
    params: { id: route.params.id, historyId: entry.id },
  })
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <button
      type="button"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      @click="router.push({ name: 'locations' })"
    >
      <span aria-hidden="true">←</span> Back to locations
    </button>

    <section v-if="locationLoading" class="py-20 text-center text-slate-400">Loading…</section>

    <section v-else-if="locationError" class="py-20 text-center">
      <p class="text-red-400">{{ locationError }}</p>
      <button
        class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        @click="fetchLocation"
      >
        Try again
      </button>
    </section>

    <template v-else-if="location">
      <LocationHeader
        :location="location"
        :can-manage="canManage"
        :editing="editing"
        :can-roll="locationGames.length >= 2"
        @update:editing="editing = $event"
        @roll="router.push({ name: 'location-play', params: { id: route.params.id } })"
      />

      <LocationEditForm
        v-if="canManage && editing"
        :form="editForm"
        :loading="editLoading"
        :error="editError"
        @submit="handleUpdateLocation"
      />

      <section v-if="canManage" class="mb-10">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
          @click="showManage = !showManage"
        >
          <span>Manage sharing &amp; games</span>
          <span
            class="text-xs text-slate-500 transition-transform"
            :class="{ 'rotate-180': showManage }"
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        <div v-if="showManage" class="mt-4 grid gap-6 md:grid-cols-2">
          <SharingPanel
            v-model:username="shareUsername"
            :shares="shares"
            :loading="sharesLoading"
            :error="sharesError"
            :share-loading="shareLoading"
            :revoking-username="revokingUsername"
            :search-results="userSearchResults"
            :search-loading="userSearchLoading"
            @search-input="onShareUsernameInput"
            @pick="pickShareSuggestion"
            @add="handleAddShare"
            @revoke="handleRevokeShare"
          />

          <AddGameForm
            v-model:selected-id="selectedGameId"
            :games="availableCatalogGames"
            :loading="addGameLoading"
            :error="addGameError"
            @add="handleAddGame"
          />
        </div>
      </section>

      <div class="space-y-12">
        <GamesPanel
          :games="locationGames"
          :loading="locationGamesLoading"
          :error="locationGamesError"
          :can-manage="canManage"
          :removing-game-id="removingGameId"
          :game-expansion-state="gameExpansionState"
          :get-available-expansions="availableCatalogExpansions"
          @remove-game="handleRemoveGame"
          @toggle-panel="toggleExpansionPanel"
          @add-expansion="handleAddExpansion"
          @remove-expansion="handleRemoveExpansion"
        />

        <HistoryPanel
          :history="history"
          :loading="historyLoading"
          :error="historyError"
          :can-manage="canManage"
          :photo-urls="photoUrls"
          :deleting-history-id="deletingHistoryId"
          :uploading-photo-id="uploadingPhotoId"
          :deleting-photo-id="deletingPhotoId"
          @log-session="router.push({ name: 'location-history-new', params: { id: route.params.id } })"
          @edit-entry="goToEditHistoryEntry"
          @delete-entry="handleDeleteHistory"
          @upload-photo="handleUploadPhoto"
          @delete-photo="handleDeletePhoto"
          @open-lightbox="lightboxUrl = $event"
        />
      </div>
    </template>

    <PhotoLightbox :url="lightboxUrl" @close="lightboxUrl = null" />
  </div>
</template>
