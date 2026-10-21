<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft as ArrowIcon, PhBellRinging as BellIcon, PhCurrencyCircleDollar as MoneyIcon, PhEnvelope as EnvelopeIcon, PhPrinter as PrinterIcon, PhSneaker as ShoeIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import AppSelect from '../components/AppSelect.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api, validationErrors } from '../services/api'
import { dateTime, money, statusLabel } from '../lib/format'

const route = useRoute()
const order = ref(null)
const error = ref('')
const busySession = ref(null)
const resending = ref(null)
const savingPayment = ref(false)
const formErrors = ref({})
const sessionForms = reactive({})
const paymentForm = reactive({ amount: '', method: 'cash', reference: '' })
const transitions = {
  received: ['cleaning'],
  cleaning: ['received', 'ready_for_collection'],
  ready_for_collection: ['cleaning', 'collected'],
  collected: [],
  cancelled: [],
}
const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
]

const transitionOptions = (status) => (transitions[status] || [])
  .filter((value) => value !== 'collected' || order.value?.balance === 0)
  .map((value) => ({ value, label: statusLabel(value) }))

function initialiseForms() {
  for (const session of order.value.cleaning_sessions) {
    sessionForms[session.id] = { status: transitionOptions(session.status)[0]?.value || '', notes: '' }
  }
}

async function loadOrder() {
  try {
    order.value = (await api.get(`/orders/${route.params.id}`)).data
    initialiseForms()
  } catch {
    error.value = 'This service order could not be loaded.'
  }
}

async function updateStatus(session) {
  if (!navigator.onLine) { formErrors.value = { status: ['A connection is required to update care progress.'] }; return }
  busySession.value = session.id
  formErrors.value = {}
  try {
    await api.patch(`/cleaning-sessions/${session.id}/status`, { ...sessionForms[session.id], expected_status: session.status })
    await loadOrder()
  } catch (requestError) {
    formErrors.value = validationErrors(requestError)
  } finally {
    busySession.value = null
  }
}

async function resend(session) {
  if (!navigator.onLine) return
  resending.value = session.id
  try { await api.post(`/cleaning-sessions/${session.id}/notifications`); await loadOrder() }
  finally { resending.value = null }
}

async function addPayment() {
  if (!navigator.onLine) { formErrors.value = { amount: ['A connection is required to record a payment.'] }; return }
  savingPayment.value = true
  formErrors.value = {}
  try {
    await api.post(`/orders/${order.value.id}/payments`, paymentForm)
    paymentForm.amount = ''
    paymentForm.reference = ''
    await loadOrder()
  } catch (requestError) {
    formErrors.value = validationErrors(requestError)
  } finally {
    savingPayment.value = false
  }
}

function latestDelivery(session) { return session.notifications?.[0] }
function cancellationRecord(session) { return session.status_history?.find((entry) => entry.to_status === 'cancelled') }
onMounted(loadOrder)
</script>

<template>
  <AppShell>
    <RouterLink to="/orders" class="text-link"><ArrowIcon :size="17" /> Back to service orders</RouterLink>
    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="!order" class="mt-6 space-y-4"><div class="skeleton h-28"></div><div class="skeleton h-96"></div></div>
    <template v-else>
      <header class="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div class="flex flex-wrap items-center gap-3"><h1 class="page-title mt-0">{{ order.reference }}</h1><StatusBadge :status="order.status" /></div><p class="mt-2 text-muted">Received {{ dateTime(order.received_at) }} by {{ order.creator.name }}</p></div>
        <div class="flex items-end gap-4 sm:text-right"><RouterLink :to="`/orders/${order.id}/receipt`" class="button-secondary"><PrinterIcon :size="17" /> Print receipt</RouterLink><div><p class="text-sm text-muted">Order total</p><strong class="text-2xl font-bold text-navy">{{ money(order.total) }}</strong></div></div>
      </header>

      <section class="mt-8 grid gap-7 xl:grid-cols-[1fr_360px]">
        <div class="space-y-6">
          <article class="form-section"><div class="flex flex-col justify-between gap-3 sm:flex-row"><div><p class="text-sm text-muted">Client</p><RouterLink :to="`/clients/${order.client.id}`" class="mt-1 block text-2xl font-bold text-navy hover:text-sky-deep">{{ order.client_name }}</RouterLink></div><div class="sm:text-right"><a class="block font-bold text-sky-deep" :href="`tel:${order.notification_phone}`">{{ order.notification_phone }}</a><a class="mt-1 block text-sm text-muted" :href="`mailto:${order.notification_email}`">{{ order.notification_email }}</a></div></div></article>

          <section>
            <div class="flex items-center gap-3"><span class="metric-icon"><ShoeIcon :size="23" /></span><div><h2 class="section-title">Footwear care</h2><p class="text-sm text-muted">Progress and intake identification for this pair.</p></div></div>
            <div class="mt-5 space-y-5">
              <article v-for="session in order.cleaning_sessions" :key="session.id" class="overflow-hidden rounded-xl border border-line bg-white shadow-[0_10px_32px_rgba(29,79,111,0.04)]">
                <div class="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start">
                  <div class="flex gap-4"><img v-if="session.shoe.reference_photo_url" :src="session.shoe.reference_photo_url" :alt="session.shoe.display_name" class="size-20 rounded-lg object-cover" /><span v-else class="grid size-20 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="30" /></span><div><div class="flex flex-wrap items-center gap-2"><h3 class="text-lg font-bold text-navy">{{ session.shoe.display_name }}</h3><StatusBadge :status="session.status" /></div><p class="mt-1 text-xs font-bold text-sky-deep">{{ session.shoe.reference }}<template v-if="session.tag"> · {{ session.tag.label }}</template></p><p class="mt-3 text-sm font-semibold text-muted">{{ session.service }} · {{ money(session.unit_price) }}</p><p v-if="session.status === 'cancelled'" class="mt-3 text-sm text-rose-700">{{ cancellationRecord(session)?.notes }} · {{ cancellationRecord(session)?.changer?.name }}</p></div></div>
                  <form v-if="transitionOptions(session.status).length" class="grid gap-3 md:w-72" @submit.prevent="updateStatus(session)"><label class="field"><span>Next care stage<span class="required-mark" aria-hidden="true">*</span></span><AppSelect v-model="sessionForms[session.id].status" :options="transitionOptions(session.status)" aria-label="Next care stage" /></label><label class="field"><span>Progress note</span><input v-model="sessionForms[session.id].notes" placeholder="Optional" /></label><button class="button-primary justify-center" :disabled="busySession === session.id">{{ busySession === session.id ? 'Updating…' : 'Update progress' }}</button></form>
                  <div v-else class="rounded-lg bg-canvas px-4 py-3 text-sm font-semibold text-muted">{{ session.status === 'ready_for_collection' && order.balance > 0 ? `Pay ${money(order.balance)} before collection.` : 'This care session is closed.' }}</div>
                </div>
                <div v-if="session.photos.length" class="border-t border-line px-5 py-4"><div class="flex gap-2 overflow-x-auto"><img v-for="photo in session.photos" :key="photo.id" :src="photo.url" alt="Footwear at intake" class="size-20 shrink-0 rounded-lg object-cover" /></div></div>
                <div v-if="['ready_for_collection','collected'].includes(session.status)" class="flex flex-col justify-between gap-3 border-t border-line bg-sky-soft/60 px-5 py-4 sm:flex-row sm:items-center"><div class="flex items-center gap-3"><EnvelopeIcon :size="20" class="text-sky-deep" /><div><p class="text-sm font-bold text-navy">Pickup email {{ latestDelivery(session)?.status || 'not recorded' }}</p><p class="text-xs text-muted">{{ latestDelivery(session)?.destination || order.notification_email }}<template v-if="latestDelivery(session)?.sent_at"> · {{ dateTime(latestDelivery(session).sent_at) }}</template></p><p v-if="latestDelivery(session)?.failure_reason" class="mt-1 text-xs font-semibold text-rose-700">{{ latestDelivery(session).failure_reason }}</p></div></div><button class="button-secondary justify-center" type="button" :disabled="resending === session.id" @click="resend(session)"><BellIcon :size="17" /> {{ resending === session.id ? 'Queueing…' : 'Resend email' }}</button></div>
              </article>
            </div>
            <p v-if="formErrors.status" class="alert-error mt-4">{{ formErrors.status[0] }}</p>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="rounded-xl bg-navy p-6 text-white shadow-[0_18px_45px_rgba(16,47,76,0.14)]"><div class="flex items-center gap-3"><MoneyIcon :size="24" class="text-[#87d4f5]" /><h2 class="text-xl font-bold">Payment summary</h2></div><dl class="mt-6 space-y-3 text-sm"><div class="flex justify-between text-[#b4cbd9]"><dt>Order total</dt><dd class="font-bold text-white">{{ money(order.total) }}</dd></div><div class="flex justify-between text-[#b4cbd9]"><dt>Paid</dt><dd class="font-bold text-white">{{ money(order.amount_paid) }}</dd></div><div class="flex justify-between border-t border-[#31536d] pt-4 text-lg"><dt class="font-bold">Balance</dt><dd class="font-bold text-[#87d4f5]">{{ money(order.balance) }}</dd></div></dl><p v-if="order.status === 'cancelled'" class="mt-4 text-xs text-[#f7c7cf]">Recorded payments are retained for audit but excluded from company income.</p></section>
          <section v-if="order.balance > 0 && order.status !== 'cancelled'" class="form-section"><h2 class="section-title">Record payment</h2><form class="mt-5 space-y-4" @submit.prevent="addPayment"><label class="field"><span>Amount (UGX)<span class="required-mark" aria-hidden="true">*</span></span><input v-model.number="paymentForm.amount" type="number" min="1" :max="order.balance" required /></label><label class="field"><span>Method<span class="required-mark" aria-hidden="true">*</span></span><AppSelect v-model="paymentForm.method" :options="paymentMethodOptions" aria-label="Payment method" /></label><label class="field"><span>Reference</span><input v-model="paymentForm.reference" placeholder="Optional" /></label><p v-if="formErrors.amount" class="text-sm font-semibold text-rose-700">{{ formErrors.amount[0] }}</p><button class="button-primary w-full justify-center" :disabled="savingPayment">{{ savingPayment ? 'Recording…' : 'Record payment' }}</button></form></section>
          <section v-else-if="order.balance === 0" class="rounded-xl border border-[#c7e7f7] bg-sky-soft p-5"><p class="font-bold text-navy">Payment complete</p><p class="mt-1 text-sm text-muted">This service order has no outstanding balance.</p></section>
          <section v-if="order.payments.length" class="form-section"><h2 class="section-title">Payment history</h2><ol class="mt-4 divide-y divide-line"><li v-for="payment in order.payments" :key="payment.id" class="py-3 first:pt-0 last:pb-0"><div class="flex justify-between gap-3"><strong class="text-navy">{{ money(payment.amount) }}</strong><span class="text-xs font-bold capitalize text-sky-deep">{{ payment.method.replaceAll('_', ' ') }}</span></div><p class="mt-1 text-xs text-muted">{{ dateTime(payment.paid_at) }} · {{ payment.recorder?.name }}<template v-if="payment.reference"> · {{ payment.reference }}</template></p></li></ol></section>
        </aside>
      </section>
    </template>
  </AppShell>
</template>
