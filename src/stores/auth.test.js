import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  initializeCsrf: vi.fn(),
  post: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../services/api', () => ({
  api: { get: mocks.get, post: mocks.post },
  initializeCsrf: mocks.initializeCsrf,
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

  it('clears local authentication when the server session has expired', async () => {
    const auth = useAuthStore()
    auth.user = { id: 2, role: 'worker' }
    mocks.post.mockRejectedValueOnce(new Error('Session expired'))

    await expect(auth.logout()).rejects.toThrow('Session expired')

    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(true)
  })
})
