<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.loadTokenFromStorage()
})
</script>

<template>
  <div class="min-h-screen">
    <router-view />
  </div>
</template>
