<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhTrash as TrashIcon, PhWarning as WarningIcon, PhX as CloseIcon } from '@phosphor-icons/vue'
import { api } from '../services/api'

const props = defineProps({ orderId: { type: [String, Number], required: true } })
const router = useRouter()
const open = ref(false)
const deleting = ref(false)
const error = ref('')

async function remove() {
  deleting.value = true
  error.value = ''
  try {
    await api.delete(`/orders/${props.orderId}`)
    await router.replace('/orders')
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'The order could not be deleted.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <button class="fixed bottom-5 right-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 shadow-[0_14px_36px_rgba(90,31,31,0.14)] hover:-translate-y-0.5 hover:bg-rose-50" type="button" @click="open = true"><TrashIcon :size="17" /> Delete order</button>
  <Transition name="modal">
    <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-navy/45 p-4 backdrop-blur-[3px]" @click.self="open = false">
      <section class="w-full max-w-md rounded-2xl border border-white/80 bg-white p-6 shadow-[0_28px_90px_rgba(8,31,50,0.28)]" role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
        <div class="flex items-start justify-between gap-4"><span class="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700"><WarningIcon :size="23" weight="fill" /></span><button class="icon-button" type="button" aria-label="Close" @click="open = false"><CloseIcon :size="20" /></button></div>
        <h2 id="delete-order-title" class="mt-5 text-2xl font-bold text-navy">Delete this order?</h2>
        <p class="mt-2 text-sm text-muted">Its payments, photos, care history, and roadmap cards will be removed. The client and footwear records will remain.</p>
        <p v-if="error" class="alert-error mt-4">{{ error }}</p>
        <div class="mt-6 flex justify-end gap-2"><button class="button-secondary" type="button" @click="open = false">Keep order</button><button class="button-primary bg-rose-700 hover:bg-rose-800" type="button" :disabled="deleting" @click="remove"><TrashIcon :size="17" /> {{ deleting ? 'Deleting…' : 'Delete order' }}</button></div>
      </section>
    </div>
  </Transition>
</template>
