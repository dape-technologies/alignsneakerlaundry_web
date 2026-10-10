<script setup>
import { onMounted, ref, watch } from 'vue'
import { PhMagnifyingGlass as MagnifyingGlassIcon, PhPackage as PackageIcon, PhPlus as PlusIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const orders = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const status = ref('')
let timer

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/orders', { params: { search: search.value, status: status.value } })
    orders.value = data.data
  } catch { error.value = 'Orders could not be loaded.' } finally { loading.value = false }
}

watch([search, status], () => { clearTimeout(timer); timer = setTimeout(loadOrders, 250) })
onMounted(loadOrders)
</script>

<template>
  <AppShell>
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">Laundry workflow</p><h1 class="mt-1 text-4xl font-black tracking-[-0.045em]">Orders</h1></div>
      <RouterLink to="/orders/new" class="button-primary"><PlusIcon :size="18" weight="bold" /> New order</RouterLink>
    </header>

    <section class="mt-8 grid gap-3 sm:grid-cols-[1fr_220px]">
      <label class="search-box"><MagnifyingGlassIcon :size="19" /><span class="sr-only">Search orders</span><input v-model="search" type="search" placeholder="Search reference, name, or phone" /></label>
      <select v-model="status" class="input"><option value="">All statuses</option><option v-for="value in ['received','washing','drying','quality_check','ready','collected','cancelled']" :key="value" :value="value">{{ value.replaceAll('_', ' ') }}</option></select>
    </section>

    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 space-y-3"><div v-for="index in 5" :key="index" class="skeleton h-24"></div></div>
    <section v-else-if="orders.length" class="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <RouterLink v-for="order in orders" :key="order.id" :to="`/orders/${order.id}`" class="grid gap-4 border-b border-stone-100 p-4 last:border-0 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/60 md:grid-cols-[1fr_1fr_auto] md:items-center">
        <div><div class="flex flex-wrap items-center gap-2"><strong>{{ order.reference }}</strong><StatusBadge :status="order.status" /></div><p class="mt-1 text-sm text-stone-500">Received {{ dateTime(order.received_at) }}</p></div>
        <div><strong class="block">{{ order.client.name }}</strong><span class="text-sm text-stone-500">{{ order.client.phone }}</span></div>
        <div class="md:text-right"><strong class="font-mono">{{ money(order.total) }}</strong><span class="block text-xs text-stone-500">{{ money(order.balance) }} due</span></div>
      </RouterLink>
    </section>
    <section v-else class="empty-state mt-6"><PackageIcon :size="34" /><h2>No orders found</h2><p>Adjust the filters or record a new laundry order.</p><RouterLink to="/orders/new" class="button-primary mt-5">New order</RouterLink></section>
  </AppShell>
</template>
