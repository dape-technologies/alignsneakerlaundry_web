import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  push: vi.fn(),
}))

vi.mock('../services/api', () => ({
  api: { get: mocks.get, post: mocks.post },
  validationErrors: () => ({}),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { client: 1 } }),
  useRouter: () => ({ push: mocks.push }),
}))

import NewOrderPage from './NewOrderPage.vue'

const client = {
  id: 1,
  name: 'Amina',
  phone: '+256700000001',
  email: 'amina@example.test',
  active_sessions: [],
  shoes: [
    { id: 11, display_name: 'White Nike sneaker', reference: 'SHOE-11', size: '40' },
    { id: 12, display_name: 'Black Adidas sneaker', reference: 'SHOE-12', size: '41' },
  ],
}

function mountPage() {
  return mount(NewOrderPage, {
    global: {
      stubs: {
        AppShell: { template: '<div><slot /></div>' },
        RouterLink: { props: ['to'], template: '<a><slot /></a>' },
        MediaUploader: { template: '<div class="media-uploader-stub"></div>' },
      },
    },
  })
}

describe('single-shoe registered footwear selection', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.get.mockImplementation((url) => {
      if (url === '/tags/available') return Promise.resolve({ data: { data: [{ id: 1, label: 'Tag 01' }] } })
      if (url === '/clients/1') return Promise.resolve({ data: structuredClone(client) })
      return Promise.reject(new Error(`Unexpected URL: ${url}`))
    })
  })

  afterEach(() => vi.clearAllMocks())

  it('allows a selected shoe to be unchecked', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const shoe = wrapper.findAll('button').find((button) => button.text().includes('White Nike sneaker'))

    await shoe.trigger('click')
    expect(shoe.attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('One-pair intake')

    await shoe.trigger('click')
    expect(shoe.attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).not.toContain('One-pair intake')
  })

  it('replaces the first selection when another shoe is chosen', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const shoes = wrapper.findAll('button').filter((button) => button.text().includes('sneaker'))

    await shoes[0].trigger('click')
    await shoes[1].trigger('click')

    expect(shoes[0].attributes('aria-pressed')).toBe('false')
    expect(shoes[1].attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('section').filter((section) => section.text().includes('One-pair intake'))).toHaveLength(1)
  })
})
