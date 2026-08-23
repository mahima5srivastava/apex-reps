import { defineStore } from 'pinia'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    name: '',
    role: ''
  }),
  actions: {
    async fetchProfile() {
      const supabase = getSupabase()
      try {
        const { data, error } = await supabase.from('profiles').select('*').single()
        if (error) throw error
        this.name = data.name
        this.role = data.role
      } catch (error) {
        console.log('Error fetching profile:', error)
        throw error
      }
    }
  }
})
