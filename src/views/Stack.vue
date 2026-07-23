<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const frontendRows = [
  { layer: 'Language', tech: 'JavaScript (ES modules)' },
  { layer: 'UI', tech: 'Vue 3.5 (Composition API, `<script setup>`), Vue Router 4' },
  { layer: 'State', tech: 'Pinia' },
  { layer: '3D / Physics', tech: 'Three.js, Rapier3D (compat) — dice rolls' },
  { layer: 'Styling', tech: 'Tailwind CSS' },
  { layer: 'Auth (client)', tech: 'Pinia store, localStorage JWT' },
  { layer: 'API', tech: 'Native fetch' },
  { layer: 'Testing', tech: 'Playwright' },
  { layer: 'Build', tech: 'Vite' },
  { layer: 'Deploy', tech: 'Netlify' },
]

const backendRows = [
  { layer: 'Runtime', tech: 'Java 21, Maven, Spring Boot 3.4' },
  { layer: 'API', tech: 'Spring Web (REST/JSON), Jakarta Validation' },
  { layer: 'Security', tech: 'Spring Security 6, BCrypt, JWT (JJWT 0.12.6 / HS256)' },
  { layer: 'Data', tech: 'PostgreSQL, Spring Data JPA, Hibernate, Flyway' },
  { layer: 'Integrations', tech: 'BoardGameGeek XML API (search / import)' },
  { layer: 'Ops', tech: 'Docker, Render (deploy), Neon (managed Postgres)' },
]

const flows = [
  {
    title: 'Login',
    steps: [
      'User submits username + password',
      'POST /api/auth/login',
      'API verifies the password hash and issues a signed JWT',
      'Token + role are stored in the Pinia auth store and localStorage',
      'Redirect to Locations (or Admin, for admin accounts)',
    ],
  },
  {
    title: 'Register',
    steps: [
      'User submits username, email, and password',
      'POST /api/auth/register',
      'API hashes the password and creates the account',
      'API returns a JWT for the new account, same as login',
      'Token is stored and the user lands on Locations',
    ],
  },
  {
    title: 'Authenticated request',
    steps: [
      'Client attaches Authorization: Bearer <JWT> to the request',
      'JwtAuthFilter validates the token signature and expiry',
      'SecurityContext is populated with the user and role',
      'Controller handles the request; 401/403 on missing or invalid tokens',
    ],
  },
  {
    title: 'Game night',
    steps: [
      'Open a location and select 2+ contenders',
      'Dice size is picked to fit the pool so every game gets a fair shot',
      'Roll the physics-simulated 3D die (Rapier + Three.js)',
      'The winning game routes to a new history entry',
      'Session is logged to that location’s history',
    ],
  },
]
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
          ← Back
        </button>
      </div>
      <h1 class="text-3xl font-bold tracking-tight">Tech stack</h1>
      <p class="mt-2 text-slate-400">
        Nastolka is a Vue 3 single-page app talking to a Spring Boot API over REST, secured with
        JWT bearer tokens.
      </p>
    </header>

    <section class="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-4 text-lg font-semibold">Architecture</h2>
      <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            Frontend
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="node in ['Vue 3 SPA', 'Pinia', 'Rapier + Three.js']"
              :key="node"
              class="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
            >
              {{ node }}
            </span>
          </div>
        </div>

        <div class="shrink-0 text-center text-xs font-medium text-slate-500 sm:px-2">
          REST + JWT →
        </div>

        <div class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            Backend
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
      <p class="mt-4 text-sm text-slate-500">
        Hosting: Netlify (frontend) · Render + Neon (backend)
      </p>
    </section>

    <section class="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Frontend</h2>
        <a
          href="https://github.com/a1exymoroz/Nastolka"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-indigo-400 hover:text-indigo-300"
        >
          View repo →
        </a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="py-2 pr-4 font-medium">Layer</th>
              <th class="py-2 font-medium">Tech</th>
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
        <h2 class="text-lg font-semibold">Backend</h2>
        <a
          href="https://github.com/a1exymoroz/Nastolka-api"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-indigo-400 hover:text-indigo-300"
        >
          View repo →
        </a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="py-2 pr-4 font-medium">Layer</th>
              <th class="py-2 font-medium">Tech</th>
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

    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="mb-4 text-lg font-semibold">Flows</h2>
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
