// src/app/api/studio/create-checkout/route.ts — Stripe checkout session

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PLANS, PlanType } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const Stripe     = (await import('stripe')).default
    const stripe     = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    const plan = (req.nextUrl.searchParams.get('plan') || 'studio') as PlanType
    const planConfig = PLANS[plan]
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants').select('id, stripe_customer_id, subdomain').eq('user_id', user.id).single()
    if (!tenant) return NextResponse.redirect(new URL('/onboarding', req.url))

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let customerId = tenant.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { tenant_id: tenant.id, subdomain: tenant.subdomain },
      })
      customerId = customer.id
      await admin.from('tenants').update({ stripe_customer_id: customerId }).eq('id', tenant.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: planConfig.stripe_price_id_monthly, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?tab=billing&success=1`,
      cancel_url:  `${appUrl}/dashboard/settings?tab=billing`,
      metadata:    { tenant_id: tenant.id, plan },
      subscription_data: { metadata: { tenant_id: tenant.id, plan } },
    })

    return NextResponse.redirect(session.url!)
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
