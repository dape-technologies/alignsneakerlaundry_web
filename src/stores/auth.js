import { defineStore } from 'pinia'
import { api, initializeCsrf } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, initialized: false }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    async initialize() {
      if (this.initialized) return
      try {
        const { data } = await api.get('/me')
        this.user = data.user
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
    async login(credentials) {
      await initializeCsrf()
      const { data } = await api.post('/login', credentials)
      this.user = data.user
      this.initialized = true
    },
    async logout() {
      try {
        await initializeCsrf()
        await api.post('/logout')
      } finally {
        this.user = null
        this.initialized = true
      }
    },
  },
})
