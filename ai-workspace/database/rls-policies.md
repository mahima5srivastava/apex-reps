# Row Level Security Policies

All tables have RLS enabled. Policies restrict access to authenticated users' own data only, except `plans` and `food_items` which are readable by all authenticated users.

---

## `profiles`

| Policy                        | Command  | Role            | Condition         |
| ----------------------------- | -------- | --------------- | ----------------- |
| `Enable read access for self` | `SELECT` | `authenticated` | `auth.uid() = id` |

**Notes:**

- No INSERT/UPDATE/DELETE policies — profiles likely managed via Supabase Auth triggers or admin
- Users can only read their own profile

---

## `stats`

| Policy                        | Command  | Role            | Condition              |
| ----------------------------- | -------- | --------------- | ---------------------- |
| `Enable insert for self`      | `INSERT` | `authenticated` | `auth.uid() = user_id` |
| `Enable read access for self` | `SELECT` | `authenticated` | `auth.uid() = user_id` |

**Notes:**

- Users can insert their own check-ins
- Users can read only their own check-ins
- No UPDATE/DELETE policies — stats are immutable once created

---

## `photos`

| Policy                   | Command  | Role            | Condition              |
| ------------------------ | -------- | --------------- | ---------------------- |
| `Enable insert for self` | `INSERT` | `authenticated` | `auth.uid() = user_id` |
| `Enable read for self`   | `SELECT` | `authenticated` | `auth.uid() = user_id` |

**Notes:**

- Users can insert photo records for their own check-ins
- Users can read only their own photo records
- Storage bucket access controlled separately (see [storage.md](./storage.md))

---

## `plans`

| Policy                                       | Command  | Role            | Condition |
| -------------------------------------------- | -------- | --------------- | --------- |
| `Enable read access for authenticated users` | `SELECT` | `authenticated` | `true`    |

**Notes:**

- All authenticated users can read all plans
- No INSERT/UPDATE/DELETE — plans are admin-managed catalog data

---

## `subscriptions`

| Policy                        | Command  | Role            | Condition              |
| ----------------------------- | -------- | --------------- | ---------------------- |
| `Enable read access for self` | `SELECT` | `authenticated` | `auth.uid() = user_id` |

**Notes:**

- Users can read only their own subscription
- No INSERT/UPDATE/DELETE — subscriptions likely managed via admin or webhook

---

## `food_items`

| Policy                                | Command  | Role            | Condition                                                     |
| ------------------------------------- | -------- | --------------- | ------------------------------------------------------------- |
| `food_items_select_all_authenticated` | `SELECT` | `authenticated` | `true`                                                        |
| `food_items_insert_coach`             | `INSERT` | `authenticated` | `(SELECT role FROM profiles WHERE id = auth.uid()) = 'coach'` |
| `food_items_update_creator`           | `UPDATE` | `authenticated` | `auth.uid() = created_by`                                     |
| `food_items_delete_creator`           | `DELETE` | `authenticated` | `auth.uid() = created_by`                                     |

**Notes:**

- All authenticated users can read food items (for autocomplete search)
- Only coaches can insert new foods
- Only creator can update/delete their custom foods
- USDA-sourced foods have `created_by = NULL` (immutable by coaches)

---

## `diet_plans`

| Policy                     | Command  | Role            | Condition                |
| -------------------------- | -------- | --------------- | ------------------------ |
| `diet_plans_coach_crud`    | `ALL`    | `authenticated` | `auth.uid() = coach_id`  |
| `diet_plans_mentee_select` | `SELECT` | `authenticated` | `auth.uid() = mentee_id` |

**Notes:**

- Coach has full CRUD on their mentees' plans
- Mentee can only read their own assigned plans
- Unique constraint on `(mentee_id, start_date)` ensures one active plan per mentee per date

---

## `diet_plan_meals`

| Policy                          | Command  | Role            | Condition                                                                                       |
| ------------------------------- | -------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `diet_plan_meals_coach_crud`    | `ALL`    | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.coach_id = auth.uid())`  |
| `diet_plan_meals_mentee_select` | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.mentee_id = auth.uid())` |

**Notes:**

- Access controlled via parent `diet_plans` — coach/mentee permissions cascade
- No direct user_id on this table; relies on plan relationship

---

## `diet_plan_food_items`

| Policy                               | Command  | Role            | Condition                                                                                                                                     |
| ------------------------------------ | -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `diet_plan_food_items_coach_crud`    | `ALL`    | `authenticated` | `EXISTS (SELECT 1 FROM diet_plan_meals dm JOIN diet_plans dp ON dp.id = dm.diet_plan_id WHERE dm.id = meal_id AND dp.coach_id = auth.uid())`  |
| `diet_plan_food_items_mentee_select` | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plan_meals dm JOIN diet_plans dp ON dp.id = dm.diet_plan_id WHERE dm.id = meal_id AND dp.mentee_id = auth.uid())` |

**Notes:**

- Access controlled via meal → plan relationship
- Macro values stored at creation (calculated from food_items per 100g × quantity_g)

---

## `diet_plan_logs`

| Policy                        | Command  | Role            | Condition                                                                                      |
| ----------------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `diet_plan_logs_mentee_crud`  | `ALL`    | `authenticated` | `auth.uid() = mentee_id`                                                                       |
| `diet_plan_logs_coach_select` | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.coach_id = auth.uid())` |

**Notes:**

- Mentee has full CRUD on their own consumption logs
- Coach can read mentee logs for visibility (read-only)
- Unique constraint on `(mentee_id, food_item_id, log_date)` prevents duplicates

---

## `diet_plan_notes`

| Policy                         | Command  | Role            | Condition                                                                                      |
| ------------------------------ | -------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `diet_plan_notes_mentee_crud`  | `ALL`    | `authenticated` | `auth.uid() = mentee_id`                                                                       |
| `diet_plan_notes_coach_select` | `SELECT` | `authenticated` | `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp.id = diet_plan_id AND dp.coach_id = auth.uid())` |

**Notes:**

- Mentee has full CRUD on their own daily notes
- Coach can read mentee notes for visibility (read-only)
- Unique constraint on `(mentee_id, diet_plan_id, log_date)`

---

## Grants (Default Privileges)

The migration also sets broad grants to `anon`, `authenticated`, `postgres`, `service_role` on all tables. **However, RLS policies take precedence** — the grants alone don't bypass RLS. The policies above are the effective access control.

| Role            | Tables | Notes                                         |
| --------------- | ------ | --------------------------------------------- |
| `anon`          | All    | Granted but RLS blocks unauthenticated access |
| `authenticated` | All    | Granted + RLS allows own data                 |
| `postgres`      | All    | Superuser                                     |
| `service_role`  | All    | Bypasses RLS (server-side only)               |

---

## Security Model Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      auth.users                             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   profiles    │     │     stats     │     │   photos      │
│  (own row)    │     │  (own rows)   │     │  (own rows)   │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                              ▼
                     ┌───────────────┐
                     │  subscriptions│
                     │  (own row)    │
                     └───────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         plans                                │
│              (readable by all authenticated)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       food_items                             │
│         (readable by all, insert coach, update creator)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │         diet_plans                │
              │   Coach CRUD (own mentees)        │
              │   Mentee SELECT (own plans)       │
              └───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │diet_plan_meals│ │diet_plan_logs │ │diet_plan_notes│
      │  (via plan)   │ │  (mentee owns)│ │  (mentee owns)│
      └───────────────┘ └───────────────┘ └───────────────┘
              │
              ▼
      ┌───────────────┐
      │diet_plan_food_│
      │    _items     │
      │  (via meal)   │
      └───────────────┘
```
