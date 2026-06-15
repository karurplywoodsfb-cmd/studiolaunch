// src/app/api/leads/route.ts — Submit a consultation lead

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@studiolaunch.in',
    to, subject, html,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenant_id, name, phone, email, property_type, scope, budget_tier, project_location, notes } = body

    if (!tenant_id || !name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get tenant for notification email
    const { data: tenant } = await supabase
      .from('tenants')
      .select('branding, contact, location')
      .eq('id', tenant_id)
      .single()

    // Save lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        tenant_id,
        name,
        phone,
        email: email || null,
        property_type: property_type || null,
        scope: scope || null,
        budget_tier: budget_tier || null,
        project_location: project_location || null,
        notes: notes || null,
        status: 'new',
        source: 'website',
      })
      .select()
      .single()

    if (error) {
      console.error('Lead save error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    // Send email notification to studio owner
    if (tenant?.contact?.email) {
      const studioName = tenant.branding?.business_name || 'Your Studio'

      await sendEmail(
        tenant.contact.email,
        `New Consultation Request — ${name} | ${studioName}`,
        `
          <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#0A0A0A;color:#F5F0E8;padding:40px;">
            <div style="border-bottom:1px solid #2A2A2A;padding-bottom:24px;margin-bottom:24px;">
              <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#C8A96E;margin-bottom:8px;">New Lead — ${studioName}</div>
              <div style="font-size:28px;font-weight:300;">Consultation Request</div>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${[['Name',name],['Phone',phone],['Email',email||'—'],['Property Type',property_type||'—'],['Scope',scope||'—'],['Budget Tier',budget_tier||'—'],['Location',project_location||'—']]
                .map(([k,v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #1A1A1A;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;width:40%;">${k}</td><td style="padding:10px 0;border-bottom:1px solid #1A1A1A;font-size:14px;color:#F5F0E8;">${v}</td></tr>`).join('')}
            </table>
            ${notes ? `<div style="margin-top:24px;padding:16px;background:#141414;border-left:2px solid #C8A96E;"><div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;margin-bottom:8px;">Notes</div><div style="font-size:14px;color:#F5F0E8;line-height:1.6;">${notes}</div></div>` : ''}
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A2A;font-size:11px;color:#6B6B6B;">Received via StudioLaunch · ${new Date().toLocaleString('en-IN')}</div>
          </div>
        `
      )
    }

    // Track page event
    await supabase.from('page_views').insert({
      tenant_id,
      path: '/lead',
      referrer: req.headers.get('referer') || null,
    })

    return NextResponse.json({ data: lead, message: 'Consultation request submitted' }, { status: 201 })
  } catch (err) {
    console.error('Lead API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
