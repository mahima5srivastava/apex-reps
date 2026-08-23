<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const isLoading = ref(false)

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const logout = async () => {
  isLoading.value = true
  await authStore.logout()
  isLoading.value = false
}
</script>

<template>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
        >
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          :loading="isLoading"
          @click="logout"
        >
          Logout
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <p class="text-sm text-muted">
        &copy; {{ new Date().getFullYear() }} Mahima Srivastava. All rights reserved.
      </p>
    </UFooter>
</template>
