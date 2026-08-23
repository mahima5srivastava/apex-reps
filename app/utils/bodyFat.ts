import type { Sex } from '@/types'

export interface BodyMeasurements {
  waist: number
  hip: number
  neck: number
}

export function calculateBodyFatPercentage(
  measurements: BodyMeasurements,
  sex: Sex,
  height: number
): number {
  if (!height || height <= 0) {
    throw new Error('Profile height is missing or invalid')
  }
  if (measurements.waist <= measurements.neck) {
    throw new Error('Waist must be greater than neck')
  }

  const heightLog = Math.log10(height)

  if (sex === 'male') {
    return 86.010 * Math.log10(measurements.waist - measurements.neck) - 70.041 * heightLog + 36.76
  }

  if (measurements.waist + measurements.hip - measurements.neck <= 0) {
    throw new Error('Invalid measurements for body fat calculation')
  }

  return 163.205 * Math.log10(measurements.waist + measurements.hip - measurements.neck) - 97.684 * heightLog - 78.387
}
