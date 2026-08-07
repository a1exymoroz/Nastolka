// Mirrors the fallback in src/config/api.js so the Functions runtime and the
// client bundle agree on where the Java backend lives when VITE_API_BASE_URL
// isn't set (e.g. no .env file yet in a fresh local checkout).
export const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:8090'
