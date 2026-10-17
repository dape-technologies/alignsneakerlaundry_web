<script setup>
import { onMounted, ref, watch } from 'vue'
import {
  PhCheckCircle as CheckIcon,
  PhMagnifyingGlass as MagnifyingGlassIcon,
  PhPackage as PackageIcon,
  PhPlus as PlusIcon,
  PhSneaker as ShoeIcon,
  PhTray as TrayIcon,
  PhWashingMachine as WashingMachineIcon,
} from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const stages = [
  { value: '', label: 'All active', icon: PackageIcon },
  { value: 'received', label: 'Received', icon: TrayIcon },
  { value: 'cleaning', label: 'In cleaning', icon: WashingMachineIcon },
  { value: 'ready_for_collection', label: 'Ready for collection', icon: CheckIcon },
]
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
    const { data } = await api.get('/orders', { params: { search: search.value, status: status.value, active: 1 } })
    orders.value = data.data
  } catch {
    error.value = 'Service orders could not be loaded.'
  } finally {
    loading.value = false
  }
}

watch([search, status], () => {
  clearTimeout(timer)
  timer = setTimeout(loadOrders, 250)
})
onMounted(loadOrders)
</script>

<template>
  <AppShell>
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Three-stage care workflow</p>
        <h1 class="page-title">Service orders</h1>
        <p class="mt-3 max-w-2xl text-muted">Track every active order from intake through cleaning to collection readiness.</p>
      </div>
      <RouterLink to="/orders/new" class="button-primary"><PlusIcon :size="18" weight="bold" /> New intake</RouterLink>
    </header>

    <section class="mt-8 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-center" aria-label="Order filters">
      <label class="search-box">
        <MagnifyingGlassIcon :size="19" />
        <span class="sr-only">Search orders</span>
        <input v-model="search" type="search" placeholder="Search order, client, phone, or shoe" />
      </label>
      <div class="stage-filter" role="group" aria-label="Filter by care stage">
        <button v-for="stage in stages" :key="stage.label" type="button" :class="{ active: status === stage.value }" :aria-pressed="status === stage.value" @click="status = stage.value">
          <component :is="stage.icon" :size="17" /> {{ stage.label }}
        </button>
      </div>
    </section>

    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 space-y-3"><div v-for="index in 5" :key="index" class="skeleton h-18"></div></div>
    <section v-else-if="orders.length" class="data-panel mt-6 overflow-x-auto">
      <table class="data-table min-w-[900px]">
        <thead><tr><th>Order</th><th>Client</th><th>Footwear</th><th>Received</th><th>Stage</th><th class="text-right">Value</th></tr></thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td><RouterLink :to="`/orders/${order.id}`" class="text-link">{{ order.reference }}</RouterLink></td>
            <td><strong class="block text-navy">{{ order.client_name }}</strong><span class="text-xs text-muted">{{ order.notification_phone }}</span></td>
            <td>
              <div class="flex min-w-48 items-center gap-2.5">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="18" /></span>
                <span><strong class="block text-navy">{{ order.cleaning_sessions[0]?.shoe?.display_name }}</strong><small v-if="order.cleaning_sessions.length > 1" class="text-muted">+{{ order.cleaning_sessions.length - 1 }} more pair<span v-if="order.cleaning_sessions.length > 2">s</span></small></span>
              </div>
            </td>
            <td class="whitespace-nowrap text-muted">{{ dateTime(order.received_at) }}</td>
            <td><StatusBadge :status="order.status" /></td>
            <td class="whitespace-nowrap text-right"><strong class="block text-navy">{{ money(order.total) }}</strong><span class="text-xs text-muted">{{ money(order.balance) }} due</span></td>
          </tr>
        </tbody>
      </table>
    </section>
    <section v-else class="empty-state mt-6"><PackageIcon :size="34" class="text-sky-deep" /><h2>No active service orders found</h2><p>Adjust the filters or start a new footwear intake.</p><RouterLink to="/orders/new" class="button-primary mt-5">New intake</RouterLink></section>
  </AppShell>
</template>
