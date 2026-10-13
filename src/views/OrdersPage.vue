<script setup>
import { onMounted, ref, watch } from 'vue'
import { PhMagnifyingGlass as MagnifyingGlassIcon, PhPackage as PackageIcon, PhPlus as PlusIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money, statusLabel } from '../lib/format'

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
      <div><p class="eyebrow">Care workflow</p><h1 class="page-title">Service orders</h1></div>
      <RouterLink to="/orders/new" class="button-primary"><PlusIcon :size="18" weight="bold" /> New intake</RouterLink>
    </header>

    <section class="mt-8 grid gap-3 sm:grid-cols-[1fr_220px]">
      <label class="search-box"><MagnifyingGlassIcon :size="19" /><span class="sr-only">Search orders</span><input v-model="search" type="search" placeholder="Search reference, name, or phone" /></label>
      <select v-model="status" class="input"><option value="">All care stages</option><option v-for="value in ['received','cleaning','ready_for_collection','collected','cancelled']" :key="value" :value="value">{{ statusLabel(value) }}</option></select>
    </section>

    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 space-y-3"><div v-for="index in 5" :key="index" class="skeleton h-24"></div></div>
    <section v-else-if="orders.length" class="data-panel mt-6">
      <RouterLink v-for="order in orders" :key="order.id" :to="`/orders/${order.id}`" class="grid gap-4 border-b border-line p-4 last:border-0 hover:bg-sky-soft md:grid-cols-[1fr_1fr_auto] md:items-center">
        <div><div class="flex flex-wrap items-center gap-2"><strong class="text-navy">{{ order.reference }}</strong><StatusBadge :status="order.status" /></div><p class="mt-1 text-sm text-muted">Received {{ dateTime(order.received_at) }} · {{ order.cleaning_sessions.length }} pair<span v-if="order.cleaning_sessions.length !== 1">s</span></p></div>
        <div><strong class="block text-navy">{{ order.client_name }}</strong><span class="text-sm text-muted">{{ order.notification_phone }}</span></div>
        <div class="md:text-right"><strong>{{ money(order.total) }}</strong><span class="block text-xs text-muted">{{ money(order.balance) }} due</span></div>
      </RouterLink>
    </section>
    <section v-else class="empty-state mt-6"><PackageIcon :size="34" class="text-sky-deep" /><h2>No service orders found</h2><p>Adjust the filters or start a new footwear intake.</p><RouterLink to="/orders/new" class="button-primary mt-5">New intake</RouterLink></section>
  </AppShell>
</template>
