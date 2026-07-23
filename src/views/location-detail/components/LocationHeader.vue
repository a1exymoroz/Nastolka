<script setup>
defineProps({
  location: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
  editing: { type: Boolean, default: false },
  canRoll: { type: Boolean, default: false },
})

defineEmits(['update:editing', 'roll'])
</script>

<template>
  <header class="mb-8 flex items-start justify-between gap-4 border-b border-slate-800 pb-8">
    <div class="min-w-0">
      <h1 class="text-3xl font-bold tracking-tight">{{ location.name }}</h1>
      <p v-if="location.description" class="mt-2 max-w-2xl text-slate-400">
        {{ location.description }}
      </p>
      <button
        v-if="canManage"
        type="button"
        class="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300"
        @click="$emit('update:editing', !editing)"
      >
        {{ editing ? 'Cancel edit' : 'Edit location' }}
      </button>
    </div>
    <button
      type="button"
      :disabled="!canRoll"
      :title="canRoll ? '' : 'Add at least 2 games to roll'"
      class="shrink-0 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-900 shadow-lg shadow-amber-500/10 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      @click="$emit('roll')"
    >
      🎲 Roll dice here
    </button>
  </header>
</template>
