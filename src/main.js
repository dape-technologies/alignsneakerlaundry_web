import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const pinia = createPinia()

window.addEventListener('auth:expired', async () => {
  const auth = useAuthStore(pinia)
  auth.expireSession()
  if (router.currentRoute.value.path === '/login') return
  await router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath, reason: 'session-expired' } })
})

const keepAlive = () => useAuthStore(pinia).refreshSession()
window.setInterval(keepAlive, 2 * 60 * 1000)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') keepAlive()
})

createApp(App).use(pinia).use(router).mount('#app')
