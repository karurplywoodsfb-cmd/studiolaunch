// src/app/api/studio/plan/route.ts — Returns current tenant plan

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('tenants')
    .select('plan, plan_status')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ plan: data?.plan || 'starter', plan_status: data?.plan_status || 'trialing' })
}
