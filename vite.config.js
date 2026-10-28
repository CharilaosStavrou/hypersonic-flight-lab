import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Three.js and the map data are split into lazily loaded chunks of
  // ~550–600 kB; the first page load stays at ~260 kB.
  build: { chunkSizeWarningLimit: 650 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
