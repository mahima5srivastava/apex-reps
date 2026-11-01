<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore } from "@/stores/profile";

const router = useRouter();
const authStore = useAuthStore();
const profileStore = useProfileStore();

const loading = ref(true);
const mentees = ref<{ id: string; name: string; email: string }[]>([]);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.fetchSession();
  }
  if (!profileStore.id) {
    await profileStore.fetchProfile();
  }
  loading.value = false;
  
  if (profileStore.role !== "coach") {
    router.push("/");
  }
  
  // Mock mentees for testing
  mentees.value = [
    { id: "f9a66a21-0cd1-4316-9d67-18b6d8691500", name: "Test Mentee", email: "test@example.com" },
  ];
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
    </div>
    
    <div v-else-if="profileStore.role === 'coach'" class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Diet Plan Management</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Create and manage diet plans for your mentees</p>
      </div>
      
      <div class="mb-6">
        <button @click="router.push('/coach/diet-plans/new')" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Create New Plan
        </button>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold">Your Mentees</h2>
        </div>
        <div v-if="mentees.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
          No mentees assigned yet.
        </div>
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="mentee in mentees" :key="mentee.id" class="p-4 flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ mentee.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ mentee.email }}</p>
            </div>
            <button @click="router.push('/coach/diet-plans/' + mentee.id)" class="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
              View Plans
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="max-w-md text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
        <div class="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">This page is only accessible to coaches.</p>
        <button @click="router.push('/')" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Go to Dashboard</button>
      </div>
    </div>
  </div>
</template>