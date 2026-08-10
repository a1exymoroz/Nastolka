<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import ProductTour from './components/ProductTour.vue'
import GlobalToast from './components/base/GlobalToast.vue'

const auth = useAuthStore()
const route = useRoute()

onMounted(() => {
  auth.loadTokenFromStorage()
})
</script>

<template>
  <div class="min-h-screen">
    <router-view />

    <ProductTour />

    <GlobalToast />

    <!-- Desktop has room for a direct tech stack link; on small screens it's
         tucked behind the settings icon to avoid overlapping content. -->
    <router-link
      v-if="route.name !== 'stack' && route.name !== 'settings'"
      to="/stack"
      class="fixed bottom-5 left-5 z-50 hidden rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-lg shadow-black/30 transition hover:border-slate-500 hover:text-white sm:block"
    >
      {{ $t('stack.linkLabel') }}
    </router-link>

    <router-link
      v-if="route.name !== 'settings'"
      to="/settings"
      :aria-label="$t('common.settings')"
      class="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg shadow-black/30 transition hover:border-slate-500 hover:text-white"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
        <path
          d="M12 15a3 3 0 100-6 3 3 0 000 6z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </router-link>
  </div>
</template>
