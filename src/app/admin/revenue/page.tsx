// src/app/admin/revenue/page.tsx — Revenue analytics for admin
import { getAdminMetrics } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getRevenueData() {
  const metrics = await getAdminMetrics()
  const admin   = createAdminClient()

  // Get tenants with plan details for MRR calculation
  const { data: subs } = await admin
    .from('tenants')
    .select('plan, plan_status, created_at')
    .in('plan_status', ['active', 'trialing'])

  const MRR_RATES = { starter: 999, studio: 2499, agency: 5999 }

  const activeSubs   = (subs || []).filter(s => s.plan_status === 'active')
  const trialingSubs = (subs || []).filter(s => s.plan_status === 'trialing')

  const mrr = activeSubs.reduce(
    (sum, s) => sum + (MRR_RATES[s.plan as keyof typeof MRR_RATES] || 0), 0
  )
  const arr = mrr * 12

  // Revenue by plan
  const revenueByPlan = (['starter','studio','agency'] as const).map(plan => {
    const count = activeSubs.filter(s => s.plan === plan).length
    return {
      plan,
      count,
      mrr_contribution: count * MRR_RATES[plan],
      pct: mrr > 0 ? ((count * MRR_RATES[plan]) / mrr * 100).toFixed(1) : '0',
    }
  })

  // Signups over last 30 days (by week)
  const now = Date.now()
  const weeklySignups = [3,2,1,0].map(weeksAgo => {
    const start = new Date(now - (weeksAgo + 1) * 7 * 86400000).toISOString()
    const end   = new Date(now - weeksAgo * 7 * 86400000).toISOString()
    const count = (subs || []).filter(s => s.created_at >= start && s.created_at < end).length
    const label = weeksAgo === 0 ? 'This week' : weeksAgo === 1 ? 'Last week' : `${weeksAgo + 1}w ago`
    return { label, count }
  })

  return {
    mrr,
    arr,
    activeCount:   activeSubs.length,
    trialingCount: trialingSubs.length,
    revenueByPlan,
    weeklySignups,
    planCounts:    metrics.planCounts,
  }
}

export default async function AdminRevenuePage() {
  const data = await getRevenueData()

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="text-red-400 text-xs tracking-[0.3em] uppercase mb-2 font-mono">Admin → Revenue</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          Revenue <em className="text-[#C8A96E]">Overview</em>
        </h1>
      </div>

      {/* Top numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A] mb-8">
        {[
          { label: 'MRR (Active)',    value: `₹${data.mrr.toLocaleString('en-IN')}`,  sub: 'Monthly recurring' },
          { label: 'ARR',            value: `₹${data.arr.toLocaleString('en-IN')}`,  sub: 'Annual run rate' },
          { label: 'Active Subs',    value: data.activeCount,                         sub: 'Paying customers' },
          { label: 'In Trial',       value: data.trialingCount,                       sub: 'Free trial users' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0A0A0A] p-6">
            <div className="text-2xl font-light text-[#C8A96E] mb-1" style={{fontFamily:'Georgia,serif'}}>{stat.value}</div>
            <div className="text-xs font-medium text-[#F5F0E8]/80 mb-0.5">{stat.label}</div>
            <div className="text-xs text-[#6B6B6B]">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue by plan */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] mb-6">
        <div className="px-5 py-4 border-b border-[#1A1A1A]">
          <div className="text-sm font-medium text-[#F5F0E8]">Revenue by Plan</div>
        </div>
        <div className="p-5 space-y-4">
          {data.revenueByPlan.map(row => (
            <div key={row.plan}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#F5F0E8] capitalize w-14">{row.plan}</span>
                  <span className="text-xs text-[#6B6B6B]">{row.count} studios</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#C8A96E]">₹{row.mrr_contribution.toLocaleString('en-IN')}/mo</span>
                  <span className="text-xs text-[#6B6B6B] ml-2">({row.pct}%)</span>
                </div>
              </div>
              <div className="h-2 bg-[#1A1A1A]">
                <div
                  className="h-full bg-[#C8A96E] transition-all"
                  style={{ width: `${row.pct}%`, opacity: row.plan === 'agency' ? 1 : row.plan === 'studio' ? 0.7 : 0.4 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly signups */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A]">
        <div className="px-5 py-4 border-b border-[#1A1A1A]">
          <div className="text-sm font-medium text-[#F5F0E8]">New Signups — Last 4 Weeks</div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-4 h-24">
            {data.weeklySignups.map(week => {
              const maxCount = Math.max(...data.weeklySignups.map(w => w.count), 1)
              const pct      = (week.count / maxCount) * 100
              return (
                <div key={week.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-[#F5F0E8]">{week.count}</span>
                  <div className="w-full bg-[#1A1A1A] relative" style={{height:'60px'}}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#C8A96E]/60"
                      style={{height:`${Math.max(pct, 4)}%`}}
                    />
                  </div>
                  <span className="text-xs text-[#6B6B6B] whitespace-nowrap">{week.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-[#6B6B6B] border border-[#1A1A1A] p-3">
        <strong className="text-[#F5F0E8]/70">Note:</strong> MRR shown is estimated from plan type × active subscriber count. Connect Stripe API for exact billing data.
      </div>
    </div>
  )
}
