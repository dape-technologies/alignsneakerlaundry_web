<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { PhArrowRight as ArrowIcon, PhCalendarBlank as CalendarIcon, PhMagnifyingGlass as SearchIcon, PhPlus as PlusIcon, PhSneaker as ShoeIcon, PhUsers as UsersIcon, PhX as ClearIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import AppSelect from '../components/AppSelect.vue'
import { api } from '../services/api'
import { dateOnly } from '../lib/format'

const clients = ref([])
const filters = reactive({ client_name: '', shoe_name: '', date: '' })
const mobileFilter = ref('client_name')
const mobileFilterOptions = [
  { value: 'client_name', label: 'Client' },
  { value: 'shoe_name', label: 'Shoe' },
  { value: 'date', label: 'Date' },
]
const mobileValue = ref('')
const loading = ref(true)
const error = ref('')
let timer

async function loadClients() {
  loading.value = true
  error.value = ''
  try {
    clients.value = (await api.get('/clients', { params: filters })).data.data
  } catch {
    error.value = 'Client and footwear records could not be loaded.'
  } finally {
    loading.value = false
  }
}
function clearFilters() {
  filters.client_name = ''
  filters.shoe_name = ''
  filters.date = ''
  mobileValue.value = ''
}
watch([mobileFilter, mobileValue], ([field, value]) => {
  filters.client_name = ''
  filters.shoe_name = ''
  filters.date = ''
  filters[field] = value
})
watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(loadClients, 250)
})
onMounted(loadClients)
</script>

<template>
  <AppShell>
    <header class="flex items-start justify-between gap-3 sm:items-end">
      <div class="min-w-0"><p class="eyebrow">Client registry</p><h1 class="page-title client-page-title">Clients & footwear</h1></div>
      <RouterLink to="/orders/new" class="button-primary compact-intake-button" aria-label="Start new intake"><PlusIcon :size="17" weight="bold" /><span class="sm:hidden">Intake</span><span class="hidden sm:inline">Start new intake</span></RouterLink>
    </header>

    <section class="mt-6 grid grid-cols-[minmax(0,1fr)_7.75rem] gap-2 md:hidden" aria-label="Client and footwear filters">
      <label class="filter-input"><SearchIcon v-if="mobileFilter !== 'date'" :size="18" /><CalendarIcon v-else :size="18" /><span class="sr-only">Filter value</span><input v-model="mobileValue" :type="mobileFilter === 'date' ? 'date' : 'search'" :placeholder="mobileFilter === 'client_name' ? 'Client name' : 'Shoe name'" /></label>
      <AppSelect v-model="mobileFilter" class="mobile-filter" :options="mobileFilterOptions" aria-label="Filter by" />
    </section>

    <section class="filter-panel desktop-filter-panel mt-8" aria-label="Client and footwear filters">
      <label class="field"><span>Client name</span><span class="filter-input"><SearchIcon :size="18" /><input v-model="filters.client_name" type="search" placeholder="e.g. Amina" /></span></label>
      <label class="field"><span>Shoe name</span><span class="filter-input"><ShoeIcon :size="18" /><input v-model="filters.shoe_name" type="search" placeholder="Brand, model, or type" /></span></label>
      <label class="field"><span>Service date</span><span class="filter-input"><CalendarIcon :size="18" /><input v-model="filters.date" type="date" /></span></label>
      <button v-if="filters.client_name || filters.shoe_name || filters.date" class="button-tertiary self-end" type="button" @click="clearFilters"><ClearIcon :size="17" /> Clear</button>
    </section>

    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 space-y-3"><div v-for="index in 6" :key="index" class="skeleton h-18"></div></div>
    <section v-else-if="clients.length" class="data-panel mt-6 overflow-x-auto">
      <table class="data-table min-w-[920px]">
        <thead><tr><th>Client</th><th>Contact</th><th>Registered footwear</th><th>Last service</th><th>Visits</th><th><span class="sr-only">Open</span></th></tr></thead>
        <tbody>
          <tr v-for="client in clients" :key="client.id">
            <td><RouterLink :to="`/clients/${client.id}`" class="font-bold text-navy hover:text-sky-deep">{{ client.name }}</RouterLink></td>
            <td><strong class="block text-sm text-sky-deep">{{ client.phone }}</strong><span class="text-xs text-muted">{{ client.email }}</span></td>
            <td>
              <div v-if="client.shoes.length" class="flex max-w-md flex-wrap gap-1.5">
                <span v-for="shoe in client.shoes" :key="shoe.id" class="shoe-tag"><ShoeIcon :size="14" /> {{ shoe.display_name }}</span>
              </div>
              <span v-else class="text-sm text-muted">No footwear registered</span>
            </td>
            <td class="whitespace-nowrap text-sm font-semibold text-muted">{{ dateOnly(client.last_service_at) }}</td>
            <td><strong class="text-navy">{{ client.orders_count }}</strong><span class="ml-1 text-xs text-muted">order<span v-if="client.orders_count !== 1">s</span></span></td>
            <td class="text-right"><RouterLink :to="`/clients/${client.id}`" class="icon-button ml-auto" :aria-label="`Open ${client.name}`"><ArrowIcon :size="18" /></RouterLink></td>
          </tr>
        </tbody>
      </table>
    </section>
    <section v-else class="empty-state mt-6"><UsersIcon :size="34" class="text-sky-deep" /><h2>No matching records</h2><button class="button-secondary mt-5" type="button" @click="clearFilters">Clear filters</button></section>
  </AppShell>
</template>
