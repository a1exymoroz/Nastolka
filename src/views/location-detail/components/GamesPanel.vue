<script setup>
import GameCard from './GameCard.vue'

defineProps({
  games: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  removingGameId: { type: [String, Number], default: null },
  gameExpansionState: { type: Object, required: true },
  getAvailableExpansions: { type: Function, required: true },
})

defineEmits(['remove-game', 'toggle-panel', 'add-expansion', 'remove-expansion'])
</script>

<template>
  <section>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-xl font-bold tracking-tight">Games</h2>
      <span v-if="games.length > 0" class="text-sm text-slate-500">{{ games.length }}</span>
    </div>

    <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
      {{ error }}
    </p>

    <p v-if="loading" class="py-6 text-center text-slate-400">Loading games…</p>

    <p
      v-else-if="games.length === 0"
      class="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500"
    >
      No games assigned to this location yet.
    </p>

    <ul v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <GameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
        :can-manage="canManage"
        :removing-game-id="removingGameId"
        :expansion-state="gameExpansionState[game.id]"
        :available-expansions="getAvailableExpansions(game.id)"
        @remove-game="$emit('remove-game', $event)"
        @toggle-panel="$emit('toggle-panel', $event)"
        @add-expansion="$emit('add-expansion', $event)"
        @remove-expansion="(gameId, expansion) => $emit('remove-expansion', gameId, expansion)"
      />
    </ul>
  </section>
</template>
