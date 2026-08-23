import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

let supabase: SupabaseClient<any, 'public', 'public', any, any> | null = null

export const getSupabase = () => {
  const config = useRuntimeConfig()
  if (supabase) {
    return supabase
  }

  supabase = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  return supabase
}
