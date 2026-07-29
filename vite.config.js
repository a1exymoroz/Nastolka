import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // sockjs-client (used for the chat WebSocket transport) assumes a Node-style
  // `global` object, which the browser doesn't have.
  define: {
    global: 'globalThis',
  },
})
