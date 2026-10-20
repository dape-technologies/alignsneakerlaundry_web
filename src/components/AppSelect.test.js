import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from './AppSelect.vue'

const visualViewport = {
  width: 375,
  height: 640,
  offsetLeft: 0,
  offsetTop: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

describe('AppSelect viewport positioning', () => {
  beforeEach(() => {
    vi.stubGlobal('visualViewport', visualViewport)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('keeps the menu inside the right edge while anchoring it below the trigger', async () => {
    const wrapper = mount(AppSelect, {
      attachTo: document.body,
      props: {
        modelValue: 'client',
        ariaLabel: 'Filter by',
        options: [
          { value: 'client', label: 'Client' },
          { value: 'shoe', label: 'Shoe' },
          { value: 'date', label: 'Date' },
        ],
      },
    })
    const trigger = wrapper.get('button')
    vi.spyOn(trigger.element, 'getBoundingClientRect').mockReturnValue({
      x: 320, y: 200, left: 320, top: 200, right: 440, bottom: 244, width: 120, height: 44,
    })

    await trigger.trigger('click')
    const menu = document.body.querySelector('.app-select-menu')

    expect(menu.style.left).toBe('187px')
    expect(menu.style.top).toBe('250px')
    expect(menu.style.width).toBe('180px')
    wrapper.unmount()
  })

  it('updates the value and closes after an option is chosen', async () => {
    const wrapper = mount(AppSelect, {
      attachTo: document.body,
      props: { modelValue: 'cash', options: ['cash', 'card'] },
    })

    await wrapper.get('button').trigger('click')
    document.body.querySelectorAll('.app-select-option')[1].click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([['card']])
    expect(document.body.querySelector('.app-select-menu')).toBeNull()
    wrapper.unmount()
  })
})
