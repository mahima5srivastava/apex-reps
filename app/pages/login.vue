<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import {useAuthStore} from '@/stores/auth'

definePageMeta({
    layout: false
})

const isLoading = ref(false);
const toast = useToast();

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox'
}]

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  isLoading.value = true;
  const authStore = useAuthStore()
  try {
    await authStore.login(payload.data.email, payload.data.password)
  } catch (error) {
    toast.add({
      title: error.message,
      color: "error"
    })
  }
  isLoading.value = false;
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <AppLogo class="w-auto h-12 shrink-0 mb-4 mt-16" />
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Login"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        @submit="onSubmit"
        :loading="isLoading"
      />
    </UPageCard>
  </div>
</template>

