<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhCamera as CameraIcon, PhPlus as PlusIcon, PhTrash as TrashIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import { api, validationErrors } from '../services/api'
import { money } from '../lib/format'

const router = useRouter()
const loading = ref(false)
const errors = ref({})
const photos = ref([])
const form = reactive({
  client: { name: '', phone: '', email: '', notes: '' },
  items: [{ shoe_type: 'Sneakers', brand: '', color: '', service: 'Deep clean', condition_notes: '', quantity: 1, unit_price: 30000 }],
  discount: 0, deposit: 0, payment_method: 'cash', due_at: '', notes: '',
})

const subtotal = computed(() => form.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0))
const total = computed(() => Math.max(0, subtotal.value - Number(form.discount || 0)))

function addItem() { form.items.push({ shoe_type: 'Sneakers', brand: '', color: '', service: 'Deep clean', condition_notes: '', quantity: 1, unit_price: 30000 }) }
function removeItem(index) { if (form.items.length > 1) form.items.splice(index, 1) }
function selectPhotos(event) { photos.value = [...event.target.files] }

async function submit() {
  loading.value = true
  errors.value = {}
  const payload = new FormData()
  Object.entries(form.client).forEach(([key, value]) => payload.append(`client[${key}]`, value))
  form.items.forEach((item, index) => Object.entries(item).forEach(([key, value]) => payload.append(`items[${index}][${key}]`, value)))
  for (const key of ['discount', 'deposit', 'payment_method', 'due_at', 'notes']) if (form[key] !== '') payload.append(key, form[key])
  photos.value.forEach((photo) => payload.append('photos[]', photo))

  try {
    const { data } = await api.post('/orders', payload)
    router.push(`/orders/${data.id}`)
  } catch (error) { errors.value = validationErrors(error) } finally { loading.value = false }
}
</script>

<template>
  <AppShell>
    <header><p class="text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">Intake</p><h1 class="mt-1 text-4xl font-black tracking-[-0.045em]">Record a new order</h1><p class="mt-3 max-w-2xl text-stone-600 dark:text-stone-400">Capture customer details, each pair, condition photos, and the amount received.</p></header>
    <form class="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]" @submit.prevent="submit">
      <div class="space-y-6">
        <section class="form-section"><h2 class="section-title">Client details</h2><div class="mt-5 grid gap-4 sm:grid-cols-2"><label class="field"><span>Full name</span><input v-model="form.client.name" required /><small v-if="errors['client.name']">{{ errors['client.name'][0] }}</small></label><label class="field"><span>Phone number</span><input v-model="form.client.phone" type="tel" required placeholder="0772 000 000" /><small v-if="errors['client.phone']">{{ errors['client.phone'][0] }}</small></label><label class="field"><span>Email address</span><input v-model="form.client.email" type="email" placeholder="Optional" /></label><label class="field"><span>Client notes</span><input v-model="form.client.notes" placeholder="Optional preferences" /></label></div></section>

        <section class="form-section"><div class="flex items-center justify-between"><h2 class="section-title">Shoes and services</h2><button class="button-secondary" type="button" @click="addItem"><PlusIcon :size="17" /> Add pair</button></div>
          <div class="mt-5 space-y-5"><fieldset v-for="(item, index) in form.items" :key="index" class="rounded-2xl border border-stone-200 p-4 dark:border-stone-700"><legend class="px-2 text-sm font-black">Pair {{ index + 1 }}</legend><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label class="field"><span>Shoe type</span><input v-model="item.shoe_type" required /></label><label class="field"><span>Brand</span><input v-model="item.brand" placeholder="Optional" /></label><label class="field"><span>Colour</span><input v-model="item.color" /></label><label class="field"><span>Service</span><select v-model="item.service"><option>Standard wash</option><option>Deep clean</option><option>Premium care</option><option>Rewash</option></select></label><label class="field"><span>Quantity</span><input v-model.number="item.quantity" type="number" min="1" max="20" /></label><label class="field"><span>Price per pair (UGX)</span><input v-model.number="item.unit_price" type="number" min="0" step="1000" /></label><label class="field sm:col-span-2 lg:col-span-3"><span>Condition notes</span><textarea v-model="item.condition_notes" rows="2" placeholder="Existing marks, damage, or special care instructions"></textarea></label></div><button v-if="form.items.length > 1" class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-700" type="button" @click="removeItem(index)"><TrashIcon :size="17" /> Remove pair</button></fieldset></div>
        </section>

        <section class="form-section"><h2 class="section-title">Condition photos</h2><label class="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-stone-300 p-5 hover:border-[#376b55] dark:border-stone-700"><span class="grid size-12 place-items-center rounded-xl bg-stone-100 dark:bg-stone-800"><CameraIcon :size="24" /></span><span><strong class="block">Add up to 6 photos</strong><span class="text-sm text-stone-500">JPG, PNG, or WebP. Maximum 6 MB each.</span></span><input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple @change="selectPhotos" /></label><p v-if="photos.length" class="mt-3 text-sm font-bold text-[#376b55] dark:text-[#9ee6c2]">{{ photos.length }} photo<span v-if="photos.length !== 1">s</span> selected</p></section>
      </div>

      <aside class="h-fit rounded-2xl bg-[#16352a] p-6 text-stone-100 xl:sticky xl:top-8"><h2 class="text-xl font-black">Order summary</h2><dl class="mt-6 space-y-4 text-sm"><div class="flex justify-between"><dt class="text-[#b8d1c5]">Subtotal</dt><dd class="font-mono font-bold">{{ money(subtotal) }}</dd></div><div><label class="field field-dark"><span>Discount (UGX)</span><input v-model.number="form.discount" type="number" min="0" :max="subtotal" step="1000" /></label></div><div class="flex justify-between border-t border-[#456456] pt-4 text-lg"><dt class="font-black">Total</dt><dd class="font-mono font-black text-[#d7ff58]">{{ money(total) }}</dd></div><div><label class="field field-dark"><span>Deposit (UGX)</span><input v-model.number="form.deposit" type="number" min="0" :max="total" step="1000" /></label></div><div><label class="field field-dark"><span>Payment method</span><select v-model="form.payment_method"><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="card">Card</option><option value="bank">Bank</option></select></label></div><div><label class="field field-dark"><span>Due date</span><input v-model="form.due_at" type="datetime-local" /></label></div><div><label class="field field-dark"><span>Order notes</span><textarea v-model="form.notes" rows="3"></textarea></label></div></dl><div v-if="Object.keys(errors).length" class="mt-5 rounded-xl bg-rose-100 p-3 text-sm font-semibold text-rose-800">Please review the highlighted order details.</div><button class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#d7ff58] px-4 py-3 font-black text-[#16352a] disabled:opacity-60" type="submit" :disabled="loading">{{ loading ? 'Saving order...' : 'Save order' }}</button></aside>
    </form>
  </AppShell>
</template>
