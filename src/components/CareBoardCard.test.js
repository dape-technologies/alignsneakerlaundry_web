import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const dragMocks = vi.hoisted(() => ({
  cleanup: vi.fn(),
  draggable: vi.fn(),
}))

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: dragMocks.draggable,
}))

import CareBoardCard from './CareBoardCard.vue'

const session = {
  id: 18,
  status: 'received',
  shoe: {
    display_name: 'White court sneaker',
    reference: 'SHOE-018',
    reference_photo_url: null,
  },
  order: {
    id: 7,
    reference: 'ASL-007',
    client: { name: 'Amina' },
  },
}

function mountCard() {
  return mount(CareBoardCard, {
    props: { session },
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('CareBoardCard drag surface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dragMocks.draggable.mockReturnValue(dragMocks.cleanup)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the whole card as the draggable element', () => {
    const wrapper = mountCard()
    const options = dragMocks.draggable.mock.calls[0][0]

    expect(options.element).toBe(wrapper.get('article').element)
    expect(options.getInitialData()).toEqual({
      type: 'care-session',
      sessionId: 18,
      fromStatus: 'received',
    })

    wrapper.unmount()
    expect(dragMocks.cleanup).toHaveBeenCalledOnce()
  })

  it('allows dragging from card content but not from links or actions', () => {
    const wrapper = mountCard()
    const options = dragMocks.draggable.mock.calls[0][0]
    const cardText = wrapper.get('strong').element
    const orderLink = wrapper.get('a').element
    const action = wrapper.get('.card-action').element
    const elementFromPoint = vi.fn()
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: elementFromPoint,
    })

    elementFromPoint.mockReturnValue(cardText)
    expect(options.canDrag({ input: { clientX: 10, clientY: 20 } })).toBe(true)

    elementFromPoint.mockReturnValue(orderLink)
    expect(options.canDrag({ input: { clientX: 10, clientY: 20 } })).toBe(false)

    elementFromPoint.mockReturnValue(action)
    expect(options.canDrag({ input: { clientX: 10, clientY: 20 } })).toBe(false)
  })

  it('emits a complete touch drag gesture from the mobile handle', async () => {
    const wrapper = mountCard()
    const handle = wrapper.get('.care-card-handle')

    await handle.trigger('pointerdown', {
      pointerType: 'touch',
      pointerId: 4,
      clientX: 20,
      clientY: 30,
    })
    await handle.trigger('pointermove', {
      pointerType: 'touch',
      pointerId: 4,
      clientX: 80,
      clientY: 60,
    })
    await handle.trigger('pointerup', {
      pointerType: 'touch',
      pointerId: 4,
      clientX: 80,
      clientY: 60,
    })

    expect(wrapper.emitted('touch-drag-start')?.[0]?.[0]).toMatchObject({
      sessionId: 18,
      from: 'received',
    })
    expect(wrapper.emitted('touch-drag-move')?.[0]?.[0]).toEqual({ clientX: 80, clientY: 60 })
    expect(wrapper.emitted('touch-drop')?.[0]?.[0]).toEqual({ clientX: 80, clientY: 60 })
    expect(document.querySelector('.care-card-touch-preview')).toBeNull()

    wrapper.unmount()
  })

  it('uses lifecycle-specific actions for received and ready footwear', async () => {
    const received = mountCard()
    expect(received.get('.card-action').text()).toContain('Cancel order')
    received.unmount()

    const ready = mount(CareBoardCard, {
      props: { session: { ...session, status: 'ready_for_collection', order: { ...session.order, balance: 0 } } },
      global: { stubs: { RouterLink: { props: ['to'], template: '<a><slot /></a>' } } },
    })
    expect(ready.get('.card-action').text()).toContain('Mark collected')
    expect(ready.get('.card-action').attributes('disabled')).toBeUndefined()
    ready.unmount()
  })
})
