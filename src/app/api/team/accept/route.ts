// src/app/api/team/accept/route.ts — Accept a team invitation

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  // Find the invite
  const { data: member, error: findErr } = await admin
    .from('team_members')
    .select('*')
    .eq('invite_token', token)
    .single()

  if (findErr || !member) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  if (member.invite_accepted) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 409 })
  }

  if (member.email !== user.email) {
    return NextResponse.json({ error: 'This invitation is for a different email address' }, { status: 403 })
  }

  // Mark as accepted
  const { error: updateErr } = await admin
    .from('team_members')
    .update({
      user_id:          user.id,
      invite_accepted:  true,
      accepted_at:      new Date().toISOString(),
      invite_token:     null, // invalidate token
    })
    .eq('id', member.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ message: 'Invitation accepted', tenant_id: member.tenant_id })
}
