import { getSupabase } from '@/utils/supabase'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const { data: { session } } = await getSupabase().auth.getSession()
  const user = session?.user

  if (to.path !== '/login' && !user) {
    return navigateTo('/login')
  }
})
