<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

// A single-select dropdown for picking a player's meeple: each option shows
// its icon, name, and game (see `getMeepleOptions` in tokenSets.js) rather
// than being a plain text choice — a native <select> can't render the icon.
const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '' },
  title: { type: String, default: '' },
  disabledOptionIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const open = ref(false)
const rootEl = ref(null)

const selected = computed(() => props.options.find((option) => option.id === props.modelValue) ?? null)

function select(option) {
  if (props.disabledOptionIds.includes(option.id)) return
  emit('update:modelValue', option.id)
  open.value = false
}

function clear() {
  emit('update:modelValue', '')
  open.value = false
}

function onDocClick(event) {
  if (rootEl.value && !rootEl.value.contains(event.target)) open.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      :title="title"
      :aria-label="title || placeholder"
      class="flex w-28 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 outline-none transition hover:border-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
      @click="open = !open"
    >
      <img
        v-if="selected?.image"
        :src="selected.image"
        alt=""
        class="h-4 w-4 shrink-0 rounded-sm object-cover"
        :class="{ border: selected.frameColor }"
        :style="{ borderColor: selected.frameColor }"
      />
      <svg v-else-if="selected" :viewBox="selected.viewBox" class="h-4 w-4 shrink-0" :fill="selected.color">
        <path :d="selected.path" />
      </svg>
      <span class="truncate" :class="selected ? 'text-slate-100' : 'text-slate-500'">
        {{ selected ? selected.name : placeholder }}
      </span>
    </button>

    <ul
      v-if="open"
      role="listbox"
      class="absolute z-10 mt-1 max-h-60 w-52 overflow-auto rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg"
    >
      <li v-if="modelValue">
        <button
          type="button"
          class="w-full px-3 py-1.5 text-left text-xs text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
          @click="clear"
        >
          {{ t('historyForm.meeplesNone') }}
        </button>
      </li>
      <li v-for="option in options" :key="option.id">
        <button
          type="button"
          role="option"
          :aria-selected="option.id === modelValue"
          :disabled="disabledOptionIds.includes(option.id)"
          :aria-disabled="disabledOptionIds.includes(option.id)"
          class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          @click="select(option)"
        >
          <img
            v-if="option.image"
            :src="option.image"
            alt=""
            class="h-5 w-5 shrink-0 rounded-sm object-cover"
            :class="{ border: option.frameColor }"
            :style="{ borderColor: option.frameColor }"
          />
          <svg v-else :viewBox="option.viewBox" class="h-5 w-5 shrink-0" :fill="option.color">
            <path :d="option.path" />
          </svg>
          <span class="flex min-w-0 flex-col leading-tight">
            <span class="truncate">{{ option.name }}</span>
            <span class="truncate text-[10px] text-slate-500">{{ option.game }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
