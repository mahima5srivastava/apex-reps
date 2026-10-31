# Diet Plan Feature — Requirements Specification

## Overview

Enable a single coach to create and assign daily diet plans to mentees. Mentees view their assigned plan for any date, mark food items as consumed, track macro progress via horizontal progress bars, and add notes.

---

## Data Model

### New Tables

#### `food_items` (Global Food Database)

Single coach → global visibility. Raw items only. Quantity in grams.

| Column               | Type           | Constraints                  | Description                                  |
| -------------------- | -------------- | ---------------------------- | -------------------------------------------- |
| `id`                 | `uuid`         | PK, `gen_random_uuid()`      | Unique food ID                               |
| `name`               | `varchar`      | NOT NULL, UNIQUE             | Canonical name (e.g., "Chicken breast, raw") |
| `calories_per_100g`  | `int`          | NOT NULL                     | Calories per 100g                            |
| `protein_g_per_100g` | `numeric(6,2)` | NOT NULL                     | Protein per 100g                             |
| `carbs_g_per_100g`   | `numeric(6,2)` | NOT NULL                     | Carbs per 100g                               |
| `fat_g_per_100g`     | `numeric(6,2)` | NOT NULL                     | Fat per 100g                                 |
| `fiber_g_per_100g`   | `numeric(6,2)` | NOT NULL                     | Fiber per 100g                               |
| `source`             | `varchar`      | NOT NULL, DEFAULT `'custom'` | `'usda'` \| `'custom'`                       |
| `usda_fdc_id`        | `int`          | —                            | USDA FoodData Central ID (if sourced)        |
| `created_by`         | `uuid`         | FK → `profiles(id)`          | Coach who added (if custom)                  |
| `created_at`         | `timestamptz`  | NOT NULL, `now()`            |                                              |
| `updated_at`         | `timestamptz`  | NOT NULL, `now()`            |                                              |

**Indexes:** PK on `id`, UNIQUE on `name`, index on `source`.

**RLS:** `SELECT` for all authenticated; `INSERT` for coach role; `UPDATE/DELETE` for creator.

#### `diet_plans`

One plan template per mentee per date range.

| Column       | Type          | Constraints                           | Description                              |
| ------------ | ------------- | ------------------------------------- | ---------------------------------------- |
| `id`         | `uuid`        | PK, `gen_random_uuid()`               | Unique plan ID                           |
| `mentee_id`  | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE | Target mentee                            |
| `coach_id`   | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE | Creating coach                           |
| `name`       | `varchar`     | NOT NULL                              | Plan name (e.g., "Cutting Phase Week 1") |
| `start_date` | `date`        | NOT NULL                              | Plan effective from                      |
| `end_date`   | `date`        | NOT NULL                              | Plan effective until                     |
| `notes`      | `text`        | —                                     | Coach notes for the period               |
| `created_at` | `timestamptz` | NOT NULL, `now()`                     | Creation timestamp                       |
| `updated_at` | `timestamptz` | NOT NULL, `now()`                     | Last update timestamp                    |

**Indexes:** PK on `id`, FK on `mentee_id`, FK on `coach_id`, unique on `(mentee_id, start_date)` — one active plan per mentee per date.

#### `diet_plan_meals`

Meals within a diet plan (Breakfast, Lunch, Dinner, Snack 1..N).

| Column          | Type          | Constraints                             | Description                                            |
| --------------- | ------------- | --------------------------------------- | ------------------------------------------------------ |
| `id`            | `uuid`        | PK, `gen_random_uuid()`                 | Unique meal ID                                         |
| `diet_plan_id`  | `uuid`        | NOT NULL, FK → `diet_plans(id)` CASCADE | Parent plan                                            |
| `name`          | `varchar`     | NOT NULL                                | 'Breakfast' \| 'Lunch' \| 'Dinner' \| 'Snack'          |
| `display_order` | `int`         | NOT NULL                                | Sort order (Breakfast=1, Lunch=2, Dinner=3, Snacks=4+) |
| `created_at`    | `timestamptz` | NOT NULL, `now()`                       |                                                        |

**Indexes:** PK on `id`, FK on `diet_plan_id`, unique on `(diet_plan_id, name, display_order)`.

#### `diet_plan_food_items`

Individual food items within a meal. Links to `food_items` for macro auto-calc.

| Column          | Type           | Constraints                                  | Description                                                  |
| --------------- | -------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `id`            | `uuid`         | PK, `gen_random_uuid()`                      | Unique item ID                                               |
| `meal_id`       | `uuid`         | NOT NULL, FK → `diet_plan_meals(id)` CASCADE | Parent meal                                                  |
| `food_item_id`  | `uuid`         | NOT NULL, FK → `food_items(id)`              | Reference to food database                                   |
| `quantity_g`    | `numeric(8,2)` | NOT NULL                                     | Quantity in grams                                            |
| `calories`      | `int`          | NOT NULL                                     | Calculated: `food_item.calories_per_100g * quantity_g / 100` |
| `protein_g`     | `numeric(6,2)` | NOT NULL                                     | Calculated                                                   |
| `carbs_g`       | `numeric(6,2)` | NOT NULL                                     | Calculated                                                   |
| `fat_g`         | `numeric(6,2)` | NOT NULL                                     | Calculated                                                   |
| `fiber_g`       | `numeric(6,2)` | NOT NULL                                     | Calculated                                                   |
| `display_order` | `int`          | NOT NULL                                     | Sort order within meal                                       |
| `created_at`    | `timestamptz`  | NOT NULL, `now()`                            |                                                              |

**Indexes:** PK on `id`, FK on `meal_id`, FK on `food_item_id`.

#### `diet_plan_logs` (Mentee Consumption Tracking)

Tracks which items the mentee has consumed for a specific date.

| Column         | Type          | Constraints                                       | Description                    |
| -------------- | ------------- | ------------------------------------------------- | ------------------------------ |
| `id`           | `uuid`        | PK, `gen_random_uuid()`                           | Unique log ID                  |
| `mentee_id`    | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE             | Mentee user                    |
| `diet_plan_id` | `uuid`        | NOT NULL, FK → `diet_plans(id)` CASCADE           | Plan reference                 |
| `food_item_id` | `uuid`        | NOT NULL, FK → `diet_plan_food_items(id)` CASCADE | Food item                      |
| `log_date`     | `date`        | NOT NULL                                          | Date of consumption            |
| `consumed`     | `boolean`     | NOT NULL, DEFAULT `false`                         | Whether consumed               |
| `consumed_at`  | `timestamptz` | —                                                 | Timestamp when marked consumed |
| `created_at`   | `timestamptz` | NOT NULL, `now()`                                 |                                |
| `updated_at`   | `timestamptz` | NOT NULL, `now()`                                 |                                |

**Indexes:** PK on `id`, FK on `mentee_id`, FK on `diet_plan_id`, FK on `food_item_id`, unique on `(mentee_id, food_item_id, log_date)`.

#### `diet_plan_notes` (Mentee Daily Notes)

Free-form notes per mentee per date.

| Column         | Type          | Constraints                             | Description                |
| -------------- | ------------- | --------------------------------------- | -------------------------- |
| `id`           | `uuid`        | PK, `gen_random_uuid()`                 |                            |
| `mentee_id`    | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE   |                            |
| `diet_plan_id` | `uuid`        | NOT NULL, FK → `diet_plans(id)` CASCADE |                            |
| `log_date`     | `date`        | NOT NULL                                |                            |
| `notes`        | `text`        | —                                       | Mentee's notes for the day |
| `created_at`   | `timestamptz` | NOT NULL, `now()`                       |                            |
| `updated_at`   | `timestamptz` | NOT NULL, `now()`                       |                            |

**Indexes:** PK on `id`, FK on `mentee_id`, FK on `diet_plan_id`, unique on `(mentee_id, diet_plan_id, log_date)`.

---

## RLS Policies

### `food_items`

| Policy                 | Command          | Role            | Condition                                                     |
| ---------------------- | ---------------- | --------------- | ------------------------------------------------------------- |
| All authenticated read | `SELECT`         | `authenticated` | `true`                                                        |
| Coach insert           | `INSERT`         | `authenticated` | `(SELECT role FROM profiles WHERE id = auth.uid()) = 'coach'` |
| Creator update/delete  | `UPDATE, DELETE` | `authenticated` | `auth.uid() = created_by`                                     |

### `diet_plans`

| Policy                        | Command  | Role            | Condition                |
| ----------------------------- | -------- | --------------- | ------------------------ |
| Coach CRUD own mentees' plans | `ALL`    | `authenticated` | `auth.uid() = coach_id`  |
| Mentee read assigned plans    | `SELECT` | `authenticated` | `auth.uid() = mentee_id` |

### `diet_plan_meals`

| Policy               | Command  | Role            | Condition                                                                                       |
| -------------------- | -------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Coach CRUD via plan  | `ALL`    | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.coach_id = auth.uid())`  |
| Mentee read via plan | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.mentee_id = auth.uid())` |

### `diet_plan_food_items`

| Policy               | Command  | Role            | Condition                                                                                                                                     |
| -------------------- | -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Coach CRUD via plan  | `ALL`    | `authenticated` | `EXISTS (SELECT 1 FROM diet_plan_meals dm JOIN diet_plans dp ON dp.id = dm.diet_plan_id WHERE dm.id = meal_id AND dp.coach_id = auth.uid())`  |
| Mentee read via plan | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plan_meals dm JOIN diet_plans dp ON dp.id = dm.diet_plan_id WHERE dm.id = meal_id AND dp.mentee_id = auth.uid())` |

### `diet_plan_logs`

| Policy                 | Command  | Role            | Condition                                                                                      |
| ---------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------------- |
| Mentee CRUD own logs   | `ALL`    | `authenticated` | `auth.uid() = mentee_id`                                                                       |
| Coach read mentee logs | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.coach_id = auth.uid())` |

### `diet_plan_notes`

| Policy                  | Command  | Role            | Condition                                                                                      |
| ----------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------------- |
| Mentee CRUD own notes   | `ALL`    | `authenticated` | `auth.uid() = mentee_id`                                                                       |
| Coach read mentee notes | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.coach_id = auth.uid())` |

---

## UI Flows

### Coach Flow

**Page: `/coach/diet-plans` (or `/diet-plans` with role guard)**

1. **List View** — Cards/table showing all mentees with their current/upcoming diet plans
   - Mentee name, active plan name, date range, status (active/upcoming/expired)
   - Action: "Create Plan" / "Edit Plan" / "View Plan"

2. **Create/Edit Plan Page** — `/coach/diet-plans/new` or `/coach/diet-plans/:id/edit`
   - Select mentee (dropdown of coach's mentees)
   - Plan name, start date, end date, coach notes
   - **Meal Builder** — Add meals (Breakfast, Lunch, Dinner, Snack 1, Snack 2...)
     - For each meal: add food items via **Food Selector**
     - **Food Selector** — Autocomplete dropdown searching `food_items.name`
       - Select existing → enter quantity (grams) → macros auto-calculated
       - "Add Custom Food" → modal: name, macros per 100g → saves to `food_items` (source=`custom`) → available in dropdown
     - Meal-level macro totals shown automatically
   - Save → creates `diet_plan` + `diet_plan_meals` + `diet_plan_food_items`

3. **Plan Detail (Read-Only for Coach)** — View assigned plan with mentee's consumption logs

### Mentee Flow

**Page: `/diet-plan` (new tab in bottom nav or dashboard link)**

1. **Date Selector** — Top bar with date picker (default: today). Can navigate to any date within active plan range.
2. **Progress Bars (5 horizontal)** — Calories, Protein, Carbs, Fat, Fiber
   - Show `consumed / planned` with percentage fill
   - Initially show `0 / planned` (planned = sum of all food items for that date's plan)
3. **Meal Sections** (collapsible cards, mobile-friendly)
   - Each meal: name (Breakfast/Lunch/Dinner/Snack), meal-level macro totals
   - Food items as rows: `[checkbox] name — quantity — calories`
   - Checkbox toggles `diet_plan_logs.consumed` → updates progress bars in real-time
   - Optimistic UI update, sync to Supabase
4. **Notes Section** — Textarea at bottom, auto-saves to `diet_plan_notes`
5. **Offline Support** — Cache active plan + logs in IndexedDB (via `@vueuse/core` `useIndexedDB` or similar). Sync on reconnect.

---

## Navigation & Integration

- **Bottom Nav / Sidebar**: Add "Diet Plan" tab (icon: `i-lucide-utensils` or similar)
- **Role-based visibility**: Coach sees management UI; Mentee sees tracking UI
- **Profile store**: Add `isCoach` getter (`role === 'coach'`)
- **Middleware**: No new middleware needed; page-level role checks

---

## Technical Implementation

### Stores

- `useDietPlanStore` — Coach: CRUD plans, meals, items. Mentee: fetch plan for date, fetch/sync logs, fetch/sync notes.
- `useFoodItemStore` — Search food items, create custom foods, cache USDA data.
- Reuse patterns from `statsStore` (transactional inserts, error handling, toast).

### Components (New)

- `DietPlanProgressBars.vue` — 5 horizontal progress bars with `consumed/planned` labels
- `DietPlanMealCard.vue` — Collapsible meal card with food item rows + checkboxes
- `DietPlanFoodItemForm.vue` — Form for coach to add/edit food items (uses FoodSelector)
- `FoodSelector.vue` — Autocomplete dropdown for `food_items` + "Add Custom Food" modal
- `DietPlanDatePicker.vue` — Date navigation with plan range constraints
- `DietPlanNotes.vue` — Auto-save textarea

### Utils

- Macro calculation helpers (sum meal items, sum daily totals)
- Date range helpers (get active plan for date)
- USDA API client (search, fetch by FDC ID)

### Caching Strategy (Offline)

- On plan fetch: store in IndexedDB keyed by `mentee_id + plan_id + date`
- On log/note change: write to IndexedDB immediately, queue Supabase mutation
- Background sync: `navigator.onLine` listener + periodic flush
- Food items: cache search results in IndexedDB, refresh periodically

### Type Generation

- Run `supabase gen types typescript --local > app/types/database.ts` after migration

---

## Migration Order

1. Create tables in dependency order: `food_items` → `diet_plans` → `diet_plan_meals` → `diet_plan_food_items` → `diet_plan_logs` → `diet_plan_notes`
2. Add RLS policies
3. Add indexes
4. Add `updated_at` triggers (reuse existing pattern if any)
5. Regenerate types
6. Seed `food_items` with USDA raw foods (script provided)

---

## Testing Requirements (E2E)

### Coach Flows

- [ ] Coach logs in → sees diet plan management page
- [ ] Coach creates new plan for mentee with multiple meals and items
- [ ] Coach searches food items via autocomplete, selects, enters grams → macros auto-fill
- [ ] Coach adds custom food → appears in autocomplete for future use
- [ ] Coach edits existing plan (add/remove meals, update items)
- [ ] Coach views mentee's consumption logs for a date

### Mentee Flows

- [ ] Mentee logs in → sees Diet Plan tab
- [ ] Mentee views today's plan with progress bars at 0/planned
- [ ] Mentee checks off food items → progress bars update in real-time
- [ ] Mentee navigates to previous date → sees that day's plan and logs
- [ ] Mentee adds/edits notes → persists on reload
- [ ] Offline: mark items consumed offline → sync on reconnect

### Auth/RLS

- [ ] Mentee cannot access coach management pages
- [ ] Mentee cannot see other mentees' plans
- [ ] Coach cannot modify mentee logs/notes (read-only)
- [ ] Mentee can read food_items; only coach can insert custom foods

---

## Acceptance Criteria

1. **Coach** can create a diet plan for any mentee with Breakfast, Lunch, Dinner, and N Snacks
2. **Each food item** selected from autocomplete dropdown (USDA + custom), quantity in grams → macros auto-calculated
3. **Coach** can add custom foods → saved to database, available in dropdown
4. **Meal totals** show summed macros/calories
5. **Mentee** sees 5 progress bars (calories, protein, carbs, fat, fiber) showing `consumed / planned`
6. **Mentee** can check off items → progress bars fill incrementally
7. **Mentee** can navigate to any date within plan range
8. **Mentee** can add/edit daily notes
9. **Offline** consumption marking works and syncs
10. **RLS** enforces coach/mentee boundaries
11. **Mobile-first** responsive layout (collapsible meals, sticky progress bars)

---

## Open Questions (Resolved)

| #   | Question                  | Resolution                                                       |
| --- | ------------------------- | ---------------------------------------------------------------- |
| 1   | Coach-mentee relationship | `profiles.role` — single coach, all mentees have `role='mentee'` |
| 2   | Plan assignment           | One active plan per mentee per date (unique constraint)          |
| 3   | Meal structure            | Fixed 3 meals + N snacks, coach defines snacks                   |
| 4   | Macro tracking            | 5 progress bars: calories, protein, carbs, fat, fiber            |
| 5   | Consumption logging       | Per-item checkbox, per-date logs                                 |
| 6   | Notes                     | Per-date free-text, mentee-only write                            |
| 7   | Offline                   | IndexedDB cache + background sync                                |
| 8   | Real-time                 | Not required                                                     |
| 9   | Subscription gating       | Available for all plans (premium app)                            |
| 10  | Navigation                | New page/tab, mobile-first                                       |
| 11  | Food database             | `food_items` table, USDA seed + coach custom foods               |
| 12  | Food selection            | Autocomplete dropdown, quantity in grams only                    |
| 13  | Macro calc                | Per 100g stored, scaled by quantity_g                            |

---

## Next Steps

1. Review and approve this spec
2. Create migration files
3. Implement stores, components, pages
4. Write E2E tests
5. Update `AGENTS.md` and `ai-workspace/database/` docs
