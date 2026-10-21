<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft as ArrowIcon, PhCheck as CheckIcon, PhMagnifyingGlass as SearchIcon, PhPlus as PlusIcon, PhSneaker as ShoeIcon, PhUserPlus as UserPlusIcon } from '@phosphor-icons/vue'
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
const availableTags = ref([])
const clientForm = reactive({ name: '', phone: '', email: '', notes: '' })
const clientShoe = reactive({ shoe_type: '', brand: '', model: '', color: '', size: '' })
const clientIntake = reactive({ tag_id: '', service: 'Deep clean', unit_price: 30000 })
const clientShoePhotos = ref([])
const registrationDraftKey = 'align:new-client-footwear-draft'
const order = reactive({ sessions: [], discount: 0, deposit: 0, payment_method: 'cash', due_at: '' })
const serviceOptions = ['Standard wash', 'Deep clean', 'Premium care', 'Re-clean']
const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
]
let timer

watch([clientForm, clientShoe, clientIntake], () => {
  sessionStorage.setItem(registrationDraftKey, JSON.stringify({ client: clientForm, shoe: clientShoe, intake: clientIntake }))
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

const selectedSession = computed(() => order.sessions[0] || null)
const subtotal = computed(() => Number(selectedSession.value?.unit_price || 0))
const total = computed(() => Math.max(0, subtotal.value - Number(order.discount || 0)))
const firstError = computed(() => Object.values(errors.value).flat()[0] || '')
const tagOptions = computed(() => availableTags.value.map((tag) => ({ value: tag.id, label: tag.label })))

function makeExistingSession(shoe) {
  return { shoe_id: shoe.id, shoe, tag_id: '', service: 'Deep clean', unit_price: 30000, photos: [] }
}

function makeNewSession() {
  return {
    shoe_id: null,
    shoe: { shoe_type: 'Sneakers', brand: '', model: '', color: '', size: '' },
    tag_id: '', service: 'Deep clean', unit_price: 30000, photos: [],
  }
}

function isInbound(shoe) {
  return selectedClient.value?.active_sessions?.some((session) => session.shoe_id === shoe.id)
}

async function loadTags() {
  availableTags.value = (await api.get('/tags/available')).data.data
}

async function selectClient(client) {
  selectedClient.value = (await api.get(`/clients/${client.id}`)).data
  matches.value = []
  search.value = ''
  creatingClient.value = false
  order.sessions = []
}

async function createClient() {
  if (!clientIntake.tag_id) { errors.value = { tags: ['Select a physical tag before continuing.'] }; return }
  if (!navigator.onLine) { errors.value = { connection: ['A connection is required to register a client.'] }; return }
  creatingClient.value = true
  errors.value = {}
  const payload = new FormData()
  Object.entries(clientForm).forEach(([key, value]) => payload.append(key, value))
  Object.entries(clientShoe).forEach(([key, value]) => payload.append(`shoe[${key}]`, value))
  if (clientShoePhotos.value[0]) payload.append('reference_photo', clientShoePhotos.value[0])
  try {
    const created = (await api.post('/clients', payload)).data
    sessionStorage.removeItem(registrationDraftKey)
    await selectClient(created)
    if (selectedClient.value.shoes[0]) {
      const session = makeExistingSession(selectedClient.value.shoes[0])
      Object.assign(session, clientIntake)
      order.sessions = [session]
    }
  } catch (error) {
    errors.value = validationErrors(error)
  } finally {
    creatingClient.value = false
  }
}

function toggleExisting(shoe) {
  if (isInbound(shoe)) return
  if (selectedSession.value?.shoe_id === shoe.id) {
    order.sessions = []
    return
  }
  order.sessions = [makeExistingSession(shoe)]
}

function selectNew() {
  order.sessions = selectedSession.value && !selectedSession.value.shoe_id ? [] : [makeNewSession()]
}

async function submit() {
  if (!navigator.onLine) { errors.value = { connection: ['A connection is required to save an intake.'] }; return }
  if (!selectedSession.value) return
  loading.value = true
  errors.value = {}
  const payload = new FormData()
  payload.append('client_id', selectedClient.value.id)
  const session = selectedSession.value
  if (session.shoe_id) payload.append('sessions[0][shoe_id]', session.shoe_id)
  else Object.entries(session.shoe).forEach(([key, value]) => payload.append(`sessions[0][shoe][${key}]`, value))
  for (const key of ['tag_id', 'service', 'unit_price']) payload.append(`sessions[0][${key}]`, session[key])
  session.photos.forEach((photo) => payload.append('sessions[0][photos][]', photo))
  for (const key of ['discount', 'deposit', 'payment_method', 'due_at']) if (order[key] !== '') payload.append(key, order[key])
  try {
    const { data } = await api.post('/orders', payload)
    router.push(`/orders/${data.id}/receipt`)
  } catch (error) {
    errors.value = validationErrors(error)
    await loadTags()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const draft = JSON.parse(sessionStorage.getItem(registrationDraftKey))
    if (draft?.client) Object.assign(clientForm, draft.client)
    if (draft?.shoe) Object.assign(clientShoe, draft.shoe)
    if (draft?.intake) Object.assign(clientIntake, draft.intake)
  } catch {
    sessionStorage.removeItem(registrationDraftKey)
  }
  try { await loadTags() } catch { errors.value = { tags: ['Available tags could not be loaded.'] } }
  if (route.query.client) {
    try { await selectClient({ id: route.query.client }) }
    catch { errors.value = { client_id: ['The selected client could not be loaded.'] } }
  }
})
</script>

<template>
  <AppShell>
    <RouterLink to="/orders" class="text-link"><ArrowIcon :size="17" /> Back to service orders</RouterLink>
    <header class="mt-6"><p class="eyebrow">New intake</p><h1 class="page-title">Receive one pair for care</h1></header>

    <section v-if="!selectedClient" class="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <article class="form-section"><h2 class="section-title">Find an existing client</h2><FormField v-model="search" class="mt-6" label="Client name, phone, or email" type="search" placeholder="Start typing to search" autofocus><template #leading><SearchIcon :size="19" /></template></FormField><p v-if="searching" class="mt-3 text-sm text-muted">Searching…</p><div v-else-if="matches.length" class="mt-4 divide-y divide-line rounded-lg border border-line"><button v-for="client in matches" :key="client.id" type="button" class="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-sky-soft" @click="selectClient(client)"><span><strong class="block text-navy">{{ client.name }}</strong><span class="mt-1 block text-sm text-muted">{{ client.phone }} · {{ client.email }}</span></span><span class="text-xs font-bold text-sky-deep">{{ client.shoes_count }} pairs</span></button></div><p v-else-if="search.length >= 2" class="mt-4 text-sm font-semibold text-muted">No client found.</p></article>
      <article class="form-section">
        <div class="flex items-center gap-3"><span class="metric-icon"><UserPlusIcon :size="22" /></span><h2 class="section-title">Register client & footwear</h2></div>
        <form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="createClient">
          <FormField v-model="clientForm.name" label="Full name" required :error="errors.name?.[0]" />
          <FormField v-model="clientForm.phone" label="Phone number" type="tel" required :error="errors.phone?.[0]" />
          <FormField v-model="clientForm.email" class="sm:col-span-2" label="Email address" type="email" required :error="errors.email?.[0]" />
          <FormField v-model="clientForm.notes" class="sm:col-span-2" label="Client notes" multiline rows="2" />
          <div class="my-1 border-t border-line sm:col-span-2"></div>
          <FormField v-model="clientShoe.shoe_type" label="Footwear type" placeholder="e.g. Sneakers" required :error="errors['shoe.shoe_type']?.[0]" />
          <FormField v-model="clientShoe.brand" label="Brand" />
          <FormField v-model="clientShoe.model" label="Model" />
          <FormField v-model="clientShoe.color" label="Colour" />
          <FormField v-model="clientShoe.size" label="Size" />
          <div class="sm:col-span-2"><p class="mb-2 text-sm font-semibold text-ink">Reference photo</p><MediaUploader v-model="clientShoePhotos" :max-files="1" compact /></div>
          <div class="my-1 border-t border-line sm:col-span-2"></div>
          <div class="sm:col-span-2"><p class="eyebrow">Intake details</p><p class="mt-1 text-sm text-muted">Assign the physical tag before registering this pair.</p></div>
          <label class="field"><span>Physical tag<span class="required-mark" aria-hidden="true">*</span></span><AppSelect v-model="clientIntake.tag_id" :options="tagOptions" :disabled="!tagOptions.length" aria-label="New client physical tag" /></label>
          <label class="field"><span>Care service<span class="required-mark" aria-hidden="true">*</span></span><AppSelect v-model="clientIntake.service" :options="serviceOptions" aria-label="New client care service" /></label>
          <label class="field"><span>Price (UGX)<span class="required-mark" aria-hidden="true">*</span></span><input v-model.number="clientIntake.unit_price" type="number" min="0" step="1000" required /></label>
          <p v-if="errors.tags" class="text-sm font-semibold text-rose-700 sm:col-span-2">{{ errors.tags[0] }}</p>
          <p v-if="errors.connection || errors.form" class="text-sm font-semibold text-rose-700 sm:col-span-2">{{ (errors.connection || errors.form)[0] }}</p>
          <button class="button-primary sm:col-span-2 sm:justify-self-start" type="submit" :disabled="creatingClient || !clientIntake.tag_id">{{ creatingClient ? 'Registering…' : 'Register client & continue' }}</button>
        </form>
      </article>
    </section>

    <form v-else class="mt-8 grid gap-6 xl:grid-cols-[1fr_350px]" @submit.prevent="submit">
      <div class="space-y-6">
        <section class="form-section"><div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="text-xs font-bold text-sky-deep">SELECTED CLIENT</p><h2 class="mt-1 text-2xl font-bold text-navy">{{ selectedClient.name }}</h2><p class="mt-1 text-sm text-muted">{{ selectedClient.phone }} · {{ selectedClient.email }}</p></div><button class="button-secondary" type="button" @click="selectedClient = null; order.sessions = []">Change client</button></div></section>

        <section class="form-section">
          <div class="flex items-center justify-between gap-4"><div><h2 class="section-title">Registered footwear</h2><p class="mt-1 text-sm text-muted">Choose one pair. Click it again to uncheck it.</p></div><button class="button-secondary" type="button" :class="{ 'border-sky bg-sky-soft': selectedSession && !selectedSession.shoe_id }" @click="selectNew"><PlusIcon :size="17" /> New pair</button></div>
          <div v-if="selectedClient.shoes.length" class="mt-5 grid gap-3 sm:grid-cols-2"><button v-for="shoe in selectedClient.shoes" :key="shoe.id" type="button" class="flex items-start gap-3 rounded-lg border p-4 text-left" :class="[selectedSession?.shoe_id === shoe.id ? 'border-sky bg-sky-soft' : 'border-line', isInbound(shoe) ? 'cursor-not-allowed opacity-55' : 'hover:border-sky hover:bg-sky-soft']" :disabled="isInbound(shoe)" :aria-pressed="selectedSession?.shoe_id === shoe.id" @click="toggleExisting(shoe)"><span class="grid size-11 shrink-0 place-items-center rounded-lg bg-canvas text-sky-deep"><ShoeIcon :size="24" /></span><span><strong class="block text-navy">{{ shoe.display_name }}</strong><span class="mt-1 block text-xs font-semibold text-muted">{{ shoe.reference }}<template v-if="shoe.size"> · Size {{ shoe.size }}</template></span><span v-if="selectedSession?.shoe_id === shoe.id" class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-deep"><CheckIcon :size="14" /> Selected</span><span v-else-if="isInbound(shoe)" class="mt-2 block text-xs font-bold text-rose-700">Already in care</span></span></button></div>
        </section>

        <section v-if="selectedSession" class="form-section">
          <div class="flex items-center justify-between"><div><p class="eyebrow">One-pair intake</p><h2 class="section-title mt-1">{{ selectedSession.shoe_id ? selectedSession.shoe.display_name : 'New footwear' }}</h2></div><button class="button-tertiary" type="button" @click="order.sessions = []">Uncheck</button></div>
          <div v-if="!selectedSession.shoe_id" class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label class="field"><span>Footwear type<span class="required-mark" aria-hidden="true">*</span></span><input v-model="selectedSession.shoe.shoe_type" required /></label><label class="field"><span>Brand</span><input v-model="selectedSession.shoe.brand" /></label><label class="field"><span>Model</span><input v-model="selectedSession.shoe.model" /></label><label class="field"><span>Colour</span><input v-model="selectedSession.shoe.color" /></label><label class="field"><span>Size</span><input v-model="selectedSession.shoe.size" /></label></div>
          <div class="mt-5 grid gap-4 sm:grid-cols-2"><label class="field"><span>Physical tag<span class="required-mark" aria-hidden="true">*</span></span><AppSelect v-model="selectedSession.tag_id" :options="tagOptions" :disabled="!tagOptions.length" aria-label="Physical tag" /></label><label class="field"><span>Care service<span class="required-mark" aria-hidden="true">*</span></span><AppSelect v-model="selectedSession.service" :options="serviceOptions" aria-label="Care service" /></label><label class="field"><span>Price (UGX)<span class="required-mark" aria-hidden="true">*</span></span><input v-model.number="selectedSession.unit_price" type="number" min="0" step="1000" required /></label><div class="sm:col-span-2"><p class="mb-2 text-sm font-semibold text-ink">Intake photos</p><MediaUploader v-model="selectedSession.photos" :max-files="6" /></div></div>
        </section>
        <div v-else class="rounded-xl border border-dashed border-[#b9d4e3] p-8 text-center"><ShoeIcon :size="30" class="mx-auto text-sky-deep" /><p class="mt-3 font-bold text-navy">Select one registered pair or add a new pair</p></div>
      </div>

      <aside class="h-fit rounded-xl bg-navy p-6 text-white shadow-[0_20px_50px_rgba(16,47,76,0.16)] xl:sticky xl:top-8"><p class="text-xs font-bold tracking-[0.12em] text-[#89d1f2]">SERVICE ORDER</p><h2 class="mt-2 text-xl font-bold">Intake summary</h2><dl class="mt-6 space-y-4 text-sm"><div class="flex justify-between"><dt class="text-[#afc8d8]">Pairs received</dt><dd class="font-bold">{{ selectedSession ? 1 : 0 }}</dd></div><div class="flex justify-between"><dt class="text-[#afc8d8]">Subtotal</dt><dd class="font-bold">{{ money(subtotal) }}</dd></div><label class="field field-dark"><span>Discount (UGX)</span><input v-model.number="order.discount" type="number" min="0" :max="subtotal" step="1000" /></label><div class="flex justify-between border-t border-[#31536d] pt-4 text-lg"><dt class="font-bold">Total</dt><dd class="font-bold text-[#8bd6f7]">{{ money(total) }}</dd></div><label class="field field-dark"><span>Deposit (UGX)</span><input v-model.number="order.deposit" type="number" min="0" :max="total" step="1000" /></label><label class="field field-dark"><span>Payment method</span><AppSelect v-model="order.payment_method" :options="paymentMethodOptions" aria-label="Payment method" /></label><label class="field field-dark"><span>Expected completion</span><input v-model="order.due_at" type="datetime-local" /></label></dl><div v-if="firstError" class="mt-5 rounded-lg bg-rose-100 p-3 text-sm font-semibold text-rose-800">{{ firstError }}</div><button class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky px-4 py-3 font-bold text-navy hover:bg-[#70c7ec] disabled:opacity-50" type="submit" :disabled="loading || !selectedSession || !selectedSession.tag_id">{{ loading ? 'Saving intake…' : 'Create order & receipt' }}</button></aside>
    </form>
  </AppShell>
</template>
