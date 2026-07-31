<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import BaseButton from '../components/base/BaseButton.vue'
import AlertBanner from '../components/base/AlertBanner.vue'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await auth.login(username.value, password.value)
    router.push({ name: auth.isAdmin ? 'admin' : 'locations' })
  } catch (e) {
    error.value = e.message || t('login.loginFailed')
  } finally {
    loading.value = false
  }
}
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
      </div>

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

      <p class="text-center text-sm text-slate-400">
        {{ $t('login.noAccount') }}
        <router-link to="/register" class="font-medium text-indigo-400 hover:text-indigo-300">
          {{ $t('login.register') }}
        </router-link>
      </p>
    </form>
  </div>
</template>
