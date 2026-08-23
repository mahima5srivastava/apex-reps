<template>
  <UContainer>
    <h2 class="text-2xl font-bold my-4">
      Welcome {{ profileStore.name }}!
    </h2>
    <UCard
      v-if="subStore.planId"
      title="Subscription Details"
      variant="subtle"
    >
      <p><span class="font-bold">Plan:</span> {{ planStore.name }} ({{ planStore.duration }} Weeks)</p>
      <p><span class="font-bold">Start Date:</span> {{ subStore.startDate }}</p>
      <p><span class="font-bold">End Date:</span> {{ subStore.endDate }}</p>
    </UCard>
    <UCard v-else>
      <div class="flex items-center">
        <UIcon
          name="material-symbols:error"
          class="mr-2"
        />
        <p>Your subscription has expired. Please renew to continue receiving guidance.</p>
      </div>
    </UCard>
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
