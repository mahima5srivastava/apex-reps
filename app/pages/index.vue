<template>
  <UContainer>
    <h2 class="text-2xl font-bold my-4">Welcome {{ profileStore.name }}!</h2>
    <Loader v-if="isLoading" />
  </UContainer>
</template>

<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'

const profileStore = useProfileStore()
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  await profileStore.fetchProfile()
  isLoading.value = false;
});
</script>
