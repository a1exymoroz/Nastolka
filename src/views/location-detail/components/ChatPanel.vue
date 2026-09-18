<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { avatarTintClasses } from '../../../utils/avatarColor'
import { useLocalStorage } from '../../../composables/useLocalStorage'

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
const expanded = useLocalStorage('nastolka-chat-expanded', true)

// Groups consecutive messages from the same sender so the header (name/badge +
// timestamp) renders once per run instead of once per message, Slack/iMessage-style.
const messageGroups = computed(() => {
  const groups = []
  for (const message of props.messages) {
    const last = groups.at(-1)
    if (last && last.senderUsername === message.senderUsername) {
      last.messages.push(message)
    } else {
      groups.push({
        senderUsername: message.senderUsername,
        senderAdmin: message.senderAdmin,
        isOwn: message.senderUsername === props.currentUsername,
        timestamp: message.createdAt,
        messages: [message],
      })
    }
  }
  return groups
})

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
      <svg
        class="h-4 w-4 shrink-0 text-slate-500 transition-transform"
        :class="{ 'rotate-180': expanded }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <div v-if="expanded" class="mt-4">
      <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
        {{ error }}
      </p>

      <p v-if="loading" class="py-6 text-center text-sm text-slate-400">{{ $t('locationDetail.chat.loadingChat') }}</p>

      <template v-else>
        <div
          ref="scrollContainer"
          class="mb-4 max-h-80 space-y-3 overflow-y-auto border-t border-b border-slate-800 py-3 pr-2"
        >
          <p v-if="messages.length === 0" class="py-6 text-center text-sm text-slate-500">
            {{ $t('locationDetail.chat.noMessagesYet') }}
          </p>
          <div
            v-for="group in messageGroups"
            :key="group.messages[0].id"
            class="flex gap-2"
            :class="{ 'flex-row-reverse': group.isOwn }"
          >
            <span
              v-if="!group.isOwn"
              class="mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="avatarTintClasses(group.senderUsername)"
              aria-hidden="true"
            >
              {{ group.senderUsername.charAt(0).toUpperCase() }}
            </span>

            <div class="flex min-w-0 flex-1 flex-col gap-1.5" :class="group.isOwn ? 'items-end' : 'items-start'">
              <p class="flex items-center gap-1.5 px-1 text-xs text-slate-400">
                <span
                  v-if="group.senderAdmin"
                  class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400"
                >
                  {{ $t('locationDetail.chat.admin') }}
                </span>
                <span v-else>{{ group.senderUsername }}</span>
                <span class="text-slate-600">{{ $d(new Date(group.timestamp), 'time') }}</span>
              </p>

              <div
                v-for="message in group.messages"
                :key="message.id"
                class="max-w-[90%] break-words rounded-lg px-3.5 py-2 text-sm lg:max-w-2xl"
                :class="group.isOwn ? 'bg-indigo-600/20 text-indigo-100' : 'bg-slate-800 text-slate-200'"
              >
                {{ message.content }}
              </div>
            </div>
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
