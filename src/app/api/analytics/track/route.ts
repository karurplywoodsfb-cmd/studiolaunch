// src/app/api/analytics/track/route.ts — Record a page view

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { tenant_id, path } = await req.json()
    if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })

    const admin = createAdminClient()

    // Verify tenant exists
    const { data: tenant } = await admin
      .from('tenants').select('id').eq('id', tenant_id).single()
    if (!tenant) return NextResponse.json({ error: 'Invalid tenant' }, { status: 404 })

    await admin.from('page_views').insert({
      tenant_id,
      path:     path || '/',
      referrer: req.headers.get('referer') || null,
      country:  req.headers.get('x-vercel-ip-country') ||
                req.headers.get('cf-ipcountry') || null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Track error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
