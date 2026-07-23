# Nastolka

Nastolka ("board game" in Russian/Ukrainian slang) is a Vue 3 app for tracking your board
game collection and letting the dice settle game night.

Organize your games by **location** — your shelf, a friend's place, a game café — and share
a location with other users so everyone plays from the same library. Search and import titles
(and their expansions) straight from BoardGameGeek, or add your own. Can't agree on what to
play? Select your contenders and roll a physics-simulated 3D die, sized to the pool so every
game gets a fair shot. Every session gets logged to that location's history — state, duration,
rating, and photos — so you can look back on what you've played.

## Features

- **Locations** — organize games by where they live; owners can share access with other users,
  and admins can oversee every location
- **Game library** — search and import games and expansions from BoardGameGeek, or add your own
- **Dice-driven picks** — pick contenders and roll a 3D physics die (Rapier + Three.js) to decide
  what to play
- **Play history** — track sessions per location with state, duration, ratings, and photos
- **Auth & roles** — JWT-based login/register with admin-only areas

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
├── main.js                 # App entry point
├── App.vue                 # Root component
├── style.css               # Tailwind imports
├── config/
│   └── api.js               # API base URL helper
├── router/
│   └── index.js             # Routes + auth guards
├── stores/
│   └── auth.js               # Authentication state (Pinia)
├── utils/
│   └── diceTypes.js          # Dice type <-> game count mapping
├── views/
│   ├── Login.vue             # Login form
│   ├── Register.vue          # Registration form
│   ├── Locations.vue         # Locations overview
│   ├── LocationDetail.vue    # Games, history & sharing for a location
│   ├── location-detail/      # Panels/composables used by LocationDetail
│   ├── GameSelector.vue      # Pick contenders, roll the dice
│   ├── GameDetail.vue        # Game info, expansions, BGG import
│   ├── HistoryForm.vue       # Log/edit a play session
│   ├── Admin.vue             # Admin-only management
│   ├── DicePlayground.vue    # Dice experimentation sandbox
│   └── physics-with-rapier-and-three-variations/  # 3D physics dice engine
└── components/
    └── Dice.vue             # Physics dice roll + result
```
