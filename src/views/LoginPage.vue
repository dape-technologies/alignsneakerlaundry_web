<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight as ArrowRightIcon, PhLockKey as LockKeyIcon } from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ email: 'admin@alignlaundry.test', password: 'password', remember: true })
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(form)
    router.push(route.query.redirect || '/dashboard')
  } catch (requestError) {
    error.value = requestError.response?.data?.errors?.email?.[0] || 'Unable to sign in. Check the API and try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="grid min-h-[100dvh] bg-stone-100 dark:bg-stone-950 lg:grid-cols-2">
    <section class="hidden bg-[#16352a] p-12 text-stone-100 lg:flex lg:flex-col lg:justify-between">
      <RouterLink to="/" class="flex items-center gap-3 font-black"><span class="grid size-10 place-items-center rounded-xl bg-[#d7ff58] text-[#16352a]">A</span> Align Sneaker Laundry</RouterLink>
      <div class="max-w-lg"><p class="text-[#b8d1c5]">Operations workspace</p><h1 class="mt-4 text-6xl font-black leading-[0.95] tracking-[-0.055em]">Every pair accounted for.</h1></div>
      <p class="text-sm text-[#b8d1c5]">Secure access for authorised workers and administrators.</p>
    </section>
    <section class="grid place-items-center px-4 py-12 sm:px-8">
      <form class="w-full max-w-md" @submit.prevent="submit">
        <div class="mb-8 grid size-12 place-items-center rounded-xl bg-[#d7ff58] text-[#16352a] lg:hidden"><LockKeyIcon :size="24" weight="bold" /></div>
        <p class="text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">Staff portal</p>
        <h2 class="mt-2 text-4xl font-black tracking-[-0.045em] text-stone-950 dark:text-stone-100">Welcome back.</h2>
        <p class="mt-3 text-stone-600 dark:text-stone-400">Sign in to manage customers, orders, and reports.</p>

        <div v-if="error" class="mt-6 rounded-xl bg-rose-100 p-4 text-sm font-semibold text-rose-800" role="alert">{{ error }}</div>
        <div class="mt-8 space-y-5">
          <label class="field"><span>Email address</span><input v-model="form.email" type="email" autocomplete="email" required /></label>
          <label class="field"><span>Password</span><input v-model="form.password" type="password" autocomplete="current-password" required /></label>
          <label class="flex items-center gap-3 text-sm font-semibold text-stone-700 dark:text-stone-300"><input v-model="form.remember" type="checkbox" class="size-4 accent-[#376b55]" /> Keep me signed in</label>
        </div>
        <button class="button-primary mt-7 w-full justify-center" type="submit" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign in' }} <ArrowRightIcon v-if="!loading" :size="18" weight="bold" /></button>
        <p class="mt-6 text-xs leading-5 text-stone-500">Development accounts are prefilled. Change seeded passwords before production.</p>
      </form>
    </section>
  </main>
</template>
