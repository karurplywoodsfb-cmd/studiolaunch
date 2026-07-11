// src/app/dashboard/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { timeAgo, getTenantUrl } from '@/lib/utils'
import { Lead } from '@/types'

function bucketByDay(rows: { created_at: string }[], days: number, now: Date) {
  const buckets: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 })
  }
  const index = new Map(buckets.map((b, i) => [b.date, i]))
  for (const row of rows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10)
    const idx = index.get(key)
    if (idx !== undefined) buckets[idx].count++
  }
  return buckets
}

function trendDelta(buckets: { count: number }[]) {
  const last7 = buckets.slice(-7).reduce((a, b) => a + b.count, 0)
  const prev7 = buckets.slice(-14, -7).reduce((a, b) => a + b.count, 0)
  if (prev7 === 0) return last7 > 0 ? { label: 'New', up: true } : null
  const pct = Math.round(((last7 - prev7) / prev7) * 100)
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, up: pct >= 0 }
}

async function getDashboardData(tenantId: string) {
  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [leadsRes, portfolioRes, caseRes, viewsRes, recentLeadsRes, reviewsRes, recentPortfolioRes] = await Promise.all([
    supabase.from('leads').select('id, status, created_at', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('portfolio_projects').select('id, published', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('case_studies').select('id, published', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('page_views').select('id, created_at', { count: 'exact' }).eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('google_reviews').select('rating, author_name, created_at', { count: 'exact' }).eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    supabase.from('portfolio_projects').select('id, title, created_at, published').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
  ])

  const allLeads      = leadsRes.data || []
  const allReviews    = reviewsRes.data || []
  const newLeads      = allLeads.filter(l => l.status === 'new').length
  const avgRating     = allReviews.length ? allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length : 0

  const leadsTrend = bucketByDay(allLeads, 14, now)
  const viewsTrend = bucketByDay((viewsRes.data || []), 14, now)

  // Recent activity feed — merges leads, portfolio adds, and review syncs into one timeline
  const activity = [
    ...allLeads.slice(0, 5).map(l => ({ type: 'lead' as const, label: 'New consultation request', created_at: l.created_at })),
    ...(recentPortfolioRes.data || []).map(p => ({ type: 'portfolio' as const, label: `Project added: ${p.title}`, created_at: p.created_at })),
    ...allReviews.slice(0, 5).map(r => ({ type: 'review' as const, label: `Review from ${r.author_name}`, created_at: r.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)

  return {
    totalLeads:     leadsRes.count      || 0,
    newLeads,
    portfolioItems: portfolioRes.count  || 0,
    caseStudies:    caseRes.count       || 0,
    pageViews:      viewsRes.count      || 0,
    reviewCount:    reviewsRes.count    || 0,
    avgRating,
    recentLeads:    (recentLeadsRes.data || []) as Lead[],
    leadsTrend,
    viewsTrend,
    leadsDelta:     trendDelta(leadsTrend),
    viewsDelta:     trendDelta(viewsTrend),
    activity,
  }
}

function Sparkline({ data, color = '#C8A96E' }: { data: { date: string; count: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map(d => d.count))
  const w = 100, h = 32, step = w / (data.length - 1 || 1)
  const points = data.map((d, i) => `${i * step},${h - (d.count / max) * (h - 4) - 2}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ACTIVITY_ICON: Record<string, string> = { lead: '◆', portfolio: '▢', review: '★' }


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
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

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
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">{greeting}</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-4xl font-light text-[#F5F0E8]">
            <em>{tenant.branding.business_name}</em>
          </h1>
        </div>
        <div className="flex items-center gap-2 border border-[#2A2A2A] rounded-full px-4 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-xs text-[#F5F0E8]/80 capitalize">{tenant.plan} plan</span>
          <span className="text-xs text-[#6B6B6B]">· {tenant.plan_status}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'New Leads',     value: data.newLeads,      sub: `${data.totalLeads} total`,   href: '/dashboard/leads',       trend: data.leadsTrend, delta: data.leadsDelta, highlight: data.newLeads > 0 },
          { label: 'Page Views',    value: data.pageViews,     sub: 'Last 30 days',                href: '/dashboard/analytics',   trend: data.viewsTrend, delta: data.viewsDelta, highlight: false },
          { label: 'Portfolio',     value: data.portfolioItems, sub: `${data.caseStudies} case studies`, href: '/dashboard/portfolio', trend: null, delta: null, highlight: false },
          { label: 'Google Rating', value: data.avgRating ? data.avgRating.toFixed(1) : '—', sub: `${data.reviewCount} reviews`, href: '/dashboard/reviews', trend: null, delta: null, highlight: false },
        ].map(stat => (
          <Link key={stat.label} href={stat.href} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-5 hover:border-[#C8A96E]/40 hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-1">
              <div className={`text-3xl font-light transition-colors ${stat.highlight ? 'text-[#C8A96E]' : 'text-[#F5F0E8] group-hover:text-[#C8A96E]'}`} style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}}>
                {stat.value}
              </div>
              {stat.delta && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${stat.delta.up ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {stat.delta.label}
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-[#F5F0E8]/80 mb-0.5">{stat.label}</div>
            <div className="text-xs text-[#6B6B6B] mb-2">{stat.sub}</div>
            {stat.trend && <Sparkline data={stat.trend} />}
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-6">

        {/* Recent leads — cards, not rows */}
        <div className="lg:col-span-3 bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
            <div className="text-sm font-medium text-[#F5F0E8]">Recent Leads</div>
            <Link href="/dashboard/leads" className="text-xs text-[#C8A96E] hover:text-[#F5F0E8] transition-colors tracking-widest uppercase">
              View All
            </Link>
          </div>
          {data.recentLeads.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[#F5F0E8]/80 text-sm mb-2">Share your website to start receiving consultation requests.</div>
              <p className="text-[#6B6B6B] text-xs leading-relaxed max-w-xs mx-auto">
                When someone fills out your consultation form, they&apos;ll appear here instantly.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {data.recentLeads.map(lead => (
                <Link key={lead.id} href={`/dashboard/leads?id=${lead.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-[#2A2A2A] hover:bg-[#141414] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#C8A96E]">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#F5F0E8] font-medium truncate">{lead.name}</div>
                    <div className="text-xs text-[#6B6B6B] truncate">{lead.property_type} · {lead.budget_tier}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[lead.status] || 'text-[#6B6B6B]'}`}>
                      {lead.status}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">{timeAgo(lead.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity timeline */}
        <div className="lg:col-span-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-5">
          <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Recent Activity</div>
          {data.activity.length === 0 ? (
            <p className="text-xs text-[#6B6B6B] leading-relaxed">Activity across leads, portfolio, and reviews will show up here.</p>
          ) : (
            <div className="space-y-4">
              {data.activity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="text-[#C8A96E] text-xs leading-none mt-0.5">{ACTIVITY_ICON[item.type]}</span>
                    {i < data.activity.length - 1 && <span className="w-px flex-1 bg-[#1A1A1A] mt-1.5" />}
                  </div>
                  <div className="pb-1">
                    <div className="text-xs text-[#F5F0E8]/90">{item.label}</div>
                    <div className="text-[10px] text-[#6B6B6B] mt-0.5">{timeAgo(item.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions — visual tiles */}
      <div className="mb-6">
        <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/portfolio?new=1', label: 'Add Project',       icon: '＋' },
            { href: '/dashboard/case-studies',    label: 'Publish Case Study', icon: '▢' },
            { href: '/dashboard/settings',        label: 'Edit Homepage',     icon: '✎' },
            { href: siteUrl,                      label: 'Preview Website',   icon: '↗', external: true },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noopener noreferrer' : undefined}
              className="flex flex-col gap-3 p-5 rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] hover:border-[#C8A96E]/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="w-9 h-9 rounded-full bg-[#C8A96E]/10 text-[#C8A96E] flex items-center justify-center text-base">{action.icon}</span>
              <span className="text-sm text-[#F5F0E8] font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Website health */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-5">
        <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Website Health</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'SSL Certificate', ok: true },
            { label: 'Domain',          ok: !!tenant.custom_domain, action: tenant.custom_domain ? null : { href: '/dashboard/settings?tab=domain', text: 'Add domain' } },
            { label: 'Google Reviews',  ok: data.reviewCount > 0, action: data.reviewCount > 0 ? null : { href: '/dashboard/reviews', text: 'Connect' } },
            { label: 'SEO Enrichment',  ok: !!tenant.seo_enriched, action: tenant.seo_enriched ? null : { href: '/dashboard/settings?tab=seo', text: 'Run now' } },
            { label: 'Sitemap',         ok: true },
            { label: 'Robots.txt',      ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#141414]">
              <span className="text-xs text-[#F5F0E8]/80">{item.label}</span>
              {item.ok ? (
                <span className="text-xs px-2 py-0.5 rounded-full text-green-400 bg-green-400/10 font-medium">Active</span>
              ) : (
                <Link href={item.action!.href} className="text-xs px-2 py-0.5 rounded-full text-[#C8A96E] bg-[#C8A96E]/10 hover:bg-[#C8A96E]/20 transition-colors font-medium">
                  {item.action!.text}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
