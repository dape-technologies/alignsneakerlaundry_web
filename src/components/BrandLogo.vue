<script setup>
defineProps({ size: { type: String, default: 'md' }, showName: { type: Boolean, default: false }, light: { type: Boolean, default: false } })
</script>

<template><span class="brand-logo" :class="[`brand-logo-${size}`, { 'brand-logo-light': light }]"><img src="/align-logo.png" alt="" aria-hidden="true" /><span v-if="showName" class="brand-logo-name"><strong>Align</strong><small>Sneaker Laundry · Ops</small></span></span></template>
