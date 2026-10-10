<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight as ArrowRightIcon, PhDrop as DropIcon, PhLockKey as LockIcon, PhShieldCheck as ShieldIcon, PhSparkle as SparkleIcon } from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const showDemoAccounts = import.meta.env.DEV
const form = reactive({
  email: import.meta.env.DEV ? 'admin@alignlaundry.test' : '',
  password: import.meta.env.DEV ? 'password' : '',
  remember: true,
})
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!navigator.onLine) { error.value = 'A connection is required to sign in.'; return }
  loading.value = true; error.value = ''
  try { await auth.login(form); router.push(route.query.redirect || '/dashboard') }
  catch (requestError) { error.value = requestError.response?.data?.errors?.email?.[0] || 'We could not sign you in. Check your details and connection.' }
  finally { loading.value = false }
}

function useDemoAccount(email) {
  form.email = email
  form.password = 'password'
}
</script>

<template>
  <main class="grid min-h-[100dvh] bg-white lg:grid-cols-[minmax(0,1.18fr)_minmax(430px,0.82fr)]">
    <section class="relative hidden min-h-[100dvh] overflow-hidden bg-sky-soft p-6 lg:block xl:p-8">
      <img src="/login-sneaker-care.png" alt="A freshly cleaned sneaker beside professional brushes and foam" class="absolute inset-0 size-full object-cover" />
      <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(234,246,252,0.98)_0%,rgba(234,246,252,0.9)_34%,rgba(234,246,252,0.05)_72%)]"></div>
      <div class="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-navy/80 to-transparent"></div>
      <div class="relative flex h-full min-h-[calc(100dvh-3rem)] flex-col justify-between xl:min-h-[calc(100dvh-4rem)]">
        <div class="flex items-center gap-3"><span class="relative grid size-12 place-items-center rounded-xl bg-navy text-xl font-extrabold text-white shadow-[0_10px_28px_rgba(16,47,76,0.2)]">A<span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-sky"></span></span><span class="text-xs font-bold uppercase tracking-[0.18em] text-navy">Professional footwear care</span></div>
        <div class="max-w-[670px] pb-[30vh] xl:pb-[28vh]"><p class="mb-4 flex items-center gap-2 text-sm font-bold text-sky-deep"><SparkleIcon :size="18" weight="fill" /> Care, clearly managed</p><h1 class="text-[clamp(3.8rem,6.6vw,7.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.075em] text-navy">Align<br /><span class="text-sky-deep">Sneaker</span><br />Laundry</h1></div>
        <div class="flex items-end justify-between gap-6 text-white"><div><p class="text-lg font-semibold">From intake to immaculate.</p><p class="mt-1 text-sm text-white/70">Every pair tracked through every care stage.</p></div><div class="flex gap-2"><span class="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur"><DropIcon :size="20" weight="fill" /></span><span class="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur"><SparkleIcon :size="20" weight="fill" /></span></div></div>
      </div>
    </section>
    <section class="grid place-items-center px-5 py-8 sm:px-10 lg:px-12">
      <form class="w-full max-w-md" @submit.prevent="submit">
        <div class="mb-8 lg:hidden"><div class="flex items-center gap-3"><span class="grid size-11 place-items-center rounded-xl bg-navy text-lg font-extrabold text-white">A</span><span class="text-xs font-bold uppercase tracking-[0.16em] text-muted">Professional footwear care</span></div><h1 class="mt-6 text-4xl font-extrabold uppercase leading-[0.88] tracking-[-0.055em] text-navy sm:text-5xl">Align <span class="text-sky-deep">Sneaker</span><br />Laundry</h1><div class="relative mt-6 h-36 overflow-hidden rounded-2xl bg-sky-soft"><img src="/login-sneaker-care.png" alt="Professional sneaker cleaning tools" class="size-full object-cover object-[center_63%]" /><div class="absolute inset-0 bg-gradient-to-r from-sky-soft/70 to-transparent"></div></div></div>
        <span class="grid size-11 place-items-center rounded-xl bg-sky-soft text-sky-deep"><LockIcon :size="23" weight="duotone" /></span>
        <p class="eyebrow mt-7">Staff workspace</p><h2 class="page-title">Welcome back</h2><p class="mt-3 text-muted">Sign in to manage clients, footwear, service orders, and reports.</p>
        <div v-if="error" class="alert-error mt-6" role="alert">{{ error }}</div>
        <div class="mt-8 space-y-5"><label class="field"><span>Email address</span><input v-model="form.email" type="email" autocomplete="email" required /></label><label class="field"><span>Password</span><input v-model="form.password" type="password" autocomplete="current-password" required /></label><div v-if="showDemoAccounts" class="rounded-xl border border-line bg-canvas p-3"><p class="text-xs font-bold uppercase tracking-[0.12em] text-muted">Demo accounts</p><div class="mt-2 grid grid-cols-2 gap-2"><button type="button" class="rounded-lg border border-line bg-white px-3 py-2 text-left hover:border-sky hover:bg-sky-soft" @click="useDemoAccount('admin@alignlaundry.test')"><strong class="block text-sm text-navy">Administrator</strong><span class="text-xs text-muted">Full access</span></button><button type="button" class="rounded-lg border border-line bg-white px-3 py-2 text-left hover:border-sky hover:bg-sky-soft" @click="useDemoAccount('worker@alignlaundry.test')"><strong class="block text-sm text-navy">Care worker</strong><span class="text-xs text-muted">Operations access</span></button></div><p class="mt-2 text-xs text-muted">Password: <strong class="text-navy">password</strong></p></div><label class="flex items-center gap-3 text-sm font-semibold text-muted"><input v-model="form.remember" type="checkbox" class="size-4 accent-sky-deep" /> Keep me signed in</label></div>
        <button class="button-primary mt-7 w-full justify-center" type="submit" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in to workspace' }} <ArrowRightIcon v-if="!loading" :size="18" weight="bold" /></button>
        <p class="mt-6 flex items-center gap-2 text-xs font-semibold text-muted"><ShieldIcon :size="16" class="text-sky-deep" weight="duotone" /> Secure access for authorised staff only.</p>
      </form>
    </section>
  </main>
</template>
