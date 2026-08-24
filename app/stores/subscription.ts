import { defineStore } from 'pinia'
import { getSupabase } from '@/utils/supabase'

export const useSubStore = defineStore('sub', {
  state: () => ({
    id: '',
    planId: '',
    startDate: '',
    endDate: ''
  }),
  getters: {},
  actions: {
    async fetchActiveSubscription() {
      const supabase = getSupabase()
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id, plan_id, start_date, end_date')
          .gte('end_date', new Date().toISOString().split('T')[0])
          .maybeSingle()

        if (error) throw error

        this.id = data?.id ?? ''
        this.planId = data?.plan_id ?? ''
        this.startDate = data?.start_date ?? ''
        this.endDate = data?.end_date ?? ''
      } catch (error) {
        console.log('Error fetching active subscription: ', error)
        throw error
      }
    }
  }
})
