import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge.vue'
import { statusLabel } from '../lib/format'

describe('care status presentation', () => {
  it('uses polished workflow labels', () => {
    expect(statusLabel('cleaning')).toBe('In cleaning')
    expect(statusLabel('ready_for_collection')).toBe('Ready for collection')
  })

  it('renders ready status without the retired green theme', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'ready_for_collection' } })
    expect(wrapper.text()).toBe('Ready for collection')
    expect(wrapper.classes()).toContain('bg-cyan-100')
    expect(wrapper.classes().join(' ')).not.toContain('emerald')
  })
})
