import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
let browserClient: SupabaseClient | undefined

export function createAdminBrowserClient() {
  if (!url || !key) throw new Error('Supabase is not configured')
  browserClient ??= createClient(url, key)
  return browserClient
}

export async function getAdminDataClient(authorization: string | undefined) {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token || !url || !key) return null
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data, error } = await client.auth.getUser(token)
  if (error || data.user?.app_metadata?.role !== 'article_admin') return null
  return client
}
