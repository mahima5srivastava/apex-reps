import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

/** Food item row from database (with all fields) */
export type FoodItem = Tables<"food_items">;

/** Food item insert payload */
export type FoodItemInsert = TablesInsert<"food_items">;

/** Food item update payload */
export type FoodItemUpdate = TablesUpdate<"food_items">;

/** Minimal food item for search results */
export interface FoodItemSearchResult {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  fiber_g_per_100g: number;
  source: "usda" | "custom";
}

/** Input for creating a custom food */
export interface CustomFoodInput {
  name: string;
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  fiber_g_per_100g: number;
}

/** Search query with pagination */
export interface FoodSearchQuery {
  query: string;
  limit?: number;
  offset?: number;
}

/** Search result with metadata */
export interface FoodSearchResult {
  items: FoodItemSearchResult[];
  total: number;
  cached: boolean;
}

/** State for food item store */
export interface FoodItemState {
  searchResults: FoodItemSearchResult[];
  searchCache: Map<string, { data: FoodItemSearchResult[]; timestamp: number }>;
  loading: boolean;
  error: string | null;
}
