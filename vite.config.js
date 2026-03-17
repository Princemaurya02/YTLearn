import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Permissions-Policy': 'interest-cohort=()',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
    proxy: {
      // Forward all /api calls to the Express backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
