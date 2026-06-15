// src/app/api/service-areas/route.ts — Service area CRUD

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tenants').select('id, plan').eq('user_id', user.id).single()
  return data
}

export async function GET() {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('service_areas')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('display_order', { ascending: true })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body  = await req.json()
  const admin = createAdminClient()

  // Check limit (Studio/Agency: 20 areas, Starter: 3)
  const limit = tenant.plan === 'starter' ? 3 : 20
  const { count } = await admin
    .from('service_areas')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  if ((count || 0) >= limit) {
    return NextResponse.json({
      error: `Area limit reached (${count}/${limit}).${tenant.plan === 'starter' ? ' Upgrade to add more.' : ''}`,
      upgrade: tenant.plan === 'starter',
    }, { status: 403 })
  }

  const { data, error } = await admin
    .from('service_areas')
    .insert({ ...body, tenant_id: tenant.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('service_areas')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const admin  = createAdminClient()
  const { error } = await admin
    .from('service_areas')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}
