<script setup>
import { computed } from 'vue'
import { statusLabel } from '../lib/format'

const props = defineProps({ status: { type: String, required: true } })

const classes = computed(() => ({
  received: 'bg-slate-100 text-slate-700',
  cleaning: 'bg-sky-100 text-sky-800',
  drying: 'bg-amber-100 text-amber-900',
  quality_check: 'bg-blue-100 text-blue-800',
  ready_for_collection: 'bg-cyan-100 text-cyan-900',
  collected: 'bg-[#dce8f1] text-navy',
  cancelled: 'bg-rose-100 text-rose-800',
}[props.status] || 'bg-slate-100 text-slate-700'))
</script>

<template>
  <span class="inline-flex rounded-md px-2.5 py-1 text-xs font-bold" :class="classes">{{ statusLabel(status) }}</span>
</template>
