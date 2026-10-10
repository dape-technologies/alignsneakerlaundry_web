<script setup>
import { onMounted, ref } from 'vue'
import { PhArrowRight as ArrowRightIcon, PhCurrencyCircleDollar as CurrencyCircleDollarIcon, PhPackage as PackageIcon, PhPlus as PlusIcon, PhUsers as UsersIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const data = ref(null)
const error = ref('')

onMounted(async () => {
  try { data.value = (await api.get('/dashboard')).data } catch { error.value = 'Dashboard data could not be loaded.' }
})
</script>

<template>
  <AppShell>
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="eyebrow">Today at Align</p><h1 class="page-title">Operations overview</h1></div>
      <RouterLink to="/orders/new" class="button-primary"><PlusIcon :size="18" weight="bold" /> New intake</RouterLink>
    </header>

    <div v-if="error" class="alert-error mt-8">{{ error }}</div>
    <div v-else-if="!data" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard"><div v-for="index in 4" :key="index" class="skeleton h-32"></div></div>
    <template v-else>
      <section class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="metric-block xl:col-span-2"><div class="metric-icon"><CurrencyCircleDollarIcon :size="25" /></div><p>Revenue this month</p><strong>{{ money(data.metrics.month_revenue) }}</strong><span>{{ money(data.metrics.outstanding) }} outstanding</span></article>
        <article class="metric-block"><div class="metric-icon"><PackageIcon :size="25" /></div><p>Active orders</p><strong>{{ data.metrics.active_orders }}</strong><span>{{ data.metrics.today_orders }} received today</span></article>
        <article class="metric-block"><div class="metric-icon"><UsersIcon :size="25" /></div><p>Clients this month</p><strong>{{ data.metrics.month_clients }}</strong><span>{{ data.metrics.month_orders }} total orders</span></article>
      </section>

      <section class="mt-10 grid gap-8 xl:grid-cols-[1.45fr_0.55fr]">
        <div>
          <div class="flex items-center justify-between"><h2 class="section-title">Recent orders</h2><RouterLink to="/orders" class="text-link">View all <ArrowRightIcon :size="16" /></RouterLink></div>
          <div class="data-panel mt-4">
            <RouterLink v-for="order in data.recent_orders" :key="order.id" :to="`/orders/${order.id}`" class="grid gap-2 border-b border-line p-4 last:border-0 hover:bg-sky-soft sm:grid-cols-[1fr_auto] sm:items-center">
              <div><div class="flex flex-wrap items-center gap-2"><strong class="text-navy">{{ order.reference }}</strong><StatusBadge :status="order.status" /></div><p class="mt-1 text-sm text-muted">{{ order.client.name }}, {{ order.cleaning_sessions.length }} pair<span v-if="order.cleaning_sessions.length !== 1">s</span>, {{ dateTime(order.received_at) }}</p></div>
              <strong class="font-mono text-sm">{{ money(order.total) }}</strong>
            </RouterLink>
          </div>
        </div>
        <div>
          <h2 class="section-title">Work queue</h2>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div v-for="(total, status) in data.status_counts" :key="status" class="rounded-xl border border-line bg-white p-4"><StatusBadge :status="status" /><strong class="mt-5 block text-3xl font-bold text-navy">{{ total }}</strong></div>
          </div>
        </div>
      </section>
    </template>
  </AppShell>
</template>
