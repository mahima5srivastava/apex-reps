import { defineStore } from 'pinia'
import { getSupabase } from '@/utils/supabase'

export const usePlanStore = defineStore('plan', {
  state: () => ({
    id: '',
    name: '',
    duration: 0
  }),
  getters: {},
  actions: {
    async fetchPlan(planId: string) {
      const supabase = getSupabase()
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id, name, duration')
          .eq('id', planId)
          .maybeSingle()

        if (error) throw error

        this.id = data?.id ?? ''
        this.name = data?.name ?? ''
        this.duration = data?.duration ?? 0
      } catch (error) {
        console.log('Error fetching plan: ', error)
        throw error
      }
    }
  }
})
