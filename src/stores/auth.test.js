import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  initializeCsrf: vi.fn(),
  keepSessionAlive: vi.fn(),
  clearSessionState: vi.fn(),
  resetAuthFailure: vi.fn(),
  post: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../services/api', () => ({
  api: { get: mocks.get, post: mocks.post },
  initializeCsrf: mocks.initializeCsrf,
  keepSessionAlive: mocks.keepSessionAlive,
  clearSessionState: mocks.clearSessionState,
  resetAuthFailure: mocks.resetAuthFailure,
}))

import { useAuthStore } from './auth'

describe('auth sign out', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('refreshes CSRF protection before ending the server session', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, role: 'admin' }

    await auth.logout()

    expect(mocks.initializeCsrf).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledWith('/logout')
    expect(auth.user).toBeNull()
  })

  it('clears the expired session without calling the server again', () => {
    const auth = useAuthStore()
    auth.user = { id: 3, role: 'worker' }
    auth.initialized = false

    auth.expireSession()

    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(true)
    expect(mocks.clearSessionState).toHaveBeenCalledOnce()
  })

  it('keeps an authenticated workspace session active', async () => {
    const auth = useAuthStore()
    auth.user = { id: 4, role: 'worker' }
    mocks.keepSessionAlive.mockResolvedValueOnce({ id: 4, role: 'worker', name: 'Attendant' })

    await auth.refreshSession()

    expect(mocks.keepSessionAlive).toHaveBeenCalledWith(true)
    expect(auth.user.name).toBe('Attendant')
  })

  it('clears local authentication when the server session has expired', async () => {
    const auth = useAuthStore()
    auth.user = { id: 2, role: 'worker' }
    mocks.post.mockRejectedValueOnce(new Error('Session expired'))

    await expect(auth.logout()).rejects.toThrow('Session expired')

    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(true)
  })
})
