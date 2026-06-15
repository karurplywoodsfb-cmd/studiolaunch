// src/lib/admin.ts — Admin authentication helpers

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { AdminTenantView } from '@/types'

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const admin = createAdminClient()
    const { data } = await admin
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    return !!data
  } catch {
    return false
  }
}

// Get aggregated metrics for admin dashboard
export async function getAdminMetrics() {
  const admin = createAdminClient()

  const now            = new Date()
  const thirtyDaysAgo  = new Date(now.getTime() - 30 * 86400000).toISOString()
  const sevenDaysAgo   = new Date(now.getTime() - 7 * 86400000).toISOString()

  const [
    tenantsRes,
    leadsRes,
    viewsRes,
    newTenantsRes,
    planCountsRes,
  ] = await Promise.all([
    admin.from('tenants').select('id, subdomain, custom_domain, plan, plan_status, white_label, created_at, branding, contact, location, stripe_customer_id', { count: 'exact' }),
    admin.from('leads').select('id, created_at', { count: 'exact' }),
    admin.from('page_views').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo),
    admin.from('tenants').select('id', { count: 'exact' }).gte('created_at', sevenDaysAgo),
    admin.from('tenants').select('plan'),
  ])

  const tenants = tenantsRes.data || []

  // Plan breakdown
  const planCounts = { starter: 0, studio: 0, agency: 0 }
  ;(planCountsRes.data || []).forEach((t: { plan: string }) => {
    if (t.plan in planCounts) planCounts[t.plan as keyof typeof planCounts]++
  })

  // Estimated MRR (rough — production would use Stripe API)
  const MRR_RATES = { starter: 999, studio: 2499, agency: 5999 }
  const estimatedMrr = tenants
    .filter((t: { plan_status: string }) => t.plan_status === 'active')
    .reduce((sum: number, t: { plan: string }) => sum + (MRR_RATES[t.plan as keyof typeof MRR_RATES] || 0), 0)

  // Build per-tenant view
  const tenantViews = await Promise.all(
    tenants.slice(0, 50).map(async (t: {
      id: string; subdomain: string; custom_domain: string | null;
      plan: string; plan_status: string; white_label: boolean;
      created_at: string; branding: Record<string,string>;
      contact: Record<string,string>; location: Record<string,string>;
      stripe_customer_id: string | null;
    }) => {
      const [leadCount, portfolioCount, viewCount] = await Promise.all([
        admin.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
        admin.from('portfolio_projects').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id).eq('published', true),
        admin.from('page_views').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id).gte('created_at', thirtyDaysAgo),
      ])
      return {
        id:               t.id,
        subdomain:        t.subdomain,
        custom_domain:    t.custom_domain,
        plan:             t.plan as AdminTenantView['plan'],
        plan_status:      t.plan_status,
        white_label:      t.white_label,
        created_at:       t.created_at,
        business_name:    t.branding?.business_name || t.subdomain,
        local_city:       t.location?.local_city || '—',
        email:            t.contact?.email || '—',
        lead_count:       leadCount.count || 0,
        portfolio_count:  portfolioCount.count || 0,
        page_views_30d:   viewCount.count || 0,
        stripe_customer_id: t.stripe_customer_id,
      }
    })
  )

  return {
    totalTenants:    tenantsRes.count  || 0,
    totalLeads:      leadsRes.count    || 0,
    pageViews30d:    viewsRes.count    || 0,
    newTenants7d:    newTenantsRes.count || 0,
    estimatedMrr,
    planCounts,
    tenants:         tenantViews,
  }
}
