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
        label="Weight (Kg)"
        name="weight"
        required
      >
        <UInput
          v-model="state.weight"
          type="number"
          :min="0"
          :step="0.1"
        />
      </UFormField>
      <UFormField
        label="Waist (inch)"
        name="waist"
        required
      >
        <UInput
          v-model="state.waist"
          type="number"
          :min="0"
          :step="0.1"
        />
      </UFormField>
      <UFormField
        label="Neck (inch)"
        name="neck"
        required
      >
        <UInput
          v-model="state.neck"
          type="number"
          :min="0"
          :step="0.1"
        />
      </UFormField>
      <UFormField
        label="Body Fat Percentage"
        name="bfp"
        required
      >
        <UInput
          v-model="state.bfp"
          type="number"
          :min="0"
          :max="100"
          :step="0.1"
        />
      </UFormField>
      <UFormField
        label="Photo Left"
        name="photoLeft"
        required
      >
        <UInput
          type="file"
          accept="image/*"
          @change="state.photoLeft = ($event.target as HTMLInputElement)?.files?.[0] ?? undefined"
        />
      </UFormField>
      <UFormField
        label="Photo Front"
        name="photoFront"
      >
        <UInput
          type="file"
          accept="image/*"
          @change="state.photoFront = ($event.target as HTMLInputElement)?.files?.[0] ?? null"
        />
      </UFormField>
      <UFormField
        label="Photo Back"
        name="photoBack"
      >
        <UInput
          type="file"
          accept="image/*"
          @change="state.photoBack = ($event.target as HTMLInputElement)?.files?.[0] ?? null"
        />
      </UFormField>
      <UFormField
        label="Photo Right"
        name="photoRight"
      >
        <UInput
          type="file"
          accept="image/*"
          @change="state.photoRight = ($event.target as HTMLInputElement)?.files?.[0] ?? null"
        />
      </UFormField>
      <UButton type="submit">
        Submit
      </UButton>
    </UForm>
  </UContainer>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const imageFile = z
  .custom<File>(
    val => val instanceof File && ALLOWED_IMAGE_TYPES.includes(val.type),
    'Must be a valid image file (JPEG, PNG, GIF, or WebP)'
  )
  .refine(file => file.size <= 10 * 1024 * 1024, 'Image must be 10MB or smaller')

const schema = z.object({
  weight: z.coerce.number().positive('Weight must be greater than 0'),
  waist: z.coerce.number().positive('Waist must be greater than 0'),
  neck: z.coerce.number().positive('Neck must be greater than 0'),
  bfp: z.coerce
    .number()
    .min(0, 'Body Fat Percentage must be between 0 and 100')
    .max(100, 'Body Fat Percentage must be between 0 and 100'),
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
  bfp: string
  photoLeft: File | undefined
  photoFront: File | null
  photoBack: File | null
  photoRight: File | null
}>({
  weight: '',
  waist: '',
  neck: '',
  bfp: '',
  photoLeft: undefined,
  photoFront: null,
  photoBack: null,
  photoRight: null
})

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    // Handle form submission logic here
    console.log('Form submitted:', event.data)
  } catch (error) {
    toast.add({
      title: error instanceof Error ? error.message : 'An error occurred',
      color: 'error'
    })
  }
}
</script>
