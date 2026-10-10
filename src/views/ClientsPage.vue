<script setup>
import { onMounted, ref, watch } from 'vue'
import { PhArrowRight as ArrowIcon, PhMagnifyingGlass as SearchIcon, PhUsers as UsersIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import { api } from '../services/api'

const clients = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
let timer
async function loadClients() { loading.value = true; error.value = ''; try { clients.value = (await api.get('/clients', { params: { search: search.value } })).data.data } catch { error.value = 'Client records could not be loaded.' } finally { loading.value = false } }
watch(search, () => { clearTimeout(timer); timer = setTimeout(loadClients, 250) })
onMounted(loadClients)
</script>

<template><AppShell><header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="eyebrow">Client registry</p><h1 class="page-title">Clients & footwear</h1><p class="mt-3 max-w-2xl text-muted">Permanent client profiles, registered pairs, and complete care history.</p></div><RouterLink to="/orders/new" class="button-primary">Start new intake</RouterLink></header><label class="search-box mt-8 max-w-2xl"><SearchIcon :size="19" /><span class="sr-only">Search clients</span><input v-model="search" type="search" placeholder="Search name, phone, or email" /></label><div v-if="error" class="alert-error mt-6">{{ error }}</div><div v-else-if="loading" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div v-for="index in 6" :key="index" class="skeleton h-40"></div></div><section v-else-if="clients.length" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><RouterLink v-for="client in clients" :key="client.id" :to="`/clients/${client.id}`" class="group rounded-xl border border-line bg-white p-5 shadow-[0_10px_32px_rgba(29,79,111,0.035)] hover:-translate-y-0.5 hover:border-sky"><div class="flex items-start justify-between gap-4"><span class="grid size-11 place-items-center rounded-lg bg-sky-soft text-lg font-bold text-sky-deep">{{ client.name.charAt(0) }}</span><ArrowIcon :size="18" class="text-muted group-hover:text-sky-deep" /></div><h2 class="mt-5 text-xl font-bold text-navy">{{ client.name }}</h2><p class="mt-2 text-sm font-semibold text-sky-deep">{{ client.phone }}</p><p class="mt-1 text-sm text-muted">{{ client.email }}</p><div class="mt-5 flex gap-5 border-t border-line pt-4 text-xs font-semibold text-muted"><span><strong class="text-navy">{{ client.shoes_count }}</strong> pairs</span><span><strong class="text-navy">{{ client.orders_count }}</strong> visits</span></div></RouterLink></section><section v-else class="empty-state mt-6"><UsersIcon :size="34" class="text-sky-deep" /><h2>No clients found</h2><p>Adjust your search or register a client during a new intake.</p><RouterLink to="/orders/new" class="button-primary mt-5">Start intake</RouterLink></section></AppShell></template>
