<script setup>
defineProps({
  tag: { type: String, default: 'div' },
  padding: { type: String, default: 'md' }, // none | sm | md | lg | xl
  radius: { type: String, default: 'xl' }, // lg | xl | 2xl
  interactive: { type: Boolean, default: false },
})

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
}

const RADIUS_CLASSES = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
}
</script>

<template>
  <component
    :is="tag"
    class="border border-slate-800 bg-slate-900"
    :class="[
      PADDING_CLASSES[padding],
      RADIUS_CLASSES[radius],
      interactive ? 'transition hover:border-slate-600' : '',
    ]"
  >
    <slot />
  </component>
</template>
