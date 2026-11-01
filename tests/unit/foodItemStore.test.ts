import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useFoodItemStore } from "@/stores/foodItem";

// Create a proper chainable mock for Supabase that is thenable
const createChain = (
  data: Record<string, unknown>[],
  error: Error | null = null,
  count = 1,
) => {
  const result = { data, error, count };
  const chain = {
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] ?? null, error }),
    then: vi.fn((resolve) => Promise.resolve(result).then(resolve)),
  };
  return chain;
};

const mockFrom = vi.fn();
const mockAuthGetUser = vi.fn();

vi.mock("@/utils/supabase", () => ({
  getSupabase: () => ({
    from: mockFrom,
    auth: {
      getUser: mockAuthGetUser,
    },
  }),
}));

describe("foodItemStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("searchFoods returns empty array when query is empty", async () => {
    const store = useFoodItemStore();
    const results = await store.searchFoods("");
    expect(results).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("searchFoods calls Supabase with ILIKE filter", async () => {
    const mockData = [
      {
        id: "1",
        name: "Chicken breast, raw",
        calories_per_100g: 165,
        protein_g_per_100g: 31,
        carbs_g_per_100g: 0,
        fat_g_per_100g: 3.6,
        fiber_g_per_100g: 0,
        source: "usda",
      },
    ];

    const chain = createChain(mockData);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    });

    const store = useFoodItemStore();
    const results = await store.searchFoods("chicken");

    expect(mockFrom).toHaveBeenCalledWith("food_items");
    expect(chain.ilike).toHaveBeenCalledWith("name", "%chicken%");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Chicken breast, raw");
  });

  it("createCustomFood inserts to Supabase and returns new item", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    const insertChain = createChain([
      {
        id: "new-id",
        name: "Whey isolate",
        calories_per_100g: 370,
        protein_g_per_100g: 90,
        carbs_g_per_100g: 3,
        fat_g_per_100g: 1,
        fiber_g_per_100g: 0,
        source: "custom",
        created_by: "user-id",
      },
    ]);

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(insertChain),
      }),
    });

    const store = useFoodItemStore();
    const input = {
      name: "Whey isolate",
      calories_per_100g: 370,
      protein_g_per_100g: 90,
      carbs_g_per_100g: 3,
      fat_g_per_100g: 1,
      fiber_g_per_100g: 0,
    };

    const result = await store.createCustomFood(input);

    expect(result.name).toBe("Whey isolate");
    expect(result.source).toBe("custom");
    expect(mockFrom).toHaveBeenCalledWith("food_items");
  });

  it("searchFoods caches results in memory", async () => {
    const mockData = [
      {
        id: "1",
        name: "Chicken breast, raw",
        calories_per_100g: 165,
        protein_g_per_100g: 31,
        carbs_g_per_100g: 0,
        fat_g_per_100g: 3.6,
        fiber_g_per_100g: 0,
        source: "usda",
      },
    ];

    const chain = createChain(mockData);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    });

    const store = useFoodItemStore();
    await store.searchFoods("chicken");
    await store.searchFoods("chicken");

    // Second call should use cache, so mockFrom called once
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});
