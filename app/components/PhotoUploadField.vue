<script setup lang="ts">
defineProps<{
  label: string
  name: string
  required?: boolean
  modelValue?: File | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: File | undefined]
}>()

const onFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement)?.files?.[0] ?? undefined
  emit('update:modelValue', file)
}
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :required="required"
  >
    <UInput
      type="file"
      accept="image/jpeg,image/png"
      @change="onFileChange"
    />
  </UFormField>
</template>
