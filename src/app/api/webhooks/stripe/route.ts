// src/app/api/webhooks/stripe/route.ts — Stripe webhook handler

import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const StripeLib  = (await import('stripe')).default
  const stripe     = new StripeLib(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub      = event.data.object as Stripe.Subscription
        const tenantId = sub.metadata?.tenant_id
        if (!tenantId) break
        const plan       = sub.metadata?.plan || 'starter'
        const planStatus = sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trialing' : sub.status === 'past_due' ? 'past_due' : 'canceled'
        await admin.from('tenants').update({ plan, plan_status: planStatus, stripe_subscription_id: sub.id }).eq('id', tenantId)
        break
      }
      case 'customer.subscription.deleted': {
        const sub      = event.data.object as Stripe.Subscription
        const tenantId = sub.metadata?.tenant_id
        if (!tenantId) break
        await admin.from('tenants').update({ plan: 'starter', plan_status: 'canceled' }).eq('id', tenantId)
        break
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice  = event.data.object as Stripe.Invoice & { subscription?: string }
        const subId    = typeof invoice.subscription === 'string' ? invoice.subscription : null
        if (!subId) break
        const { data: tenant } = await admin.from('tenants').select('id').eq('stripe_subscription_id', subId).single()
        if (!tenant) break
        const status = event.type === 'invoice.payment_succeeded' ? 'active' : 'past_due'
        await admin.from('tenants').update({ plan_status: status }).eq('id', tenant.id)
        break
      }
      default: break
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
