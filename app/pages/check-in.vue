<template>
    <UContainer>
        <h2 class="text-2xl font-bold my-4">Check-In Form</h2>
        <UForm :schema="schema" :state="state" class="flex flex-col gap-4 items-start" @submit="handleSubmit">
            <UFormField label="Weight (Kg)" required>
                <UInput v-model="state.weight" type="number" />
            </UFormField>
            <UFormField label="Waist (inch)" required>
                <UInput v-model="state.waist" type="number" />
            </UFormField>
            <UFormField label="Neck (inch)" required>
                <UInput v-model="state.neck" type="number" />
            </UFormField>
            <UFormField label="Body Fat Percentage" required>
                <UInput v-model="state.bfp" type="number" />
            </UFormField>
            <UFormField label="Photo Left" required>
                <UInput type="file" accept="image/*" @change="state.photoLeft = ($event.target as HTMLInputElement)?.files?.[0] ?? undefined" />
            </UFormField>
            <UFormField label="Photo Front">
                <UInput type="file" accept="image/*" @change="state.photoFront = ($event.target as HTMLInputElement)?.files?.[0] ?? null" />
            </UFormField>
            <UFormField label="Photo Back">
                <UInput type="file" accept="image/*" @change="state.photoBack = ($event.target as HTMLInputElement)?.files?.[0] ?? null" />
            </UFormField> 
            <UFormField label="Photo Right">
                <UInput type="file" accept="image/*" @change="state.photoRight = ($event.target as HTMLInputElement)?.files?.[0] ?? null" />
            </UFormField>
            <UButton type="submit">Submit</UButton>
        </UForm>
    </UContainer>
</template>

<script setup lang="ts">
import * as z from 'zod'

const imageFile = z.custom<File>(
  (val) => val instanceof File && ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(val.type),
  'Must be a valid image file (JPEG, PNG, GIF, or WebP)'
);

const schema = z.object({
    weight: z.number().min(0, 'Weight must be a positive number'),
    waist: z.number().min(0, 'Waist must be a positive number'),
    neck: z.number().min(0, 'Neck must be a positive number'),
    bfp: z.number().min(0, 'Body Fat Percentage must be a positive number'),
    photoLeft: imageFile,
    photoFront: z.union([z.null(), imageFile]).optional(),
    photoBack: z.union([z.null(), imageFile]).optional(),
    photoRight: z.union([z.null(), imageFile]).optional()
})

const state = reactive({
    weight: 0,
    waist: 0,
    neck: 0,
    bfp: 0,
    photoLeft: undefined,
    photoFront: null,
    photoBack: null,
    photoRight: null
})

const handleSubmit = async () => {
    try {
        // Handle form submission logic here
        console.log('Form submitted:', state)
    } catch (error) {
        console.error('Validation error:', error)
    }
}
</script>