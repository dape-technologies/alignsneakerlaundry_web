<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft as ArrowLeftIcon, PhBellRinging as BellRingingIcon, PhCurrencyCircleDollar as CurrencyCircleDollarIcon, PhImage as ImageIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api, validationErrors } from '../services/api'
import { dateTime, money, statusLabel } from '../lib/format'

const route = useRoute()
const order = ref(null)
const error = ref('')
const savingStatus = ref(false)
const savingPayment = ref(false)
const formErrors = ref({})
const statusForm = reactive({ status: '', notes: '' })
const paymentForm = reactive({ amount: '', method: 'cash', reference: '' })

const nextStatuses = computed(() => ({
  received: ['washing', 'cancelled'], washing: ['drying', 'quality_check', 'cancelled'],
  drying: ['quality_check', 'washing', 'cancelled'], quality_check: ['ready', 'washing', 'cancelled'],
  ready: ['collected', 'washing'], collected: [], cancelled: [],
}[order.value?.status] || []))

async function loadOrder() {
  try { order.value = (await api.get(`/orders/${route.params.id}`)).data; statusForm.status = nextStatuses.value[0] || '' }
  catch { error.value = 'This order could not be loaded.' }
}

async function updateStatus() {
  savingStatus.value = true; formErrors.value = {}
  try { order.value = (await api.patch(`/orders/${order.value.id}/status`, statusForm)).data; statusForm.status = nextStatuses.value[0] || ''; statusForm.notes = '' }
  catch (requestError) { formErrors.value = validationErrors(requestError) } finally { savingStatus.value = false }
}

async function addPayment() {
  savingPayment.value = true; formErrors.value = {}
  try { await api.post(`/orders/${order.value.id}/payments`, paymentForm); paymentForm.amount = ''; paymentForm.reference = ''; await loadOrder() }
  catch (requestError) { formErrors.value = validationErrors(requestError) } finally { savingPayment.value = false }
}

onMounted(loadOrder)
</script>

<template>
  <AppShell>
    <RouterLink to="/orders" class="text-link"><ArrowLeftIcon :size="17" /> Back to orders</RouterLink>
    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="!order" class="mt-6 space-y-4"><div class="skeleton h-28"></div><div class="skeleton h-80"></div></div>
    <template v-else>
      <header class="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div class="flex flex-wrap items-center gap-3"><h1 class="text-4xl font-black tracking-[-0.045em]">{{ order.reference }}</h1><StatusBadge :status="order.status" /></div><p class="mt-2 text-stone-500">Received {{ dateTime(order.received_at) }} by {{ order.creator.name }}</p></div><div class="text-left sm:text-right"><p class="text-sm text-stone-500">Order total</p><strong class="font-mono text-2xl">{{ money(order.total) }}</strong></div></header>

      <section class="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div class="space-y-6">
          <article class="form-section"><div class="flex flex-col justify-between gap-3 sm:flex-row"><div><p class="text-sm text-stone-500">Client</p><h2 class="mt-1 text-2xl font-black">{{ order.client.name }}</h2></div><div class="sm:text-right"><a class="block font-bold text-[#376b55] dark:text-[#9ee6c2]" :href="`tel:${order.client.phone}`">{{ order.client.phone }}</a><a v-if="order.client.email" class="mt-1 block text-sm text-stone-500" :href="`mailto:${order.client.email}`">{{ order.client.email }}</a></div></div></article>

          <article class="form-section"><h2 class="section-title">Shoes and services</h2><div class="mt-5 grid gap-4 md:grid-cols-2"><div v-for="item in order.items" :key="item.id" class="rounded-2xl bg-stone-100 p-5 dark:bg-stone-800"><div class="flex justify-between gap-4"><div><strong class="text-lg">{{ item.brand || 'Unbranded' }} {{ item.shoe_type }}</strong><p class="mt-1 text-sm text-stone-500">{{ item.color || 'Colour not recorded' }}</p></div><strong class="font-mono">{{ money(item.unit_price) }}</strong></div><p class="mt-4 text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">{{ item.service }}</p><p v-if="item.condition_notes" class="mt-2 text-sm text-stone-600 dark:text-stone-300">{{ item.condition_notes }}</p></div></div></article>

          <article class="form-section"><h2 class="section-title">Condition photos</h2><div v-if="order.photos.length" class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><img v-for="photo in order.photos" :key="photo.id" :src="photo.url" alt="Shoe condition at intake" class="aspect-square w-full rounded-2xl object-cover" /></div><div v-else class="mt-5 flex items-center gap-3 rounded-2xl bg-stone-100 p-5 text-stone-500 dark:bg-stone-800"><ImageIcon :size="26" /><span>No condition photos were attached.</span></div></article>

          <article class="form-section"><h2 class="section-title">Status history</h2><ol class="mt-5 space-y-4"><li v-for="entry in order.status_history" :key="entry.id" class="grid gap-1 border-l-2 border-[#7aa58f] pl-4 sm:grid-cols-[1fr_auto]"><div><strong>{{ statusLabel(entry.to_status) }}</strong><p class="text-sm text-stone-500">{{ entry.notes || `Changed by ${entry.changer.name}` }}</p></div><time class="text-xs text-stone-500">{{ dateTime(entry.created_at) }}</time></li></ol></article>
        </div>

        <aside class="space-y-6">
          <section class="rounded-2xl bg-[#16352a] p-6 text-stone-100"><div class="flex items-center gap-3"><BellRingingIcon :size="24" class="text-[#d7ff58]" /><h2 class="text-xl font-black">Update workflow</h2></div><form v-if="nextStatuses.length" class="mt-5 space-y-4" @submit.prevent="updateStatus"><label class="field field-dark"><span>Next status</span><select v-model="statusForm.status"><option v-for="value in nextStatuses" :key="value" :value="value">{{ statusLabel(value) }}</option></select></label><label class="field field-dark"><span>Internal note</span><textarea v-model="statusForm.notes" rows="3"></textarea></label><p v-if="formErrors.status" class="text-sm text-rose-200">{{ formErrors.status[0] }}</p><button class="w-full rounded-xl bg-[#d7ff58] px-4 py-3 font-black text-[#16352a]" :disabled="savingStatus">{{ savingStatus ? 'Updating...' : 'Update status' }}</button></form><p v-else class="mt-4 text-sm text-[#b8d1c5]">This order has reached its final state.</p><p v-if="order.ready_notified_at" class="mt-4 border-t border-[#456456] pt-4 text-xs text-[#b8d1c5]">Pickup email queued {{ dateTime(order.ready_notified_at) }}</p></section>

          <section class="form-section"><div class="flex items-center gap-3"><CurrencyCircleDollarIcon :size="24" /><h2 class="section-title">Payment</h2></div><dl class="mt-5 space-y-3 text-sm"><div class="flex justify-between"><dt>Paid</dt><dd class="font-mono font-bold">{{ money(order.amount_paid) }}</dd></div><div class="flex justify-between text-lg"><dt class="font-black">Balance</dt><dd class="font-mono font-black text-[#376b55] dark:text-[#9ee6c2]">{{ money(order.balance) }}</dd></div></dl><form v-if="order.balance > 0" class="mt-5 space-y-4" @submit.prevent="addPayment"><label class="field"><span>Amount (UGX)</span><input v-model.number="paymentForm.amount" type="number" min="1" :max="order.balance" required /></label><label class="field"><span>Method</span><select v-model="paymentForm.method"><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="card">Card</option><option value="bank">Bank</option></select></label><label class="field"><span>Reference</span><input v-model="paymentForm.reference" placeholder="Optional" /></label><p v-if="formErrors.amount" class="text-sm text-rose-700">{{ formErrors.amount[0] }}</p><button class="button-primary w-full justify-center" :disabled="savingPayment">{{ savingPayment ? 'Recording...' : 'Record payment' }}</button></form><p v-else class="mt-5 rounded-xl bg-emerald-100 p-3 text-sm font-bold text-emerald-800">This order is fully paid.</p></section>
        </aside>
      </section>
    </template>
  </AppShell>
</template>
