<script setup>
import { onMounted, reactive, ref } from 'vue'
import { PhPlus as PlusIcon, PhShieldCheck as ShieldIcon, PhUserMinus as RevokeIcon, PhUserPlus as RestoreIcon, PhUsers as UsersIcon, PhX as CloseIcon } from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import FormField from '../components/FormField.vue'
import { api, validationErrors } from '../services/api'

const attendants = ref([])
const loading = ref(true)
const saving = ref(false)
const formOpen = ref(false)
const error = ref('')
const formErrors = ref({})
const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })

async function loadAttendants() {
  loading.value = true
  error.value = ''
  try {
    attendants.value = (await api.get('/attendants')).data.data
  } catch {
    error.value = 'Attendants could not be loaded.'
  } finally {
    loading.value = false
  }
}

async function registerAttendant() {
  saving.value = true
  formErrors.value = {}
  try {
    const { data } = await api.post('/attendants', form)
    attendants.value.unshift(data.data)
    Object.assign(form, { name: '', email: '', password: '', password_confirmation: '' })
    formOpen.value = false
  } catch (requestError) {
    formErrors.value = validationErrors(requestError)
  } finally {
    saving.value = false
  }
}

async function setAccess(attendant, active) {
  const previous = attendant.is_active
  attendant.is_active = active
  try {
    const { data } = await api.patch(`/attendants/${attendant.id}`, { is_active: active })
    Object.assign(attendant, data.data)
  } catch {
    attendant.is_active = previous
    error.value = 'Access could not be updated.'
  }
}

onMounted(loadAttendants)
</script>

<template>
  <AppShell>
    <header class="flex items-end justify-between gap-3">
      <div><p class="eyebrow">Owner view</p><h1 class="page-title">Attendants</h1></div>
      <button class="button-primary compact-intake-button" type="button" @click="formOpen = !formOpen"><CloseIcon v-if="formOpen" :size="17" /><PlusIcon v-else :size="17" weight="bold" /> {{ formOpen ? 'Close' : 'Add attendant' }}</button>
    </header>

    <form v-if="formOpen" class="form-section mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="registerAttendant">
      <FormField v-model="form.name" label="Name" autocomplete="name" required :error="formErrors.name?.[0]" />
      <FormField v-model="form.email" label="Email" type="email" autocomplete="email" required :error="formErrors.email?.[0]" />
      <FormField v-model="form.password" label="Password" type="password" minlength="8" autocomplete="new-password" required :error="formErrors.password?.[0]" />
      <FormField v-model="form.password_confirmation" label="Confirm password" type="password" minlength="8" autocomplete="new-password" required />
      <p v-if="formErrors.form" class="alert-error sm:col-span-2">{{ formErrors.form[0] }}</p>
      <div class="flex justify-end sm:col-span-2"><button class="button-primary" :disabled="saving"><ShieldIcon :size="18" /> {{ saving ? 'Registering…' : 'Register attendant' }}</button></div>
    </form>

    <div v-if="error" class="alert-error mt-6">{{ error }}</div>
    <div v-else-if="loading" class="mt-6 space-y-3"><div v-for="index in 4" :key="index" class="skeleton h-16"></div></div>
    <section v-else-if="attendants.length" class="data-panel mt-6 overflow-x-auto">
      <table class="data-table min-w-[680px]">
        <thead><tr><th>Attendant</th><th>Email</th><th>Status</th><th>Registered</th><th><span class="sr-only">Access</span></th></tr></thead>
        <tbody><tr v-for="attendant in attendants" :key="attendant.id"><td class="font-bold text-navy">{{ attendant.name }}</td><td class="font-semibold text-muted">{{ attendant.email }}</td><td><span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" :class="attendant.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ attendant.is_active ? 'Active' : 'Revoked' }}</span></td><td class="whitespace-nowrap text-sm font-semibold text-muted">{{ new Date(attendant.created_at).toLocaleDateString() }}</td><td class="text-right"><button v-if="attendant.is_active" class="button-tertiary text-rose-700" type="button" @click="setAccess(attendant, false)"><RevokeIcon :size="17" /> Revoke</button><button v-else class="button-tertiary" type="button" @click="setAccess(attendant, true)"><RestoreIcon :size="17" /> Restore</button></td></tr></tbody>
      </table>
    </section>
    <section v-else class="empty-state mt-6"><UsersIcon :size="34" class="text-sky-deep" /><h2>No attendants registered</h2><button class="button-primary mt-5" type="button" @click="formOpen = true"><PlusIcon :size="17" /> Add attendant</button></section>
  </AppShell>
</template>
