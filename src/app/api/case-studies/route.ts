// src/app/api/case-studies/route.ts — Case Study CRUD

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkPlanLimit } from '@/lib/tenant'

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tenants').select('id, plan, subdomain, custom_domain').eq('user_id', user.id).single()
  return data
}

export async function GET() {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('case_studies').select('*').eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: viewRows } = await admin
    .from('page_views')
    .select('path')
    .eq('tenant_id', tenant.id)
    .like('path', '/case-studies/%')

  const viewCounts = new Map<string, number>()
  for (const row of viewRows || []) {
    viewCounts.set(row.path, (viewCounts.get(row.path) || 0) + 1)
  }
  const withViews = (data || []).map(s => ({
    ...s,
    views: s.slug ? (viewCounts.get(`/case-studies/${s.slug}`) || 0) : 0,
  }))

  return NextResponse.json({ data: withViews, tenant: { subdomain: tenant.subdomain, custom_domain: tenant.custom_domain } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, current, limit } = await checkPlanLimit(tenant.id, 'case_studies', tenant.plan)
  if (!allowed) {
    return NextResponse.json({
      error: `Case study limit reached (${current}/${limit}). Upgrade to Studio plan.`,
      upgrade: true,
    }, { status: 403 })
  }

  const body  = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('case_studies').insert({ ...body, tenant_id: tenant.id }).select().single()

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
    .from('case_studies').update(updates).eq('id', id).eq('tenant_id', tenant.id).select().single()

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
    .from('case_studies').delete().eq('id', id).eq('tenant_id', tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Deleted' })
}
