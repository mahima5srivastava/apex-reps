import type { PhotoAngle } from '@/types'

export const PROGRESS_PHOTOS_BUCKET = 'progress_photos'
export const ALLOWED_IMAGE_TYPES: string[] = ['image/jpeg', 'image/png']

export const MAX_IMAGE_DIMENSION = 1000
export const IMAGE_QUALITY = 0.82

export function buildPhotoStoragePath(
  userId: string,
  statId: string,
  angle: PhotoAngle,
  extension: string
): string {
  return `${userId}_${statId}_${angle}.${extension}`
}
