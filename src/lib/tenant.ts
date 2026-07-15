// src/lib/tenant.ts — Tenant data access helpers

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Tenant } from '@/types'
import { cache } from 'react'

// ── Get tenant by subdomain (cached per request) ──────────────────────────────
export const getTenantBySubdomain = cache(async (subdomain: string): Promise<Tenant | null> => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .single()
  if (error || !data) return null
  return data as Tenant
})

// ── Get tenant by custom domain (only if ownership has been verified) ────────
export const getTenantByDomain = cache(async (domain: string): Promise<Tenant | null> => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain)
    .eq('domain_verified', true)
    .single()
  if (error || !data) return null
  return data as Tenant
})

// ── Get current user's tenant ─────────────────────────────────────────────────
export async function getCurrentTenant(): Promise<Tenant | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data as Tenant
}

// ── Get full site data for rendering ─────────────────────────────────────────
export async function getSiteData(tenantId: string) {
  const supabase = createAdminClient()

  const [portfolioRes, caseStudiesRes, faqRes, reviewsRes] = await Promise.all([
    supabase
      .from('portfolio_projects')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('published', true)
      .order('display_order', { ascending: true }),

    supabase
      .from('case_studies')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1),

    supabase
      .from('faq_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true }),

    supabase
      .from('google_reviews')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .limit(6),
  ])

  return {
    portfolio:  portfolioRes.data  || [],
    caseStudy:  caseStudiesRes.data?.[0] || null,
    faqs:       faqRes.data        || [],
    reviews:    reviewsRes.data    || [],
  }
}

// ── Check subdomain availability ──────────────────────────────────────────────
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'cdn', 'dashboard', 'login', 'signup', 'onboarding', 'invite']
  if (RESERVED.includes(subdomain)) return false
  if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) return false

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain)
    .single()

  return !data
}

// ── Update tenant ─────────────────────────────────────────────────────────────
export async function updateTenant(tenantId: string, updates: Partial<Tenant>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single()

  return { data, error }
}

// ── Validate plan limits ──────────────────────────────────────────────────────
import { PLANS } from '@/types'

export async function checkPlanLimit(
  tenantId: string,
  resource: 'portfolio_items' | 'case_studies',
  plan: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createAdminClient()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  const limit = planConfig?.limits[resource] ?? 5

  const table = resource === 'portfolio_items' ? 'portfolio_projects' : 'case_studies'
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const current = count || 0
  return { allowed: current < limit, current, limit }
}
