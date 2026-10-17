<script setup>
import { PhArrowLeft as ArrowLeftIcon } from '@phosphor-icons/vue'
import BrandLogo from '../components/BrandLogo.vue'
</script>

<template><main class="grid min-h-[100dvh] place-items-center bg-canvas px-4"><section class="max-w-lg text-center"><BrandLogo size="xl" /><p class="eyebrow mt-8">Page not found</p><h1 class="page-title">This workspace page does not exist.</h1><p class="mt-4 text-muted">Return to the operations dashboard and continue managing today’s care queue.</p><RouterLink to="/dashboard" class="button-primary mt-7"><ArrowLeftIcon :size="18" /> Back to dashboard</RouterLink></section></main></template>
