import { defineStore } from 'pinia'
import { getSupabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    userId: ''
  }),
  getters: {
    isLoggedIn: state => state.isAuthenticated
  },
  actions: {
    async fetchSession() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      this.isAuthenticated = !!user
      this.userId = user?.id ?? ''
      return user
    },
    async login(email: string, password: string) {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await this.fetchSession()
      return navigateTo('/')
    },
    async logout() {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      this.isAuthenticated = false
      this.userId = ''
      return navigateTo('/login')
    }
  }
})
