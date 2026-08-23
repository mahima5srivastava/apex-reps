<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  layout: false
})

const isLoading = ref(false)
const toast = useToast()

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
  isLoading.value = true
  const authStore = useAuthStore()
  try {
    await authStore.login(payload.data.email, payload.data.password)
  } catch (error) {
    toast.add({
      title: error instanceof Error ? error.message : 'An error occurred',
      color: 'error'
    })
  }
  isLoading.value = false
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <div class="relative hidden flex-col justify-between bg-gradient-to-br from-primary to-primary/70 p-12 text-primary-invert lg:flex">
      <AppLogo class="w-auto h-12 shrink-0 brightness-0 invert" />
      <div class="space-y-4">
        <h1 class="text-3xl font-bold leading-tight">
          Track your transformation, one check-in at a time.
        </h1>
        <p class="text-primary-invert/80 max-w-md">
          Log your measurements and progress photos to stay accountable and see
          real, visible results on your fitness journey.
        </p>
      </div>
      <p class="text-sm text-primary-invert/70">
        &copy; {{ new Date().getFullYear() }} Apex Reps. All rights reserved.
      </p>
    </div>

    <div class="flex flex-col items-center justify-center gap-6 p-4">
      <AppLogo class="w-auto h-10 shrink-0 lg:hidden" />
      <UPageCard class="w-full max-w-md">
        <UAuthForm
          :schema="schema"
          title="Login"
          description="Enter your credentials to access your account."
          icon="i-lucide-user"
          :fields="fields"
          :loading="isLoading"
          @submit="onSubmit"
        />
      </UPageCard>
    </div>
  </div>
</template>
