import { getSupabase } from '@/utils/supabase'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const { data: { user } } = await getSupabase().auth.getUser()

  if (to.path !== '/login' && !user) {
    return navigateTo('/login')
  }
})
