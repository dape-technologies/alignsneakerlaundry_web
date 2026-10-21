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
import AppSelect from '../components/AppSelect.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const stages = [
  { value: '', label: 'All active', icon: PackageIcon },
  { value: 'received', label: 'Received', icon: TrayIcon },
  { value: 'cleaning', label: 'In cleaning', icon: WashingMachineIcon },
  { value: 'ready_for_collection', label: 'Ready for collection', icon: CheckIcon },
]
const stageOptions = stages.map((stage) => ({ value: stage.value, label: stage.label }))
const orders = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const status = ref('')
const scope = ref('active')
const scopes = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'collected', label: 'Collected' },
]
let timer

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/orders', { params: { search: search.value, status: scope.value === 'active' ? status.value : '', scope: scope.value } })
    orders.value = data.data
  } catch {
    error.value = 'Service orders could not be loaded.'
  } finally {
    loading.value = false
  }
}

watch([search, status, scope], () => {
  clearTimeout(timer)
  timer = setTimeout(loadOrders, 250)
})
onMounted(loadOrders)
</script>

<template>
  <AppShell>
    <header class="flex items-start justify-between gap-3 sm:items-end">
      <div>
        <p class="eyebrow">Three-stage care workflow</p>
        <h1 class="page-title">Service orders</h1>
      </div>
      <RouterLink to="/orders/new" class="button-primary compact-intake-button" aria-label="New intake"><PlusIcon :size="17" weight="bold" /><span class="sm:hidden">Intake</span><span class="hidden sm:inline">New intake</span></RouterLink>
    </header>

    <section class="mt-6 grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2 sm:mt-8 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-center" aria-label="Order filters">
      <label class="search-box">
        <MagnifyingGlassIcon :size="19" />
        <span class="sr-only">Search orders</span>
        <input v-model="search" type="search" placeholder="Search order, client, phone, or shoe" />
      </label>
      <AppSelect v-if="scope === 'active'" v-model="status" class="mobile-filter lg:hidden" :options="stageOptions" aria-label="Care stage" />
      <div v-if="scope === 'active'" class="stage-filter hidden lg:flex" role="group" aria-label="Filter by care stage">
        <button v-for="stage in stages" :key="stage.label" type="button" :class="{ active: status === stage.value }" :aria-pressed="status === stage.value" @click="status = stage.value">
          <component :is="stage.icon" :size="17" /> {{ stage.label }}
        </button>
      </div>
    </section>
    <div class="stage-filter mt-3 flex overflow-x-auto" role="group" aria-label="Order records">
      <button v-for="item in [...scopes, ...(auth.isAdmin ? [{ value: 'cancelled', label: 'Cancelled' }] : [])]" :key="item.value" type="button" :class="{ active: scope === item.value }" :aria-pressed="scope === item.value" @click="scope = item.value; status = ''">{{ item.label }}</button>
    </div>

    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 space-y-3"><div v-for="index in 5" :key="index" class="skeleton h-18"></div></div>
    <template v-else-if="orders.length">
    <section class="mt-5 grid gap-2 md:hidden" aria-label="Service orders">
      <RouterLink v-for="order in orders" :key="order.id" :to="`/orders/${order.id}`" class="rounded-xl border border-line bg-white p-4 shadow-[0_8px_24px_rgba(29,79,111,0.04)] active:bg-sky-soft">
        <div class="flex items-center justify-between gap-3"><strong class="text-sm text-sky-deep">{{ order.reference }}</strong><StatusBadge :status="order.status" /></div>
        <div class="mt-3 flex items-center gap-2.5"><span class="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="18" /></span><span class="min-w-0"><strong class="block truncate text-navy">{{ order.cleaning_sessions[0]?.shoe?.display_name }}</strong><small class="block text-muted">{{ order.client_name }}</small><small class="block text-muted">{{ order.cleaning_sessions[0]?.tag?.label || 'Legacy — no tag' }} · {{ order.cleaning_sessions[0]?.service }}</small></span></div>
        <div class="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3"><span class="text-xs text-muted">{{ dateTime(order.received_at) }}</span><span class="text-right"><strong class="block text-sm text-navy">{{ money(order.total) }}</strong><small class="text-muted">{{ money(order.balance) }} due</small></span></div>
      </RouterLink>
    </section>
    <section class="data-panel mt-6 hidden overflow-x-auto md:block">
      <table class="data-table min-w-[900px]">
        <thead><tr><th>Order</th><th>Client</th><th>Footwear</th><th>Received</th><th>Stage</th><th class="text-right">Value</th></tr></thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td><RouterLink :to="`/orders/${order.id}`" class="text-link">{{ order.reference }}</RouterLink></td>
            <td><strong class="block text-navy">{{ order.client_name }}</strong><span class="text-xs text-muted">{{ order.notification_phone }}</span></td>
            <td>
              <div class="flex min-w-48 items-center gap-2.5">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="18" /></span>
                <span><strong class="block text-navy">{{ order.cleaning_sessions[0]?.shoe?.display_name }}</strong><small class="text-muted">{{ order.cleaning_sessions[0]?.tag?.label || 'Legacy — no tag' }} · {{ order.cleaning_sessions[0]?.service }}</small><small v-if="order.cleaning_sessions.length > 1" class="block text-muted">+{{ order.cleaning_sessions.length - 1 }} more pair<span v-if="order.cleaning_sessions.length > 2">s</span></small></span>
              </div>
            </td>
            <td class="whitespace-nowrap text-muted">{{ dateTime(order.received_at) }}</td>
            <td><StatusBadge :status="order.status" /></td>
            <td class="whitespace-nowrap text-right"><strong class="block text-navy">{{ money(order.total) }}</strong><span class="text-xs text-muted">{{ money(order.balance) }} due</span></td>
          </tr>
        </tbody>
      </table>
    </section>
    </template>
    <section v-else class="empty-state mt-6"><PackageIcon :size="34" class="text-sky-deep" /><h2>No service orders found</h2><RouterLink to="/orders/new" class="button-primary mt-5">New intake</RouterLink></section>
  </AppShell>
</template>
