<script setup lang="ts">
const subStore = useSubStore()
const planStore = usePlanStore()

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
</script>

<template>
  <UCard
    v-if="subStore.planId"
    title="Subscription Details"
    variant="subtle"
  >
    <p><span class="font-bold">Plan:</span> {{ planStore.name }} ({{ planStore.duration }} Weeks)</p>
    <p><span class="font-bold">Start Date:</span> {{ formatDate(subStore.startDate) }}</p>
    <p><span class="font-bold">End Date:</span> {{ formatDate(subStore.endDate) }}</p>
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
</template>
