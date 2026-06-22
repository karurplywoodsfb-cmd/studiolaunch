// src/app/api/tenants/route.ts — Create a new tenant

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isSubdomainAvailable } from '@/lib/tenant'
import { OnboardingData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    // Identify the caller from their session — never trust a client-supplied user_id
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user_id = user.id

    const body: OnboardingData = await req.json()

    const {
      business_name, tagline, logo_letter,
      local_city, state, street_address, pin_code, geo_latitude, geo_longitude, service_radius_km,
      phone_number, phone_display, email, instagram_handle,
      project_count, years_active, sqft_total, subdomain,
    } = body

    // Validate required fields
    if (!user_id || !business_name || !subdomain || !local_city || !phone_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check subdomain availability
    const available = await isSubdomainAvailable(subdomain)
    if (!available) {
      return NextResponse.json({ error: 'Subdomain is not available' }, { status: 409 })
    }

    const supabase = createAdminClient()

    // Check user doesn't already have a tenant
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Account already has a site' }, { status: 409 })
    }

    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        user_id,
        subdomain,
        plan: 'starter',
        plan_status: 'trialing',
        onboarding_completed: true,
        branding: { business_name, tagline, logo_letter: logo_letter || business_name.charAt(0).toUpperCase(), primary_color: '#0A0A0A', accent_color: '#C8A96E' },
        contact: { phone_number, phone_display, email, instagram_handle, houzz_handle: '' },
        location: { street_address, local_city, state, pin_code, geo_latitude: geo_latitude || '0', geo_longitude: geo_longitude || '0', service_radius_km: service_radius_km || 60 },
        stats: { project_count: project_count || 0, years_active: years_active || 1, sqft_total: sqft_total || '1', city_radius: service_radius_km || 60 },
        content: {
          hero_headline_line1: 'Space',
          hero_headline_line2: 'designed',
          hero_headline_line3: `with precision`,
          hero_subtext: `We transform residential and commercial spaces in ${local_city} into considered environments.`,
          hero_image_url: '',
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Tenant creation error:', error)
      return NextResponse.json({ error: 'Failed to create studio' }, { status: 500 })
    }

    // Seed default FAQs
    await supabase.rpc('seed_default_faqs', {
      p_tenant_id: tenant.id,
      p_city: local_city,
    })

    return NextResponse.json({ data: tenant, message: 'Studio created successfully' }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
