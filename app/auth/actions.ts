'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'

export async function signOut() {
  const supabase = createServerSupabase()
  await supabase.auth.signOut()
  redirect('/')
}
