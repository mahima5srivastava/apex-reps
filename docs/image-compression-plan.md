# Progress Photo Compression

> **Status: Implemented.** This documents behavior that is already shipped in
> `app/utils/image.ts`, `app/utils/constants.ts`, and `app/stores/stats.ts`.

## Why

- **Upload flow:** `check-in.vue` → `useStatsStore().saveStatsAndPhotos` → `uploadPhoto` (`app/stores/stats.ts`) uploads the `File` straight to the Supabase `progress_photos` bucket.
- **Display size is small:** `ProgressPhotoCompare.vue` caps images at `max-h-72` / `max-h-96` (~288–384px) with `object-contain`. Only ~800–1000px source images are needed.
- **Everything runs in the browser**, so compression is done client-side with the Canvas API — no new dependency, no server changes, no storage-path rework.

## What it does

`compressImage(file, opts?): Promise<File>` (`app/utils/image.ts`):

- Uses `createImageBitmap(file, { imageOrientation: 'from-image' })` to correct phone EXIF rotation.
- Scales so the longest edge ≤ `MAX_IMAGE_DIMENSION` (`1000`, in `app/utils/constants.ts`).
- Draws to an offscreen `<canvas>` and exports via `canvas.toBlob('image/jpeg', IMAGE_QUALITY)` (`0.82`).
- Returns a `File` named `<original-base>.jpg` (forces `.jpg` so the existing `ext` derivation in `uploadPhoto` stays valid).
- **Fallback:** if the compressed size ≥ the original, returns the original `File` unchanged.
- **SSR / non-browser guard:** if `createImageBitmap` or `document.createElement` is unavailable, returns the original (never breaks non-browser contexts).

## Wiring

`uploadPhoto` (`app/stores/stats.ts`) calls `const compressed = await compressImage(photo.file)` and uploads `compressed`. The storage path is built with `buildPhotoStoragePath` (`app/utils/constants.ts`), which uses `compressed.name`'s `.jpg` extension, so the storage key is correct.

The 10MB form validation in `check-in.vue` is unchanged — compressed files pass easily.

## Decisions

- **Format:** all images are converted to **JPEG** (biggest savings for photos; no transparency needed). PNG uploads are also re-encoded to JPEG.
- **Target dimension:** `1000`px gives safe headroom for 2× retina displays; can drop to `800`px for more savings.
- **Storage:** only compressed images are saved (efficient bucket usage). Existing photos already in the bucket are not backfilled.
