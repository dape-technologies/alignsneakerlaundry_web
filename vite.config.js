import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: { environment: 'jsdom' },
  plugins: [vue(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'pwa-icon.svg'],
    manifest: {
      name: 'Align Sneaker Laundry Operations',
      short_name: 'Align Laundry',
      description: 'Staff operations workspace for Align Sneaker Laundry.',
      theme_color: '#ffffff',
      background_color: '#f6fafd',
      display: 'standalone',
      start_url: '/login',
      icons: [
        { src: '/pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: '/pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
      ],
    },
    workbox: { navigateFallback: '/index.html', runtimeCaching: [] },
  })],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
