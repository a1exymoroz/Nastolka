Act as an expert Vue.js developer. I am building a learning project: a board game selector application. Please generate the boilerplate code for a Vue 3 application (using Composition API and `<script setup>`) with the following requirements. 

Leave specific business logic, API calls, and the actual animation logic empty or as `TODO` comments so I can implement them myself.

Requirements:
1. Routing & State: Include basic Vue Router setup and Pinia (or Vuex) store setup for handling authentication state.
2. Authentication: 
   - A `Login.vue` and `Register.vue` component.
   - They should have basic forms (email/password).
   - Leave the actual API fetch call and JWT saving logic as a `TODO` for me.
3. Main Page (`GameSelector.vue`):
   - A page that fetches a list of board games (mock the data for now, leave API call as `TODO`).
   - The user should be able to select multiple games from the list using checkboxes or clickable cards.
4. Dice Roll Feature:
   - A "Roll the Dice" button that appears when at least 2 games are selected.
   - A `Dice.vue` component that handles the dice animation. Leave the actual CSS/JS animation logic empty for me to write (`TODO: Add dice rolling animation`).
   - Once the animation finishes, it should randomly pick one of the selected games and display the result.

Please provide the structure of the project and the code for the main components, routing, and store. Use modern styling (you can use basic Tailwind CSS classes or just plain CSS placeholders).