/**
 * Macro calculation utilities for food items.
 * All macros stored per 100g in database; scaled by quantity_g at runtime.
 */

export interface FoodMacrosPer100g {
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  fiber_g_per_100g: number;
}

export interface CalculatedMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

/**
 * Calculate macros for a given quantity (in grams) based on per-100g values.
 * @param food - Food item with macros per 100g
 * @param quantityG - Quantity in grams (must be positive)
 * @returns Calculated macros for the given quantity
 * @throws Error if quantityG is not positive
 */
export function calculateMacros(
  food: FoodMacrosPer100g,
  quantityG: number,
): CalculatedMacros {
  if (quantityG <= 0) {
    throw new Error("Quantity must be positive");
  }

  const factor = quantityG / 100;

  return {
    calories: Math.round(food.calories_per_100g * factor),
    protein_g: Number((food.protein_g_per_100g * factor).toFixed(2)),
    carbs_g: Number((food.carbs_g_per_100g * factor).toFixed(2)),
    fat_g: Number((food.fat_g_per_100g * factor).toFixed(2)),
    fiber_g: Number((food.fiber_g_per_100g * factor).toFixed(2)),
  };
}

/**
 * Sum macros across multiple food items.
 * @param items - Array of calculated macros objects
 * @returns Total macros
 */
export function sumMacros(items: CalculatedMacros[]): CalculatedMacros {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein_g: Number((acc.protein_g + item.protein_g).toFixed(2)),
      carbs_g: Number((acc.carbs_g + item.carbs_g).toFixed(2)),
      fat_g: Number((acc.fat_g + item.fat_g).toFixed(2)),
      fiber_g: Number((acc.fiber_g + item.fiber_g).toFixed(2)),
    }),
    {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    },
  );
}
