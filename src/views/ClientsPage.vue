<script setup>
import { onMounted, ref, watch } from 'vue'
import { PhMagnifyingGlass as MagnifyingGlassIcon, PhUsers as UsersIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import { api } from '../services/api'

const clients = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
let timer

async function loadClients() { loading.value = true; try { clients.value = (await api.get('/clients', { params: { search: search.value } })).data.data } catch { error.value = 'Clients could not be loaded.' } finally { loading.value = false } }
watch(search, () => { clearTimeout(timer); timer = setTimeout(loadClients, 250) })
onMounted(loadClients)
</script>

<template>
  <AppShell>
    <header><p class="text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">Customer records</p><h1 class="mt-1 text-4xl font-black tracking-[-0.045em]">Clients</h1></header>
    <label class="search-box mt-8 max-w-2xl"><MagnifyingGlassIcon :size="19" /><span class="sr-only">Search clients</span><input v-model="search" type="search" placeholder="Search name, phone, or email" /></label>
    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 grid gap-4 md:grid-cols-2"><div v-for="index in 4" :key="index" class="skeleton h-36"></div></div>
    <section v-else-if="clients.length" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><article v-for="client in clients" :key="client.id" class="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div class="flex items-start justify-between gap-4"><div><h2 class="text-xl font-black">{{ client.name }}</h2><a :href="`tel:${client.phone}`" class="mt-2 block font-semibold text-[#376b55] dark:text-[#9ee6c2]">{{ client.phone }}</a><a v-if="client.email" :href="`mailto:${client.email}`" class="mt-1 block text-sm text-stone-500">{{ client.email }}</a></div><span class="rounded-lg bg-stone-100 px-2 py-1 font-mono text-sm font-bold dark:bg-stone-800">{{ client.orders_count }}</span></div><p v-if="client.notes" class="mt-5 border-t border-stone-100 pt-4 text-sm text-stone-500 dark:border-stone-800">{{ client.notes }}</p></article></section>
    <section v-else class="empty-state mt-6"><UsersIcon :size="34" /><h2>No clients found</h2><p>Clients are created automatically when a new order is recorded.</p></section>
  </AppShell>
</template>
