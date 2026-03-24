import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build output
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'motion':        ['framer-motion'],
          'charts':        ['recharts'],
          'icons':         ['lucide-react'],
        },
      },
    },
    // Warn if a chunk exceeds 800 KB
    chunkSizeWarningLimit: 800,
  },

  server: {
    port: 5173,
    headers: {
      'Permissions-Policy': 'interest-cohort=()',
      'Referrer-Policy':    'no-referrer-when-downgrade',
    },
    proxy: {
      // Forward all /api calls to the Express backend in dev
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
