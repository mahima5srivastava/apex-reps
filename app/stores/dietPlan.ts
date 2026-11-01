import { defineStore } from "pinia";
import { getSupabase } from "@/utils/supabase";
import { useProfileStore } from "@/stores/profile";
import type { CalculatedMacros } from "@/utils/foodMacros";

interface DietPlanFoodItem {
  id: string;
  food_item_id: string;
  quantity_g: number;
  macros: CalculatedMacros;
  foodItem?: {
    id: string;
    name: string;
    calories_per_100g: number;
    protein_g_per_100g: number;
    carbs_g_per_100g: number;
    fat_g_per_100g: number;
    fiber_g_per_100g: number;
  };
}

interface DietPlanMeal {
  id: string;
  name: string;
  display_order: number;
  items: DietPlanFoodItem[];
}

interface DietPlanWithMeals {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  meals: DietPlanMeal[];
}

interface DietPlanLog {
  id: string;
  food_item_id: string;
  consumed: boolean;
  consumed_at: string | null;
  macros?: CalculatedMacros;
}

export const useDietPlanStore = defineStore("dietPlan", {
  state: () => ({
    currentPlan: null as DietPlanWithMeals | null,
    logs: {} as Record<string, DietPlanLog>,
    notes: {} as Record<string, string>,
    loading: false,
    error: null as string | null,
  }),
  
  getters: {
    isLoading: (state) => state.loading,
    lastError: (state) => state.error,
  },
  
  actions: {
    async fetchPlanForDate(date: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const profileStore = useProfileStore();
        if (!profileStore.id) {
          await profileStore.fetchProfile();
        }
        if (!profileStore.id) throw new Error("Profile not found");
        
        const supabase = getSupabase();
        
        // Get the active plan for this date
        const { data: plan, error: planError } = await supabase
          .from("diet_plans")
          .select("id, name, start_date, end_date, notes")
          .eq("mentee_id", profileStore.id)
          .lte("start_date", date)
          .gte("end_date", date)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (planError) throw new Error(planError.message);
        
        if (!plan) {
          this.currentPlan = null;
          this.logs = {};
          this.notes = {};
          return;
        }
        
        // Get meals with food items
        const { data: meals, error: mealsError } = await supabase
          .from("diet_plan_meals")
          .select(`
            id,
            name,
            display_order,
            diet_plan_food_items (
              id,
              food_item_id,
              quantity_g,
              calories,
              protein_g,
              carbs_g,
              fat_g,
              fiber_g,
              food_items (
                id,
                name,
                calories_per_100g,
                protein_g_per_100g,
                carbs_g_per_100g,
                fat_g_per_100g,
                fiber_g_per_100g
              )
            )
          `)
          .eq("diet_plan_id", plan.id)
          .order("display_order");
        
        if (mealsError) throw new Error(mealsError.message);
        
        // Transform meals
        const transformedMeals: DietPlanMeal[] = (meals ?? []).map(meal => ({
          id: meal.id,
          name: meal.name,
          display_order: meal.display_order,
          items: (meal.diet_plan_food_items ?? []).map((item: Record<string, unknown>) => ({
            id: item.id,
            food_item_id: item.food_item_id,
            quantity_g: item.quantity_g,
            macros: {
              calories: item.calories,
              protein_g: item.protein_g,
              carbs_g: item.carbs_g,
              fat_g: item.fat_g,
              fiber_g: item.fiber_g,
            },
            foodItem: item.food_items ? {
              id: item.food_items.id,
              name: item.food_items.name,
              calories_per_100g: item.food_items.calories_per_100g,
              protein_g_per_100g: item.food_items.protein_g_per_100g,
              carbs_g_per_100g: item.food_items.carbs_g_per_100g,
              fat_g_per_100g: item.food_items.fat_g_per_100g,
              fiber_g_per_100g: item.food_items.fiber_g_per_100g,
            } : undefined,
          })),
        }));
        
        this.currentPlan = {
          id: plan.id,
          name: plan.name,
          start_date: plan.start_date,
          end_date: plan.end_date,
          notes: plan.notes,
          meals: transformedMeals,
        };
        
        // Fetch logs for this date
        await this.fetchLogs(date);
        
        // Fetch notes for this date
        await this.fetchNotes(date);
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load plan";
        this.error = message;
        console.error("Fetch plan error:", err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchLogs(date: string) {
      if (!this.currentPlan) return;
      
      try {
        const profileStore = useProfileStore();
        const supabase = getSupabase();
        
        // Get all food item IDs from the plan
        const foodItemIds = this.currentPlan.meals.flatMap(meal => 
          meal.items.map(item => item.id)
        );
        
        if (foodItemIds.length === 0) {
          this.logs = {};
          return;
        }
        
        const { data, error } = await supabase
          .from("diet_plan_logs")
          .select("id, food_item_id, consumed, consumed_at, macros")
          .eq("mentee_id", profileStore.id)
          .eq("diet_plan_id", this.currentPlan.id)
          .eq("log_date", date)
          .in("food_item_id", foodItemIds);
        
        if (error) throw new Error(error.message);
        
        this.logs = (data ?? []).reduce((acc, log) => {
          acc[log.food_item_id] = log;
          return acc;
        }, {} as Record<string, DietPlanLog>);
        
      } catch (err) {
        console.error("Fetch logs error:", err);
      }
    },
    
    async fetchNotes(date: string) {
      if (!this.currentPlan) return;
      
      try {
        const profileStore = useProfileStore();
        const supabase = getSupabase();
        
        const { data, error } = await supabase
          .from("diet_plan_notes")
          .select("notes")
          .eq("mentee_id", profileStore.id)
          .eq("diet_plan_id", this.currentPlan.id)
          .eq("log_date", date)
          .maybeSingle();
        
        if (error) throw new Error(error.message);
        
        if (data?.notes) {
          this.notes[date] = data.notes;
        } else {
          this.notes[date] = "";
        }
        
      } catch (err) {
        console.error("Fetch notes error:", err);
      }
    },
    
    async toggleConsumed(foodItemId: string, consumed: boolean) {
      if (!this.currentPlan) return;
      
      try {
        const profileStore = useProfileStore();
        const supabase = getSupabase();
        
        // Find the item to get macros
        const item = this.currentPlan.meals.flatMap(m => m.items).find(i => i.id === foodItemId);
        
        const { error } = await supabase
          .from("diet_plan_logs")
          .upsert({
            mentee_id: profileStore.id,
            diet_plan_id: this.currentPlan.id,
            food_item_id: foodItemId,
            log_date: new Date().toISOString().split("T")[0],
            consumed,
            consumed_at: consumed ? new Date().toISOString() : null,
            macros: item?.macros || {},
          });
        
        if (error) throw new Error(error.message);
        
        // Update local state
        this.logs[foodItemId] = {
          ...this.logs[foodItemId],
          id: this.logs[foodItemId]?.id || crypto.randomUUID(),
          food_item_id: foodItemId,
          consumed,
          consumed_at: consumed ? new Date().toISOString() : null,
          macros: item?.macros,
        };
        
      } catch (err) {
        console.error("Toggle consumed error:", err);
        throw err;
      }
    },
    
    async saveNotes(date: string, notes: string) {
      if (!this.currentPlan) return;
      
      try {
        const profileStore = useProfileStore();
        const supabase = getSupabase();
        
        const { error } = await supabase
          .from("diet_plan_notes")
          .upsert({
            mentee_id: profileStore.id,
            diet_plan_id: this.currentPlan.id,
            log_date: date,
            notes,
          });
        
        if (error) throw new Error(error.message);
        
        this.notes[date] = notes;
        
      } catch (err) {
        console.error("Save notes error:", err);
        throw err;
      }
    },
    
    clearPlan() {
      this.currentPlan = null;
      this.logs = {};
      this.notes = {};
    },
  },
});