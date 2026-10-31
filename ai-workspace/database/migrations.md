# Migration History

## Applied Migrations (in order)

### 1. `20260824164907_remote_schema.sql`

**Full schema + RLS + grants**

Creates all 5 tables with:

- Primary keys (UUID, `gen_random_uuid()`)
- Foreign keys to `auth.users` and cross-table references
- `ON DELETE CASCADE` on all FKs
- Row Level Security enabled on all tables
- RLS policies (see [rls-policies.md](./rls-policies.md))
- Broad grants to `anon`, `authenticated`, `postgres`, `service_role`
- Default privileges for future objects

**Tables created:** `photos`, `plans`, `profiles`, `stats`, `subscriptions`

**Key design decisions:**

- `profiles.id` = `auth.users.id` (1:1, no separate PK)
- `stats.user_id` + `photos.user_id` + `subscriptions.user_id` all FK to `auth.users`
- `photos.stat_id` FK to `stats.id` (cascade delete)
- `subscriptions.plan_id` FK to `plans.id` (cascade delete)
- `stats.bfp` stored (not computed) — calculated client-side on insert
- `photos.filename` stores storage object path, not original filename

---

### 2. `20260824220000_storage.sql`

**Storage bucket + policies**

- Creates private bucket `progress_photos`
- INSERT policy: authenticated users can upload
- SELECT policy: authenticated users can read
- No UPDATE/DELETE policies

---

### 3. `20261031120000_diet_plan_schema.sql`

**Diet Plan Feature: food_items, diet_plans, diet_plan_meals, diet_plan_food_items, diet_plan_logs, diet_plan_notes**

- Creates 6 new tables with full RLS, indexes, triggers
- `pg_trgm` extension for fuzzy food name search
- `food_items`: 52 seeded foods (USDA raw + Indian branded)
- Shared `set_updated_at()` trigger function for `updated_at` columns
- RLS: coach CRUD on mentee plans, mentee read own, coach read mentee logs/notes, all read food_items

**Tables created:** `food_items`, `diet_plans`, `diet_plan_meals`, `diet_plan_food_items`, `diet_plan_logs`, `diet_plan_notes`

**Key design decisions:**

- `food_items` per-100g macros; `diet_plan_food_items` stores calculated macros at creation time
- `quantity_g` numeric(8,2) — grams only, no unit conversion
- `source` enum: `'usda'` | `'custom'` — USDA seeded, coach adds custom
- `diet_plans` unique on `(mentee_id, start_date)` — one active plan per mentee per date
- `diet_plan_logs` unique on `(mentee_id, food_item_id, log_date)` — one log per item per day
- `diet_plan_notes` unique on `(mentee_id, diet_plan_id, log_date)` — one note per day
- `food_item_id` FK to `food_items` RESTRICT — prevents deleting referenced foods

---

## Migration Commands

```bash
# Local development
supabase db push          # Push local migrations to linked project
supabase migration new    # Create new migration file

# Production (via Supabase Dashboard or CLI)
supabase db push --linked
```

---

## Schema Drift Detection

Run typecheck to detect TypeScript ↔ DB drift:

```bash
pnpm typecheck
```

The `app/types/database.ts` should be regenerated after schema changes:

```bash
# Using Supabase CLI (generates TypeScript types)
supabase gen types typescript --project-id <ref> > app/types/database.ts
```

---

## Rollback Considerations

| Migration                             | Rollback Risk | Notes                                                    |
| ------------------------------------- | ------------- | -------------------------------------------------------- |
| `20260824164907_remote_schema.sql`    | High          | Drops 5 tables, cascades to auth.users — data loss       |
| `20260824220000_storage.sql`          | Low           | Bucket drop loses all photos; policies removable         |
| `20261031120000_diet_plan_schema.sql` | Medium        | Drops 6 tables, seed data loss; no cascade to auth.users |

**Never run destructive migrations on production without backup.**

---

## Future Migration Guidelines

1. **Name format:** `YYYYMMDDHHMMSS_description.sql`
2. **Single responsibility:** One logical change per file
3. **Idempotent where possible:** Use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`
4. **RLS first:** Add policies in same migration as table creation
5. **Test locally:** `supabase db reset` then `supabase db push`
6. **Update types:** Regenerate `app/types/database.ts` after schema changes

## Local Development Notes

### Auth User Creation (GoTrue Schema Issue)

Direct SQL inserts into `auth.users` require all nullable string columns to be non-NULL:

```sql
UPDATE auth.users SET
  confirmation_token = '',
  confirmation_sent_at = now(),
  recovery_token = '',
  recovery_sent_at = now(),
  email_change_token_new = '',
  email_change_token_current = '',
  email_change = '',
  email_change_sent_at = now(),
  phone_change_token = '',
  phone_change = '',
  phone_change_sent_at = now(),
  reauthentication_token = '',
  reauthentication_sent_at = now()
WHERE email = 'test@example.com';
```

Otherwise GoTrue fails with: `converting NULL to string is unsupported`

### Test User Setup

```sql
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role, is_sso_user, is_anonymous)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  false,
  false
);

INSERT INTO public.profiles (id, name, role, sex, height)
VALUES ('<user-id>', 'Test User', 'mentee', 'male', 70);
```
