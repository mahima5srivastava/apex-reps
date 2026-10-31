# Entity Relationships

## ER Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "id = id"
    AUTH_USERS ||--o{ STATS : "id = user_id"
    AUTH_USERS ||--o{ PHOTOS : "id = user_id"
    AUTH_USERS ||--o{ SUBSCRIPTIONS : "id = user_id"
    STATS ||--o{ PHOTOS : "id = stat_id"
    PLANS ||--o{ SUBSCRIPTIONS : "id = plan_id"
    PROFILES ||--o{ FOOD_ITEMS : "id = created_by"
    PROFILES ||--o{ DIET_PLANS : "id = mentee_id"
    PROFILES ||--o{ DIET_PLANS : "id = coach_id"
    PROFILES ||--o{ DIET_PLAN_LOGS : "id = mentee_id"
    PROFILES ||--o{ DIET_PLAN_NOTES : "id = mentee_id"
    DIET_PLANS ||--o{ DIET_PLAN_MEALS : "id = diet_plan_id"
    DIET_PLAN_MEALS ||--o{ DIET_PLAN_FOOD_ITEMS : "id = meal_id"
    FOOD_ITEMS ||--o{ DIET_PLAN_FOOD_ITEMS : "id = food_item_id"
    DIET_PLANS ||--o{ DIET_PLAN_LOGS : "id = diet_plan_id"
    DIET_PLANS ||--o{ DIET_PLAN_NOTES : "id = diet_plan_id"
    DIET_PLAN_FOOD_ITEMS ||--o{ DIET_PLAN_LOGS : "id = food_item_id"

    AUTH_USERS {
        uuid id PK
        text email
        ...
    }

    PROFILES {
        uuid id PK,FK
        timestamptz created_at
        varchar name
        varchar role
        varchar sex
        double height
    }

    STATS {
        uuid id PK
        uuid user_id FK
        double weight
        double waist
        double hip
        double neck
        double bfp
        timestamptz created_at
    }

    PHOTOS {
        uuid id PK
        varchar filename
        varchar angle
        timestamptz created_at
        uuid stat_id FK
        uuid user_id FK
    }

    PLANS {
        uuid id PK
        varchar name
        numeric duration
        timestamptz created_at
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid plan_id FK
        uuid user_id FK
        date start_date
        date end_date
        timestamptz created_at
    }

    FOOD_ITEMS {
        uuid id PK
        varchar name UK
        int calories_per_100g
        numeric protein_g_per_100g
        numeric carbs_g_per_100g
        numeric fat_g_per_100g
        numeric fiber_g_per_100g
        varchar source
        int usda_fdc_id
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    DIET_PLANS {
        uuid id PK
        uuid mentee_id FK
        uuid coach_id FK
        varchar name
        date start_date
        date end_date
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    DIET_PLAN_MEALS {
        uuid id PK
        uuid diet_plan_id FK
        varchar name
        int display_order
        timestamptz created_at
    }

    DIET_PLAN_FOOD_ITEMS {
        uuid id PK
        uuid meal_id FK
        uuid food_item_id FK
        numeric quantity_g
        int calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        numeric fiber_g
        int display_order
        timestamptz created_at
    }

    DIET_PLAN_LOGS {
        uuid id PK
        uuid mentee_id FK
        uuid diet_plan_id FK
        uuid food_item_id FK
        date log_date
        boolean consumed
        timestamptz consumed_at
        timestamptz created_at
        timestamptz updated_at
    }

    DIET_PLAN_NOTES {
        uuid id PK
        uuid mentee_id FK
        uuid diet_plan_id FK
        date log_date
        text notes
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## Relationship Details

### `auth.users` → `profiles` (1:1)

- **FK:** `profiles.id` → `auth.users.id`
- **On Delete:** CASCADE (deleting user deletes profile)
- **Access:** User reads own profile via RLS

### `auth.users` → `stats` (1:N)

- **FK:** `stats.user_id` → `auth.users.id`
- **On Delete:** CASCADE
- **Access:** User inserts/reads own stats via RLS
- **Ordering:** `created_at` ascending for timeline

### `auth.users` → `photos` (1:N)

- **FK:** `photos.user_id` → `auth.users.id`
- **On Delete:** CASCADE
- **Redundant:** `photos` also links to `stats` → `stats.user_id` = `photos.user_id`
- **Purpose:** Direct RLS on `photos` without joining `stats`

### `auth.users` → `subscriptions` (1:N)

- **FK:** `subscriptions.user_id` → `auth.users.id`
- **On Delete:** CASCADE
- **Active subscription:** Latest by date range or single row per user

### `stats` → `photos` (1:N)

- **FK:** `photos.stat_id` → `stats.id`
- **On Delete:** CASCADE (deleting stat deletes its photos)
- **Angles per stat:** Up to 4 (`front`, `left`, `right`, `back`)
- **Dashboard query:** Filter `angle = 'left'` for comparison

### `plans` → `subscriptions` (1:N)

- **FK:** `subscriptions.plan_id` → `plans.id`
- **On Delete:** CASCADE
- **Plans:** Catalog (read-only for users)
- **Subscription:** Links user to plan + date range

---

### `profiles` → `food_items` (1:N, nullable)

- **FK:** `food_items.created_by` → `profiles.id`
- **On Delete:** SET NULL (USDA foods have NULL; custom foods keep coach reference)
- **Access:** All read; coach inserts; creator updates/deletes

### `profiles` → `diet_plans` (1:N as mentee, 1:N as coach)

- **FK:** `diet_plans.mentee_id` → `profiles.id` (CASCADE)
- **FK:** `diet_plans.coach_id` → `profiles.id` (CASCADE)
- **Unique:** `(mentee_id, start_date)` — one active plan per mentee per date
- **Access:** Coach CRUD own mentees; Mentee read own

### `diet_plans` → `diet_plan_meals` (1:N)

- **FK:** `diet_plan_meals.diet_plan_id` → `diet_plans.id`
- **On Delete:** CASCADE
- **Fixed meals:** Breakfast (1), Lunch (2), Dinner (3), Snacks (4+)
- **Unique:** `(diet_plan_id, name, display_order)`

### `diet_plan_meals` → `diet_plan_food_items` (1:N)

- **FK:** `diet_plan_food_items.meal_id` → `diet_plan_meals.id`
- **On Delete:** CASCADE
- **Access:** Via parent plan (coach CRUD, mentee read)

### `food_items` → `diet_plan_food_items` (1:N)

- **FK:** `diet_plan_food_items.food_item_id` → `food_items.id`
- **On Delete:** RESTRICT (cannot delete food if used in plans)
- **Macros:** Stored per-100g in `food_items`; calculated at plan creation in `diet_plan_food_items`

### `diet_plans` → `diet_plan_logs` (1:N)

- **FK:** `diet_plan_logs.diet_plan_id` → `diet_plans.id`
- **On Delete:** CASCADE
- **Unique:** `(mentee_id, food_item_id, log_date)` — one log per item per day
- **Access:** Mentee CRUD own; Coach read mentee's

### `diet_plan_food_items` → `diet_plan_logs` (1:N)

- **FK:** `diet_plan_logs.food_item_id` → `diet_plan_food_items.id`
- **On Delete:** CASCADE

### `diet_plans` → `diet_plan_notes` (1:N)

- **FK:** `diet_plan_notes.diet_plan_id` → `diet_plans.id`
- **On Delete:** CASCADE
- **Unique:** `(mentee_id, diet_plan_id, log_date)` — one note per day
- **Access:** Mentee CRUD own; Coach read mentee's

---

## Query Patterns

### Dashboard Load (Parallel)

```sql
-- 1. Profile (own row)
SELECT * FROM profiles WHERE id = auth.uid();

-- 2. Active subscription (own row, current date range)
SELECT s.*, p.name, p.duration
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = auth.uid()
  AND s.start_date <= CURRENT_DATE
  AND s.end_date >= CURRENT_DATE
LIMIT 1;

-- 3. All stats (own, ordered)
SELECT * FROM stats WHERE user_id = auth.uid() ORDER BY created_at ASC;

-- 4. Left photos (own, deduped by stat_id)
SELECT DISTINCT ON (stat_id) filename, stat_id, created_at
FROM photos
WHERE user_id = auth.uid() AND angle = 'left'
ORDER BY stat_id, created_at ASC;
```

### Check-in Insert (Transactional)

```sql
-- 1. Insert stat (returns id)
INSERT INTO stats (user_id, weight, waist, hip, neck, bfp)
VALUES (auth.uid(), ..., ..., ..., ..., ...)
RETURNING id;

-- 2. For each photo: upload to storage, then
INSERT INTO photos (stat_id, user_id, angle, filename)
VALUES (stat_id, auth.uid(), 'left', 'userId_statId_left.jpg');
```

### Mentee Daily Diet Plan (Single Query with Joins)

```sql
-- Get active plan for date
SELECT dp.*
FROM diet_plans dp
WHERE dp.mentee_id = auth.uid()
  AND dp.start_date <= CURRENT_DATE
  AND dp.end_date >= CURRENT_DATE
LIMIT 1;

-- Get meals + items + macros for plan
SELECT dm.name AS meal_name, dm.display_order AS meal_order,
       dfi.*, fi.name AS food_name
FROM diet_plan_meals dm
JOIN diet_plan_food_items dfi ON dfi.meal_id = dm.id
JOIN food_items fi ON fi.id = dfi.food_item_id
WHERE dm.diet_plan_id = $1
ORDER BY dm.display_order, dfi.display_order;

-- Get consumption logs for date
SELECT dpl.*, dfi.food_item_id
FROM diet_plan_logs dpl
JOIN diet_plan_food_items dfi ON dfi.id = dpl.food_item_id
WHERE dpl.mentee_id = auth.uid()
  AND dpl.log_date = CURRENT_DATE;

-- Get notes for date
SELECT * FROM diet_plan_notes
WHERE mentee_id = auth.uid() AND log_date = CURRENT_DATE;
```

### Coach Create Plan (Transactional)

```sql
-- 1. Insert plan
INSERT INTO diet_plans (mentee_id, coach_id, name, start_date, end_date, notes)
VALUES ($mentee_id, auth.uid(), $name, $start, $end, $notes)
RETURNING id;

-- 2. Insert meals
INSERT INTO diet_plan_meals (diet_plan_id, name, display_order)
VALUES ($plan_id, 'Breakfast', 1), ($plan_id, 'Lunch', 2), ($plan_id, 'Dinner', 3), ($plan_id, 'Snack', 4)
RETURNING id, name;

-- 3. Insert food items (macros calculated from food_items per 100g * quantity_g / 100)
INSERT INTO diet_plan_food_items (meal_id, food_item_id, quantity_g, calories, protein_g, carbs_g, fat_g, fiber_g, display_order)
VALUES ($meal_id, $food_item_id, $qty_g,
        fi.calories_per_100g * $qty_g / 100,
        fi.protein_g_per_100g * $qty_g / 100,
        fi.carbs_g_per_100g * $qty_g / 100,
        fi.fat_g_per_100g * $qty_g / 100,
        fi.fiber_g_per_100g * $qty_g / 100,
        $order);
```

---

## Cascade Delete Behavior

| Delete Trigger                | Cascades To                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| `auth.users` row deleted      | `profiles`, `stats`, `photos`, `subscriptions`                            |
| `stats` row deleted           | `photos` (via `stat_id`)                                                  |
| `plans` row deleted           | `subscriptions` (via `plan_id`)                                           |
| `profiles` (coach) deleted    | `food_items.created_by` SET NULL, `diet_plans` CASCADE                    |
| `profiles` (mentee) deleted   | `diet_plans` CASCADE, `diet_plan_logs` CASCADE, `diet_plan_notes` CASCADE |
| `diet_plans` row deleted      | `diet_plan_meals`, `diet_plan_logs`, `diet_plan_notes` CASCADE            |
| `diet_plan_meals` row deleted | `diet_plan_food_items` CASCADE                                            |

**Note:** Storage objects in `progress_photos` bucket are **NOT** automatically deleted — app handles cleanup via rollback logic or manual admin action.

**Note:** `food_items` with `source = 'usda'` have `created_by = NULL` — deleting coach does not affect USDA foods.
