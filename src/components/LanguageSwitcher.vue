<script setup>
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'

const { locale } = useI18n()
const LABELS = { en: 'EN', pl: 'PL', ru: 'RU' }
</script>

<template>
  <div class="flex overflow-hidden rounded-full border border-slate-700 bg-slate-900 shadow-lg shadow-black/30">
    <button
      v-for="code in SUPPORTED_LOCALES"
      :key="code"
      type="button"
      class="px-3 py-1.5 text-xs font-medium transition"
      :class="locale === code ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
      :aria-pressed="locale === code"
      @click="setLocale(code)"
    >
      {{ LABELS[code] }}
    </button>
  </div>
</template>
