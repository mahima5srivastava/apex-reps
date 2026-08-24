# Plan: Compress Progress Photos Before Storage

## Context
- **Upload flow:** `check-in.vue` → `statsStore.saveStatsAndPhotos` → `uploadPhoto` (`app/stores/stats.ts:208`) uploads the `File` straight to the Supabase `progress_photos` bucket.
- **Display size is small:** `ProgressPhotoCompare.vue:79,93` caps images at `max-h-72` / `max-h-96` (~288–384px) with `object-contain`. We only need ~800–1000px source images.
- **Everything runs in the browser**, so compression can be done client-side with the Canvas API — **no new dependency, no server changes, no storage-path rework.**

## Steps

### 1. Add constants (`app/utils/constants.ts`)
- `MAX_IMAGE_DIMENSION = 1000` (longest edge; generous for 2x retina displays).
- `IMAGE_QUALITY = 0.82`.

### 2. Create `app/utils/image.ts` — `compressImage(file, opts?): Promise<File>`
- Use `createImageBitmap(file, { imageOrientation: 'from-image' })` to correct phone EXIF rotation.
- Scale so the longest edge ≤ `MAX_IMAGE_DIMENSION`.
- Draw to an offscreen `<canvas>`, export via `canvas.toBlob('image/jpeg', IMAGE_QUALITY)`.
- Return a `File` named `<original-base>.jpg` (forces the `.jpg` extension so the existing `ext` derivation in `uploadPhoto` stays valid).
- **Fallback:** if compressed size ≥ original, return the original `File` unchanged.
- **SSR guard:** if `createImageBitmap` / canvas is unavailable, return the original (so it never breaks non-browser contexts).

### 3. Wire into `uploadPhoto` (`app/stores/stats.ts:208`)
- `const compressed = await compressImage(photo.file)` then upload `compressed`. The `ext` is derived from `photo.file.name`, so the compressed `.jpg` name yields the correct `.jpg` storage path.

### 4. Keep existing validation
- The 10MB form validation (`check-in.vue:102`) stays as-is — compressed files pass easily; no change needed.

## Decisions / Alternatives
- **Format:** Recommended to convert everything to **JPEG** (biggest savings for photos; no transparency needed). Alternative: keep PNG-as-PNG, but canvas PNG output won't shrink much.
- **Target dimension:** 1000px gives safe headroom; could drop to 800px for more savings.
- **Testing:** `compressImage` depends on browser APIs, so a unit test needs a browser / happy-dom env (e.g. `@nuxt/test-utils`) — note that CI currently has no test runner. Suggest at least a manual check via `pnpm dev`.

## Out of Scope
- Storing high-res originals — only compressed images are saved, per the goal of efficient bucket usage.
- Backfilling existing photos already in the bucket.
