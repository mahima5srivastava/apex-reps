<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore } from "@/stores/profile";
import FoodSelector from "@/components/diet-plan/FoodSelector.vue";

const router = useRouter();
const authStore = useAuthStore();
const profileStore = useProfileStore();

const loading = ref(true);
const mentees = ref<{ id: string; name: string }[]>([]);
const selectedMenteeId = ref("");
const planName = ref("");
const startDate = ref("");
const endDate = ref("");
const saving = ref(false);

interface MealItem {
  id: string;
  foodItemId: string;
  quantityG: number;
  macros: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

const meals = ref<{ id: string; name: string; items: MealItem[] }[]>([
  { id: "breakfast", name: "Breakfast", items: [] },
  { id: "lunch", name: "Lunch", items: [] },
  { id: "dinner", name: "Dinner", items: [] },
]);

const snackCount = ref(0);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.fetchSession();
  }
  if (!profileStore.id) {
    await profileStore.fetchProfile();
  }
  
  if (profileStore.role !== "coach") {
    router.push("/");
    return;
  }
  
  loading.value = false;
  
  const today = new Date().toISOString().split("T")[0];
  startDate.value = today;
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  endDate.value = nextWeek.toISOString().split("T")[0];
  
  mentees.value = [
    { id: "f9a66a21-0cd1-4316-9d67-18b6d8691500", name: "Test Mentee" },
  ];
  selectedMenteeId.value = mentees.value[0].id;
});

function addSnack() {
  snackCount.value++;
  meals.value.push({
    id: `snack-${snackCount.value}`,
    name: `Snack ${snackCount.value}`,
    items: [] as MealItem[],
  });
}

function removeMeal(mealId: string) {
  if (meals.value.length <= 3) return;
  meals.value = meals.value.filter(m => m.id !== mealId);
}

function handleFoodSelected(event: { foodItemId: string; quantityG: number; macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number } }) {
  const { foodItemId, quantityG, macros } = event;
  const meal = meals.value.find(m => m.id === "breakfast") || meals.value[0];
  meal.items.push({
    id: crypto.randomUUID(),
    foodItemId,
    quantityG,
    macros,
  });
}

function getMealTotalMacros(meal: { items: Array<{ macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number } }> }) {
  return meal.items.reduce((acc: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }, item: { macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number } }) => ({
    calories: acc.calories + item.macros.calories,
    protein_g: Number((acc.protein_g + item.macros.protein_g).toFixed(2)),
    carbs_g: Number((acc.carbs_g + item.macros.carbs_g).toFixed(2)),
    fat_g: Number((acc.fat_g + item.macros.fat_g).toFixed(2)),
    fiber_g: Number((acc.fat_g + item.macros.fiber_g).toFixed(2)),
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
}

async function savePlan() {
  if (!selectedMenteeId.value || !planName.value || !startDate.value || !endDate.value) {
    alert("Please fill all required fields");
    return;
  }
  
  saving.value = true;
  try {
    console.log("Saving plan:", {
      menteeId: selectedMenteeId.value,
      name: planName.value,
      startDate: startDate.value,
      endDate: endDate.value,
      meals: meals.value,
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    router.push("/coach/diet-plans");
  } catch (err) {
    console.error("Failed to save plan:", err);
    alert("Failed to save plan");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
    </div>
    
    <div v-else-if="profileStore.role === 'coach'" class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Diet Plan</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Build a nutrition plan for your mentee</p>
        </div>
        <button @click="router.push('/coach/diet-plans')" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          Back
        </button>
      </div>
      
      <form @submit.prevent="savePlan" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold mb-4">Basic Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mentee <span class="text-red-500">*</span>
              </label>
              <select v-model="selectedMenteeId" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option v-for="m in mentees" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan Name <span class="text-red-500">*</span>
              </label>
              <input v-model="planName" placeholder="e.g., Cutting Phase Week 1" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date <span class="text-red-500">*</span>
              </label>
              <input v-model="startDate" type="date" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date <span class="text-red-500">*</span>
              </label>
              <input v-model="endDate" type="date" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Meals</h2>
            <button @click="addSnack" class="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">Add Snack</button>
          </div>
          
          <div class="space-y-6">
            <div v-for="meal in meals" :key="meal.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-gray-900 dark:text-gray-100 capitalize">{{ meal.name }}</h3>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    Total: {{ getMealTotalMacros(meal).calories }} cal • {{ getMealTotalMacros(meal).protein_g }}g protein
                  </span>
                  <button v-if="meal.id.startsWith('snack-')" @click="removeMeal(meal.id)" class="px-2 py-1 text-sm text-red-600 hover:text-red-700">Remove</button>
                </div>
              </div>
              
              <FoodSelector
                @food-selected="handleFoodSelected"
                :placeholder="`Search and add food to ${meal.name}...`"
              />
              
              <div v-if="meal.items.length > 0" class="mt-4 space-y-2">
                <div v-for="item in meal.items" :key="item.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="flex-1">
                    <p class="font-medium">{{ item.macros.calories }} cal • {{ item.quantityG }}g</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      P: {{ item.macros.protein_g }}g • C: {{ item.macros.carbs_g }}g • F: {{ item.macros.fat_g }}g • Fib: {{ item.macros.fiber_g }}g
                    </p>
                  </div>
                  <button @click="meal.items = meal.items.filter(i => i.id !== item.id)" class="px-2 py-1 text-sm text-red-600 hover:text-red-700">Remove</button>
                </div>
              </div>
              <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
                No foods added yet. Search above to add items.
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <button @click="router.push('/coach/diet-plans')" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" :disabled="saving" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {{ saving ? "Saving..." : "Save Plan" }}
          </button>
        </div>
      </form>
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
        <button @click="router.push('/')" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Go to Dashboard</button>
      </div>
    </div>
  </div>
</template>