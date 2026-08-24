# Plan: Deploy to GitHub Pages at `app.fitmahima.in`

## Context
- **App:** Nuxt 4 SPA, no `server/` directory (`app/`, `public/`), backend is client-side Supabase only (`app/utils/supabase.ts`). Fully static-hostable.
- **Goal:** Serve the app at the custom domain `app.fitmahima.in` via GitHub Pages.
- **Topology already in place:**
  - `fitmahima.in` + `www.fitmahima.in` → GitHub Pages repo of `mahima5srivastava` (apex site).
  - `app.fitmahima.in` → a **different** repository of the same user `mahima5srivastava`, i.e. `mahima5srivastava/apex-reps` (the upstream repo this fork is based on).
- **GitHub Pages rule:** custom domains are scoped per exact hostname. `app.fitmahima.in` ≠ `fitmahima.in`, so it can live on a separate repo with no conflict. `fitmahima.in`/`www` stay paired on the apex repo. One domain verification (`fitmahima.in`) already covers the apex + all subdomains for that account.
- **Where the pipeline runs:** the `apex-reps` repo that owns `app.fitmahima.in` = `mahima5srivastava/apex-reps`. The deploy workflow, Nuxt config change, and `public/CNAME` are committed there (via PR from this fork, or directly if write access exists). Secrets + Pages settings are configured on that repo by its owner.
- **Trigger:** push to `main` on that repo (covers merge-to-main from a PR).

## Architecture decisions
- **Static build, not SSR.** GitHub Pages serves files only. Use `nuxt generate` (output `.output/public`).
- **Root base, not `/apex-reps/`.** The `github_pages` preset would force the `/apex-reps/` subpath base; with a custom domain the site is served at `/`, so we build with `NUXT_APP_BASE_URL=/` instead of that preset.
- **Supabase keys are inlined at build time** via `public.runtimeConfig` (`nuxt.config.ts:16`). They must be supplied as **repo secrets** at build time: `SUPABASE_URL`, `SUPABASE_KEY`.
- **Custom domain artifact:** ship a `public/CNAME` file containing `app.fitmahima.in` so the published site is bound to the domain.

## Steps

### 1. Nuxt config — force SPA/static output
In `nuxt.config.ts`, ensure the app is generated as a static SPA:
```ts
export default defineNuxtConfig({
  // ...existing modules/css/runtimeConfig...
  ssr: false,
  nitro: {
    prerender: { routes: ['/'] }
  }
})
```
- `ssr: false` → pure client-rendered SPA (matches current client-only Supabase usage).
- `prerender.routes: ['/']` → emits `index.html`.

### 2. Add `public/CNAME`
Create `public/CNAME` with exactly:
```
app.fitmahima.in
```
Nuxt copies `public/` into `.output/public`, so the artifact carries the binding.

### 3. Create `.github/workflows/deploy.yml`
```yaml
name: deploy-pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Generate static site
        run: nuxt generate
        env:
          NUXT_APP_BASE_URL: "/"
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}

      - uses: actions/upload-pages-artifact@v4
        with:
          path: .output/public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 4. Repo secrets (owner of `mahima5srivastava/apex-reps`)
Settings → Secrets and variables → Actions → New repository secret:
- `SUPABASE_URL` (value from `.env.example`/real project)
- `SUPABASE_KEY` (the `sb_publishable_...` anon key — public by design)

### 5. Enable Pages + custom domain (owner)
- Settings → Pages → **Source: GitHub Actions**.
- Settings → Pages → **Custom domain: `app.fitmahima.in`**.
- GitHub provisions the TLS cert once DNS resolves. Verify the "DNS check" turns green.

### 6. Cloudflare DNS (owner, `fitmahima.in` zone)
Add one record (apex + www already exist):
- `CNAME` `app` → `mahima5srivastava.github.io`
- SSL/TLS mode → **Full** (GitHub's cert won't validate under Strict; DNS-only/grey-cloud also works but drops Cloudflare proxying).

### 7. Merge / push to `main`
Opening a PR from this fork into `mahima5srivastava/apex-reps#main` and merging triggers the workflow; the site goes live at `https://app.fitmahima.in`.

## SPA deep-link note (follow-up, only if needed)
With `ssr: false`, a hard refresh / direct open of a client-side route (e.g. `/some-page`) returns 404 on Pages because no `some-page/index.html` exists. Mitigations if this matters:
- Add `public/404.html` that loads the SPA shell and lets the client router take over, or
- Prerender the specific routes: `nitro.prerender.routes: ['/', '/login', ...]`.
The current app largely lands on `/` and routes client-side, so this is likely unnecessary; flag only if deep links are used.

## Decisions / Alternatives
- **Why `static` preset + `NUXT_APP_BASE_URL=/` instead of `github_pages` preset:** the latter hardcodes the `/apex-reps/` base, which breaks a root-served custom domain. Root base is correct for `app.fitmahima.in`.
- **Why secrets and not committed keys:** `public.runtimeConfig` is inlined into the client bundle at build time, so the value ends up public regardless — but keeping it in Actions secrets avoids baking it into source control and lets it be rotated without a code change.
- **Could deploy from the `SumitKPandit` fork instead:** yes — then point `app` CNAME at `sumitkpandit.github.io` and put secrets/Pages on the fork. Chosen approach deploys from upstream `mahima5srivastava/apex-reps` to match the existing domain ownership.

## Out of Scope
- Apex (`fitmahima.in` / `www`) site changes — untouched, stays on its existing repo.
- Supabase project setup / RLS — assumed already working for the client key.
- Adding tests for the static build (CI has no test runner today).
