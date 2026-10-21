import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ initialize: vi.fn(), isAuthenticated: false, isAdmin: false }),
}))

describe('staff-only routes', () => {
  let router
  beforeEach(async () => { router = (await import('./index')).default })

  it('redirects the root route to staff login', () => {
    expect(router.getRoutes().find((route) => route.path === '/').redirect).toBe('/login')
  })

  it('protects every operational route', () => {
    for (const path of ['/dashboard', '/orders', '/orders/new', '/orders/:id/receipt', '/clients', '/reports', '/attendants']) {
      expect(router.getRoutes().find((route) => route.path === path).meta.auth).toBe(true)
    }
  })
})
