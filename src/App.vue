<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const route = useRoute()

onMounted(() => {
  auth.loadTokenFromStorage()
})
</script>

<template>
  <div class="min-h-screen">
    <router-view />

    <router-link
      v-if="route.name !== 'stack'"
      to="/stack"
      class="fixed bottom-5 right-5 z-50 rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-lg shadow-black/30 transition hover:border-slate-500 hover:text-white"
    >
      Tech stack
    </router-link>
  </div>
</template>
