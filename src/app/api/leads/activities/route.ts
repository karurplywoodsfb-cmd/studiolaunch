// src/app/api/leads/activities/route.ts — Internal notes + status timeline for a lead

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tenants').select('id').eq('user_id', user.id).single()
  return data
}

// GET ?lead_id=... — full timeline (notes + auto-logged status changes), newest first
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadId = req.nextUrl.searchParams.get('lead_id')
  if (!leadId) return NextResponse.json({ error: 'Missing lead_id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .eq('tenant_id', tenant.id) // belt-and-suspenders alongside RLS
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST — add an internal note to a lead's timeline
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  const { lead_id, content } = await req.json()

  if (!lead_id || !content?.trim()) {
    return NextResponse.json({ error: 'lead_id and content are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Confirm the lead actually belongs to this tenant before logging against it
  const { data: lead } = await admin
    .from('leads').select('id').eq('id', lead_id).eq('tenant_id', tenant.id).single()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const { data, error } = await admin
    .from('lead_activities')
    .insert({
      lead_id,
      tenant_id:  tenant.id,
      type:       'note',
      content:    content.trim(),
      created_by: user!.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
