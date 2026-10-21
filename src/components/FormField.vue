<script setup>
import { computed, useAttrs } from 'vue'
import AppSelect from './AppSelect.vue'

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
const isRequired = computed(() => 'required' in controlAttrs.value && controlAttrs.value.required !== false)
function update(event) {
  const value = props.modelModifiers.number && event.target.value !== '' ? Number(event.target.value) : event.target.value
  emit('update:modelValue', value)
}
</script>

<template>
  <label class="field app-field" :class="[$attrs.class, { 'field-dark': dark, 'app-field-invalid': error }]" :style="$attrs.style">
    <span>{{ label }}<span v-if="isRequired" class="required-mark" aria-hidden="true">*</span></span>
    <span class="app-field-control">
      <slot name="leading" />
      <textarea v-if="multiline" v-bind="controlAttrs" :value="modelValue" @input="update"></textarea>
      <AppSelect v-else-if="options.length" :model-value="modelValue" :options="options" :aria-label="label" :disabled="controlAttrs.disabled" @update:model-value="emit('update:modelValue', $event)" />
      <input v-else v-bind="controlAttrs" :value="modelValue" @input="update" />
      <slot name="trailing" />
    </span>
    <small v-if="error">{{ error }}</small>
  </label>
</template>
