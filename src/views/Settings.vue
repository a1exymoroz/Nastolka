<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()
const appVersion = __APP_VERSION__
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <header class="mb-10">
      <button
        type="button"
        class="mb-4 text-sm text-slate-400 underline transition hover:text-slate-200"
        @click="router.push({ name: auth.isAuthenticated ? 'locations' : 'login' })"
      >
        {{ t('settings.back') }}
      </button>
      <h1 class="text-3xl font-bold tracking-tight">{{ t('settings.title') }}</h1>
    </header>

    <section class="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-1 text-lg font-semibold">{{ t('settings.languageTitle') }}</h2>
      <p class="mb-4 text-sm text-slate-500">{{ t('settings.languageDescription') }}</p>
      <LanguageSwitcher class="inline-flex" />
    </section>

    <section class="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-1 text-lg font-semibold">{{ t('settings.aboutTitle') }}</h2>
      <p class="mb-4 text-sm text-slate-500">{{ t('settings.version', { version: appVersion }) }}</p>
      <router-link
        to="/stack"
        class="text-sm text-indigo-400 underline transition hover:text-indigo-300"
      >
        {{ t('settings.techStackLink') }}
      </router-link>
    </section>
  </div>
</template>
