<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationDetails } from './location-detail/composables/useLocationDetails'
import { useShares } from './location-detail/composables/useShares'
import { useLocationGames } from './location-detail/composables/useLocationGames'
import { useLocationHistory } from './location-detail/composables/useLocationHistory'
import { useLocationChat } from './location-detail/composables/useLocationChat'
import { useAuthStore } from '../stores/auth'
import LocationHeader from './location-detail/components/LocationHeader.vue'
import LocationEditForm from './location-detail/components/LocationEditForm.vue'
import SharingPanel from './location-detail/components/SharingPanel.vue'
import AddGameForm from './location-detail/components/AddGameForm.vue'
import GamesPanel from './location-detail/components/GamesPanel.vue'
import HistoryPanel from './location-detail/components/HistoryPanel.vue'
import ChatPanel from './location-detail/components/ChatPanel.vue'
import PhotoLightbox from './location-detail/components/PhotoLightbox.vue'
import { useTourStore } from '../stores/tour'
import InfoPanel from '../components/base/InfoPanel.vue'
import BaseButton from '../components/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const tour = useTourStore()

const showManage = ref(route.hash === '#sharing')

// The tour's sharing/add-game steps live inside this collapsed section, so open it
// for them automatically rather than leaving the user stuck spotlighting a hidden element.
watch(
  () => tour.currentStep,
  (step) => {
    if (step?.requiresManageExpanded) showManage.value = true
  },
  { immediate: true },
)

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

// Lets the tour skip manage-only steps instantly for read-only viewers instead of
// polling for elements (edit toggle, sharing, log session, ...) that won't render.
// canManage defaults to false while the location is still loading, so wait for
// loading to finish before reporting it — otherwise the tour could skip a step for
// an owner just because their location hadn't loaded yet.
//
// Also resumes the tour here: a prior location without manage rights can exhaust
// its visible steps and go inactive, and only Locations.vue calls maybeStart() on
// mount — without this, navigating straight to a manage-rights location would
// never surface its remaining steps.
watch(
  () => [locationLoading.value, canManage.value],
  ([loading, manage]) => {
    if (!loading) {
      tour.setContext({ canManage: manage })
      tour.maybeStart()
    }
  },
  { immediate: true },
)

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
  gameSearchQuery,
  gameSearchResults,
  gameSearchLoading,
  gameSearchError,
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
} = useLocationGames()

const {
  history,
  historyLoading,
  historyError,
  deletingHistoryId,
  photoUrls,
  uploadingPhotoId,
  deletingPhotoId,
  lightboxEntry,
  lightboxUrl,
  openLightbox,
  closeLightbox,
  fetchHistory,
  handleUploadPhoto,
  handleDeletePhoto,
  handleDeleteHistory,
} = useLocationHistory()

const { chatMessages, chatLoading, chatError, chatConnected, fetchChat, sendChatMessage } =
  useLocationChat()

async function loadAll() {
  await Promise.all([
    fetchLocation().then(() => {
      if (canManage.value) return fetchShares()
    }),
    fetchLocationGames(),
    fetchCatalogGames(),
    fetchHistory(),
    fetchChat(),
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
      {{ $t('locationDetail.backToLocations') }}
    </button>

    <section v-if="locationLoading" class="py-20 text-center text-slate-400">{{ $t('locationDetail.loading') }}</section>

    <section v-else-if="locationError" class="py-20 text-center">
      <p class="text-red-400">{{ locationError }}</p>
      <BaseButton variant="secondary" class="mt-4" @click="fetchLocation">
        {{ $t('common.tryAgain') }}
      </BaseButton>
    </section>

    <template v-else-if="location">
      <InfoPanel id="location-detail-intro" :title="$t('locationDetail.introTitle')">
        {{ $t('locationDetail.introBody') }}
      </InfoPanel>

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
          <span>{{ $t('locationDetail.manageSharingAndGames') }}</span>
          <span
            class="text-xs text-slate-500 transition-transform"
            :class="{ 'rotate-180': showManage }"
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        <div v-if="showManage" class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
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
            v-model:search-query="gameSearchQuery"
            :games="availableCatalogGames"
            :loading="addGameLoading"
            :error="addGameError"
            :search-results="gameSearchResults"
            :search-loading="gameSearchLoading"
            :search-error="gameSearchError"
            :importing-bgg-id="importingGameBggId"
            @add="handleAddGame"
            @search="handleSearchGames"
            @import="handleImportGame"
          />
        </div>
      </section>

      <div class="space-y-12">
        <ChatPanel
          :messages="chatMessages"
          :loading="chatLoading"
          :error="chatError"
          :connected="chatConnected"
          :current-username="auth.user?.username"
          @send="sendChatMessage"
        />

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
          @search-expansions="handleSearchExpansions"
          @import-expansion="handleImportExpansion"
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
          @open-lightbox="openLightbox"
        />
      </div>
    </template>

    <PhotoLightbox
      :url="lightboxUrl"
      :can-manage="canManage"
      :saving="!!lightboxEntry && uploadingPhotoId === lightboxEntry.id"
      :error="lightboxEntry ? historyError : ''"
      @close="closeLightbox"
      @save-rotation="handleUploadPhoto(lightboxEntry, $event)"
    />
  </div>
</template>
