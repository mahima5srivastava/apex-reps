import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let supabase: SupabaseClient<Database> | null = null

export const getSupabase = () => {
  const config = useRuntimeConfig()
  if (supabase) {
    return supabase
  }

  supabase = createClient<Database>(config.public.supabaseUrl, config.public.supabaseKey)
  return supabase
}
