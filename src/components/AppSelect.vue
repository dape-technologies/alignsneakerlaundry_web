<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { PhCaretDown as CaretIcon, PhCheck as CheckIcon } from '@phosphor-icons/vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  ariaLabel: { type: String, default: 'Choose an option' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const trigger = ref(null)
const menu = ref(null)
const open = ref(false)
const activeIndex = ref(0)
const menuStyle = ref({})
const listboxId = `app-select-${useId()}`

const normalisedOptions = computed(() => props.options.map((option) => (
  typeof option === 'object' ? option : { value: option, label: option }
)))
const selectedIndex = computed(() => normalisedOptions.value.findIndex((option) => option.value === props.modelValue))
const selectedLabel = computed(() => normalisedOptions.value[selectedIndex.value]?.label || props.ariaLabel)

function viewportBounds() {
  const viewport = window.visualViewport
  return {
    left: viewport?.offsetLeft || 0,
    top: viewport?.offsetTop || 0,
    width: viewport?.width || document.documentElement.clientWidth,
    height: viewport?.height || document.documentElement.clientHeight,
  }
}

function positionMenu() {
  if (!open.value || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const viewport = viewportBounds()
  const gutter = 8
  const gap = 6
  const estimatedHeight = Math.min(normalisedOptions.value.length * 44 + 8, 280)
  const width = Math.min(Math.max(rect.width, 180), viewport.width - gutter * 2)
  const maxLeft = viewport.left + viewport.width - width - gutter
  const left = Math.max(viewport.left + gutter, Math.min(rect.left, maxLeft))
  const roomBelow = viewport.top + viewport.height - rect.bottom - gap - gutter
  const top = roomBelow >= Math.min(estimatedHeight, 160)
    ? rect.bottom + gap
    : Math.max(viewport.top + gutter, rect.top - estimatedHeight - gap)

  menuStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    maxHeight: `${Math.max(96, Math.min(280, viewport.height - gutter * 2))}px`,
  }
}

async function openMenu() {
  if (props.disabled) return
  open.value = true
  activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
  await nextTick()
  positionMenu()
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!open.value) return
  open.value = false
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

function select(option) {
  emit('update:modelValue', option.value)
  closeMenu({ restoreFocus: true })
}

function handleTriggerKey(event) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    closeMenu({ restoreFocus: true })
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return
  event.preventDefault()
  if (!open.value) {
    openMenu()
    return
  }
  if (event.key === 'ArrowDown') activeIndex.value = (activeIndex.value + 1) % normalisedOptions.value.length
  else if (event.key === 'ArrowUp') activeIndex.value = (activeIndex.value - 1 + normalisedOptions.value.length) % normalisedOptions.value.length
  else select(normalisedOptions.value[activeIndex.value])
}

function handleMenuKey(event) {
  if (event.key === 'Escape' || event.key === 'Tab') {
    closeMenu({ restoreFocus: event.key === 'Escape' })
    return
  }
  if (event.key === 'Home') activeIndex.value = 0
  else if (event.key === 'End') activeIndex.value = normalisedOptions.value.length - 1
  else if (event.key === 'ArrowDown') activeIndex.value = (activeIndex.value + 1) % normalisedOptions.value.length
  else if (event.key === 'ArrowUp') activeIndex.value = (activeIndex.value - 1 + normalisedOptions.value.length) % normalisedOptions.value.length
  else if (event.key === 'Enter' || event.key === ' ') select(normalisedOptions.value[activeIndex.value])
  else return
  event.preventDefault()
}

function handleOutsidePointer(event) {
  if (!open.value || trigger.value?.contains(event.target) || menu.value?.contains(event.target)) return
  closeMenu()
}

watch(open, (isOpen) => {
  const method = isOpen ? 'addEventListener' : 'removeEventListener'
  window[method]('resize', positionMenu)
  window[method]('scroll', positionMenu, true)
  window.visualViewport?.[method]('resize', positionMenu)
  window.visualViewport?.[method]('scroll', positionMenu)
  document[method]('pointerdown', handleOutsidePointer)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', positionMenu)
  window.removeEventListener('scroll', positionMenu, true)
  window.visualViewport?.removeEventListener('resize', positionMenu)
  window.visualViewport?.removeEventListener('scroll', positionMenu)
  document.removeEventListener('pointerdown', handleOutsidePointer)
})
</script>

<template>
  <span class="app-select">
    <button
      ref="trigger"
      class="app-select-trigger"
      type="button"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      :aria-controls="listboxId"
      aria-haspopup="listbox"
      @click="open ? closeMenu() : openMenu()"
      @keydown="handleTriggerKey"
    >
      <span class="truncate">{{ selectedLabel }}</span><CaretIcon :size="16" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <Transition name="select-menu">
        <ul
          v-if="open"
          :id="listboxId"
          ref="menu"
          class="app-select-menu"
          :style="menuStyle"
          role="listbox"
          :aria-label="ariaLabel"
          tabindex="-1"
          @keydown="handleMenuKey"
        >
          <li
            v-for="(option, index) in normalisedOptions"
            :key="option.value"
            class="app-select-option"
            :class="{ 'is-selected': option.value === modelValue, 'is-active': index === activeIndex }"
            role="option"
            :aria-selected="option.value === modelValue"
            @pointerenter="activeIndex = index"
            @click="select(option)"
          >
            <span>{{ option.label }}</span><CheckIcon v-if="option.value === modelValue" :size="16" weight="bold" />
          </li>
        </ul>
      </Transition>
    </Teleport>
  </span>
</template>
