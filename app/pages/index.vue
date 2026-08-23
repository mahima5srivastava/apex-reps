<template>
  <UContainer>
    <PageLoader v-if="isLoading" />

    <div
      v-else
      class="space-y-6 py-4"
    >
      <h2 class="text-2xl font-bold">
        Welcome {{ profileStore.name }}!
      </h2>

      <SubscriptionCard />

      <h3 class="text-xl font-bold">
        Your Progress
      </h3>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatChart
          title="Weight"
          :chart-data="statsStore.weightChartData"
          value-key="value"
          category-name="Weight"
          x-label="Date"
          y-label="Weight (kg)"
        />
        <StatChart
          title="Waist"
          :chart-data="statsStore.waistChartData"
          value-key="value"
          category-name="Waist"
          x-label="Date"
          y-label="Waist (in)"
        />
        <StatChart
          title="Body Fat %"
          :chart-data="statsStore.bfpChartData"
          value-key="value"
          category-name="Body Fat %"
          x-label="Date"
          y-label="Body Fat (%)"
        />
      </div>

      <UButton to="/check-in">
        Check In
      </UButton>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { useProfileStore } from '@/stores/profile'
import { useSubStore } from '@/stores/subscription'
import { usePlanStore } from '@/stores/plan'
import { useStatsStore } from '@/stores/stats'

const profileStore = useProfileStore()
const subStore = useSubStore()
const planStore = usePlanStore()
const statsStore = useStatsStore()
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    await profileStore.fetchProfile()
    await subStore.fetchActiveSubscription()
    if (subStore.planId) {
      await planStore.fetchPlan(subStore.planId)
    }
    await statsStore.fetchAllStats()
  } catch (error) {
    console.log('Error loading dashboard: ', error)
  } finally {
    isLoading.value = false
  }
})
</script>
