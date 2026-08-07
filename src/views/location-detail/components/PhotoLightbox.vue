<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../../../components/base/BaseModal.vue'
import BaseButton from '../../../components/base/BaseButton.vue'
import AlertBanner from '../../../components/base/AlertBanner.vue'

const props = defineProps({
  url: { type: String, default: null },
  canManage: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save-rotation'])

const { t } = useI18n()

const rotation = ref(0)

// A freshly reloaded photo (after a successful save) or a newly opened one
// should always start unrotated; on a failed save the url is unchanged, so
// this leaves the pending rotation in place for the user to retry.
watch(
  () => props.url,
  () => {
    rotation.value = 0
  },
)

function rotateLeft() {
  rotation.value = (rotation.value - 90 + 360) % 360
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
}

async function saveRotation() {
  if (!props.url || rotation.value === 0) return

  const originalBlob = await fetch(props.url).then((response) => response.blob())
  const mimeType = originalBlob.type || 'image/jpeg'

  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = props.url
  })

  const swapDimensions = rotation.value === 90 || rotation.value === 270
  const canvas = document.createElement('canvas')
  canvas.width = swapDimensions ? image.naturalHeight : image.naturalWidth
  canvas.height = swapDimensions ? image.naturalWidth : image.naturalHeight

  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  const rotatedBlob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, 0.92))
  if (rotatedBlob) emit('save-rotation', rotatedBlob)
}
</script>

<template>
  <BaseModal :model-value="!!url" bare @close="$emit('close')">
    <div class="flex flex-col items-center gap-3">
      <img
        v-if="url"
        :src="url"
        alt=""
        class="max-h-[70vh] max-w-full rounded-lg object-contain transition-transform"
        :style="{ transform: `rotate(${rotation}deg)` }"
      />

      <div v-if="canManage" class="flex flex-wrap items-center justify-center gap-2">
        <BaseButton variant="secondary" size="sm" :disabled="saving" @click="rotateLeft">
          <span aria-hidden="true">⟲</span> {{ t('locationDetail.historyEntry.rotateLeft') }}
        </BaseButton>
        <BaseButton variant="secondary" size="sm" :disabled="saving" @click="rotateRight">
          <span aria-hidden="true">⟳</span> {{ t('locationDetail.historyEntry.rotateRight') }}
        </BaseButton>
        <BaseButton v-if="rotation !== 0" size="sm" :loading="saving" @click="saveRotation">
          {{ saving ? t('locationDetail.historyEntry.uploading') : t('locationDetail.historyEntry.saveRotatedPhoto') }}
        </BaseButton>
      </div>

      <AlertBanner v-if="canManage && error" size="sm">{{ error }}</AlertBanner>
    </div>
  </BaseModal>
</template>
