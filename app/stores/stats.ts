import { defineStore } from 'pinia'
import { getSupabase } from '@/utils/supabase'
import { useProfileStore } from '@/stores/profile'
import { calculateBodyFatPercentage } from '@/utils/bodyFat'
import { PROGRESS_PHOTOS_BUCKET, buildPhotoStoragePath } from '@/utils/constants'
import type { PhotoAngle } from '@/types'

interface Stats {
  weight: number
  waist: number
  hip: number
  neck: number
}

interface PhotoInput {
  angle: PhotoAngle
  file: File
}

export const useStatsStore = defineStore('stats', {
  state: () => ({}),
  getters: {},
  actions: {
    async saveStatsAndPhotos(stats: Stats, photos: PhotoInput[] = []) {
      try {
        const profileStore = useProfileStore()
        if (!profileStore.id) {
          await profileStore.fetchProfile()
        }
        if (!profileStore.id) {
          throw new Error('Profile not found. Please complete your profile before checking in.')
        }

        const statId = await this.insertStat(profileStore.id, stats, profileStore)
        await this.savePhotos(profileStore.id, statId, photos)

        return statId
      } catch (error) {
        console.error('Error saving stats:', error)
        throw error
      }
    },

    async insertStat(userId: string, stats: Stats, profileStore: ReturnType<typeof useProfileStore>) {
      const bfp = calculateBodyFatPercentage(stats, profileStore.sex, profileStore.height)

      const { data, error } = await getSupabase()
        .from('stats')
        .insert({
          user_id: userId,
          waist: stats.waist,
          weight: stats.weight,
          bfp,
          hip: stats.hip,
          neck: stats.neck
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      return data.id
    },

    async savePhotos(userId: string, statId: string, photos: PhotoInput[]) {
      for (const photo of photos) {
        const path = await this.uploadPhoto(userId, statId, photo)
        await this.insertPhotoRecord(userId, statId, photo.angle, path)
      }
    },

    async uploadPhoto(userId: string, statId: string, photo: PhotoInput) {
      const ext = photo.file.name.split('.').pop() ?? 'jpg'
      const path = buildPhotoStoragePath(userId, statId, photo.angle, ext)

      const { error } = await getSupabase().storage
        .from(PROGRESS_PHOTOS_BUCKET)
        .upload(path, photo.file)

      if (error) throw new Error(error.message)
      return path
    },

    async insertPhotoRecord(userId: string, statId: string, angle: PhotoAngle, filename: string) {
      const { error } = await getSupabase()
        .from('photos')
        .insert({
          stat_id: statId,
          user_id: userId,
          angle,
          filename
        })

      if (error) throw new Error(error.message)
    }
  }
})
