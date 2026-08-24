# Apex Reps

A client-side fitness-progress tracker for [Mahima Srivastava](https://fitmahima.in) clients. Clients log body measurements and progress photos, see charts of their weight / waist / body-fat trends, and compare progress photos side by side.

The app is a fully static **Nuxt 4 SPA** with no server runtime. All data lives in a **Supabase** project accessed directly from the browser; there is no backend code in this repo.

- **Live site:** https://app.fitmahima.in
- **Deploy target:** GitHub Pages (custom domain), see [`docs/GITHUB_PAGES_DEPLOYMENT.md`](docs/GITHUB_PAGES_DEPLOYMENT.md)

## Tech stack

- [Nuxt 4](https://nuxt.com) (`ssr: false` → static SPA, prerendered at `/`)
- [Nuxt UI](https://ui.nuxt.com) (v4) for components, theming (`app.config.ts`)
- [Pinia](https://pinia.vuejs.org) (`@pinia/nuxt`) for state
- [nuxt-charts](https://github.com/numlder/nuxt-charts) for trend charts
- [Supabase JS](https://supabase.com/docs/reference/javascript) for auth + data + storage
- [Zod](https://zod.dev) for form validation

## Features

- **Auth** — email/password sign-in via Supabase Auth. A global route middleware (`app/middleware/auth.global.ts`) redirects unauthenticated users to `/login`; `/login` opts out of the default layout.
- **Dashboard** (`/`) — profile greeting, active subscription details, latest-stat summary cards, trend charts (weight, waist, body-fat %), and a side-by-side progress-photo compare view.
- **Check-in** (`/check-in`) — log weight, waist, neck, hip, and up to four progress photos (left, front, back, right). A **left** photo is required. On submit, a stat row is inserted (with body-fat % computed), photos are compressed and uploaded, and a `photos` row is written per angle. If any upload fails, the stat row and already-uploaded objects are rolled back.
- **Body-fat estimation** — US Navy method (`app/utils/bodyFat.ts`) using height, waist, hip, neck and the profile's sex.
- **Client-side photo compression** — images are downscaled to a max 1000px edge and re-encoded as JPEG (quality 0.82) in the browser before upload (`app/utils/image.ts`). See [`docs/image-compression-plan.md`](docs/image-compression-plan.md).

## Project structure

```
app/
  app.config.ts            # Nuxt UI theme (brand/sand colors)
  app.vue                  # UApp + NuxtLayout + NuxtPage
  layouts/default.vue      # Authenticated shell (header, logout, footer)
  middleware/
    auth.global.ts         # Require auth on every route except /login (client-only)
  pages/
    index.vue              # Dashboard
    check-in.vue           # Measurement + photo check-in form
    login.vue              # Email/password login (no layout)
  stores/
    auth.ts                # Session, login, logout
    profile.ts             # Current user profile (sex, height, ...)
    stats.ts               # Stats + photos: fetch, save, compress/upload, rollback
    subscription.ts        # Active subscription
    plan.ts                # Plan lookup
  components/              # AppLogo, StatChart, ProgressPhotoCompare, PhotoUploadField, SubscriptionCard, PageLoader
  utils/
    supabase.ts            # Lazy getSupabase() client from runtime config
    image.ts               # compressImage()
    bodyFat.ts             # calculateBodyFatPercentage()
    constants.ts           # Bucket name, allowed types, compression params, storage-path builder
  types/
    index.ts               # Sex, PhotoAngle
    database.ts            # Typed Supabase schema (Database)
supabase/
  config.toml             # Local Supabase config
  migrations/             # Schema + storage bucket/policies
public/
  CNAME                   # Binds the GitHub Pages site to app.fitmahima.in
```

## Data model (Supabase)

Tables (in the `public` schema, all RLS-enabled):

| Table          | Purpose                                                        |
| -------------- | ------------------------------------------------------------- |
| `profiles`     | One row per auth user: `name`, `role`, `sex`, `height`.        |
| `stats`        | Each check-in: `weight`, `waist`, `hip`, `neck`, `bfp`.       |
| `photos`       | One row per uploaded photo: `stat_id`, `angle`, `filename`.   |
| `plans`        | Coaching plan catalog: `name`, `duration` (weeks).            |
| `subscriptions`| Active plan for a user: `plan_id`, `start_date`, `end_date`.  |

**Storage:** a private `progress_photos` bucket. Photos are read via short-lived signed URLs (the dashboard requests a 7-day URL per selected check-in). RLS allows authenticated users to insert/view objects in that bucket.

Migrations live in `supabase/migrations/` and are applied against the Supabase project (local dev via `supabase db push` / hosted via the Supabase dashboard or CLI).

## Local development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment (see .env.example)
cp .env.example .env
#   SUPABASE_URL=https://<project>.supabase.co
#   SUPABASE_KEY=sb_publishable_<anon-key>

# 3. Run the dev server
pnpm dev          # http://localhost:3000
```

The Supabase keys are read into `public.runtimeConfig` via `nuxt.config.ts` and therefore inlined into the client bundle at build time (they are public by design). For local dev they come from `.env`; for production builds they come from GitHub Actions secrets (see deployment docs).

### Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the dev server.                        |
| `pnpm build`        | Build for production (`nuxt build`).         |
| `pnpm generate`     | Generate the static site (`.output/public`). |
| `pnpm preview`      | Preview a production build locally.          |
| `pnpm lint`         | Lint with ESLint.                            |
| `pnpm typecheck`    | Type-check with `nuxt typecheck`.            |

## Deployment

The app is built as a static site and published to **GitHub Pages** at `https://app.fitmahima.in`:

- `nuxt.config.ts` sets `ssr: false` and prerenders `/`.
- `public/CNAME` binds the custom domain.
- `.github/workflows/deploy.yml` runs on push to `main`, executes `nuxt generate` (with `SUPABASE_URL`/`SUPABASE_KEY` from repo secrets), and deploys via `actions/deploy-pages`.

Full setup (secrets, Pages settings, Cloudflare DNS) is documented in [`docs/GITHUB_PAGES_DEPLOYMENT.md`](docs/GITHUB_PAGES_DEPLOYMENT.md).

## Renovate

Dependency updates are automated by [Renovate](https://github.com/apps/renovate) (`renovate.json`).
