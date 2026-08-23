<script setup lang="ts">
const subStore = useSubStore()
const planStore = usePlanStore()
</script>

<template>
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
</template>
