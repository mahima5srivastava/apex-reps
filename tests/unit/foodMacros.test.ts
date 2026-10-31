import { describe, it, expect } from "vitest";
import { calculateMacros, sumMacros } from "@/utils/foodMacros";

describe("foodMacros utils", () => {
  const sampleFood = {
    calories_per_100g: 200,
    protein_g_per_100g: 20,
    carbs_g_per_100g: 10,
    fat_g_per_100g: 8,
    fiber_g_per_100g: 3,
  };

  it("calculates macros scaled by quantity in grams", () => {
    const result = calculateMacros(sampleFood, 150);

    expect(result.calories).toBe(300);
    expect(result.protein_g).toBe(30);
    expect(result.carbs_g).toBe(15);
    expect(result.fat_g).toBe(12);
    expect(result.fiber_g).toBe(4.5);
  });

  it("handles 100g (exact per-100g values)", () => {
    const result = calculateMacros(sampleFood, 100);

    expect(result.calories).toBe(200);
    expect(result.protein_g).toBe(20);
    expect(result.carbs_g).toBe(10);
    expect(result.fat_g).toBe(8);
    expect(result.fiber_g).toBe(3);
  });

  it("handles 50g (half values)", () => {
    const result = calculateMacros(sampleFood, 50);

    expect(result.calories).toBe(100);
    expect(result.protein_g).toBe(10);
    expect(result.carbs_g).toBe(5);
    expect(result.fat_g).toBe(4);
    expect(result.fiber_g).toBe(1.5);
  });

  it("handles decimal quantities", () => {
    const result = calculateMacros(sampleFood, 33.33);

    expect(result.calories).toBe(67);
    expect(result.protein_g).toBeCloseTo(6.67, 1);
    expect(result.carbs_g).toBeCloseTo(3.33, 1);
    expect(result.fat_g).toBeCloseTo(2.67, 1);
    expect(result.fiber_g).toBeCloseTo(1.0, 1);
  });

  it("throws on negative quantity", () => {
    expect(() => calculateMacros(sampleFood, -10)).toThrow(
      "Quantity must be positive",
    );
  });

  it("throws on zero quantity", () => {
    expect(() => calculateMacros(sampleFood, 0)).toThrow(
      "Quantity must be positive",
    );
  });

  it("sumMacros aggregates multiple items correctly", () => {
    const items = [
      { calories: 100, protein_g: 10, carbs_g: 5, fat_g: 4, fiber_g: 2 },
      { calories: 200, protein_g: 20, carbs_g: 10, fat_g: 8, fiber_g: 3 },
      { calories: 50, protein_g: 5, carbs_g: 2, fat_g: 1, fiber_g: 1 },
    ];

    const result = sumMacros(items);

    expect(result.calories).toBe(350);
    expect(result.protein_g).toBe(35);
    expect(result.carbs_g).toBe(17);
    expect(result.fat_g).toBe(13);
    expect(result.fiber_g).toBe(6);
  });

  it("sumMacros returns zeros for empty array", () => {
    const result = sumMacros([]);

    expect(result).toEqual({
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    });
  });
});
