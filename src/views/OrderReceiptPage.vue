<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft as ArrowIcon, PhPrinter as PrinterIcon } from '@phosphor-icons/vue'
import BrandLogo from '../components/BrandLogo.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const route = useRoute()
const order = ref(null)
const error = ref('')
const printReceipt = () => window.print()

onMounted(async () => {
  try { order.value = (await api.get(`/orders/${route.params.id}`)).data }
  catch { error.value = 'This receipt could not be loaded.' }
})
</script>

<template>
  <main class="receipt-screen min-h-screen bg-canvas px-4 py-8 text-ink">
    <div class="receipt-actions mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
      <RouterLink :to="`/orders/${route.params.id}`" class="button-secondary"><ArrowIcon :size="17" /> Back to order</RouterLink>
      <button class="button-primary" type="button" :disabled="!order" @click="printReceipt"><PrinterIcon :size="17" /> Print / Save PDF</button>
    </div>
    <div v-if="error" class="alert-error mx-auto max-w-3xl">{{ error }}</div>
    <article v-else-if="order" class="receipt mx-auto max-w-3xl bg-white p-7 shadow-sm sm:p-10">
      <header class="flex items-start justify-between gap-6 border-b-2 border-navy pb-6"><div><BrandLogo show-name /><p class="mt-5 text-xs font-bold tracking-[.15em] text-sky-deep">SERVICE RECEIPT</p><h1 class="mt-1 text-2xl font-bold text-navy">{{ order.reference }}</h1></div><div class="text-right"><StatusBadge :status="order.status" /><p class="mt-3 text-sm text-muted">{{ dateTime(order.received_at) }}</p></div></header>

      <section class="mt-7 grid gap-6 sm:grid-cols-2"><div><p class="receipt-label">Client</p><strong class="mt-1 block text-lg text-navy">{{ order.client_name }}</strong><p class="mt-1 text-sm text-muted">{{ order.notification_phone }}</p><p class="text-sm text-muted">{{ order.notification_email }}</p></div><div class="sm:text-right"><p class="receipt-label">Received by</p><strong class="mt-1 block text-navy">{{ order.creator.name }}</strong><p class="mt-1 text-sm text-muted">Expected completion: {{ dateTime(order.due_at) }}</p></div></section>

      <section v-if="order.collected_at || order.status === 'cancelled'" class="mt-6 rounded-lg bg-canvas p-4 text-sm"><strong class="text-navy">{{ order.status === 'cancelled' ? 'Order cancelled' : 'Collected' }}</strong><p class="mt-1 text-muted">{{ order.status === 'cancelled' ? 'Recorded payments are retained for audit and excluded from company income.' : dateTime(order.collected_at) }}</p></section>

      <section class="mt-8 overflow-hidden rounded-lg border border-line"><table class="w-full text-left text-sm"><thead class="bg-canvas text-xs uppercase tracking-wide text-muted"><tr><th class="p-3">Footwear</th><th class="p-3">Tag</th><th class="p-3">Care service</th><th class="p-3 text-right">Price</th></tr></thead><tbody><tr v-for="session in order.cleaning_sessions" :key="session.id"><td class="p-3"><strong class="block text-navy">{{ session.shoe.display_name }}</strong><span class="text-xs text-muted">{{ session.shoe.reference }}</span></td><td class="p-3 font-bold text-sky-deep">{{ session.tag?.label || 'Legacy — no tag' }}</td><td class="p-3">{{ session.service }}</td><td class="p-3 text-right font-semibold">{{ money(session.unit_price) }}</td></tr></tbody></table></section>

      <section class="mt-7 grid gap-7 sm:grid-cols-[1fr_18rem]"><div><p class="receipt-label">Payments</p><div v-if="order.payments.length" class="mt-2 divide-y divide-line"><div v-for="payment in order.payments" :key="payment.id" class="flex justify-between gap-4 py-2 text-sm"><span><strong class="capitalize text-navy">{{ payment.method.replaceAll('_', ' ') }}</strong><small class="block text-muted">{{ dateTime(payment.paid_at) }} · {{ payment.recorder?.name }}<template v-if="payment.reference"> · {{ payment.reference }}</template></small></span><strong class="text-navy">{{ money(payment.amount) }}</strong></div></div><p v-else class="mt-2 text-sm text-muted">No payment recorded.</p></div><dl class="space-y-2 text-sm"><div class="flex justify-between"><dt class="text-muted">Subtotal</dt><dd class="font-semibold">{{ money(order.subtotal) }}</dd></div><div class="flex justify-between"><dt class="text-muted">Discount</dt><dd class="font-semibold">{{ money(order.discount) }}</dd></div><div class="flex justify-between border-t border-line pt-2"><dt class="font-bold text-navy">Total</dt><dd class="font-bold text-navy">{{ money(order.total) }}</dd></div><div class="flex justify-between"><dt class="text-muted">Paid</dt><dd class="font-semibold">{{ money(order.amount_paid) }}</dd></div><div class="flex justify-between rounded-md bg-sky-soft px-3 py-2"><dt class="font-bold text-navy">Balance</dt><dd class="font-bold text-sky-deep">{{ money(order.balance) }}</dd></div></dl></section>

      <footer class="mt-10 border-t border-line pt-5 text-center text-xs text-muted"><p>Thank you for trusting Go Fresh Shoe Laundry with your footwear.</p><p class="mt-1">Keep this receipt for collection and payment reference.</p></footer>
    </article>
    <div v-else class="skeleton mx-auto h-[36rem] max-w-3xl"></div>
  </main>
</template>

<style scoped>
.receipt { border: 1px solid var(--color-line); border-radius: 1rem; }
.receipt-label { color: var(--color-muted); font-size: .7rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
@media print {
  :global(body) { background: white !important; }
  .receipt-screen { min-height: auto; padding: 0; background: white; }
  .receipt-actions { display: none; }
  .receipt { max-width: none; border: 0; border-radius: 0; padding: 0; box-shadow: none; }
}
</style>
