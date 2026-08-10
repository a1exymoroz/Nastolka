<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import BaseButton from '../components/base/BaseButton.vue'
import AlertBanner from '../components/base/AlertBanner.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = t('register.passwordsDoNotMatch')
    return
  }

  loading.value = true

  try {
    await auth.register(username.value, password.value, email.value)
    router.push({ name: auth.isAdmin ? 'admin' : 'locations' })
  } catch (e) {
    error.value = e.message || t('register.registrationFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <form
      class="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      @submit.prevent="handleSubmit"
    >
      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight">{{ $t('register.title') }}</h1>
        <p class="mt-1 text-sm text-slate-400">{{ $t('register.subtitle') }}</p>
        <LanguageSwitcher class="mt-4 inline-flex" />
      </div>

      <AlertBanner v-if="error">{{ error }}</AlertBanner>

      <div class="space-y-4">
        <div>
          <label for="username" class="mb-1 block text-sm font-medium text-slate-300">{{ $t('register.usernameLabel') }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            :placeholder="$t('register.usernamePlaceholder')"
          />
        </div>

        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-slate-300">{{ $t('register.emailLabel') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            :placeholder="$t('register.emailPlaceholder')"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-slate-300">{{ $t('register.passwordLabel') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            minlength="8"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label for="confirm-password" class="mb-1 block text-sm font-medium text-slate-300">
            {{ $t('register.confirmPasswordLabel') }}
          </label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            placeholder="••••••••"
          />
        </div>
      </div>

      <BaseButton type="submit" block :loading="loading">
        {{ loading ? $t('register.creatingAccount') : $t('register.register') }}
      </BaseButton>

      <p class="text-center text-sm text-slate-400">
        {{ $t('register.haveAccount') }}
        <router-link to="/login" class="font-medium text-indigo-400 hover:text-indigo-300">
          {{ $t('register.signIn') }}
        </router-link>
      </p>
    </form>
  </div>
</template>
