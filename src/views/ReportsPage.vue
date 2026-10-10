<script setup>
import { onMounted, reactive, ref } from 'vue'
import { PhCurrencyCircleDollar as CurrencyCircleDollarIcon, PhReceipt as ReceiptIcon, PhUsers as UsersIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { money } from '../lib/format'

const report = ref(null)
const error = ref('')
const filters = reactive({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })

async function loadReport() { error.value = ''; try { report.value = (await api.get('/reports', { params: filters })).data } catch { error.value = 'Financial report could not be loaded.' } }
onMounted(loadReport)
</script>

<template>
  <AppShell>
    <header class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p class="text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">Owner view</p><h1 class="mt-1 text-4xl font-black tracking-[-0.045em]">Business reports</h1></div><form class="flex flex-wrap items-end gap-3" @submit.prevent="loadReport"><label class="field"><span>From</span><input v-model="filters.from" type="date" /></label><label class="field"><span>To</span><input v-model="filters.to" type="date" /></label><button class="button-primary" type="submit">Apply</button></form></header>
    <div v-if="error" class="alert-error mt-8">{{ error }}</div>
    <div v-else-if="!report" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div v-for="index in 4" :key="index" class="skeleton h-32"></div></div>
    <template v-else>
      <section class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><article class="metric-block xl:col-span-2"><div class="metric-icon"><CurrencyCircleDollarIcon :size="25" /></div><p>Collected revenue</p><strong>{{ money(report.collected_revenue) }}</strong><span>{{ money(report.quoted_revenue) }} quoted</span></article><article class="metric-block"><div class="metric-icon"><ReceiptIcon :size="25" /></div><p>Orders</p><strong>{{ report.orders }}</strong><span>{{ money(report.average_order_value) }} average</span></article><article class="metric-block"><div class="metric-icon"><UsersIcon :size="25" /></div><p>Clients served</p><strong>{{ report.clients }}</strong><span>{{ money(report.outstanding) }} outstanding</span></article></section>
      <section class="mt-10 grid gap-8 xl:grid-cols-2"><div><h2 class="section-title">Order outcomes</h2><div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div v-for="(total, status) in report.status_counts" :key="status" class="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"><StatusBadge :status="status" /><strong class="mt-5 block font-mono text-3xl">{{ total }}</strong></div></div></div><div><h2 class="section-title">Daily collections</h2><div class="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"><div v-if="report.daily_revenue.length"><div v-for="day in report.daily_revenue" :key="day.date" class="flex items-center justify-between border-b border-stone-100 px-5 py-4 last:border-0 dark:border-stone-800"><time class="font-semibold">{{ day.date }}</time><strong class="font-mono">{{ money(day.total) }}</strong></div></div><p v-else class="p-6 text-stone-500">No payments were recorded in this period.</p></div></div></section>
    </template>
  </AppShell>
</template>
