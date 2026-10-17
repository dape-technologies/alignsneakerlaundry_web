<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, required: true },
  error: { type: String, default: '' },
  multiline: { type: Boolean, default: false },
  options: { type: Array, default: () => [] },
  dark: { type: Boolean, default: false },
  modelModifiers: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])
const controlAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => !['class', 'style'].includes(key))))
function update(event) {
  const value = props.modelModifiers.number && event.target.value !== '' ? Number(event.target.value) : event.target.value
  emit('update:modelValue', value)
}
const optionValue = (option) => typeof option === 'object' ? option.value : option
const optionLabel = (option) => typeof option === 'object' ? option.label : option
</script>

<template>
  <label class="field app-field" :class="[$attrs.class, { 'field-dark': dark, 'app-field-invalid': error }]" :style="$attrs.style">
    <span>{{ label }}</span>
    <span class="app-field-control">
      <slot name="leading" />
      <textarea v-if="multiline" v-bind="controlAttrs" :value="modelValue" @input="update"></textarea>
      <select v-else-if="options.length" v-bind="controlAttrs" :value="modelValue" @change="update"><option v-for="option in options" :key="optionValue(option)" :value="optionValue(option)">{{ optionLabel(option) }}</option></select>
      <input v-else v-bind="controlAttrs" :value="modelValue" @input="update" />
      <slot name="trailing" />
    </span>
    <small v-if="error">{{ error }}</small>
  </label>
</template>
