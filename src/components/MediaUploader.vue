<script setup>
import { onBeforeUnmount, watch } from 'vue'
import Uppy from '@uppy/core'
import ImageEditor from '@uppy/image-editor'
import Dashboard from '@uppy/vue/dashboard'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxFiles: { type: Number, default: 6 },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const uppy = new Uppy({
  autoProceed: false,
  restrictions: {
    maxNumberOfFiles: props.maxFiles,
    maxFileSize: 6 * 1024 * 1024,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
})

uppy.use(ImageEditor, {
  quality: 0.9,
  cropperOptions: { background: false, responsive: true },
})

function syncFiles() {
  emit('update:modelValue', uppy.getFiles().map((file) => file.data))
}

uppy.on('file-added', syncFiles)
uppy.on('file-removed', syncFiles)
uppy.on('file-editor:complete', syncFiles)

watch(() => props.modelValue, (files) => {
  if (files.length === 0 && uppy.getFiles().length > 0) uppy.cancelAll()
})

onBeforeUnmount(() => uppy.destroy())

const dashboardProps = {
  width: '100%',
  height: props.compact ? 220 : 280,
  hideUploadButton: true,
  hideRetryButton: true,
  hidePauseResumeButton: true,
  proudlyDisplayPoweredByUppy: false,
  showLinkToFileUploadResult: false,
  note: props.maxFiles === 1
    ? 'JPG, PNG or WebP · maximum 6 MB'
    : `Up to ${props.maxFiles} images · maximum 6 MB each`,
  locale: {
    strings: {
      dropPasteFiles: 'Drop care photos here or %{browseFiles}',
      browseFiles: 'choose images',
    },
  },
}
</script>

<template>
  <div class="media-uploader">
    <Dashboard :uppy="uppy" :props="dashboardProps" />
  </div>
</template>
