// src/app/admin/page.tsx — Admin overview dashboard
import { getAdminMetrics } from '@/lib/admin'
import { formatCurrency, timeAgo, getTenantUrl } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const metrics = await getAdminMetrics()

  const PLAN_COLOR: Record<string, string> = {
    starter: 'text-[#6B6B6B]',
    studio:  'text-[#C8A96E]',
    agency:  'text-purple-400',
  }

  const STATUS_COLOR: Record<string, string> = {
    active:   'text-green-400',
    trialing: 'text-blue-400',
    past_due: 'text-yellow-400',
    canceled: 'text-red-400',
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="text-red-400 text-xs tracking-[0.3em] uppercase mb-2 font-mono">Admin Console</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          Platform <em className="text-[#C8A96E]">Overview</em>
        </h1>
        <p className="text-[#6B6B6B] text-xs mt-1">Live data — refreshes on page load</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A] mb-8">
        {[
          { label: 'Total Studios',    value: metrics.totalTenants,                     sub: `+${metrics.newTenants7d} this week`,   color: false },
          { label: 'Est. MRR',         value: `₹${(metrics.estimatedMrr/100).toFixed(0)}`,  sub: 'Active subs only',                   color: true },
          { label: 'Total Leads',      value: metrics.totalLeads,                       sub: 'All studios, all time',               color: false },
          { label: 'Page Views (30d)', value: metrics.pageViews30d,                     sub: 'Across all tenant sites',             color: false },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0A0A0A] p-6">
            <div className={`text-3xl font-light mb-1 ${stat.color ? 'text-[#C8A96E]' : 'text-[#F5F0E8]'}`}
              style={{fontFamily:'Georgia,serif'}}>
              {stat.value}
            </div>
            <div className="text-xs font-medium text-[#F5F0E8]/80 mb-0.5">{stat.label}</div>
            <div className="text-xs text-[#6B6B6B]">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-3 gap-px bg-[#1A1A1A] mb-8">
        {[
          { plan: 'Starter', count: metrics.planCounts.starter, price: '₹999/mo',   color: 'text-[#6B6B6B]' },
          { plan: 'Studio',  count: metrics.planCounts.studio,  price: '₹2,499/mo', color: 'text-[#C8A96E]' },
          { plan: 'Agency',  count: metrics.planCounts.agency,  price: '₹5,999/mo', color: 'text-purple-400' },
        ].map(p => (
          <div key={p.plan} className="bg-[#0A0A0A] p-5 flex items-center justify-between">
            <div>
              <div className={`text-lg font-light ${p.color}`} style={{fontFamily:'Georgia,serif'}}>{p.plan}</div>
              <div className="text-xs text-[#6B6B6B] mt-0.5">{p.price}</div>
            </div>
            <div className={`text-2xl font-light ${p.color}`} style={{fontFamily:'Georgia,serif'}}>{p.count}</div>
          </div>
        ))}
      </div>

      {/* Studios table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
          <div className="text-sm font-medium text-[#F5F0E8]">All Studios</div>
          <div className="text-xs text-[#6B6B6B]">{metrics.totalTenants} total · showing {metrics.tenants.length}</div>
        </div>

        {/* Table header */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#1A1A1A] text-xs tracking-widest uppercase text-[#6B6B6B]">
          <div className="col-span-3">Studio</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">City</div>
          <div className="col-span-1 text-center">Leads</div>
          <div className="col-span-1 text-center">Items</div>
          <div className="col-span-1 text-center">Views</div>
          <div className="col-span-2">Joined</div>
        </div>

        {metrics.tenants.map(t => (
          <div key={t.id}
            className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-[#1A1A1A] last:border-0 items-center hover:bg-[#141414] transition-colors">

            {/* Studio name + URL */}
            <div className="col-span-3 min-w-0">
              <div className="text-sm font-medium text-[#F5F0E8] truncate">{t.business_name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <a href={getTenantUrl(t.subdomain)} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#6B6B6B] hover:text-[#C8A96E] transition-colors truncate">
                  {t.subdomain}.maspace.in
                </a>
                {t.white_label && (
                  <span className="text-xs text-purple-400 border border-purple-400/30 px-1 py-0 flex-shrink-0">WL</span>
                )}
              </div>
            </div>

            {/* Plan */}
            <div className="col-span-2">
              <div className={`text-xs font-medium capitalize ${PLAN_COLOR[t.plan] || 'text-[#6B6B6B]'}`}>
                {t.plan}
              </div>
              <div className={`text-xs capitalize ${STATUS_COLOR[t.plan_status] || 'text-[#6B6B6B]'}`}>
                {t.plan_status}
              </div>
            </div>

            {/* City */}
            <div className="col-span-2 text-xs text-[#6B6B6B] truncate">{t.local_city}</div>

            {/* Leads */}
            <div className="col-span-1 text-center text-sm text-[#F5F0E8]">{t.lead_count}</div>

            {/* Portfolio items */}
            <div className="col-span-1 text-center text-xs text-[#6B6B6B]">{t.portfolio_count}</div>

            {/* Page views */}
            <div className="col-span-1 text-center text-xs text-[#6B6B6B]">{t.page_views_30d}</div>

            {/* Joined */}
            <div className="col-span-2 text-xs text-[#6B6B6B]">{timeAgo(t.created_at)}</div>
          </div>
        ))}
      </div>

      {/* Quick admin actions */}
      <div className="mt-6 bg-[#0D0D0D] border border-[#1A1A1A] p-5">
        <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/tenants"
            className="text-xs border border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8] hover:border-[#C8A96E]/40 px-4 py-2 transition-colors tracking-widest uppercase">
            Manage Studios
          </Link>
          <Link href="/admin/revenue"
            className="text-xs border border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8] hover:border-[#C8A96E]/40 px-4 py-2 transition-colors tracking-widest uppercase">
            Revenue Report
          </Link>
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
            className="text-xs border border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8] hover:border-[#C8A96E]/40 px-4 py-2 transition-colors tracking-widest uppercase">
            Stripe Dashboard ↗
          </a>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="text-xs border border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8] hover:border-[#C8A96E]/40 px-4 py-2 transition-colors tracking-widest uppercase">
            Supabase ↗
          </a>
        </div>
      </div>
    </div>
  )
}
