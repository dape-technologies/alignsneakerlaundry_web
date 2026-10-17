<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Uppy from '@uppy/core'
import { PhFileImage as FileIcon, PhPlus as PlusIcon, PhX as RemoveIcon } from '@phosphor-icons/vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxFiles: { type: Number, default: 6 },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const input = ref(null)
const error = ref('')

const uppy = new Uppy({
  autoProceed: false,
  restrictions: {
    maxNumberOfFiles: props.maxFiles,
    maxFileSize: 6 * 1024 * 1024,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
})

const files = ref([])
const canAdd = computed(() => files.value.length < props.maxFiles)
const actionLabel = computed(() => props.maxFiles === 1 ? 'Add photo' : 'Add photos')

function syncFiles() {
  files.value = uppy.getFiles()
  emit('update:modelValue', files.value.map((file) => file.data))
}

function selectFiles(event) {
  error.value = ''
  for (const file of event.target.files || []) {
    try {
      uppy.addFile({ name: file.name, type: file.type, data: file, source: 'file-input' })
    } catch (uploadError) {
      error.value = uploadError.message
      break
    }
  }
  event.target.value = ''
}

function removeFile(id) {
  error.value = ''
  uppy.removeFile(id)
}

uppy.on('file-added', syncFiles)
uppy.on('file-removed', syncFiles)
uppy.on('restriction-failed', (_file, uploadError) => { error.value = uploadError.message })

watch(() => props.modelValue, (nextFiles) => {
  if (nextFiles.length === 0 && uppy.getFiles().length > 0) uppy.cancelAll()
})

onBeforeUnmount(() => uppy.destroy())
</script>

<template>
  <div class="media-uploader" :class="{ 'media-uploader-compact': compact }">
    <input ref="input" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" :multiple="maxFiles > 1" @change="selectFiles" />
    <button v-if="canAdd" class="media-add-button" type="button" @click="input?.click()">
      <span class="media-add-icon"><PlusIcon :size="18" weight="bold" /></span>
      <span class="min-w-0 text-left"><strong>{{ actionLabel }}</strong><small>JPG, PNG or WebP · 6 MB max</small></span>
    </button>
    <ul v-if="files.length" class="media-file-list" aria-label="Selected photos">
      <li v-for="file in files" :key="file.id"><FileIcon :size="18" class="shrink-0 text-sky-deep" /><span class="min-w-0 flex-1 truncate">{{ file.name }}</span><button type="button" :aria-label="`Remove ${file.name}`" @click="removeFile(file.id)"><RemoveIcon :size="17" /></button></li>
    </ul>
    <p v-if="error" class="px-3 pb-3 text-xs font-semibold text-rose-700" role="alert">{{ error }}</p>
  </div>
</template>
