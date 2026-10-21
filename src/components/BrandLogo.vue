<script setup>
defineProps({ size: { type: String, default: 'md' }, showName: { type: Boolean, default: false }, light: { type: Boolean, default: false } })
</script>

<template><span class="brand-logo" :class="[`brand-logo-${size}`, { 'brand-logo-light': light }]"><img src="/go-fresh-logo.svg" alt="" aria-hidden="true" /><span v-if="showName" class="brand-logo-name"><strong>Go Fresh</strong><small>Shoe Laundry · Ops</small></span></span></template>
