<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ProductTour from './components/ProductTour.vue'
import GlobalToast from './components/base/GlobalToast.vue'

const auth = useAuthStore()
const route = useRoute()
const appVersion = __APP_VERSION__

onMounted(() => {
  auth.loadTokenFromStorage()
})
</script>

<template>
  <div class="min-h-screen">
    <router-view />

    <ProductTour />

    <GlobalToast />

    <router-link
      v-if="route.name !== 'stack'"
      to="/stack"
      class="fixed bottom-5 right-5 z-50 rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-lg shadow-black/30 transition hover:border-slate-500 hover:text-white"
    >
      {{ $t('stack.linkLabel') }}
    </router-link>

    <LanguageSwitcher class="fixed bottom-16 left-5 z-50" />

    <span class="fixed bottom-5 left-5 z-50 text-xs text-slate-600">v{{ appVersion }}</span>
  </div>
</template>
