<script setup>
import { computed } from 'vue'
import { statusLabel } from '../lib/format'

const props = defineProps({ status: { type: String, required: true } })

const classes = computed(() => ({
  received: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  washing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  drying: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  quality_check: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  collected: 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
}[props.status] || 'bg-stone-200 text-stone-800'))
</script>

<template>
  <span class="inline-flex rounded-lg px-2.5 py-1 text-xs font-bold" :class="classes">{{ statusLabel(status) }}</span>
</template>
