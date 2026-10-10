<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhChartBar as ChartBarIcon, PhHouse as HouseIcon, PhListChecks as ListChecksIcon,
  PhSignOut as SignOutIcon, PhUsers as UsersIcon, PhX as XIcon, PhList as ListIcon,
} from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: HouseIcon },
  { label: 'Orders', to: '/orders', icon: ListChecksIcon },
  { label: 'Clients', to: '/clients', icon: UsersIcon },
]

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-[100dvh] bg-stone-100 text-stone-950 dark:bg-stone-950 dark:text-stone-100">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200 bg-stone-50 px-4 py-5 dark:border-stone-800 dark:bg-stone-900 lg:flex lg:flex-col">
      <RouterLink to="/" class="mb-10 flex items-center gap-3 px-2">
        <span class="grid size-10 place-items-center rounded-xl bg-[#16352a] text-lg font-black text-[#d7ff58]">A</span>
        <span class="leading-tight"><strong class="block">Align</strong><span class="text-sm text-stone-500">Sneaker Laundry</span></span>
      </RouterLink>

      <nav class="space-y-1" aria-label="Dashboard navigation">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link">
          <component :is="item.icon" :size="20" weight="bold" />
          {{ item.label }}
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/reports" class="nav-link">
          <ChartBarIcon :size="20" weight="bold" /> Reports
        </RouterLink>
      </nav>

      <div class="mt-auto border-t border-stone-200 pt-5 dark:border-stone-800">
        <p class="px-3 text-sm font-bold">{{ auth.user?.name }}</p>
        <p class="px-3 text-xs capitalize text-stone-500">{{ auth.user?.role }}</p>
        <button class="nav-link mt-3 w-full" type="button" @click="logout">
          <SignOutIcon :size="20" weight="bold" /> Sign out
        </button>
      </div>
    </aside>

    <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-stone-50/95 px-4 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 lg:hidden">
      <RouterLink to="/dashboard" class="flex items-center gap-2 font-bold">
        <span class="grid size-8 place-items-center rounded-lg bg-[#16352a] text-[#d7ff58]">A</span> Align
      </RouterLink>
      <button class="icon-button" type="button" aria-label="Open navigation" @click="menuOpen = true">
        <ListIcon :size="24" />
      </button>
    </header>

    <div v-if="menuOpen" class="fixed inset-0 z-40 bg-stone-950/50 lg:hidden" @click.self="menuOpen = false">
      <aside class="ml-auto flex min-h-[100dvh] w-72 flex-col bg-stone-50 p-5 dark:bg-stone-900">
        <button class="icon-button ml-auto" type="button" aria-label="Close navigation" @click="menuOpen = false"><XIcon :size="22" /></button>
        <nav class="mt-8 space-y-1">
          <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link" @click="menuOpen = false">
            <component :is="item.icon" :size="20" weight="bold" /> {{ item.label }}
          </RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/reports" class="nav-link" @click="menuOpen = false">
            <ChartBarIcon :size="20" weight="bold" /> Reports
          </RouterLink>
        </nav>
        <button class="nav-link mt-auto" type="button" @click="logout"><SignOutIcon :size="20" /> Sign out</button>
      </aside>
    </div>

    <main class="lg:pl-64">
      <div class="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
