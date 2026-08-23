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

interface StatRecord {
  id: string
  user_id: string
  weight: number
  waist: number
  hip: number
  neck: number
  bfp: number
  created_at: string
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const formatChartDate = (iso: string) => dateFormatter.format(new Date(iso))

export const useStatsStore = defineStore('stats', {
  state: () => ({
    stats: [] as StatRecord[],
    leftPhotoCheckins: [] as { statId: string, createdAt: string, url: string }[]
  }),
  getters: {
    weightChartData: state =>
      [...state.stats]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map(s => ({ date: formatChartDate(s.created_at), value: s.weight })),

    waistChartData: state =>
      [...state.stats]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map(s => ({ date: formatChartDate(s.created_at), value: s.waist })),

    bfpChartData: state =>
      [...state.stats]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map(s => ({ date: formatChartDate(s.created_at), value: Math.round(s.bfp * 10) / 10 }))
  },
  actions: {
    async fetchAllStats() {
      try {
        const profileStore = useProfileStore()
        if (!profileStore.id) {
          await profileStore.fetchProfile()
        }
        if (!profileStore.id) {
          throw new Error('Profile not found.')
        }

        const { data, error } = await getSupabase()
          .from('stats')
          .select('id, user_id, weight, waist, hip, neck, bfp, created_at')
          .eq('user_id', profileStore.id)
          .order('created_at', { ascending: true })

        if (error) throw new Error(error.message)

        this.stats = data as StatRecord[]
        return this.stats
      } catch (error) {
        console.error('Error fetching stats:', error)
        throw error
      }
    },

    async fetchLeftPhotos() {
      try {
        const profileStore = useProfileStore()
        if (!profileStore.id) {
          await profileStore.fetchProfile()
        }
        if (!profileStore.id) {
          throw new Error('Profile not found.')
        }

        const { data, error } = await getSupabase()
          .from('photos')
          .select('filename, stat_id, created_at')
          .eq('user_id', profileStore.id)
          .eq('angle', 'left')
          .order('created_at', { ascending: true })

        if (error) throw new Error(error.message)

        const seen = new Set<string>()
        const rows = (data ?? []).filter((row) => {
          if (seen.has(row.stat_id)) return false
          seen.add(row.stat_id)
          return true
        })

        const checkins = await Promise.all(
          rows.map(async (row) => {
            const { data: signed, error: urlError } = await getSupabase()
              .storage
              .from(PROGRESS_PHOTOS_BUCKET)
              .createSignedUrl(row.filename, 60 * 60 * 24 * 7)

            if (urlError) throw new Error(urlError.message)

            return {
              statId: row.stat_id,
              createdAt: row.created_at,
              url: signed?.signedUrl ?? ''
            }
          })
        )

        this.leftPhotoCheckins = checkins
        return this.leftPhotoCheckins
      } catch (error) {
        console.error('Error fetching left photos:', error)
        throw error
      }
    },

    async saveStatsAndPhotos(stats: Stats, photos: PhotoInput[] = []) {
      const profileStore = useProfileStore()
      if (!profileStore.id) {
        await profileStore.fetchProfile()
      }
      if (!profileStore.id) {
        throw new Error('Profile not found. Please complete your profile before checking in.')
      }

      if (!photos.some(p => p.angle === 'left')) {
        throw new Error('A left progress photo is required.')
      }

      const statId = await this.insertStat(profileStore.id, stats, profileStore)

      const uploadedPaths: string[] = []
      try {
        for (const photo of photos) {
          const path = await this.uploadPhoto(profileStore.id, statId, photo)
          uploadedPaths.push(path)
          await this.insertPhotoRecord(profileStore.id, statId, photo.angle, path)
        }
      } catch (error) {
        await this.rollbackStat(profileStore.id, statId, uploadedPaths)
        throw error
      }

      return statId
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
    },

    async rollbackStat(userId: string, statId: string, uploadedPaths: string[]) {
      const supabase = getSupabase()
      if (uploadedPaths.length) {
        await supabase.storage
          .from(PROGRESS_PHOTOS_BUCKET)
          .remove(uploadedPaths)
      }
      const { error } = await supabase
        .from('stats')
        .delete()
        .eq('id', statId)

      if (error) throw new Error(error.message)
    }
  }
})
