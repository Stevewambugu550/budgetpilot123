import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: false,
    proxy: {
      // Proxy Netlify Functions and Identity to local netlify dev server
      '/.netlify': 'http://localhost:8888',
    },
  },
})
