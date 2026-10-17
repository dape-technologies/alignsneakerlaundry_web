import { defineStore } from 'pinia'
import { api, clearSessionState, initializeCsrf, keepSessionAlive, resetAuthFailure } from '../services/api'

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
      resetAuthFailure()
    },
    async logout() {
      try {
        await initializeCsrf()
        await api.post('/logout')
      } finally {
        this.user = null
        this.initialized = true
        clearSessionState()
      }
    },
    async refreshSession() {
      if (!this.user) return
      try {
        this.user = await keepSessionAlive(true)
      } catch {
        // The shared API handler moves an expired session to login once.
      }
    },
    expireSession() {
      this.user = null
      this.initialized = true
      clearSessionState()
    },
  },
})
