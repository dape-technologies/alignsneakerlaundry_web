import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from './FormField.vue'

describe('FormField required labels', () => {
  it('shows a star for mandatory fields', () => {
    const wrapper = mount(FormField, {
      props: { modelValue: '', label: 'Full name' },
      attrs: { required: true },
    })

    expect(wrapper.get('.required-mark').text()).toBe('*')
    expect(wrapper.get('input').attributes()).toHaveProperty('required')
  })

  it('does not show a star for optional fields', () => {
    const wrapper = mount(FormField, {
      props: { modelValue: '', label: 'Client notes' },
    })

    expect(wrapper.find('.required-mark').exists()).toBe(false)
  })
})
