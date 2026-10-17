<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { PhArrowRight as ArrowRightIcon, PhDotsSixVertical as DragIcon, PhSneaker as ShoeIcon } from '@phosphor-icons/vue'

const props = defineProps({
  session: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['action', 'touch-drag-start', 'touch-drag-move', 'touch-drop', 'touch-drag-cancel'])

const card = ref(null)
const dragging = ref(false)
let cleanup
let touchPointerId = null
let touchOrigin = null
let touchPreview = null

const actionLabels = {
  received: 'Start cleaning',
  cleaning: 'Mark ready',
}

onMounted(() => {
  cleanup = draggable({
    element: card.value,
    canDrag: ({ input }) => {
      const pointerTarget = document.elementFromPoint(input.clientX, input.clientY)

      return !(pointerTarget instanceof Element && pointerTarget.closest('[data-no-drag]'))
    },
    getInitialData: () => ({
      type: 'care-session',
      sessionId: props.session.id,
      fromStatus: props.session.status,
    }),
    onDragStart: () => { dragging.value = true },
    onDrop: () => { dragging.value = false },
  })
})

function removeTouchPreview() {
  touchPreview?.remove()
  touchPreview = null
  touchPointerId = null
  touchOrigin = null
  dragging.value = false
}

function startTouchDrag(event) {
  if (event.pointerType === 'mouse' || props.busy || touchPointerId !== null) return

  event.preventDefault()
  event.stopPropagation()
  touchPointerId = event.pointerId
  touchOrigin = { x: event.clientX, y: event.clientY }
  event.currentTarget.setPointerCapture?.(event.pointerId)

  const bounds = card.value.getBoundingClientRect()
  touchPreview = card.value.cloneNode(true)
  touchPreview.classList.add('care-card-touch-preview')
  touchPreview.setAttribute('aria-hidden', 'true')
  Object.assign(touchPreview.style, {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
  })
  document.body.appendChild(touchPreview)
  dragging.value = true
  emit('touch-drag-start', {
    sessionId: props.session.id,
    from: props.session.status,
    clientX: event.clientX,
    clientY: event.clientY,
  })
}

function moveTouchDrag(event) {
  if (event.pointerId !== touchPointerId || !touchOrigin) return

  event.preventDefault()
  const x = event.clientX - touchOrigin.x
  const y = event.clientY - touchOrigin.y
  if (touchPreview) touchPreview.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(1deg) scale(1.02)`
  emit('touch-drag-move', { clientX: event.clientX, clientY: event.clientY })
}

function finishTouchDrag(event) {
  if (event.pointerId !== touchPointerId) return

  event.preventDefault()
  emit('touch-drop', { clientX: event.clientX, clientY: event.clientY })
  removeTouchPreview()
}

function cancelTouchDrag(event) {
  if (event.pointerId !== touchPointerId) return
  emit('touch-drag-cancel')
  removeTouchPreview()
}

onBeforeUnmount(() => {
  cleanup?.()
  removeTouchPreview()
})
</script>

<template>
  <article
    ref="card"
    class="care-card"
    :class="{ 'care-card-dragging': dragging }"
    :aria-label="`Move ${session.shoe.display_name} to another care stage`"
  >
    <div class="flex items-start gap-3">
      <img
        v-if="session.shoe.reference_photo_url"
        :src="session.shoe.reference_photo_url"
        :alt="session.shoe.display_name"
        draggable="false"
        class="size-12 rounded-lg object-cover"
      />
      <span v-else class="grid size-12 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="23" /></span>
      <div class="min-w-0 flex-1">
        <strong class="block truncate text-navy">{{ session.shoe.display_name }}</strong>
        <span class="text-xs font-bold text-sky-deep">{{ session.shoe.reference }}</span>
      </div>
      <button
        type="button"
        class="care-card-handle"
        :aria-label="`Drag ${session.shoe.display_name} to another care stage`"
        @pointerdown="startTouchDrag"
        @pointermove="moveTouchDrag"
        @pointerup="finishTouchDrag"
        @pointercancel="cancelTouchDrag"
      >
        <DragIcon :size="21" weight="bold" aria-hidden="true" />
      </button>
    </div>
    <div class="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
      <div>
        <span class="block text-sm font-semibold text-navy">{{ session.order.client.name }}</span>
        <RouterLink :to="`/orders/${session.order.id}`" data-no-drag draggable="false" class="text-xs font-bold text-muted hover:text-sky-deep">{{ session.order.reference }}</RouterLink>
      </div>
      <button v-if="actionLabels[session.status]" type="button" data-no-drag class="card-action" :disabled="busy" @pointerdown.stop @click.stop="emit('action', session)">
        {{ actionLabels[session.status] }} <ArrowRightIcon :size="14" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.care-card { margin-bottom: .7rem; cursor: grab; user-select: none; -webkit-user-select: none; padding: .9rem; border: 1px solid var(--stage-border); border-radius: .7rem; background: white; box-shadow: 0 8px 20px rgba(16, 47, 76, .045); transition: box-shadow .18s ease, opacity .18s ease, transform .18s ease; }
.care-card:hover { box-shadow: 0 12px 26px color-mix(in srgb, var(--stage-accent) 12%, transparent); transform: translateY(-1px); }
.care-card:active { cursor: grabbing; }
.care-card-dragging { cursor: grabbing; opacity: .48; transform: rotate(1deg) scale(.985); box-shadow: 0 18px 38px rgba(16, 47, 76, .16); }
.care-card-handle { display: grid; width: 2.75rem; height: 2.75rem; flex: 0 0 auto; touch-action: none; place-items: center; border-radius: .55rem; color: var(--stage-accent); }
.care-card-handle:active { background: color-mix(in srgb, var(--stage-accent) 10%, transparent); }
.care-card-touch-preview { position: fixed; z-index: 100; margin: 0; pointer-events: none; opacity: .96; box-shadow: 0 22px 55px rgba(9, 29, 45, .24); will-change: transform; }
.care-card [data-no-drag] { cursor: pointer; user-select: auto; -webkit-user-select: auto; }
.card-action { display: inline-flex; align-items: center; gap: .3rem; flex: 0 0 auto; color: #147eae; font-size: .72rem; font-weight: 800; }
.card-action:hover { color: #123451; }
.card-action:disabled { cursor: wait; opacity: .55; }
</style>
