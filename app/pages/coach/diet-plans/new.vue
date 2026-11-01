<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore } from "@/stores/profile";
import { useDietPlanStore } from "@/stores/dietPlan";
import { useToast } from "#imports";
import { sumMacros } from "@/utils/foodMacros";
import FoodSelector from "@/components/diet-plan/FoodSelector.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const profileStore = useProfileStore();
const dietPlanStore = useDietPlanStore();
const toast = useToast();

const loading = ref(true);
const mentees = ref<{ id: string; name: string }[]>([]);
const selectedMenteeId = ref("");
const planName = ref("");
const startDate = ref("");
const endDate = ref("");
const notes = ref("");
const saving = ref(false);
const initialized = ref(false);

interface MealItem {
  id: string;
  foodItemId: string;
  foodName: string;
  quantityG: number;
  macros: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

const meals = ref<{ id: string; name: string; displayOrder: number; items: MealItem[] }[]>([
  { id: "breakfast", name: "Breakfast", displayOrder: 0, items: [] },
  { id: "lunch", name: "Lunch", displayOrder: 1, items: [] },
  { id: "dinner", name: "Dinner", displayOrder: 2, items: [] },
]);

const snackCount = ref(0);

function getMealTotalMacros(meal: { items: MealItem[] }) {
  return sumMacros(meal.items.map((i) => i.macros));
}

function getDailyTotalMacros() {
  return sumMacros(meals.value.flatMap((m) => m.items.map((i) => i.macros)));
}

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

  const today = new Date().toISOString().split("T")[0] ?? "";
  startDate.value = today;
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  endDate.value = nextWeek.toISOString().split("T")[0] ?? "";

  try {
    const menteesData = await profileStore.fetchMyMentees();
    mentees.value = menteesData.map((m) => ({ id: m.id, name: m.name }));

    // Pre-select mentee from query parameter if provided
    const menteeIdFromQuery = route.query.menteeId as string | undefined;
    if (menteeIdFromQuery && mentees.value.some((m) => m.id === menteeIdFromQuery)) {
      selectedMenteeId.value = menteeIdFromQuery;
    } else if (mentees.value.length > 0) {
      selectedMenteeId.value = mentees.value[0]?.id ?? "";
    }
  } catch (err) {
    console.error("Failed to load mentees:", err);
    toast.add({ title: "Failed to load mentees", color: "error" });
  }

  initialized.value = true;
});

function addSnack() {
  snackCount.value++;
  meals.value.push({
    id: `snack-${snackCount.value}`,
    name: `Snack ${snackCount.value}`,
    displayOrder: 3 + snackCount.value - 1,
    items: [] as MealItem[],
  });
}

function removeMeal(mealId: string) {
  if (meals.value.length <= 3) return;
  meals.value = meals.value.filter((m) => m.id !== mealId);
}

function handleFoodSelected(event: { foodItemId: string; foodName: string; quantityG: number; macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number } }, mealId: string) {
  const meal = meals.value.find((m) => m.id === mealId);
  if (!meal) return;

  meal.items.push({
    id: crypto.randomUUID(),
    foodItemId: event.foodItemId,
    foodName: event.foodName,
    quantityG: event.quantityG,
    macros: event.macros,
  });
}

function removeFoodItem(mealId: string, itemId: string) {
  const meal = meals.value.find((m) => m.id === mealId);
  if (meal) {
    meal.items = meal.items.filter((i) => i.id !== itemId);
  }
}

async function savePlan() {
  if (!selectedMenteeId.value || !planName.value || !startDate.value || !endDate.value) {
    toast.add({ title: "Please fill all required fields", color: "error" });
    return;
  }

  const mealsWithItems = meals.value.filter((m) => m.items.length > 0);
  if (mealsWithItems.length === 0) {
    toast.add({ title: "Please add at least one food item to a meal", color: "error" });
    return;
  }

  saving.value = true;
  try {
    await dietPlanStore.createPlan({
      menteeId: selectedMenteeId.value,
      name: planName.value,
      startDate: startDate.value,
      endDate: endDate.value,
      notes: notes.value || undefined,
      meals: mealsWithItems.map((m) => ({
        name: m.name,
        displayOrder: m.displayOrder,
        items: m.items.map((i) => ({
          foodItemId: i.foodItemId,
          foodName: i.foodName,
          quantityG: i.quantityG,
          macros: i.macros,
        })),
      })),
    });

    toast.add({ title: "Plan created successfully", color: "success" });
    router.push("/coach/diet-plans");
  } catch (err) {
    console.error("Failed to save plan:", err);
    toast.add({ title: err instanceof Error ? err.message : "Failed to save plan", color: "error" });
  } finally {
    saving.value = false;
  }
}

// Auto-save when all mandatory fields are filled and at least one item exists
watch(
  () => ({
    mentee: selectedMenteeId.value,
    planName: planName.value,
    startDate: startDate.value,
    endDate: endDate.value,
    items: meals.value.map((m) => m.items.length).join(","),
  }),
  async () => {
    if (saving.value) return;
    if (!initialized.value) return;
    if (!selectedMenteeId.value || !planName.value || !startDate.value || !endDate.value) return;
    const mealsWithItems = meals.value.filter((m) => m.items.length > 0);
    if (mealsWithItems.length === 0) return;
    await savePlan();
  },
  { deep: true },
);
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
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coach Notes (Optional)
              </label>
              <textarea v-model="notes" rows="3" placeholder="Add any notes for this plan..." class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Meals</h2>
            <button @click="addSnack" type="button" class="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">Add Snack</button>
          </div>

          <div class="space-y-6">
            <div v-for="meal in meals" :key="meal.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-gray-900 dark:text-gray-100 capitalize">{{ meal.name }}</h3>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    Total: {{ getMealTotalMacros(meal).calories }} cal • {{ getMealTotalMacros(meal).protein_g }}g protein
                  </span>
                  <button v-if="meal.id.startsWith('snack-')" @click="removeMeal(meal.id)" type="button" class="px-2 py-1 text-sm text-red-600 hover:text-red-700">Remove</button>
                </div>
              </div>

              <FoodSelector
                @food-selected="($event) => handleFoodSelected($event, meal.id)"
                :placeholder="`Search and add food to ${meal.name}...`"
              />

              <div v-if="meal.items.length > 0" class="mt-4 space-y-2">
                <div v-for="item in meal.items" :key="item.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ item.foodName }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ item.quantityG }}g • {{ item.macros.calories }} cal • P: {{ item.macros.protein_g }}g • C: {{ item.macros.carbs_g }}g • F: {{ item.macros.fat_g }}g • Fib: {{ item.macros.fiber_g }}g
                    </p>
                  </div>
                  <button @click="removeFoodItem(meal.id, item.id)" type="button" class="px-2 py-1 text-sm text-red-600 hover:text-red-700">Remove</button>
                </div>
              </div>
              <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
                No foods added yet. Search above to add items.
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="font-semibold mb-2">Daily Totals</h3>
          <div class="grid grid-cols-5 gap-2 text-sm">
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="font-bold text-gray-900 dark:text-gray-100">{{ getDailyTotalMacros().calories }}</div>
              <div class="text-gray-500 dark:text-gray-400">Calories</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="font-bold text-gray-900 dark:text-gray-100">{{ getDailyTotalMacros().protein_g }}</div>
              <div class="text-gray-500 dark:text-gray-400">Protein (g)</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="font-bold text-gray-900 dark:text-gray-100">{{ getDailyTotalMacros().carbs_g }}</div>
              <div class="text-gray-500 dark:text-gray-400">Carbs (g)</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="font-bold text-gray-900 dark:text-gray-100">{{ getDailyTotalMacros().fat_g }}</div>
              <div class="text-gray-500 dark:text-gray-400">Fat (g)</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="font-bold text-gray-900 dark:text-gray-100">{{ getDailyTotalMacros().fiber_g }}</div>
              <div class="text-gray-500 dark:text-gray-400">Fiber (g)</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="router.push('/coach/diet-plans')" type="button" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
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