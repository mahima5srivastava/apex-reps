# AGENTS.md — Project Memory

## Project

**Apex Reps** — Client-side fitness tracker (Nuxt 4 SPA, Supabase, GitHub Pages)

## Rules

- **Minimal responses** — Fewest words needed. No fluff.
- **Update context in same session** as code changes.
- **Never assume** — If unsure, ask. Never decide without asking.

## Coding Standards (persist across sessions)

1. **TDD** — Write meaningful E2E/integration tests first, then implement
2. **No regressions** — Run existing tests before/after changes; guard existing flows
3. **Minimal/KISS/YAGNI/DRY/SOLID** — Reuse existing patterns (stores, components, utils), no over-engineering
4. **Readable/maintainable** — Clear types, small functions, consistent with codebase style
5. **Boy scout** — Improve touched files (types, comments, refactors where safe)
6. **No surprises** — Changes localized to feature area, follow existing conventions

## ai-workspace Index

| Domain                    | File                                          |
| ------------------------- | --------------------------------------------- |
| Database schema           | `ai-workspace/database/tables.md`             |
| RLS policies              | `ai-workspace/database/rls-policies.md`       |
| Storage                   | `ai-workspace/database/storage.md`            |
| Migrations                | `ai-workspace/database/migrations.md`         |
| Relationships             | `ai-workspace/database/relationships.md`      |
| Context maintenance skill | `.agents/skills/context-maintenance/SKILL.md` |
| E2E testing skill         | `.agents/skills/e2e-testing/SKILL.md`         |

## Quick Refs

### Pinia Stores

| Store          | Key Actions                                                            |
| -------------- | ---------------------------------------------------------------------- |
| `auth`         | `fetchSession()`, `login()`, `logout()`                                |
| `profile`      | `fetchProfile()`                                                       |
| `stats`        | `fetchAllStats()`, `fetchLeftPhotos()`, `saveStatsAndPhotos()`         |
| `subscription` | `fetchActiveSubscription()`                                            |
| `plan`         | `fetchPlan(planId)`                                                    |
| `dietPlan`     | `fetchPlanForDate()`, `fetchLogs()`, `toggleConsumed()`, `saveNotes()` |
| `foodItem`     | `searchFoods()`, `createCustomFood()`                                  |

### Database

| Table                  | PK   | RLS                                           |
| ---------------------- | ---- | --------------------------------------------- |
| `profiles`             | `id` | Self read                                     |
| `stats`                | `id` | Self insert/read                              |
| `photos`               | `id` | Self insert/read                              |
| `plans`                | `id` | All auth read                                 |
| `subscriptions`        | `id` | Self read                                     |
| `food_items`           | `id` | All read; coach insert; creator update/delete |
| `diet_plans`           | `id` | Coach CRUD (own mentees); Mentee read own     |
| `diet_plan_meals`      | `id` | Via plan                                      |
| `diet_plan_food_items` | `id` | Via plan                                      |
| `diet_plan_logs`       | `id` | Mentee CRUD; Coach read                       |
| `diet_plan_notes`      | `id` | Mentee CRUD; Coach read                       |

### Commands

```bash
pnpm dev | build | generate | preview | lint | typecheck
supabase start | stop | db push | migration new | db reset | db query
npx playwright test | test --ui | test --debug
```

### Env

| Var            | Source                  |
| -------------- | ----------------------- |
| `SUPABASE_URL` | `.env` / GitHub Secrets |
| `SUPABASE_KEY` | `.env` / GitHub Secrets |

### Gotchas

1. Stats/photos immutable — no UPDATE/DELETE policies
2. `photos.user_id` redundant — enables direct RLS
3. Storage policies bucket-level — isolation via path prefix
4. BFP calculated client-side, stored in `stats.bfp`
5. Profile `sex`/`height` required for BFP
6. Left photo required (Zod + store validation)
7. **Local Supabase GoTrue**: `auth.users` nullable string cols must be non-NULL or login fails with "converting NULL to string is unsupported"
8. `food_items` macros per 100g; `diet_plan_food_items` stores calculated macros at creation
9. `diet_plans` unique on `(mentee_id, start_date)` — one active plan per mentee per date

### Files to Watch

- `supabase/migrations/*.sql` → update `ai-workspace/database/`
- `app/utils/bodyFat.ts` — formula changes affect all BFP
- `app/utils/image.ts` — compression params
- `app/stores/stats.ts` — transactional logic
- `app/types/database.ts` — regenerate after migration
- `.agents/skills/*.md` — update when workflows change

## Last Updated

2026-10-31
