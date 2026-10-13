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
    const action = wrapper.get('button').element
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
})
