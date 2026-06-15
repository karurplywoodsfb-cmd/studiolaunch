// src/app/dashboard/analytics/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getAnalytics(tenantId: string) {
  const supabase = createAdminClient()
  const now      = new Date()

  // Last 30 days daily views
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
  const { data: views } = await supabase
    .from('page_views')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  // Leads by status
  const { data: leads } = await supabase
    .from('leads')
    .select('status, created_at')
    .eq('tenant_id', tenantId)

  // Build daily counts
  const dailyMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = 0
  }
  views?.forEach(v => {
    const key = v.created_at.slice(0, 10)
    if (key in dailyMap) dailyMap[key]++
  })

  // Leads by status counts
  const leadsByStatus = { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 }
  leads?.forEach(l => {
    if (l.status in leadsByStatus) leadsByStatus[l.status as keyof typeof leadsByStatus]++
  })

  // Leads last 30 days
  const recentLeads = leads?.filter(l => l.created_at >= thirtyDaysAgo).length || 0

  return {
    dailyViews:    Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    totalViews:    views?.length || 0,
    totalLeads:    leads?.length || 0,
    recentLeads,
    leadsByStatus,
    conversionRate: leads?.length
      ? ((leadsByStatus.converted / leads.length) * 100).toFixed(1)
      : '0.0',
  }
}

function MiniBar({ value, max, label, date }: { value: number; max: number; label: string; date: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-1 group" title={`${date}: ${value} views`}>
      <div className="text-xs text-[#6B6B6B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{value}</div>
      <div className="w-full bg-[#1A1A1A] relative flex-1 min-h-16">
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#C8A96E]/60 group-hover:bg-[#C8A96E] transition-colors"
          style={{ height: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <div className="text-xs text-[#6B6B6B] rotate-90 w-3 h-6 origin-center" style={{fontSize:'0.55rem'}}>
        {label}
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  const data = await getAnalytics(tenant.id)
  const maxViews = Math.max(...data.dailyViews.map(d => d.count), 1)

  const STAT_CARDS = [
    { label: 'Page Views (30d)',    value: data.totalViews,                    sub: 'Total visits to your site' },
    { label: 'Leads (30d)',         value: data.recentLeads,                   sub: 'Consultation requests' },
    { label: 'Total Leads',         value: data.totalLeads,                    sub: 'All time' },
    { label: 'Conversion Rate',     value: `${data.conversionRate}%`,          sub: 'Leads converted to clients' },
  ]

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Analytics</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          Site <em>Performance</em>
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A] mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-[#0A0A0A] p-6">
            <div className="text-3xl font-light text-[#C8A96E] mb-1" style={{fontFamily:'Georgia,serif'}}>{card.value}</div>
            <div className="text-xs font-medium text-[#F5F0E8]/80 mb-0.5">{card.label}</div>
            <div className="text-xs text-[#6B6B6B]">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Page views chart */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] mb-6">
        <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="text-sm font-medium text-[#F5F0E8]">Page Views — Last 30 Days</div>
          <div className="text-xs text-[#6B6B6B]">{data.totalViews} total</div>
        </div>
        <div className="p-5">
          {data.totalViews === 0 ? (
            <div className="text-center py-10 text-[#6B6B6B] text-sm">
              No page views recorded yet. Share your site URL to start tracking.
            </div>
          ) : (
            <div className="flex items-end gap-0.5 h-32">
              {data.dailyViews.map(d => (
                <MiniBar
                  key={d.date}
                  value={d.count}
                  max={maxViews}
                  label={d.date.slice(5)}  // MM-DD
                  date={d.date}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead funnel */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A]">
        <div className="px-5 py-4 border-b border-[#1A1A1A]">
          <div className="text-sm font-medium text-[#F5F0E8]">Lead Pipeline</div>
        </div>
        <div className="p-5">
          {data.totalLeads === 0 ? (
            <div className="text-center py-8 text-[#6B6B6B] text-sm">No leads yet.</div>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'new',       label: 'New',       color: '#C8A96E' },
                { key: 'contacted', label: 'Contacted', color: '#60A5FA' },
                { key: 'qualified', label: 'Qualified', color: '#A78BFA' },
                { key: 'converted', label: 'Converted', color: '#34D399' },
                { key: 'lost',      label: 'Lost',      color: '#6B6B6B' },
              ].map(({ key, label, color }) => {
                const count = data.leadsByStatus[key as keyof typeof data.leadsByStatus]
                const pct   = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-20 text-xs text-[#6B6B6B] text-right flex-shrink-0">{label}</div>
                    <div className="flex-1 bg-[#1A1A1A] h-6 relative">
                      <div
                        className="absolute inset-y-0 left-0 transition-all"
                        style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
                      />
                    </div>
                    <div className="w-12 text-xs text-[#F5F0E8] text-right flex-shrink-0">
                      {count} <span className="text-[#6B6B6B]">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note about tracking */}
      <div className="mt-6 border border-[#1A1A1A] p-4 text-xs text-[#6B6B6B] leading-relaxed">
        <strong className="text-[#F5F0E8]/70">How tracking works:</strong> Page views are recorded when visitors load your site. Lead counts reflect all consultation form submissions. Analytics are updated in real time.
      </div>
    </div>
  )
}
