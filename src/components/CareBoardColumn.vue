<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import CareBoardCard from './CareBoardCard.vue'

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  sessions: { type: Array, required: true },
  busySession: { type: [Number, String], default: null },
})
const emit = defineEmits(['move', 'action'])

const column = ref(null)
const draggedOver = ref(false)
let cleanup

onMounted(() => {
  cleanup = dropTargetForElements({
    element: column.value,
    getData: () => ({ type: 'care-column', status: props.status }),
    canDrop: ({ source }) => source.data.type === 'care-session' && source.data.fromStatus !== props.status,
    onDragEnter: () => { draggedOver.value = true },
    onDragLeave: () => { draggedOver.value = false },
    onDrop: ({ source }) => {
      draggedOver.value = false
      emit('move', {
        sessionId: source.data.sessionId,
        from: source.data.fromStatus,
        to: props.status,
      })
    },
  })
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <section ref="column" class="care-column" :class="[`care-column-${status}`, { 'care-column-drop': draggedOver }]">
    <header class="care-column-header">
      <span class="flex items-center gap-2"><component :is="icon" :size="19" /><strong>{{ label }}</strong></span>
      <b>{{ sessions.length }}</b>
    </header>
    <div class="care-column-list">
      <CareBoardCard
        v-for="session in sessions"
        :key="session.id"
        :session="session"
        :busy="Boolean(busySession)"
        @action="emit('action', $event)"
      />
    </div>
    <p v-if="!sessions.length" class="care-column-empty">Drop footwear here</p>
  </section>
</template>

<style scoped>
.care-column { --stage-accent: #60778a; --stage-bg: #f3f6f8; --stage-border: #d3dde4; min-height: 27rem; padding: .8rem; border: 1px solid var(--stage-border); border-radius: .85rem; background: var(--stage-bg); transition: background .18s ease, border-color .18s ease, box-shadow .18s ease; }
.care-column-received { --stage-accent: #5c7182; --stage-bg: #f3f6f8; --stage-border: #d3dde4; }
.care-column-cleaning { --stage-accent: #147eae; --stage-bg: #eef8fc; --stage-border: #c5e5f2; }
.care-column-ready_for_collection { --stage-accent: #32725c; --stage-bg: #eef8f3; --stage-border: #c9e4d8; }
.care-column-drop { border-color: var(--stage-accent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--stage-accent) 24%, transparent); }
.care-column-header { display: flex; align-items: center; justify-content: space-between; padding: .35rem .35rem .9rem; color: var(--stage-accent); }
.care-column-header strong { color: #123451; }
.care-column-header b { display: grid; width: 1.8rem; height: 1.8rem; place-items: center; border-radius: 999px; background: var(--stage-accent); color: white; font-size: .78rem; font-variant-numeric: tabular-nums; }
.care-column-list { min-height: 7rem; }
.care-column-empty { padding: 2.5rem .5rem; text-align: center; color: #7890a1; font-size: .78rem; font-weight: 600; }
</style>
