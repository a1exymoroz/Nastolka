<script setup>
defineProps({
  form: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['submit'])
</script>

<template>
  <div class="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="mb-4 text-lg font-semibold">Edit location</h2>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <form class="space-y-4" @submit.prevent="$emit('submit')">
      <div>
        <label for="edit-location-name" class="mb-1 block text-sm font-medium text-slate-300">
          Name
        </label>
        <input
          id="edit-location-name"
          v-model="form.name"
          type="text"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <div>
        <label
          for="edit-location-description"
          class="mb-1 block text-sm font-medium text-slate-300"
        >
          Description
        </label>
        <textarea
          id="edit-location-description"
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ loading ? 'Saving…' : 'Save changes' }}
      </button>
    </form>
  </div>
</template>
