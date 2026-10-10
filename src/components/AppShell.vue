<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhChartBar as ChartBarIcon, PhHouse as HouseIcon, PhListChecks as ListChecksIcon,
  PhSignOut as SignOutIcon, PhUsers as UsersIcon, PhX as XIcon, PhList as ListIcon,
  PhPlus as PlusIcon,
} from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)
const navigation = [
  { label: 'Overview', to: '/dashboard', icon: HouseIcon },
  { label: 'Service orders', to: '/orders', icon: ListChecksIcon },
  { label: 'Clients & footwear', to: '/clients', icon: UsersIcon },
]

async function logout() { await auth.logout(); router.push('/login') }
</script>

<template>
  <div class="min-h-[100dvh] bg-canvas text-ink">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-line bg-white px-4 py-5 lg:flex lg:flex-col">
      <RouterLink to="/dashboard" class="mb-9 flex items-center gap-3 rounded-lg px-2 py-1">
        <span class="relative grid size-10 place-items-center rounded-lg bg-navy text-lg font-bold text-white">A<span class="absolute right-1 top-1 size-2 rounded-full bg-sky"></span></span>
        <span class="leading-tight"><strong class="block text-navy">Align</strong><span class="text-xs font-semibold text-muted">Sneaker Laundry · Ops</span></span>
      </RouterLink>

      <RouterLink to="/orders/new" class="button-primary mb-7 w-full justify-center"><PlusIcon :size="18" weight="bold" /> New intake</RouterLink>
      <nav class="space-y-1" aria-label="Workspace navigation">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link">
          <component :is="item.icon" :size="20" weight="bold" /> {{ item.label }}
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/reports" class="nav-link"><ChartBarIcon :size="20" weight="bold" /> Reports</RouterLink>
      </nav>

      <div class="mt-auto border-t border-line pt-5">
        <div class="rounded-lg bg-sky-soft px-3 py-3"><p class="text-sm font-bold text-navy">{{ auth.user?.name }}</p><p class="mt-0.5 text-xs font-semibold capitalize text-muted">{{ auth.user?.role }} access</p></div>
        <button class="nav-link mt-2 w-full" type="button" @click="logout"><SignOutIcon :size="20" weight="bold" /> Sign out</button>
      </div>
    </aside>

    <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
      <RouterLink to="/dashboard" class="flex items-center gap-2 font-bold text-navy"><span class="grid size-8 place-items-center rounded-lg bg-navy text-white">A</span> Align Operations</RouterLink>
      <button class="icon-button" type="button" aria-label="Open navigation" @click="menuOpen = true"><ListIcon :size="24" /></button>
    </header>

    <div v-if="menuOpen" class="fixed inset-0 z-40 bg-navy/35 backdrop-blur-sm lg:hidden" @click.self="menuOpen = false">
      <aside class="ml-auto flex min-h-[100dvh] w-76 flex-col bg-white p-5 shadow-2xl">
        <button class="icon-button ml-auto" type="button" aria-label="Close navigation" @click="menuOpen = false"><XIcon :size="22" /></button>
        <RouterLink to="/orders/new" class="button-primary mt-5 justify-center" @click="menuOpen = false"><PlusIcon :size="18" /> New intake</RouterLink>
        <nav class="mt-6 space-y-1">
          <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link" @click="menuOpen = false"><component :is="item.icon" :size="20" weight="bold" /> {{ item.label }}</RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/reports" class="nav-link" @click="menuOpen = false"><ChartBarIcon :size="20" /> Reports</RouterLink>
        </nav>
        <button class="nav-link mt-auto" type="button" @click="logout"><SignOutIcon :size="20" /> Sign out</button>
      </aside>
    </div>

    <main id="main-content" class="lg:pl-68"><div class="mx-auto w-full max-w-[1440px] p-4 pb-12 sm:p-6 lg:p-9"><slot /></div></main>
  </div>
</template>
