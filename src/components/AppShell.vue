<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhChartBar as ChartBarIcon, PhHouse as HouseIcon, PhListChecks as ListChecksIcon,
  PhSignOut as SignOutIcon, PhUsers as UsersIcon, PhX as XIcon, PhList as ListIcon,
  PhPlus as PlusIcon, PhUserGear as UserGearIcon,
} from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'
import BrandLogo from './BrandLogo.vue'
import OrderDeleteControl from './OrderDeleteControl.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const menuOpen = ref(false)
const signingOut = ref(false)
const menuTrigger = ref(null)
const menuClose = ref(null)
const mobileViewportStyle = reactive({})
let previousBodyOverflow = ''
const navigation = [
  { label: 'Overview', to: '/dashboard', icon: HouseIcon },
  { label: 'Service orders', to: '/orders', icon: ListChecksIcon },
  { label: 'Clients & footwear', to: '/clients', icon: UsersIcon },
]

function updateMobileViewport() {
  const viewport = window.visualViewport
  Object.assign(mobileViewportStyle, {
    left: `${viewport?.offsetLeft || 0}px`,
    top: `${viewport?.offsetTop || 0}px`,
    width: `${viewport?.width || document.documentElement.clientWidth}px`,
    height: `${viewport?.height || document.documentElement.clientHeight}px`,
  })
}

async function openMenu() {
  updateMobileViewport()
  menuOpen.value = true
  await nextTick()
  menuClose.value?.focus()
}

function closeMenu({ restoreFocus = false } = {}) {
  menuOpen.value = false
  if (restoreFocus) nextTick(() => menuTrigger.value?.focus())
}

function handleKeydown(event) {
  if (event.key === 'Escape' && menuOpen.value) closeMenu({ restoreFocus: true })
}

watch(menuOpen, (open) => {
  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})
watch(() => route.fullPath, () => closeMenu())

onMounted(() => {
  updateMobileViewport()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', updateMobileViewport)
  window.visualViewport?.addEventListener('resize', updateMobileViewport)
  window.visualViewport?.addEventListener('scroll', updateMobileViewport)
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updateMobileViewport)
  window.visualViewport?.removeEventListener('resize', updateMobileViewport)
  window.visualViewport?.removeEventListener('scroll', updateMobileViewport)
})

async function logout() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await auth.logout()
  } catch {
    // Local sign-out still completes when the server session has already expired.
  } finally {
    menuOpen.value = false
    await router.replace('/login')
    signingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] bg-canvas text-ink">
    <aside class="shell-sidebar fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-line bg-white px-4 py-5 lg:flex lg:flex-col">
      <RouterLink to="/dashboard" class="mb-9 flex items-center gap-3 rounded-lg px-2 py-1">
        <BrandLogo show-name />
      </RouterLink>

      <nav class="space-y-1" aria-label="Workspace navigation">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link">
          <component :is="item.icon" :size="20" weight="bold" /> {{ item.label }}
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/reports" class="nav-link"><ChartBarIcon :size="20" weight="bold" /> Reports</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/attendants" class="nav-link"><UserGearIcon :size="20" weight="bold" /> Attendants</RouterLink>
        <RouterLink to="/orders/new" class="button-primary mt-4 w-full justify-center"><PlusIcon :size="18" weight="bold" /> New intake</RouterLink>
      </nav>

      <div class="mt-auto border-t border-line pt-5">
        <div class="rounded-lg bg-sky-soft px-3 py-3"><p class="text-sm font-bold text-navy">{{ auth.user?.name }}</p><p class="mt-0.5 text-xs font-semibold capitalize text-muted">{{ auth.isAdmin ? 'Owner' : 'Attendant' }} access</p></div>
        <button class="nav-link mt-2 w-full" type="button" :disabled="signingOut" @click="logout"><SignOutIcon :size="20" weight="bold" /> {{ signingOut ? 'Signing out…' : 'Sign out' }}</button>
      </div>
    </aside>

    <header class="shell-mobile-header sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
      <RouterLink to="/dashboard" aria-label="Go Fresh operations dashboard"><BrandLogo size="sm" show-name /></RouterLink>
      <button ref="menuTrigger" class="icon-button" type="button" aria-label="Open navigation" aria-controls="mobile-navigation" :aria-expanded="menuOpen" @click="openMenu"><ListIcon :size="24" /></button>
    </header>

    <Teleport to="body">
      <Transition name="mobile-menu">
        <div v-if="menuOpen" class="mobile-nav-overlay fixed z-40 overflow-hidden bg-navy/35 backdrop-blur-sm lg:hidden" :style="mobileViewportStyle" @click.self="closeMenu({ restoreFocus: true })">
          <aside id="mobile-navigation" class="mobile-nav-drawer ml-auto flex h-full max-h-full w-[min(19rem,100%)] flex-col overflow-y-auto bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Workspace navigation">
            <button ref="menuClose" class="icon-button ml-auto shrink-0" type="button" aria-label="Close navigation" @click="closeMenu({ restoreFocus: true })"><XIcon :size="22" /></button>
            <nav class="mt-6 space-y-1">
              <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link" @click="closeMenu()"><component :is="item.icon" :size="20" weight="bold" /> {{ item.label }}</RouterLink>
              <RouterLink v-if="auth.isAdmin" to="/reports" class="nav-link" @click="closeMenu()"><ChartBarIcon :size="20" /> Reports</RouterLink>
              <RouterLink v-if="auth.isAdmin" to="/attendants" class="nav-link" @click="closeMenu()"><UserGearIcon :size="20" /> Attendants</RouterLink>
              <RouterLink to="/orders/new" class="button-primary mt-4 w-full justify-center" @click="closeMenu()"><PlusIcon :size="18" weight="bold" /> New intake</RouterLink>
            </nav>
            <div class="mt-auto pt-6">
              <div class="mb-2 rounded-lg bg-sky-soft px-3 py-3"><p class="text-sm font-bold text-navy">{{ auth.user?.name }}</p><p class="mt-0.5 text-xs font-semibold capitalize text-muted">{{ auth.isAdmin ? 'Owner' : 'Attendant' }} access</p></div>
              <button class="nav-link w-full" type="button" :disabled="signingOut" @click="logout"><SignOutIcon :size="20" /> {{ signingOut ? 'Signing out…' : 'Sign out' }}</button>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

    <main id="main-content" class="shell-main lg:pl-68"><div class="shell-content mx-auto w-full max-w-[1440px] p-4 pb-12 sm:p-6 lg:p-9"><slot /></div></main>
    <OrderDeleteControl v-if="auth.isAdmin && route.params.id && route.path.startsWith('/orders/')" :order-id="route.params.id" />
  </div>
</template>

<style scoped>
.mobile-nav-drawer { padding-top: max(1.25rem, env(safe-area-inset-top)); padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); overscroll-behavior: contain; }
.mobile-menu-enter-active, .mobile-menu-leave-active { transition: opacity 180ms ease; }
.mobile-menu-enter-active .mobile-nav-drawer, .mobile-menu-leave-active .mobile-nav-drawer { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
.mobile-menu-enter-from, .mobile-menu-leave-to { opacity: 0; }
.mobile-menu-enter-from .mobile-nav-drawer, .mobile-menu-leave-to .mobile-nav-drawer { transform: translateX(100%); }
</style>
