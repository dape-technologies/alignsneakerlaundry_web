<script setup>
import PwaStatus from './components/PwaStatus.vue'
</script>

<template><a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-navy">Skip to content</a><RouterView v-slot="{ Component, route }"><Transition name="page" mode="out-in"><component :is="Component" :key="route.path" /></Transition></RouterView><PwaStatus /></template>
