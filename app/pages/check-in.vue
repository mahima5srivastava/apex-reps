<template>
  <UContainer class="pb-4">
    <h2 class="text-2xl font-bold my-4">
      Check-In Form
    </h2>
    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4 items-start"
      @submit="handleSubmit"
    >
      <UFormField
        v-for="measurement in measurements"
        :key="measurement.name"
        :label="measurement.label"
        :name="measurement.name"
        required
      >
        <UInput
          v-model="state[measurement.name]"
          type="number"
          :min="0"
          :step="0.1"
        />
      </UFormField>
      <PhotoUploadField
        v-for="photo in photoFields"
        :key="photo.name"
        v-model="state[photo.stateKey]"
        :label="photo.label"
        :name="photo.name"
        :required="photo.required"
      />
      <UButton
        type="submit"
        :loading="isLoading"
      >
        Submit
      </UButton>
    </UForm>
  </UContainer>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useStatsStore } from '@/stores/stats'
import type { PhotoAngle } from '@/types'
import { ALLOWED_IMAGE_TYPES } from '@/utils/constants'

const measurements = [
  { label: 'Weight (kg)', name: 'weight' as const },
  { label: 'Waist (inch)', name: 'waist' as const },
  { label: 'Neck (inch)', name: 'neck' as const },
  { label: 'Hip (inch)', name: 'hip' as const }
]

const photoFields = [
  { label: 'Photo Left', name: 'photoLeft', stateKey: 'photoLeft' as const, angle: 'left' as PhotoAngle, required: true },
  { label: 'Photo Front', name: 'photoFront', stateKey: 'photoFront' as const, angle: 'front' as PhotoAngle },
  { label: 'Photo Back', name: 'photoBack', stateKey: 'photoBack' as const, angle: 'back' as PhotoAngle },
  { label: 'Photo Right', name: 'photoRight', stateKey: 'photoRight' as const, angle: 'right' as PhotoAngle }
]

const toast = useToast()
const statsStore = useStatsStore()

const imageFile = z
  .custom<File>(
    val => val instanceof File && ALLOWED_IMAGE_TYPES.includes(val.type),
    'Must be a valid image file (JPEG or PNG)'
  )
  .refine(file => file.size <= 10 * 1024 * 1024, 'Image must be 10MB or smaller')

const schema = z.object({
  weight: z.coerce.number().positive('Weight must be greater than 0'),
  waist: z.coerce.number().positive('Waist must be greater than 0'),
  neck: z.coerce.number().positive('Neck must be greater than 0'),
  hip: z.coerce.number().positive('Hip must be greater than 0'),
  photoLeft: imageFile,
  photoFront: z.union([z.null(), imageFile]).optional(),
  photoBack: z.union([z.null(), imageFile]).optional(),
  photoRight: z.union([z.null(), imageFile]).optional()
})

type Schema = z.output<typeof schema>

const state = reactive<{
  weight: string
  waist: string
  neck: string
  hip: string
  photoLeft: File | undefined
  photoFront: File | undefined
  photoBack: File | undefined
  photoRight: File | undefined
}>({
  weight: '',
  waist: '',
  neck: '',
  hip: '',
  photoLeft: undefined,
  photoFront: undefined,
  photoBack: undefined,
  photoRight: undefined
})

const isLoading = ref(false)

const buildPhotoPayload = (): { angle: PhotoAngle, file: File }[] => {
  const photos: { angle: PhotoAngle, file: File }[] = []
  for (const photo of photoFields) {
    const file = state[photo.stateKey]
    if (file) photos.push({ angle: photo.angle, file })
  }
  return photos
}

const resetForm = () => {
  state.weight = ''
  state.waist = ''
  state.neck = ''
  state.hip = ''
  for (const photo of photoFields) {
    state[photo.stateKey] = undefined
  }
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  isLoading.value = true
  try {
    const photos = buildPhotoPayload()
    const stats = {
      waist: event.data.waist,
      weight: event.data.weight,
      hip: event.data.hip,
      neck: event.data.neck
    }

    await statsStore.saveStatsAndPhotos(stats, photos)

    toast.add({ title: 'Stats saved successfully', color: 'success' })
    resetForm()

    return navigateTo('/')
  } catch (error) {
    toast.add({
      title: error instanceof Error ? error.message : 'An error occurred',
      color: 'error'
    })
  }
  isLoading.value = false
}
</script>
