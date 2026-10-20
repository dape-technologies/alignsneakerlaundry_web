<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft as ArrowIcon, PhCheck as CheckIcon, PhMagnifyingGlass as SearchIcon, PhPlus as PlusIcon, PhSneaker as ShoeIcon, PhTrash as TrashIcon, PhUserPlus as UserPlusIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import AppSelect from '../components/AppSelect.vue'
import FormField from '../components/FormField.vue'
import MediaUploader from '../components/MediaUploader.vue'
import { api, validationErrors } from '../services/api'
import { money } from '../lib/format'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const errors = ref({})
const search = ref('')
const searching = ref(false)
const matches = ref([])
const selectedClient = ref(null)
const creatingClient = ref(false)
const clientForm = reactive({ name: '', phone: '', email: '', notes: '' })
const clientShoe = reactive({ shoe_type: '', brand: '', model: '', color: '', size: '', identifying_notes: '' })
const clientShoePhotos = ref([])
const registrationDraftKey = 'align:new-client-footwear-draft'
const order = reactive({ sessions: [], discount: 0, deposit: 0, payment_method: 'cash', due_at: '', notes: '' })
const serviceOptions = ['Standard wash', 'Deep clean', 'Premium care', 'Re-clean']
const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
]
let timer

watch([clientForm, clientShoe], () => {
  sessionStorage.setItem(registrationDraftKey, JSON.stringify({ client: clientForm, shoe: clientShoe }))
}, { deep: true })

watch(search, () => {
  clearTimeout(timer)
  if (search.value.length < 2) { matches.value = []; return }
  timer = setTimeout(async () => {
    searching.value = true
    try { matches.value = (await api.get('/clients', { params: { search: search.value } })).data.data }
    finally { searching.value = false }
  }, 250)
})

const subtotal = computed(() => order.sessions.reduce((sum, item) => sum + Number(item.unit_price || 0), 0))
const total = computed(() => Math.max(0, subtotal.value - Number(order.discount || 0)))
const firstError = computed(() => Object.values(errors.value).flat()[0] || '')

async function selectClient(client) {
  selectedClient.value = (await api.get(`/clients/${client.id}`)).data
  matches.value = []; search.value = ''; creatingClient.value = false; order.sessions = []
}
async function createClient() {
  if (!navigator.onLine) { errors.value = { connection: ['A connection is required to register a client.'] }; return }
  creatingClient.value = true; errors.value = {}
  const payload = new FormData()
  Object.entries(clientForm).forEach(([key, value]) => payload.append(key, value))
  Object.entries(clientShoe).forEach(([key, value]) => payload.append(`shoe[${key}]`, value))
  if (clientShoePhotos.value[0]) payload.append('reference_photo', clientShoePhotos.value[0])
  try {
    const created = (await api.post('/clients', payload)).data
    sessionStorage.removeItem(registrationDraftKey)
    await selectClient(created)
    if (selectedClient.value.shoes[0]) addExisting(selectedClient.value.shoes[0])
  }
  catch (error) { errors.value = validationErrors(error) }
  finally { creatingClient.value = false }
}
function addExisting(shoe) {
  if (order.sessions.some((session) => session.shoe_id === shoe.id)) return
  order.sessions.push({ shoe_id: shoe.id, shoe, service: 'Deep clean', condition_notes: '', unit_price: 30000, photos: [] })
}
function addNew() {
  order.sessions.push({ shoe_id: null, shoe: { shoe_type: 'Sneakers', brand: '', model: '', color: '', size: '', identifying_notes: '' }, service: 'Deep clean', condition_notes: '', unit_price: 30000, photos: [] })
}
function removeSession(index) { order.sessions.splice(index, 1) }

async function submit() {
  if (!navigator.onLine) { errors.value = { connection: ['A connection is required to save an intake.'] }; return }
  loading.value = true; errors.value = {}
  const payload = new FormData()
  payload.append('client_id', selectedClient.value.id)
  order.sessions.forEach((session, index) => {
    if (session.shoe_id) payload.append(`sessions[${index}][shoe_id]`, session.shoe_id)
    else Object.entries(session.shoe).forEach(([key, value]) => payload.append(`sessions[${index}][shoe][${key}]`, value))
    for (const key of ['service', 'condition_notes', 'unit_price']) payload.append(`sessions[${index}][${key}]`, session[key])
    session.photos.forEach((photo) => payload.append(`sessions[${index}][photos][]`, photo))
  })
  for (const key of ['discount', 'deposit', 'payment_method', 'due_at', 'notes']) if (order[key] !== '') payload.append(key, order[key])
  try { const { data } = await api.post('/orders', payload); router.push({ path: '/dashboard', query: { received: data.id } }) }
  catch (error) { errors.value = validationErrors(error) }
  finally { loading.value = false }
}

onMounted(async () => {
  try {
    const draft = JSON.parse(sessionStorage.getItem(registrationDraftKey))
    if (draft?.client) Object.assign(clientForm, draft.client)
    if (draft?.shoe) Object.assign(clientShoe, draft.shoe)
  } catch {
    sessionStorage.removeItem(registrationDraftKey)
  }
  if (route.query.client) {
    try { await selectClient({ id: route.query.client }) } catch { errors.value = { client_id: ['The selected client could not be loaded.'] } }
  }
})
</script>

<template>
  <AppShell>
    <RouterLink to="/orders" class="text-link"><ArrowIcon :size="17" /> Back to service orders</RouterLink>
    <header class="mt-6"><p class="eyebrow">New intake</p><h1 class="page-title">Receive footwear for care</h1></header>

    <section v-if="!selectedClient" class="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <article class="form-section"><h2 class="section-title">Find an existing client</h2><label class="search-box mt-6"><SearchIcon :size="20" /><input v-model="search" type="search" placeholder="Name, phone, or email" autofocus /></label><p v-if="searching" class="mt-3 text-sm text-muted">Searching…</p><div v-else-if="matches.length" class="mt-4 divide-y divide-line rounded-lg border border-line"><button v-for="client in matches" :key="client.id" type="button" class="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-sky-soft" @click="selectClient(client)"><span><strong class="block text-navy">{{ client.name }}</strong><span class="mt-1 block text-sm text-muted">{{ client.phone }} · {{ client.email }}</span></span><span class="text-xs font-bold text-sky-deep">{{ client.shoes_count }} pairs</span></button></div><p v-else-if="search.length >= 2" class="mt-4 text-sm font-semibold text-muted">No client found.</p></article>
      <article class="form-section"><div class="flex items-center gap-3"><span class="metric-icon"><UserPlusIcon :size="22" /></span><h2 class="section-title">Register client & footwear</h2></div><form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="createClient"><FormField v-model="clientForm.name" label="Full name" required :error="errors.name?.[0]" /><FormField v-model="clientForm.phone" label="Phone number" type="tel" required :error="errors.phone?.[0]" /><FormField v-model="clientForm.email" class="sm:col-span-2" label="Email address" type="email" required :error="errors.email?.[0]" /><FormField v-model="clientForm.notes" class="sm:col-span-2" label="Client notes" multiline rows="2" /><div class="my-1 border-t border-line sm:col-span-2"></div><FormField v-model="clientShoe.shoe_type" label="Footwear type" placeholder="e.g. Sneakers" required :error="errors['shoe.shoe_type']?.[0]" /><FormField v-model="clientShoe.brand" label="Brand" /><FormField v-model="clientShoe.model" label="Model" /><FormField v-model="clientShoe.color" label="Colour" /><FormField v-model="clientShoe.size" label="Size" /><FormField v-model="clientShoe.identifying_notes" label="Identifying notes" /><div class="sm:col-span-2"><p class="mb-2 text-sm font-semibold text-ink">Reference photo</p><MediaUploader v-model="clientShoePhotos" :max-files="1" compact /></div><p v-if="errors.connection || errors.form" class="text-sm font-semibold text-rose-700 sm:col-span-2">{{ (errors.connection || errors.form)[0] }}</p><button class="button-primary sm:col-span-2 sm:justify-self-start" type="submit" :disabled="creatingClient">{{ creatingClient ? 'Registering…' : 'Register client & footwear' }}</button></form></article>
    </section>

    <form v-else class="mt-8 grid gap-6 xl:grid-cols-[1fr_350px]" @submit.prevent="submit">
      <div class="space-y-6">
        <section class="form-section"><div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="text-xs font-bold text-sky-deep">SELECTED CLIENT</p><h2 class="mt-1 text-2xl font-bold text-navy">{{ selectedClient.name }}</h2><p class="mt-1 text-sm text-muted">{{ selectedClient.phone }} · {{ selectedClient.email }}</p></div><button class="button-secondary" type="button" @click="selectedClient = null">Change client</button></div></section>

        <section class="form-section"><div class="flex items-center justify-between gap-4"><h2 class="section-title">Registered footwear</h2><button class="button-secondary" type="button" @click="addNew"><PlusIcon :size="17" /> New pair</button></div><div v-if="selectedClient.shoes.length" class="mt-5 grid gap-3 sm:grid-cols-2"><button v-for="shoe in selectedClient.shoes" :key="shoe.id" type="button" class="flex items-start gap-3 rounded-lg border p-4 text-left hover:border-sky hover:bg-sky-soft" :class="order.sessions.some((entry) => entry.shoe_id === shoe.id) ? 'border-sky bg-sky-soft' : 'border-line'" @click="addExisting(shoe)"><span class="grid size-11 shrink-0 place-items-center rounded-lg bg-canvas text-sky-deep"><ShoeIcon :size="24" /></span><span><strong class="block text-navy">{{ shoe.display_name }}</strong><span class="mt-1 block text-xs font-semibold text-muted">{{ shoe.reference }}<template v-if="shoe.size"> · Size {{ shoe.size }}</template></span><span v-if="order.sessions.some((entry) => entry.shoe_id === shoe.id)" class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-deep"><CheckIcon :size="14" /> Added</span></span></button></div><p v-else class="mt-5 text-sm font-semibold text-muted">No registered footwear.</p></section>

        <section class="form-section"><h2 class="section-title">Today’s care sessions</h2><div v-if="order.sessions.length" class="mt-5 space-y-5"><fieldset v-for="(session, index) in order.sessions" :key="`${session.shoe_id || 'new'}-${index}`" class="rounded-xl border border-line bg-canvas/50 p-4"><legend class="px-2 text-sm font-bold text-navy">Pair {{ index + 1 }} · {{ session.shoe_id ? session.shoe.display_name : 'New footwear' }}</legend><div v-if="!session.shoe_id" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label class="field"><span>Footwear type</span><input v-model="session.shoe.shoe_type" required /></label><label class="field"><span>Brand</span><input v-model="session.shoe.brand" /></label><label class="field"><span>Model</span><input v-model="session.shoe.model" /></label><label class="field"><span>Colour</span><input v-model="session.shoe.color" /></label><label class="field"><span>Size</span><input v-model="session.shoe.size" /></label><label class="field sm:col-span-2 lg:col-span-3"><span>Identifying notes</span><input v-model="session.shoe.identifying_notes" /></label></div><div class="mt-4 grid gap-4 sm:grid-cols-2"><label class="field"><span>Care service</span><AppSelect v-model="session.service" :options="serviceOptions" aria-label="Care service" /></label><label class="field"><span>Price (UGX)</span><input v-model.number="session.unit_price" type="number" min="0" step="1000" required /></label><label class="field sm:col-span-2"><span>Condition at intake</span><textarea v-model="session.condition_notes" rows="2"></textarea></label><div class="sm:col-span-2"><p class="mb-2 text-sm font-semibold text-ink">Condition photos</p><MediaUploader v-model="session.photos" :max-files="6" /></div></div><div class="mt-3 flex items-center justify-between"><span class="text-xs font-semibold text-muted">{{ session.photos.length }} selected</span><button class="inline-flex items-center gap-1 text-sm font-bold text-rose-700" type="button" @click="removeSession(index)"><TrashIcon :size="16" /> Remove</button></div></fieldset></div><div v-else class="mt-5 rounded-lg border border-dashed border-[#b9d4e3] p-8 text-center"><ShoeIcon :size="30" class="mx-auto text-sky-deep" /><p class="mt-3 font-bold text-navy">No footwear selected</p></div></section>
      </div>

      <aside class="h-fit rounded-xl bg-navy p-6 text-white shadow-[0_20px_50px_rgba(16,47,76,0.16)] xl:sticky xl:top-8"><p class="text-xs font-bold tracking-[0.12em] text-[#89d1f2]">SERVICE ORDER</p><h2 class="mt-2 text-xl font-bold">Intake summary</h2><dl class="mt-6 space-y-4 text-sm"><div class="flex justify-between"><dt class="text-[#afc8d8]">Pairs received</dt><dd class="font-bold">{{ order.sessions.length }}</dd></div><div class="flex justify-between"><dt class="text-[#afc8d8]">Subtotal</dt><dd class="font-bold">{{ money(subtotal) }}</dd></div><label class="field field-dark"><span>Discount (UGX)</span><input v-model.number="order.discount" type="number" min="0" :max="subtotal" step="1000" /></label><div class="flex justify-between border-t border-[#31536d] pt-4 text-lg"><dt class="font-bold">Total</dt><dd class="font-bold text-[#8bd6f7]">{{ money(total) }}</dd></div><label class="field field-dark"><span>Deposit (UGX)</span><input v-model.number="order.deposit" type="number" min="0" :max="total" step="1000" /></label><label class="field field-dark"><span>Payment method</span><AppSelect v-model="order.payment_method" :options="paymentMethodOptions" aria-label="Payment method" /></label><label class="field field-dark"><span>Expected completion</span><input v-model="order.due_at" type="datetime-local" /></label><label class="field field-dark"><span>Internal order notes</span><textarea v-model="order.notes" rows="3"></textarea></label></dl><div v-if="firstError" class="mt-5 rounded-lg bg-rose-100 p-3 text-sm font-semibold text-rose-800">{{ firstError }}</div><button class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky px-4 py-3 font-bold text-navy hover:bg-[#70c7ec] disabled:opacity-50" type="submit" :disabled="loading || !order.sessions.length">{{ loading ? 'Saving intake…' : 'Create service order' }}</button></aside>
    </form>
  </AppShell>
</template>
