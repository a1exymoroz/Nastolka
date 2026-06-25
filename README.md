# Nastolka

A Vue 3 board game selector — pick your contenders, roll the dice, play tonight's game.

## Stack

- Vue 3 (Composition API, `<script setup>`)
- Vue Router
- Pinia
- Vite
- Tailwind CSS

## Getting started

```bash
npm install
npm run dev
```

## Project structure

```
src/
├── main.js              # App entry point
├── App.vue              # Root component
├── style.css            # Tailwind imports
├── router/
│   └── index.js         # Routes + auth guards
├── stores/
│   └── auth.js          # Authentication state (Pinia)
├── views/
│   ├── Login.vue        # Login form
│   ├── Register.vue     # Registration form
│   └── GameSelector.vue # Main game picker page
└── components/
    └── Dice.vue         # Dice roll animation + result
```

## TODOs for you to implement

1. **`src/stores/auth.js`** — Wire up real login/register API calls and JWT persistence.
2. **`src/views/GameSelector.vue`** — Replace mock game data with a real API fetch.
3. **`src/components/Dice.vue`** — Replace the placeholder shake animation with your own CSS/JS dice roll.
