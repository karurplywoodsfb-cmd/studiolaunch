'use client'
// src/app/admin/tenants/AdminTenantsClient.tsx

import { useState } from 'react'
import { AdminTenantView, PlanType } from '@/types'
import { timeAgo, getTenantUrl } from '@/lib/utils'

const PLAN_OPTIONS: PlanType[] = ['starter', 'studio', 'agency']

const PLAN_COLOR: Record<string, string> = {
  starter: 'text-[#6B6B6B] border-[#3A3A3A]',
  studio:  'text-[#C8A96E] border-[#C8A96E]/40',
  agency:  'text-purple-400 border-purple-400/40',
}
const STATUS_COLOR: Record<string, string> = {
  active:   'text-green-400',
  trialing: 'text-blue-400',
  past_due: 'text-yellow-400',
  canceled: 'text-red-400',
}

function PlanOverrideModal({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: AdminTenantView
  onClose: () => void
  onSaved: (id: string, plan: PlanType, wl: boolean) => void
}) {
  const [plan, setPlan]       = useState<PlanType>(tenant.plan as PlanType)
  const [wl, setWl]           = useState(tenant.white_label)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/tenants', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: tenant.id, plan, white_label: wl }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed'); setSaving(false); return }
    onSaved(tenant.id, plan, wl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0D0D0D] border border-[#2A2A2A] w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
          <div>
            <div className="text-sm font-medium text-[#F5F0E8]">{tenant.business_name}</div>
            <div className="text-xs text-[#6B6B6B]">{tenant.subdomain}.studiolaunch.in</div>
          </div>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Plan selector */}
          <div>
            <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Override Plan</div>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`py-2.5 text-xs font-medium capitalize border transition-colors ${
                    plan === p
                      ? PLAN_COLOR[p] + ' bg-[#141414]'
                      : 'border-[#2A2A2A] text-[#6B6B6B] hover:border-[#3A3A3A]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* White-label toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[#1A1A1A]">
            <div>
              <div className="text-sm text-[#F5F0E8]">White Label</div>
              <div className="text-xs text-[#6B6B6B]">Remove StudioLaunch branding</div>
            </div>
            <div
              onClick={() => setWl(!wl)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${wl ? 'bg-[#C8A96E]' : 'bg-[#2A2A2A]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${wl ? 'left-6' : 'left-1'}`} />
            </div>
          </div>

          {/* Studio details */}
          <div className="bg-[#141414] border border-[#1A1A1A] p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Email</span>
              <span className="text-[#F5F0E8]">{tenant.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">City</span>
              <span className="text-[#F5F0E8]">{tenant.local_city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Status</span>
              <span className={STATUS_COLOR[tenant.plan_status] || 'text-[#6B6B6B]'}>{tenant.plan_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Leads</span>
              <span className="text-[#F5F0E8]">{tenant.lead_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Stripe</span>
              <span className="text-[#F5F0E8] font-mono text-xs">
                {tenant.stripe_customer_id
                  ? <a href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[#C8A96E] hover:underline">
                      {tenant.stripe_customer_id.slice(0, 16)}...
                    </a>
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Joined</span>
              <span className="text-[#F5F0E8]">{timeAgo(tenant.created_at)}</span>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-3 py-2">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#1A1A1A] flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <a href={getTenantUrl(tenant.subdomain)} target="_blank" rel="noopener noreferrer"
            className="border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-5 py-3 hover:border-[#C8A96E]/40 hover:text-[#F5F0E8] transition-colors">
            View Site ↗
          </a>
        </div>
      </div>
    </div>
  )
}

export default function AdminTenantsClient({ tenants: initial }: { tenants: AdminTenantView[] }) {
  const [tenants, setTenants] = useState(initial)
  const [search, setSearch]   = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [selected, setSelected]     = useState<AdminTenantView | null>(null)

  const filtered = tenants.filter(t => {
    const matchPlan   = planFilter === 'all' || t.plan === planFilter
    const matchSearch = !search || [t.business_name, t.subdomain, t.email, t.local_city]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchPlan && matchSearch
  })

  const handleSaved = (id: string, plan: PlanType, wl: boolean) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, plan, white_label: wl } : t))
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="text-red-400 text-xs tracking-[0.3em] uppercase mb-2 font-mono">Admin → Studios</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          All <em className="text-[#C8A96E]">Studios</em>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, city..."
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-[#F5F0E8] pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'starter', 'studio', 'agency'].map(p => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={`text-xs px-3 py-2 border capitalize transition-colors ${
                planFilter === p
                  ? 'border-[#C8A96E]/40 text-[#C8A96E] bg-[#C8A96E]/10'
                  : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8]'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A]">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#1A1A1A] text-xs tracking-widest uppercase text-[#6B6B6B]">
          <div className="col-span-4">Studio</div>
          <div className="col-span-2">Plan / Status</div>
          <div className="col-span-2">City</div>
          <div className="col-span-1 text-center">Leads</div>
          <div className="col-span-1 text-center">Views</div>
          <div className="col-span-2">Joined</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-[#6B6B6B] text-sm">No studios match your filters.</div>
        ) : filtered.map(t => (
          <div
            key={t.id}
            onClick={() => setSelected(t)}
            className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-[#1A1A1A] last:border-0 hover:bg-[#141414] cursor-pointer transition-colors items-center"
          >
            <div className="col-span-4 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-[#F5F0E8] truncate">{t.business_name}</div>
                {t.white_label && (
                  <span className="text-xs text-purple-400 border border-purple-400/30 px-1 flex-shrink-0">WL</span>
                )}
              </div>
              <div className="text-xs text-[#6B6B6B] truncate">{t.email}</div>
            </div>

            <div className="col-span-2">
              <div className={`text-xs font-medium capitalize ${PLAN_COLOR[t.plan]?.split(' ')[0] || 'text-[#6B6B6B]'}`}>
                {t.plan}
              </div>
              <div className={`text-xs ${STATUS_COLOR[t.plan_status] || 'text-[#6B6B6B]'}`}>
                {t.plan_status}
              </div>
            </div>

            <div className="col-span-2 text-xs text-[#6B6B6B] truncate">{t.local_city}</div>
            <div className="col-span-1 text-center text-sm text-[#F5F0E8]">{t.lead_count}</div>
            <div className="col-span-1 text-center text-xs text-[#6B6B6B]">{t.page_views_30d}</div>
            <div className="col-span-2 text-xs text-[#6B6B6B]">{timeAgo(t.created_at)}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-[#6B6B6B]">
        Showing {filtered.length} of {tenants.length} studios · Click any row to manage
      </div>

      {selected && (
        <PlanOverrideModal
          tenant={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
