import { defineStore } from 'pinia'
import type { Sex } from '@/types'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    id: '',
    name: '',
    role: '',
    sex: 'male' as Sex,
    height: 0
  }),
  actions: {
    async fetchProfile() {
      const supabase = getSupabase()
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, role, sex, height')
          .single()

        if (error) throw error

        this.id = data.id
        this.name = data.name
        this.role = data.role
        this.sex = data.sex
        this.height = data.height
      } catch (error) {
        console.log('Error fetching profile:', error)
        throw error
      }
    }
  }
})
