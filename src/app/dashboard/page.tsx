// src/app/dashboard/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, timeAgo, getTenantUrl } from '@/lib/utils'
import { Lead } from '@/types'

async function getDashboardData(tenantId: string) {
  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [leadsRes, portfolioRes, caseRes, viewsRes, recentLeadsRes] = await Promise.all([
    supabase.from('leads').select('id, status, created_at', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('portfolio_projects').select('id, published', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('case_studies').select('id, published', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('page_views').select('id', { count: 'exact' }).eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
  ])

  const allLeads = leadsRes.data || []
  const newLeads = allLeads.filter(l => l.status === 'new').length

  return {
    totalLeads:     leadsRes.count      || 0,
    newLeads,
    portfolioItems: portfolioRes.count  || 0,
    caseStudies:    caseRes.count       || 0,
    pageViews:      viewsRes.count      || 0,
    recentLeads:    (recentLeadsRes.data || []) as Lead[],
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  const { welcome } = await searchParams
  const data    = await getDashboardData(tenant.id)
  const siteUrl = getTenantUrl(tenant.subdomain)

  const statusColor: Record<string, string> = {
    new:       'text-[#C8A96E] bg-[#C8A96E]/10',
    contacted: 'text-blue-400 bg-blue-400/10',
    qualified: 'text-green-400 bg-green-400/10',
    converted: 'text-emerald-400 bg-emerald-400/10',
    lost:      'text-[#6B6B6B] bg-[#1A1A1A]',
  }

  return (
    <div className="max-w-5xl">
      {/* Welcome banner */}
      {welcome && (
        <div className="mb-8 border border-[#C8A96E]/30 bg-[#C8A96E]/5 p-5 flex items-start gap-4">
          <div className="w-8 h-8 bg-[#C8A96E] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="text-[#F5F0E8] font-medium text-sm mb-1">Your studio site is live! 🎉</div>
            <div className="text-[#6B6B6B] text-xs leading-relaxed">
              Visit{' '}
              <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-[#C8A96E] hover:underline">{siteUrl}</a>
              {' '}to see your site. Now upload your portfolio photos and your first case study to make it shine.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Overview</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          Good day, <em>{tenant.branding.business_name}</em>
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A] mb-8">
        {[
          { label: 'New Leads',      value: data.newLeads,       sub: `${data.totalLeads} total`,    href: '/dashboard/leads',     highlight: data.newLeads > 0 },
          { label: 'Page Views',     value: data.pageViews,      sub: 'Last 30 days',               href: '/dashboard/analytics', highlight: false },
          { label: 'Portfolio Items',value: data.portfolioItems, sub: 'Published on site',           href: '/dashboard/portfolio', highlight: false },
          { label: 'Case Studies',   value: data.caseStudies,    sub: 'Published on site',           href: '/dashboard/case-studies', highlight: false },
        ].map(stat => (
          <Link key={stat.label} href={stat.href} className="bg-[#0A0A0A] p-6 hover:bg-[#0D0D0D] transition-colors group">
            <div className={`text-3xl font-light mb-1 transition-colors ${stat.highlight ? 'text-[#C8A96E]' : 'text-[#F5F0E8] group-hover:text-[#C8A96E]'}`} style={{fontFamily:'Georgia,serif'}}>
              {stat.value}
            </div>
            <div className="text-xs font-medium text-[#F5F0E8]/80 mb-1">{stat.label}</div>
            <div className="text-xs text-[#6B6B6B]">{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Recent leads */}
        <div className="lg:col-span-3 bg-[#0D0D0D] border border-[#1A1A1A]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
            <div className="text-sm font-medium text-[#F5F0E8]">Recent Leads</div>
            <Link href="/dashboard/leads" className="text-xs text-[#C8A96E] hover:text-[#F5F0E8] transition-colors tracking-widest uppercase">
              View All
            </Link>
          </div>
          {data.recentLeads.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[#6B6B6B] text-sm mb-4">No leads yet.</div>
              <p className="text-[#6B6B6B] text-xs leading-relaxed max-w-xs mx-auto">
                When someone fills out your consultation form, they&apos;ll appear here instantly.
              </p>
            </div>
          ) : (
            <div>
              {data.recentLeads.map(lead => (
                <Link key={lead.id} href={`/dashboard/leads?id=${lead.id}`}
                  className="flex items-center gap-4 px-5 py-4 border-b border-[#1A1A1A] last:border-0 hover:bg-[#141414] transition-colors">
                  <div className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#C8A96E]">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#F5F0E8] font-medium truncate">{lead.name}</div>
                    <div className="text-xs text-[#6B6B6B] truncate">{lead.property_type} · {lead.budget_tier}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 font-medium capitalize ${statusColor[lead.status] || 'text-[#6B6B6B]'}`}>
                      {lead.status}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">{timeAgo(lead.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5">
            <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Quick Actions</div>
            <div className="space-y-2">
              {[
                { href: '/dashboard/portfolio',    label: 'Add Portfolio Item',  icon: '＋' },
                { href: '/dashboard/case-studies', label: 'Create Case Study',   icon: '＋' },
                { href: '/dashboard/settings',     label: 'Edit Site Content',   icon: '✎' },
                { href: siteUrl,                   label: 'View Live Site',       icon: '↗', external: true },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  target={action.external ? '_blank' : undefined}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#6B6B6B] hover:text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#2A2A2A]"
                >
                  <span className="text-[#C8A96E] w-4 text-center">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Site status */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5">
            <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Site Status</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F5F0E8]/70">Subdomain</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F5F0E8]/70">Custom Domain</span>
                <span className="text-xs text-[#6B6B6B]">
                  {tenant.custom_domain ? tenant.custom_domain : (
                    <Link href="/dashboard/settings?tab=domain" className="text-[#C8A96E] hover:underline">Add domain</Link>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F5F0E8]/70">SEO Enrichment</span>
                <span className={`text-xs ${tenant.seo_enriched ? 'text-green-400' : 'text-[#6B6B6B]'}`}>
                  {tenant.seo_enriched ? 'Complete' : (
                    <Link href="/dashboard/settings?tab=seo" className="text-[#C8A96E] hover:underline">Run now</Link>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F5F0E8]/70">Plan</span>
                <span className="text-xs text-[#C8A96E] capitalize font-medium">{tenant.plan} · {tenant.plan_status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
