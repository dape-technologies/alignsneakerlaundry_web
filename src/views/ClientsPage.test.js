import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('../services/api', () => ({ api: { get: mocks.get } }))

import ClientsPage from './ClientsPage.vue'

function mountPage() {
  return mount(ClientsPage, {
    global: {
      stubs: {
        AppShell: { template: '<div><slot /></div>' },
        AppSelect: { template: '<div />' },
        RouterLink: { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  })
}

describe('footwear directory', () => {
  afterEach(() => vi.clearAllMocks())

  it('renders each shoe as its own row with the owner repeated', async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          name: 'Amina Kintu',
          phone: '+256700000101',
          email: 'amina@example.test',
          shoes: [
            { id: 11, reference: 'SHOE-11', display_name: 'White Nike sneaker', size: '40', cleaning_sessions_count: 2, last_service_at: '2026-10-20T10:00:00Z' },
            { id: 12, reference: 'SHOE-12', display_name: 'Black Adidas sneaker', size: '41', cleaning_sessions_count: 1, last_service_at: '2026-10-18T10:00:00Z' },
          ],
        }],
      },
    })

    const wrapper = mountPage()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('White Nike sneaker')
    expect(rows[1].text()).toContain('Black Adidas sneaker')
    expect(rows.every((row) => row.text().includes('Amina Kintu'))).toBe(true)
  })
})
