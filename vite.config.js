import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/clipping/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['src/test-setup.js']
  }
})
