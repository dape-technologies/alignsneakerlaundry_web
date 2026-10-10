<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft as ArrowIcon, PhClockCounterClockwise as HistoryIcon, PhSneaker as ShoeIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import MediaUploader from '../components/MediaUploader.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const route = useRoute()
const client = ref(null)
const error = ref('')
const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive({ name: '', phone: '', email: '', notes: '' })
const editingShoe = ref(null)
const shoePhotos = ref([])
const shoeForm = reactive({ shoe_type: '', brand: '', model: '', color: '', size: '', identifying_notes: '' })
async function loadClient(page = 1) {
  try { client.value = (await api.get(`/clients/${route.params.id}`, { params: { page } })).data; Object.assign(form, { name: client.value.name, phone: client.value.phone, email: client.value.email || '', notes: client.value.notes || '' }) }
  catch { error.value = 'This client record could not be loaded.' }
}
onMounted(loadClient)
async function saveClient() {
  if (!navigator.onLine) { formError.value = 'A connection is required to update this client.'; return }
  saving.value = true; formError.value = ''
  try { const { data } = await api.patch(`/clients/${client.value.id}`, form); Object.assign(client.value, data); editing.value = false }
  catch (requestError) { formError.value = requestError.response?.data?.message || 'Client details could not be updated.' }
  finally { saving.value = false }
}
function startShoeEdit(shoe) {
  editingShoe.value = shoe
  shoePhotos.value = []
  Object.assign(shoeForm, { shoe_type: shoe.shoe_type, brand: shoe.brand || '', model: shoe.model || '', color: shoe.color || '', size: shoe.size || '', identifying_notes: shoe.identifying_notes || '' })
}
async function saveShoe() {
  if (!navigator.onLine) { formError.value = 'A connection is required to update footwear.'; return }
  saving.value = true; formError.value = ''
  const payload = new FormData()
  Object.entries(shoeForm).forEach(([key, value]) => payload.append(key, value))
  if (shoePhotos.value[0]) payload.append('reference_photo', shoePhotos.value[0])
  payload.append('_method', 'PATCH')
  try {
    const { data } = await api.post(`/shoes/${editingShoe.value.id}`, payload)
    Object.assign(client.value.shoes.find((shoe) => shoe.id === data.id), data)
    editingShoe.value = null; shoePhotos.value = []
  } catch (requestError) { formError.value = requestError.response?.data?.message || 'Footwear details could not be updated.' }
  finally { saving.value = false }
}
</script>

<template>
  <AppShell>
    <RouterLink to="/clients" class="text-link"><ArrowIcon :size="17" /> Back to clients</RouterLink>
    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="!client" class="mt-6 space-y-4"><div class="skeleton h-40"></div><div class="skeleton h-80"></div></div>
    <template v-else>
      <header class="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p class="eyebrow">Client profile</p><h1 class="page-title">{{ client.name }}</h1><div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted"><a :href="`tel:${client.phone}`" class="font-semibold text-sky-deep">{{ client.phone }}</a><a :href="`mailto:${client.email}`">{{ client.email }}</a><span>{{ client.active_sessions.length }} active care session<span v-if="client.active_sessions.length !== 1">s</span></span></div></div>
        <div class="flex flex-wrap gap-2"><button class="button-secondary" type="button" @click="editing = !editing">{{ editing ? 'Cancel editing' : 'Edit client' }}</button><RouterLink :to="{ path: '/orders/new', query: { client: client.id } }" class="button-primary">Start return intake</RouterLink></div>
      </header>
      <form v-if="editing" class="form-section mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="saveClient"><label class="field"><span>Full name</span><input v-model="form.name" required /></label><label class="field"><span>Phone</span><input v-model="form.phone" type="tel" required /></label><label class="field"><span>Email</span><input v-model="form.email" type="email" required /></label><label class="field"><span>Client notes</span><input v-model="form.notes" /></label><p v-if="formError" class="text-sm font-semibold text-rose-700 sm:col-span-2 lg:col-span-3">{{ formError }}</p><button class="button-primary justify-center lg:justify-self-end" :disabled="saving">{{ saving ? 'Saving…' : 'Save client' }}</button></form>
      <section class="mt-8 grid gap-8 xl:grid-cols-[1fr_0.9fr]">
        <div>
          <div class="flex items-center gap-3"><span class="metric-icon"><ShoeIcon :size="23" /></span><div><h2 class="section-title">Registered footwear</h2><p class="text-sm text-muted">{{ client.shoes.length }} permanent pair records</p></div></div>
          <div v-if="client.shoes.length" class="mt-5 grid gap-4 md:grid-cols-2">
            <article v-for="shoe in client.shoes" :key="shoe.id" class="form-section">
              <div class="flex items-start gap-4"><img v-if="shoe.reference_photo_url" :src="shoe.reference_photo_url" :alt="shoe.display_name" class="size-20 rounded-lg object-cover" /><span v-else class="grid size-20 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="30" /></span><div><p class="text-xs font-bold text-sky-deep">{{ shoe.reference }}</p><h3 class="mt-1 font-bold text-navy">{{ shoe.display_name }}</h3><p class="mt-1 text-sm text-muted"><template v-if="shoe.size">Size {{ shoe.size }} · </template>{{ shoe.cleaning_sessions_count }} care sessions</p></div></div>
              <p v-if="shoe.identifying_notes" class="mt-4 border-t border-line pt-4 text-sm text-muted">{{ shoe.identifying_notes }}</p><button class="button-tertiary mt-3 -ml-3" type="button" @click="startShoeEdit(shoe)">Edit footwear</button>
            </article>
          </div>
          <div v-else class="empty-state mt-5"><ShoeIcon :size="32" /><h2>No footwear registered</h2><p>This client’s first pair will be saved during their next intake.</p></div>
          <form v-if="editingShoe" class="form-section mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="saveShoe"><div class="sm:col-span-2"><p class="eyebrow">Editing {{ editingShoe.reference }}</p><h3 class="section-title mt-1">Footwear details</h3></div><label class="field"><span>Type</span><input v-model="shoeForm.shoe_type" required /></label><label class="field"><span>Brand</span><input v-model="shoeForm.brand" /></label><label class="field"><span>Model</span><input v-model="shoeForm.model" /></label><label class="field"><span>Colour</span><input v-model="shoeForm.color" /></label><label class="field"><span>Size</span><input v-model="shoeForm.size" /></label><label class="field sm:col-span-2"><span>Identifying notes</span><textarea v-model="shoeForm.identifying_notes" rows="2"></textarea></label><div class="sm:col-span-2"><p class="mb-2 text-sm font-semibold text-ink">Replacement reference photo</p><MediaUploader v-model="shoePhotos" :max-files="1" compact /></div><p v-if="formError" class="text-sm font-semibold text-rose-700">{{ formError }}</p><div class="flex justify-end gap-2 sm:col-span-2"><button class="button-secondary" type="button" @click="editingShoe = null">Cancel</button><button class="button-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save footwear' }}</button></div></form>
        </div>
        <div>
          <div class="flex items-center gap-3"><span class="metric-icon"><HistoryIcon :size="23" /></span><div><h2 class="section-title">Service history</h2><p class="text-sm text-muted">Every visit and care outcome</p></div></div>
          <div v-if="client.order_history.data.length" class="data-panel mt-5"><RouterLink v-for="order in client.order_history.data" :key="order.id" :to="`/orders/${order.id}`" class="block border-b border-line p-4 last:border-0 hover:bg-sky-soft"><div class="flex items-center justify-between gap-3"><strong class="text-navy">{{ order.reference }}</strong><StatusBadge :status="order.status" /></div><p class="mt-2 text-sm text-muted">{{ order.cleaning_sessions.length }} pair<span v-if="order.cleaning_sessions.length !== 1">s</span> · {{ dateTime(order.received_at) }}</p><p class="mt-2 text-sm font-bold text-navy">{{ money(order.total) }}</p></RouterLink><div v-if="client.order_history.last_page > 1" class="flex items-center justify-between border-t border-line p-3"><button class="button-tertiary" type="button" :disabled="client.order_history.current_page === 1" @click="loadClient(client.order_history.current_page - 1)">Previous</button><span class="text-xs font-semibold text-muted">Page {{ client.order_history.current_page }} of {{ client.order_history.last_page }}</span><button class="button-tertiary" type="button" :disabled="client.order_history.current_page === client.order_history.last_page" @click="loadClient(client.order_history.current_page + 1)">Next</button></div></div>
          <div v-else class="empty-state mt-5"><HistoryIcon :size="32" /><h2>No service history</h2></div>
        </div>
      </section>
    </template>
  </AppShell>
</template>
