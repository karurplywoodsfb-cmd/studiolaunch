// src/app/api/tenants/domain/route.ts — Custom domain claim + DNS TXT verification

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import dns from 'dns/promises'

export const runtime = 'nodejs' // dns module requires the Node runtime, not edge

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tenants').select('id, plan, custom_domain').eq('user_id', user.id).single()
  return data
}

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i

// POST — claim a domain: stores it unverified + generates a verification token
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (tenant.plan === 'starter') {
    return NextResponse.json({ error: 'Custom domains require the Studio or Agency plan.' }, { status: 403 })
  }

  const { domain } = await req.json()
  const clean = (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')

  if (!clean || !DOMAIN_RE.test(clean)) {
    return NextResponse.json({ error: 'Enter a valid domain, e.g. www.yourstudio.com' }, { status: 400 })
  }

  const token = `maspace-verify-${crypto.randomBytes(16).toString('hex')}`
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('tenants')
    .update({ custom_domain: clean, domain_verified: false, domain_verification_token: token })
    .eq('id', tenant.id)
    .select('custom_domain, domain_verified, domain_verification_token')
    .single()

  if (error) {
    // Unique constraint violation -> domain already claimed by another tenant
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This domain is already connected to another studio.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// GET — check DNS for the verification TXT record and flip domain_verified on match
export async function GET() {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: full } = await admin
    .from('tenants')
    .select('custom_domain, domain_verified, domain_verification_token')
    .eq('id', tenant.id)
    .single()

  if (!full?.custom_domain) {
    return NextResponse.json({ error: 'No domain set yet' }, { status: 400 })
  }
  if (full.domain_verified) {
    return NextResponse.json({ verified: true })
  }

  try {
    const records = await dns.resolveTxt(`_maspace-verify.${full.custom_domain}`)
    const found = records.flat().some(r => r === full.domain_verification_token)

    if (found) {
      await admin.from('tenants').update({ domain_verified: true }).eq('id', tenant.id)
      return NextResponse.json({ verified: true })
    }
    return NextResponse.json({ verified: false, error: 'TXT record not found yet — DNS changes can take up to a few hours to propagate.' })
  } catch {
    return NextResponse.json({ verified: false, error: 'Could not resolve TXT record yet. Double-check the record and try again shortly.' })
  }
}
