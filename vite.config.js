import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')
)

export default defineConfig({
  plugins: [vue()],
  server: {
    // Bind to all interfaces so the dev server is reachable from other
    // devices (e.g. a phone) on the same LAN, not just localhost.
    host: true,
  },
  define: {
    // sockjs-client (used for the chat WebSocket transport) assumes a Node-style
    // `global` object, which the browser doesn't have.
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
