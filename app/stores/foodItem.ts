import { defineStore } from "pinia";
import { getSupabase } from "@/utils/supabase";
import type { FoodItemSearchResult, CustomFoodInput } from "@/types/food";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_LIMIT = 20;

export const useFoodItemStore = defineStore("foodItem", {
  state: () => ({
    searchResults: [] as FoodItemSearchResult[],
    searchCache: new Map<
      string,
      { data: FoodItemSearchResult[]; timestamp: number }
    >(),
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    lastError: (state) => state.error,
  },

  actions: {
    async searchFoods(query: string): Promise<FoodItemSearchResult[]> {
      const trimmed = query.trim();
      if (!trimmed) {
        this.searchResults = [];
        return [];
      }

      const cacheKey = `search:${trimmed.toLowerCase()}`;
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        this.searchResults = cached.data;
        return cached.data;
      }

      this.loading = true;
      this.error = null;

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("food_items")
          .select(
            "id, name, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, fiber_g_per_100g, source",
            { count: "exact" },
          )
          .ilike("name", `%${trimmed}%`)
          .order("name")
          .limit(SEARCH_LIMIT);

        if (error) throw new Error(error.message);

        const results: FoodItemSearchResult[] = (data ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          calories_per_100g: item.calories_per_100g,
          protein_g_per_100g: item.protein_g_per_100g,
          carbs_g_per_100g: item.carbs_g_per_100g,
          fat_g_per_100g: item.fat_g_per_100g,
          fiber_g_per_100g: item.fiber_g_per_100g,
          source: item.source as "usda" | "custom",
        }));

        this.searchCache.set(cacheKey, {
          data: results,
          timestamp: Date.now(),
        });
        this.searchResults = results;
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        this.error = message;
        console.error("Food search error:", err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createCustomFood(
      input: CustomFoodInput,
    ): Promise<FoodItemSearchResult> {
      this.loading = true;
      this.error = null;

      try {
        const supabase = getSupabase();
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("food_items")
          .insert({
            name: input.name,
            calories_per_100g: input.calories_per_100g,
            protein_g_per_100g: input.protein_g_per_100g,
            carbs_g_per_100g: input.carbs_g_per_100g,
            fat_g_per_100g: input.fat_g_per_100g,
            fiber_g_per_100g: input.fiber_g_per_100g,
            source: "custom",
            created_by: user.user.id,
          })
          .select(
            "id, name, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, fiber_g_per_100g, source",
          )
          .single();

        if (error) throw new Error(error.message);

        const result: FoodItemSearchResult = {
          id: data.id,
          name: data.name,
          calories_per_100g: data.calories_per_100g,
          protein_g_per_100g: data.protein_g_per_100g,
          carbs_g_per_100g: data.carbs_g_per_100g,
          fat_g_per_100g: data.fat_g_per_100g,
          fiber_g_per_100g: data.fiber_g_per_100g,
          source: data.source as "usda" | "custom",
        };

        // Invalidate search cache since new item may match existing queries
        this.searchCache.clear();

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create food";
        this.error = message;
        console.error("Create custom food error:", err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    clearCache() {
      this.searchCache.clear();
    },
  },
});
