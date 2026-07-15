// src/app/api/team/route.ts — Team member management

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TeamRole } from '@/types'
import crypto from 'crypto'

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tenants').select('id, plan').eq('user_id', user.id).single()
  return data ? { ...data, userId: user.id } : null
}

const TEAM_LIMITS: Record<string, number> = {
  starter: 1,
  studio:  3,
  agency:  10,
}

// GET — list team members
export async function GET() {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('team_members')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ data: data || [] })
}

// POST — invite a team member
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = TEAM_LIMITS[tenant.plan] || 1
  const admin = createAdminClient()

  // Check current team count
  const { count } = await admin
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  if ((count || 0) >= limit) {
    return NextResponse.json({
      error: `Team limit reached (${count}/${limit}) for your ${tenant.plan} plan.`,
      upgrade: true,
    }, { status: 403 })
  }

  const { email, role, name } = await req.json()

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  // Check if already invited
  const { data: existing } = await admin
    .from('team_members')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('email', email.toLowerCase())
    .single()

  if (existing) return NextResponse.json({ error: 'This email has already been invited' }, { status: 409 })

  // Generate secure invite token
  const inviteToken = crypto.randomBytes(32).toString('hex')

  const { data: member, error } = await admin
    .from('team_members')
    .insert({
      tenant_id:    tenant.id,
      email:        email.toLowerCase(),
      role:         (role as TeamRole) || 'editor',
      name:         name || null,
      invite_token: inviteToken,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${inviteToken}`

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    // Fetch tenant branding for email
    const { data: tenantFull } = await admin.from('tenants').select('branding').eq('id', tenant.id).single()
    const studioName = (tenantFull?.branding as { business_name?: string })?.business_name || 'Your Studio'

    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL || 'noreply@maspace.in',
      to:      email,
      subject: `You've been invited to manage ${studioName} on MaSpace`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#0A0A0A;color:#F5F0E8;padding:40px;">
          <div style="margin-bottom:32px;">
            <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#C8A96E;margin-bottom:8px;">Team Invitation</div>
            <div style="font-size:28px;font-weight:300;">You&apos;ve been invited</div>
          </div>
          <p style="color:#6B6B6B;font-size:15px;line-height:1.7;margin-bottom:32px;">
            You&apos;ve been invited to help manage <strong style="color:#F5F0E8;">${studioName}</strong> on MaSpace as an <strong style="color:#C8A96E;">${role || 'editor'}</strong>.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;background:#C8A96E;color:#0A0A0A;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;padding:14px 28px;text-decoration:none;">
            Accept Invitation
          </a>
          <p style="color:#6B6B6B;font-size:12px;margin-top:24px;line-height:1.6;">
            Or copy this link: <span style="color:#C8A96E;">${inviteUrl}</span><br/>
            This invitation expires in 7 days.
          </p>
        </div>
      `,
    }).catch(console.error)
  }

  return NextResponse.json({ data: member, invite_url: inviteUrl }, { status: 201 })
}

// PATCH — update role
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, role } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('team_members')
    .update({ role })
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE — remove team member
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const admin  = createAdminClient()
  await admin.from('team_members').delete().eq('id', id).eq('tenant_id', tenant.id)
  return NextResponse.json({ message: 'Removed' })
}
