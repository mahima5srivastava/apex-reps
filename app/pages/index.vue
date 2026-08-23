<template>
  <UContainer>
    <h2 class="text-2xl font-bold my-4">
      Welcome {{ profileStore.name }}!
    </h2>
    <SubscriptionCard />
    <UButton to="/check-in">
      Check In
    </UButton>
    <PageLoader v-if="isLoading" />
  </UContainer>
</template>

<script setup lang="ts">
import { useProfileStore } from '@/stores/profile'
import { useSubStore } from '@/stores/subscription'
import { usePlanStore } from '@/stores/plan'

const profileStore = useProfileStore()
const subStore = useSubStore()
const planStore = usePlanStore()
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    await profileStore.fetchProfile()
    await subStore.fetchActiveSubscription()
    if (subStore.planId) {
      await planStore.fetchPlan(subStore.planId)
    }
  } catch (error) {
    console.log('Error loading dashboard: ', error)
  } finally {
    isLoading.value = false
  }
})
</script>
