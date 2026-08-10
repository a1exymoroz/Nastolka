<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()
const appVersion = __APP_VERSION__

const frontendRows = computed(() => [
  { layer: t('stack.frontendRows.language'), tech: t('stack.frontendRows.languageValue') },
  { layer: t('stack.frontendRows.ui'), tech: t('stack.frontendRows.uiValue') },
  { layer: t('stack.frontendRows.state'), tech: t('stack.frontendRows.stateValue') },
  { layer: t('stack.frontendRows.physics'), tech: t('stack.frontendRows.physicsValue') },
  { layer: t('stack.frontendRows.styling'), tech: t('stack.frontendRows.stylingValue') },
  { layer: t('stack.frontendRows.authClient'), tech: t('stack.frontendRows.authClientValue') },
  { layer: t('stack.frontendRows.api'), tech: t('stack.frontendRows.apiValue') },
  { layer: t('stack.frontendRows.realtime'), tech: t('stack.frontendRows.realtimeValue') },
  { layer: t('stack.frontendRows.photoStorage'), tech: t('stack.frontendRows.photoStorageValue') },
  { layer: t('stack.frontendRows.testing'), tech: t('stack.frontendRows.testingValue') },
  { layer: t('stack.frontendRows.build'), tech: t('stack.frontendRows.buildValue') },
  { layer: t('stack.frontendRows.deploy'), tech: t('stack.frontendRows.deployValue') },
])

const backendRows = computed(() => [
  { layer: t('stack.backendRows.runtime'), tech: t('stack.backendRows.runtimeValue') },
  { layer: t('stack.backendRows.api'), tech: t('stack.backendRows.apiValue') },
  { layer: t('stack.backendRows.security'), tech: t('stack.backendRows.securityValue') },
  { layer: t('stack.backendRows.data'), tech: t('stack.backendRows.dataValue') },
  { layer: t('stack.backendRows.realtime'), tech: t('stack.backendRows.realtimeValue') },
  { layer: t('stack.backendRows.integrations'), tech: t('stack.backendRows.integrationsValue') },
  { layer: t('stack.backendRows.ops'), tech: t('stack.backendRows.opsValue') },
])

const telegramRows = computed(() => [
  { layer: t('stack.telegramRows.language'), tech: t('stack.telegramRows.languageValue') },
  { layer: t('stack.telegramRows.commands'), tech: t('stack.telegramRows.commandsValue') },
  { layer: t('stack.telegramRows.auth'), tech: t('stack.telegramRows.authValue') },
  { layer: t('stack.telegramRows.deploy'), tech: t('stack.telegramRows.deployValue') },
])

const flows = computed(() => [
  {
    title: t('stack.flowLogin.title'),
    steps: [
      t('stack.flowLogin.step1'),
      t('stack.flowLogin.step2'),
      t('stack.flowLogin.step3'),
      t('stack.flowLogin.step4'),
      t('stack.flowLogin.step5'),
    ],
  },
  {
    title: t('stack.flowRegister.title'),
    steps: [
      t('stack.flowRegister.step1'),
      t('stack.flowRegister.step2'),
      t('stack.flowRegister.step3'),
      t('stack.flowRegister.step4'),
      t('stack.flowRegister.step5'),
    ],
  },
  {
    title: t('stack.flowAuthRequest.title'),
    steps: [
      t('stack.flowAuthRequest.step1'),
      t('stack.flowAuthRequest.step2'),
      t('stack.flowAuthRequest.step3'),
      t('stack.flowAuthRequest.step4'),
    ],
  },
  {
    title: t('stack.flowGameNight.title'),
    steps: [
      t('stack.flowGameNight.step1'),
      t('stack.flowGameNight.step2'),
      t('stack.flowGameNight.step3'),
      t('stack.flowGameNight.step4'),
      t('stack.flowGameNight.step5'),
    ],
  },
  {
    title: t('stack.flowTelegram.title'),
    steps: [
      t('stack.flowTelegram.step1'),
      t('stack.flowTelegram.step2'),
      t('stack.flowTelegram.step3'),
      t('stack.flowTelegram.step4'),
    ],
  },
])
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <header class="mb-10">
      <div class="mb-4 flex items-center justify-between">
        <button
          type="button"
          class="text-sm text-slate-400 underline transition hover:text-slate-200"
          @click="router.push({ name: auth.isAuthenticated ? 'locations' : 'login' })"
        >
          {{ $t('stack.back') }}
        </button>
      </div>
      <h1 class="text-3xl font-bold tracking-tight">{{ $t('stack.title') }}</h1>
      <p class="mt-1 text-sm text-slate-500">{{ $t('stack.version', { version: appVersion }) }}</p>
      <p class="mt-2 text-slate-400">
        {{ $t('stack.description') }}
      </p>
    </header>

    <section class="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-4 text-lg font-semibold">{{ $t('stack.architecture') }}</h2>
      <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            {{ $t('stack.frontend') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="node in ['Vue 3 SPA', 'Pinia', 'Rapier + Three.js', 'STOMP chat']"
              :key="node"
              class="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
            >
              {{ node }}
            </span>
          </div>
        </div>

        <div class="shrink-0 text-center text-xs font-medium text-slate-500 sm:px-2">
          {{ $t('stack.restJwt') }}
        </div>

        <div class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            {{ $t('stack.backend') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="node in ['Spring Boot', 'PostgreSQL']"
              :key="node"
              class="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
            >
              {{ node }}
            </span>
          </div>
        </div>
      </div>
      <div class="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div class="hidden flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:block sm:invisible">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">&nbsp;</p>
          <div class="flex flex-wrap gap-2">
            <span class="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200">&nbsp;</span>
          </div>
        </div>

        <div class="shrink-0 text-center text-xs font-medium text-slate-500 sm:px-2">
          {{ $t('stack.telegramConnectorOut') }}<br />
          {{ $t('stack.telegramConnectorIn') }}
        </div>

        <div class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            {{ $t('stack.telegramBot') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="node in ['Python', 'python-telegram-bot']"
              :key="node"
              class="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
            >
              {{ node }}
            </span>
          </div>
        </div>
      </div>
      <p class="mt-4 text-sm text-slate-500">
        {{ $t('stack.hosting') }}
      </p>
    </section>

    <section class="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ $t('stack.frontend') }}</h2>
        <a
          href="https://github.com/a1exymoroz/Nastolka"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {{ $t('stack.viewRepo') }}
        </a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="py-2 pr-4 font-medium">{{ $t('stack.layer') }}</th>
              <th class="py-2 font-medium">{{ $t('stack.tech') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in frontendRows"
              :key="row.layer"
              class="border-b border-slate-800/60 last:border-0"
            >
              <td class="py-2 pr-4 whitespace-nowrap text-slate-300">{{ row.layer }}</td>
              <td class="py-2 text-slate-400">{{ row.tech }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ $t('stack.backend') }}</h2>
        <a
          href="https://github.com/a1exymoroz/Nastolka-api"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {{ $t('stack.viewRepo') }}
        </a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="py-2 pr-4 font-medium">{{ $t('stack.layer') }}</th>
              <th class="py-2 font-medium">{{ $t('stack.tech') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in backendRows"
              :key="row.layer"
              class="border-b border-slate-800/60 last:border-0"
            >
              <td class="py-2 pr-4 whitespace-nowrap text-slate-300">{{ row.layer }}</td>
              <td class="py-2 text-slate-400">{{ row.tech }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ $t('stack.telegramBot') }}</h2>
        <a
          href="https://github.com/a1exymoroz/Nastolka-telegram"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {{ $t('stack.viewRepo') }}
        </a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="py-2 pr-4 font-medium">{{ $t('stack.layer') }}</th>
              <th class="py-2 font-medium">{{ $t('stack.tech') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in telegramRows"
              :key="row.layer"
              class="border-b border-slate-800/60 last:border-0"
            >
              <td class="py-2 pr-4 whitespace-nowrap text-slate-300">{{ row.layer }}</td>
              <td class="py-2 text-slate-400">{{ row.tech }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-4 text-lg font-semibold">{{ $t('stack.flows') }}</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <article
          v-for="flow in flows"
          :key="flow.title"
          class="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
        >
          <h3 class="mb-2 text-sm font-semibold text-slate-200">{{ flow.title }}</h3>
          <ol class="list-decimal space-y-1 pl-4 text-sm text-slate-400">
            <li v-for="step in flow.steps" :key="step">{{ step }}</li>
          </ol>
        </article>
      </div>
    </section>
  </div>
</template>
