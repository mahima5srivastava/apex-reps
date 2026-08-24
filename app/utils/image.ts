import { MAX_IMAGE_DIMENSION, IMAGE_QUALITY } from '@/utils/constants'

interface CompressImageOptions {
  maxDimension?: number
  quality?: number
}

export async function compressImage(file: File, opts: CompressImageOptions = {}): Promise<File> {
  const maxDimension = opts.maxDimension ?? MAX_IMAGE_DIMENSION
  const quality = opts.quality ?? IMAGE_QUALITY

  if (
    typeof createImageBitmap !== 'function' ||
    typeof document === 'undefined' ||
    typeof document.createElement !== 'function'
  ) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const { width, height } = bitmap

    const longest = Math.max(width, height)
    const scale = longest > maxDimension ? maxDimension / longest : 1
    const targetWidth = Math.round(width * scale)
    const targetHeight = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )

    if (!blob) return file

    if (blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
