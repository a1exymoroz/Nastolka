<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import BaseInput from '../components/base/BaseInput.vue'
import BaseButton from '../components/base/BaseButton.vue'
import AlertBanner from '../components/base/AlertBanner.vue'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()
const appVersion = __APP_VERSION__

const displayName = ref('')
const profileLoading = ref(true)
const profileError = ref('')
const saveLoading = ref(false)
const saveError = ref('')
const saved = ref(false)

async function parseProfileError(response, fallback) {
  const data = await response.json().catch(() => ({}))
  return data.message || data.error || fallback
}

async function fetchProfile() {
  profileLoading.value = true
  profileError.value = ''

  try {
    const response = await apiFetch('api/users/me')

    if (!response.ok) {
      throw new Error(await parseProfileError(response, t('settings.profileLoadFailed')))
    }

    const data = await response.json()
    displayName.value = data.displayName ?? ''
  } catch (e) {
    profileError.value = e.message || t('settings.profileLoadFailed')
  } finally {
    profileLoading.value = false
  }
}

async function handleSaveDisplayName() {
  saveError.value = ''
  saveLoading.value = true

  try {
    const response = await apiFetch('api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: displayName.value.trim() || null }),
    })

    if (!response.ok) {
      throw new Error(await parseProfileError(response, t('settings.displayNameSaveFailed')))
    }

    const data = await response.json()
    displayName.value = data.displayName ?? ''
    saved.value = true
  } catch (e) {
    saveError.value = e.message || t('settings.displayNameSaveFailed')
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchProfile()
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <header class="mb-10">
      <button
        type="button"
        class="mb-4 text-sm text-slate-400 underline transition hover:text-slate-200"
        @click="auth.isAuthenticated ? router.back() : router.push({ name: 'login' })"
      >
        {{ t('settings.back') }}
      </button>
      <h1 class="text-3xl font-bold tracking-tight">{{ t('settings.title') }}</h1>
    </header>

    <section v-if="auth.isAuthenticated" class="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-1 text-lg font-semibold">{{ t('settings.profileTitle') }}</h2>
      <p class="mb-4 text-sm text-slate-500">{{ t('settings.profileDescription') }}</p>

      <AlertBanner v-if="profileError" variant="error" class="mb-4">{{ profileError }}</AlertBanner>

      <form class="space-y-4" @submit.prevent="handleSaveDisplayName">
        <div>
          <label for="settings-display-name" class="mb-1 block text-sm font-medium text-slate-300">
            {{ t('settings.displayNameLabel') }}
          </label>
          <BaseInput
            id="settings-display-name"
            v-model="displayName"
            type="text"
            maxlength="64"
            :disabled="profileLoading"
            class="w-full px-4 py-2.5"
            @input="saved = false"
          />
        </div>

        <AlertBanner v-if="saved" variant="success">{{ t('settings.displayNameSaved') }}</AlertBanner>
        <AlertBanner v-if="saveError" variant="error">{{ saveError }}</AlertBanner>

        <BaseButton type="submit" :loading="saveLoading" :disabled="profileLoading">
          {{ saveLoading ? t('common.saving') : t('settings.save') }}
        </BaseButton>
      </form>
    </section>

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
