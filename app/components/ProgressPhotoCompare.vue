<script setup lang="ts">
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
})
const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

const checkins = computed(() => statsStore.leftPhotoCheckins)

const latestCheckin = computed(() =>
  checkins.value.length
    ? checkins.value[checkins.value.length - 1]
    : null
)

const leftStatId = ref<string>('')

const leftCheckin = computed(
  () => checkins.value.find(c => c.statId === leftStatId.value) ?? null
)

const selectItems = computed(() =>
  checkins.value.map(c => ({
    label: formatDate(c.createdAt),
    value: c.statId
  }))
)

watch(
  checkins,
  (val) => {
    if (val.length && !val.some(c => c.statId === leftStatId.value)) {
      leftStatId.value = val[0]?.statId ?? ''
    }
  },
  { immediate: true }
)
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-lg font-semibold">
          Progress Photos
        </h3>
        <USelect
          v-if="selectItems.length"
          v-model="leftStatId"
          :items="selectItems"
          placeholder="Select check-in"
          class="w-full sm:w-48"
        />
      </div>
    </template>

    <p
      v-if="checkins.length < 2"
      class="text-muted"
    >
      You need at least two check-ins with a left photo to compare.
    </p>

    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <div class="flex min-w-0 flex-col gap-2">
        <span class="text-sm font-medium text-muted">Earlier</span>
        <img
          v-if="leftCheckin"
          :src="leftCheckin.url"
          alt="Earlier left progress photo"
          class="mx-auto max-h-72 w-full rounded-lg object-contain sm:max-h-96"
        >
        <span
          v-if="leftCheckin"
          class="text-xs text-muted"
        >{{ formatDate(leftCheckin.createdAt) }}</span>
      </div>

      <div class="flex min-w-0 flex-col gap-2">
        <span class="text-sm font-medium text-muted">Latest</span>
        <img
          v-if="latestCheckin"
          :src="latestCheckin.url"
          alt="Latest left progress photo"
          class="mx-auto max-h-72 w-full rounded-lg object-contain sm:max-h-96"
        >
        <span
          v-if="latestCheckin"
          class="text-xs text-muted"
        >{{ formatDate(latestCheckin.createdAt) }}</span>
      </div>
    </div>
  </UCard>
</template>
