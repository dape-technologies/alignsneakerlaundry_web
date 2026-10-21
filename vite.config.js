import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: { environment: 'jsdom' },
  plugins: [vue(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'go-fresh-logo.svg', 'pwa-icon.svg'],
    manifest: {
      name: 'Go Fresh Shoe Laundry Operations',
      short_name: 'Go Fresh',
      description: 'Staff operations workspace for Go Fresh Shoe Laundry.',
      theme_color: '#ffffff',
      background_color: '#f6fafd',
      display: 'standalone',
      id: '/',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/index.html',
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [],
    },
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
