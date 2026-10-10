<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const online = ref(navigator.onLine)
const { needRefresh, updateServiceWorker } = useRegisterSW()
const sync = () => { online.value = navigator.onLine }
onMounted(() => { window.addEventListener('online', sync); window.addEventListener('offline', sync) })
onBeforeUnmount(() => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync) })
</script>

<template>
  <div v-if="!online" class="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-white shadow-xl" role="status">You are offline. Viewing may continue, but changes require a connection.</div>
  <div v-else-if="needRefresh" class="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-line bg-white p-4 shadow-xl" role="status"><strong class="text-navy">An update is ready</strong><p class="mt-1 text-sm text-muted">Refresh to use the latest version.</p><button class="button-primary mt-3" type="button" @click="updateServiceWorker(true)">Refresh app</button></div>
</template>
