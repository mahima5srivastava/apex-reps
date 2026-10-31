# Tables Schema

All tables in the `public` schema with Row Level Security enabled.

---

## `profiles`

One row per authenticated user. Linked to `auth.users` via `id`.

| Column       | Type               | Constraints                                 | Default    | Description                                     |
| ------------ | ------------------ | ------------------------------------------- | ---------- | ----------------------------------------------- |
| `id`         | `uuid`             | PK, FK → `auth.users(id)` ON DELETE CASCADE | —          | Auth user ID                                    |
| `created_at` | `timestamptz`      | NOT NULL                                    | `now()`    | Profile creation timestamp                      |
| `name`       | `varchar`          | NOT NULL                                    | —          | Display name                                    |
| `role`       | `varchar`          | NOT NULL                                    | `'mentee'` | User role (mentee/coach/etc.)                   |
| `sex`        | `varchar`          | NOT NULL                                    | `'female'` | `'male'` or `'female'` — used for body fat calc |
| `height`     | `double precision` | NOT NULL                                    | `70`       | Height in inches — used for body fat calc       |

**Indexes:** PK on `id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#profiles)

---

## `stats`

Each check-in measurement row. One per check-in event.

| Column       | Type               | Constraints                                       | Default             | Description                                                   |
| ------------ | ------------------ | ------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `id`         | `uuid`             | PK                                                | `gen_random_uuid()` | Unique stat ID                                                |
| `user_id`    | `uuid`             | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | —                   | Owner                                                         |
| `weight`     | `double precision` | NOT NULL                                          | —                   | Weight in kg                                                  |
| `waist`      | `double precision` | NOT NULL                                          | —                   | Waist in inches                                               |
| `hip`        | `double precision` | NOT NULL                                          | —                   | Hip in inches                                                 |
| `neck`       | `double precision` | NOT NULL                                          | —                   | Neck in inches                                                |
| `bfp`        | `double precision` | NOT NULL                                          | —                   | Body fat percentage (computed server-side via US Navy method) |
| `created_at` | `timestamptz`      | NOT NULL                                          | `now()`             | Check-in timestamp                                            |

**Indexes:** PK on `id`, FK on `user_id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#stats)

**Application Notes:**

- Inserted via `statsStore.insertStat()` with `bfp` pre-calculated in client using `calculateBodyFatPercentage()`
- Ordered by `created_at` ascending for charts
- One-to-many with `photos` via `stat_id`

---

## `photos`

One row per uploaded progress photo angle per check-in.

| Column       | Type          | Constraints                                         | Default             | Description                                           |
| ------------ | ------------- | --------------------------------------------------- | ------------------- | ----------------------------------------------------- |
| `id`         | `uuid`        | PK                                                  | `gen_random_uuid()` | Unique photo row ID                                   |
| `filename`   | `varchar`     | NOT NULL                                            | —                   | Storage object path (e.g., `userId_statId_angle.jpg`) |
| `angle`      | `varchar`     | NOT NULL                                            | —                   | `'front' \| 'left' \| 'right' \| 'back'`              |
| `created_at` | `timestamptz` | NOT NULL                                            | `now()`             | Upload timestamp                                      |
| `stat_id`    | `uuid`        | NOT NULL, FK → `public.stats(id)` ON DELETE CASCADE | `gen_random_uuid()` | Links to check-in                                     |
| `user_id`    | `uuid`        | FK → `auth.users(id)` ON DELETE CASCADE             | —                   | Owner (redundant with stat→user for RLS)              |

**Indexes:** PK on `id`, FK on `stat_id`, FK on `user_id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#photos)

**Application Notes:**

- Storage path format: `{userId}_{statId}_{angle}.{ext}` (see `buildPhotoStoragePath()`)
- Dashboard fetches only `angle = 'left'` for comparison view
- Signed URLs generated with 7-day expiry for display

---

## `plans`

Coaching plan catalog (read-only for clients).

| Column       | Type          | Constraints | Default             | Description                                |
| ------------ | ------------- | ----------- | ------------------- | ------------------------------------------ |
| `id`         | `uuid`        | PK          | `gen_random_uuid()` | Plan ID                                    |
| `name`       | `varchar`     | NOT NULL    | —                   | Plan name (e.g., "12-Week Transformation") |
| `duration`   | `numeric`     | NOT NULL    | —                   | Duration in weeks                          |
| `created_at` | `timestamptz` | NOT NULL    | `now()`             | Creation timestamp                         |

**Indexes:** PK on `id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#plans)

---

## `subscriptions`

Active plan subscription per user.

| Column       | Type          | Constraints                                         | Default             | Description        |
| ------------ | ------------- | --------------------------------------------------- | ------------------- | ------------------ |
| `id`         | `uuid`        | PK                                                  | `gen_random_uuid()` | Subscription ID    |
| `plan_id`    | `uuid`        | NOT NULL, FK → `public.plans(id)` ON DELETE CASCADE | —                   | Plan reference     |
| `user_id`    | `uuid`        | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE   | `gen_random_uuid()` | Subscriber         |
| `start_date` | `date`        | NOT NULL                                            | —                   | Subscription start |
| `end_date`   | `date`        | NOT NULL                                            | —                   | Subscription end   |
| `created_at` | `timestamptz` | NOT NULL                                            | `now()`             | Record creation    |

**Indexes:** PK on `id`, FK on `plan_id`, FK on `user_id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#subscriptions)

**Application Notes:**

- Dashboard shows active subscription via `subscriptionStore.fetchActiveSubscription()`
- Plan details fetched via `planStore.fetchPlan(planId)`

---

## `food_items`

Global food database (USDA + coach custom foods).

| Column               | Type           | Constraints         | Default             | Description                 |
| -------------------- | -------------- | ------------------- | ------------------- | --------------------------- |
| `id`                 | `uuid`         | PK                  | `gen_random_uuid()` | Unique food ID              |
| `name`               | `varchar`      | NOT NULL, UNIQUE    | —                   | Canonical name              |
| `calories_per_100g`  | `int`          | NOT NULL            | —                   | Calories per 100g           |
| `protein_g_per_100g` | `numeric(6,2)` | NOT NULL            | —                   | Protein per 100g            |
| `carbs_g_per_100g`   | `numeric(6,2)` | NOT NULL            | —                   | Carbs per 100g              |
| `fat_g_per_100g`     | `numeric(6,2)` | NOT NULL            | —                   | Fat per 100g                |
| `fiber_g_per_100g`   | `numeric(6,2)` | NOT NULL            | —                   | Fiber per 100g              |
| `source`             | `varchar`      | NOT NULL            | `'custom'`          | `'usda'` \| `'custom'`      |
| `usda_fdc_id`        | `int`          | —                   | —                   | USDA FoodData Central ID    |
| `created_by`         | `uuid`         | FK → `profiles(id)` | —                   | Coach who added (if custom) |
| `created_at`         | `timestamptz`  | NOT NULL            | `now()`             |                             |
| `updated_at`         | `timestamptz`  | NOT NULL            | `now()`             |                             |

**Indexes:** PK on `id`, UNIQUE on `name`, index on `source`, GIN on `name` (trgm)

**RLS Policies:** See [rls-policies.md](./rls-policies.md#food_items)

---

## `diet_plans`

One plan template per mentee per date range.

| Column       | Type          | Constraints                           | Default             | Description          |
| ------------ | ------------- | ------------------------------------- | ------------------- | -------------------- |
| `id`         | `uuid`        | PK                                    | `gen_random_uuid()` | Unique plan ID       |
| `mentee_id`  | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE | —                   | Target mentee        |
| `coach_id`   | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE | —                   | Creating coach       |
| `name`       | `varchar`     | NOT NULL                              | —                   | Plan name            |
| `start_date` | `date`        | NOT NULL                              | —                   | Plan effective from  |
| `end_date`   | `date`        | NOT NULL                              | —                   | Plan effective until |
| `notes`      | `text`        | —                                     | —                   | Coach notes          |
| `created_at` | `timestamptz` | NOT NULL                              | `now()`             |                      |
| `updated_at` | `timestamptz` | NOT NULL                              | `now()`             |                      |

**Indexes:** PK on `id`, FK on `mentee_id`, FK on `coach_id`, unique on `(mentee_id, start_date)`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#diet_plans)

---

## `diet_plan_meals`

Meals within a diet plan (Breakfast, Lunch, Dinner, Snack 1..N).

| Column          | Type          | Constraints                             | Default             | Description    |
| --------------- | ------------- | --------------------------------------- | ------------------- | -------------- |
| `id`            | `uuid`        | PK                                      | `gen_random_uuid()` | Unique meal ID |
| `diet_plan_id`  | `uuid`        | NOT NULL, FK → `diet_plans(id)` CASCADE | —                   | Parent plan    |
| `name`          | `varchar`     | NOT NULL                                | —                   | Meal name      |
| `display_order` | `int`         | NOT NULL                                | —                   | Sort order     |
| `created_at`    | `timestamptz` | NOT NULL                                | `now()`             |                |

**Indexes:** PK on `id`, FK on `diet_plan_id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#diet_plan_meals)

---

## `diet_plan_food_items`

Individual food items within a meal. Links to `food_items` for macro auto-calc.

| Column          | Type           | Constraints                                  | Default             | Description                |
| --------------- | -------------- | -------------------------------------------- | ------------------- | -------------------------- |
| `id`            | `uuid`         | PK                                           | `gen_random_uuid()` | Unique item ID             |
| `meal_id`       | `uuid`         | NOT NULL, FK → `diet_plan_meals(id)` CASCADE | —                   | Parent meal                |
| `food_item_id`  | `uuid`         | NOT NULL, FK → `food_items(id)` RESTRICT     | —                   | Reference to food database |
| `quantity_g`    | `numeric(8,2)` | NOT NULL                                     | —                   | Quantity in grams          |
| `calories`      | `int`          | NOT NULL                                     | —                   | Calculated macros          |
| `protein_g`     | `numeric(6,2)` | NOT NULL                                     | —                   | Calculated                 |
| `carbs_g`       | `numeric(6,2)` | NOT NULL                                     | —                   | Calculated                 |
| `fat_g`         | `numeric(6,2)` | NOT NULL                                     | —                   | Calculated                 |
| `fiber_g`       | `numeric(6,2)` | NOT NULL                                     | —                   | Calculated                 |
| `display_order` | `int`          | NOT NULL                                     | —                   | Sort order within meal     |
| `created_at`    | `timestamptz`  | NOT NULL                                     | `now()`             |                            |

**Indexes:** PK on `id`, FK on `meal_id`, FK on `food_item_id`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#diet_plan_food_items)

---

## `diet_plan_logs`

Mentee consumption tracking per date.

| Column         | Type          | Constraints                                       | Default             | Description           |
| -------------- | ------------- | ------------------------------------------------- | ------------------- | --------------------- |
| `id`           | `uuid`        | PK                                                | `gen_random_uuid()` | Unique log ID         |
| `mentee_id`    | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE             | —                   | Mentee user           |
| `diet_plan_id` | `uuid`        | NOT NULL, FK → `diet_plans(id)` CASCADE           | —                   | Plan reference        |
| `food_item_id` | `uuid`        | NOT NULL, FK → `diet_plan_food_items(id)` CASCADE | —                   | Food item             |
| `log_date`     | `date`        | NOT NULL                                          | —                   | Date of consumption   |
| `consumed`     | `boolean`     | NOT NULL                                          | `false`             | Whether consumed      |
| `consumed_at`  | `timestamptz` | —                                                 | —                   | Timestamp when marked |
| `created_at`   | `timestamptz` | NOT NULL                                          | `now()`             |                       |
| `updated_at`   | `timestamptz` | NOT NULL                                          | `now()`             |                       |

**Indexes:** PK on `id`, FKs, unique on `(mentee_id, food_item_id, log_date)`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#diet_plan_logs)

---

## `diet_plan_notes`

Mentee daily free-form notes.

| Column         | Type          | Constraints                             | Default             | Description    |
| -------------- | ------------- | --------------------------------------- | ------------------- | -------------- |
| `id`           | `uuid`        | PK                                      | `gen_random_uuid()` |                |
| `mentee_id`    | `uuid`        | NOT NULL, FK → `profiles(id)` CASCADE   | —                   |                |
| `diet_plan_id` | `uuid`        | NOT NULL, FK → `diet_plans(id)` CASCADE | —                   |                |
| `log_date`     | `date`        | NOT NULL                                | —                   |                |
| `notes`        | `text`        | —                                       | —                   | Mentee's notes |
| `created_at`   | `timestamptz` | NOT NULL                                | `now()`             |                |
| `updated_at`   | `timestamptz` | NOT NULL                                | `now()`             |                |

**Indexes:** PK on `id`, FKs, unique on `(mentee_id, diet_plan_id, log_date)`

**RLS Policies:** See [rls-policies.md](./rls-policies.md#diet_plan_notes)

---

## Foreign Key Summary

```
auth.users (id)
    │
    ├── profiles (id) ── CASCADE DELETE
    ├── stats (user_id) ── CASCADE DELETE
    ├── photos (user_id) ── CASCADE DELETE
    └── subscriptions (user_id) ── CASCADE DELETE

stats (id)
    └── photos (stat_id) ── CASCADE DELETE

plans (id)
    └── subscriptions (plan_id) ── CASCADE DELETE

profiles (id)
    ├── food_items (created_by) ── SET NULL
    ├── diet_plans (mentee_id, coach_id) ── CASCADE DELETE
    ├── diet_plan_logs (mentee_id) ── CASCADE DELETE
    └── diet_plan_notes (mentee_id) ── CASCADE DELETE

diet_plans (id)
    ├── diet_plan_meals (diet_plan_id) ── CASCADE DELETE
    ├── diet_plan_logs (diet_plan_id) ── CASCADE DELETE
    └── diet_plan_notes (diet_plan_id) ── CASCADE DELETE

diet_plan_meals (id)
    └── diet_plan_food_items (meal_id) ── CASCADE DELETE

food_items (id)
    └── diet_plan_food_items (food_item_id) ── RESTRICT
```
