<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { usingFallbackBackend } from '../config/api'
import { GOOGLE_CLIENT_ID, loadGoogleIdentity } from '../utils/googleIdentity'
import BaseButton from '../components/base/BaseButton.vue'
import AlertBanner from '../components/base/AlertBanner.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t, locale } = useI18n()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const googleButtonRef = ref(null)

// Only ever redirect back into our own app — a bare `/path`, never a
// protocol-relative or backslash-prefixed one, which browsers would treat
// as pointing off-site (open-redirect via a crafted `?redirect=`).
function isSafeRedirect(path) {
  return typeof path === 'string' && /^\/(?!\/|\\)/.test(path)
}

function postLoginDestination() {
  const redirect = route.query.redirect
  if (isSafeRedirect(redirect)) return redirect
  return { name: auth.isAdmin ? 'admin' : 'locations' }
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await auth.login(username.value, password.value)
    router.push(postLoginDestination())
  } catch (e) {
    error.value = e.message || t('login.loginFailed')
  } finally {
    loading.value = false
  }
}

async function handleGoogleCredential(response) {
  error.value = ''

  try {
    await auth.loginWithGoogle(response.credential)
    router.push(postLoginDestination())
  } catch (e) {
    error.value = e.message || t('login.googleFailed')
  }
}

onMounted(async () => {
  if (!GOOGLE_CLIENT_ID) return

  try {
    await loadGoogleIdentity()
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    })
    // GIS only accepts a pixel width (max 400), not a percentage, so derive
    // one from the container's rendered width to match the card.
    const width = Math.min(400, googleButtonRef.value.offsetWidth || 300)
    window.google.accounts.id.renderButton(googleButtonRef.value, {
      theme: 'filled_black',
      size: 'large',
      width,
      text: 'signin_with',
      locale: locale.value,
    })
  } catch {
    error.value = t('login.googleUnavailable')
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
    <section class="w-full max-w-md text-center">
      <h2 class="text-lg font-semibold text-slate-100">{{ $t('login.about.title') }}</h2>
      <p class="mt-2 text-sm text-slate-400">{{ $t('login.about.description') }}</p>
      <ul class="mt-3 space-y-1 text-left text-sm text-slate-400">
        <li>🎲 {{ $t('login.about.feature1') }}</li>
        <li>📓 {{ $t('login.about.feature2') }}</li>
        <li>🤝 {{ $t('login.about.feature3') }}</li>
      </ul>
    </section>

    <form
      class="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      @submit.prevent="handleSubmit"
    >
      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight">{{ $t('login.title') }}</h1>
        <p class="mt-1 text-sm text-slate-400">{{ $t('login.subtitle') }}</p>
        <LanguageSwitcher class="mt-4 inline-flex" />
      </div>

      <AlertBanner v-if="usingFallbackBackend" variant="info" size="sm">{{ $t('login.coldStartHint') }}</AlertBanner>

      <AlertBanner v-if="error">{{ error }}</AlertBanner>

      <div class="space-y-4">
        <div>
          <label for="username" class="mb-1 block text-sm font-medium text-slate-300">{{ $t('login.usernameLabel') }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            :placeholder="$t('login.usernamePlaceholder')"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-slate-300">{{ $t('login.passwordLabel') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            placeholder="••••••••"
          />
        </div>
      </div>

      <BaseButton type="submit" block :loading="loading">
        {{ loading ? $t('login.signingIn') : $t('login.signIn') }}
      </BaseButton>

      <div v-if="GOOGLE_CLIENT_ID" class="flex items-center gap-3">
        <div class="h-px flex-1 bg-slate-800"></div>
        <span class="text-xs text-slate-500">{{ $t('login.orContinueWith') }}</span>
        <div class="h-px flex-1 bg-slate-800"></div>
      </div>

      <div v-if="GOOGLE_CLIENT_ID" ref="googleButtonRef" class="flex justify-center"></div>

      <p class="text-center text-sm text-slate-400">
        {{ $t('login.noAccount') }}
        <router-link to="/register" class="font-medium text-indigo-400 hover:text-indigo-300">
          {{ $t('login.register') }}
        </router-link>
      </p>
    </form>
  </div>
</template>
