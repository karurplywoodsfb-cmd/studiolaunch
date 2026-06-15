// src/app/api/admin/tenants/route.ts — Admin plan override

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { PlanType } from '@/types'

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, plan, white_label, plan_status } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const validPlans: PlanType[] = ['starter', 'studio', 'agency']
  if (plan && !validPlans.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const admin = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (plan !== undefined)        updates.plan        = plan
  if (white_label !== undefined) updates.white_label = white_label
  if (plan_status !== undefined) updates.plan_status = plan_status

  const { data, error } = await admin
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select('id, plan, plan_status, white_label')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log the admin action (fire-and-forget)
  void admin.from('tenant_events').insert({
    tenant_id:  id,
    event_type: 'admin_plan_override',
    metadata:   { updates, admin: 'system' },
  })

  return NextResponse.json({ data })
}

// GET all tenants — for admin use
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tenants')
    .select('id, subdomain, plan, plan_status, white_label, created_at, branding, contact, location')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
