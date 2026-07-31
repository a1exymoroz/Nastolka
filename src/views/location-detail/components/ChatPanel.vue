<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  connected: { type: Boolean, default: false },
  currentUsername: { type: String, default: '' },
})

const emit = defineEmits(['send'])

const input = ref('')
const scrollContainer = ref(null)
const expanded = ref(true)

function scrollToBottom() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// Covers both the initial history load and each new incoming/sent message.
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  },
)

// The scroll container unmounts while collapsed, so re-expanding needs its own
// jump-to-bottom instead of relying on the message-count watcher above.
watch(expanded, async (isExpanded) => {
  if (!isExpanded) return
  await nextTick()
  scrollToBottom()
})

function submit() {
  if (!props.connected || !input.value.trim()) return
  emit('send', input.value)
  input.value = ''
}
</script>

<template>
  <section data-tour="location-chat" class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <button
      type="button"
      class="flex w-full items-center justify-between text-left"
      @click="expanded = !expanded"
    >
      <h2 class="text-lg font-semibold">{{ $t('locationDetail.chat.title') }}</h2>
      <span
        class="text-xs text-slate-500 transition-transform"
        :class="{ 'rotate-180': expanded }"
        aria-hidden="true"
      >
        ▾
      </span>
    </button>

    <div v-if="expanded" class="mt-4">
      <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ error }}
      </p>

      <p v-if="loading" class="py-6 text-center text-sm text-slate-400">{{ $t('locationDetail.chat.loadingChat') }}</p>

      <template v-else>
        <div ref="scrollContainer" class="mb-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          <p v-if="messages.length === 0" class="py-6 text-center text-sm text-slate-500">
            {{ $t('locationDetail.chat.noMessagesYet') }}
          </p>
          <div
            v-for="message in messages"
            :key="message.id"
            class="max-w-[85%] rounded-lg px-3 py-1.5 text-sm"
            :class="
              message.senderUsername === currentUsername
                ? 'ml-auto bg-indigo-600/20 text-indigo-100'
                : 'mr-auto bg-slate-800 text-slate-200'
            "
          >
            <p class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {{ message.senderUsername }}
              <span
                v-if="message.senderAdmin"
                class="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-semibold tracking-wide text-amber-400"
              >
                {{ $t('locationDetail.chat.admin') }}
              </span>
            </p>
            <p class="break-words">{{ message.content }}</p>
          </div>
        </div>

        <form class="flex gap-2" @submit.prevent="submit">
          <input
            v-model="input"
            type="text"
            maxlength="2000"
            :placeholder="$t('locationDetail.chat.placeholder')"
            class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            :disabled="!connected || !input.trim()"
            class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ $t('locationDetail.chat.send') }}
          </button>
        </form>
      </template>
    </div>
  </section>
</template>
