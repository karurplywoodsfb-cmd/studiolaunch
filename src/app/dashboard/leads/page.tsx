'use client'
// src/app/dashboard/leads/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStatus } from '@/types'
import { timeAgo, formatDate } from '@/lib/utils'

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new',       label: 'New',       color: 'text-[#C8A96E] bg-[#C8A96E]/10 border-[#C8A96E]/20' },
  { value: 'contacted', label: 'Contacted', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { value: 'qualified', label: 'Qualified', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { value: 'converted', label: 'Converted', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { value: 'lost',      label: 'Lost',      color: 'text-[#6B6B6B] bg-[#1A1A1A] border-[#2A2A2A]' },
]

const statusConfig = (s: string) =>
  STATUS_OPTIONS.find(o => o.value === s) || STATUS_OPTIONS[0]

function LeadDetailPanel({
  lead,
  onClose,
  onStatusChange,
}: {
  lead: Lead
  onClose: () => void
  onStatusChange: (id: string, status: LeadStatus) => void
}) {
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (status: LeadStatus) => {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    onStatusChange(lead.id, status)
    setUpdating(false)
  }

  const cfg = statusConfig(lead.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0D0D0D] border border-[#2A2A2A] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
          <div>
            <div className="text-[#F5F0E8] font-medium">{lead.name}</div>
            <div className="text-[#6B6B6B] text-xs mt-0.5">{formatDate(lead.created_at)}</div>
          </div>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Status bar */}
        <div className="px-6 py-4 border-b border-[#1A1A1A]">
          <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Update Status</div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateStatus(opt.value)}
                disabled={updating || lead.status === opt.value}
                className={`text-xs px-3 py-1.5 border font-medium tracking-wide transition-all ${
                  lead.status === opt.value
                    ? opt.color + ' opacity-100'
                    : 'text-[#6B6B6B] bg-transparent border-[#2A2A2A] hover:border-[#C8A96E]/40'
                } disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lead details */}
        <div className="px-6 py-5 space-y-4">
          {[
            ['Phone',         lead.phone,           `tel:${lead.phone}`],
            ['Email',         lead.email,            lead.email ? `mailto:${lead.email}` : null],
            ['Property Type', lead.property_type,    null],
            ['Scope',         lead.scope,            null],
            ['Budget Tier',   lead.budget_tier,      null],
            ['Location',      lead.project_location, null],
          ].map(([label, value, href]) =>
            value ? (
              <div key={label as string} className="flex gap-4">
                <div className="text-xs tracking-widest uppercase text-[#6B6B6B] w-28 flex-shrink-0 pt-0.5">{label}</div>
                <div className="text-sm text-[#F5F0E8] flex-1">
                  {href ? (
                    <a href={href as string} className="text-[#C8A96E] hover:underline">{value}</a>
                  ) : value}
                </div>
              </div>
            ) : null
          )}

          {lead.notes && (
            <div>
              <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Notes</div>
              <div className="bg-[#141414] border border-[#2A2A2A] p-4 text-sm text-[#F5F0E8]/80 leading-relaxed">
                {lead.notes}
              </div>
            </div>
          )}
        </div>

        {/* CTA actions */}
        <div className="px-6 py-4 border-t border-[#1A1A1A] flex gap-3">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex-1 bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase py-3 text-center hover:bg-[#A8854A] transition-colors"
            >
              Call Now
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}?subject=Re: Design Consultation`}
              className="flex-1 border border-[#2A2A2A] text-[#F5F0E8]/70 text-xs font-medium tracking-widest uppercase py-3 text-center hover:border-[#C8A96E]/50 transition-colors"
            >
              Send Email
            </a>
          )}
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=Hi ${lead.name}, thank you for your consultation request. I'd love to discuss your project further.`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-4 py-3 hover:border-green-500/50 hover:text-green-400 transition-colors"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads]             = useState<Lead[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Lead | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch]           = useState('')
  const [tenantId, setTenantId]       = useState<string>('')

  const fetchLeads = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tenant } = await supabase
      .from('tenants').select('id').eq('user_id', user.id).single()
    if (!tenant) return

    setTenantId(tenant.id)

    let query = supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    const { data } = await query
    setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Real-time subscription
  useEffect(() => {
    if (!tenantId) return
    const supabase = createClient()
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        setLeads(prev => [payload.new as Lead, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  const handleStatusChange = (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const filtered = leads.filter(l => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    const matchSearch = !search || [l.name, l.phone, l.email, l.property_type, l.project_location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchStatus && matchSearch
  })

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = leads.filter(l => l.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Leads</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
            Consultation <em>Inbox</em>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light text-[#C8A96E]" style={{fontFamily:'Georgia,serif'}}>{leads.filter(l=>l.status==='new').length}</div>
          <div className="text-xs text-[#6B6B6B] tracking-widest uppercase">New</div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs px-4 py-2 border whitespace-nowrap transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#C8A96E]/10 border-[#C8A96E]/30 text-[#C8A96E]'
              : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8]'
          }`}
        >
          All ({leads.length})
        </button>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`text-xs px-4 py-2 border whitespace-nowrap transition-colors ${
              filterStatus === opt.value
                ? opt.color
                : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8]'
            }`}
          >
            {opt.label} ({counts[opt.value] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email, location..."
          className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-[#F5F0E8] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B] text-sm">Loading leads...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-[#1A1A1A] bg-[#0D0D0D]">
          <div className="text-[#6B6B6B] text-sm mb-2">
            {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
          </div>
          {leads.length === 0 && (
            <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed mt-2">
              Leads will appear here automatically when someone fills out your consultation form.
            </p>
          )}
        </div>
      ) : (
        <div className="border border-[#1A1A1A] bg-[#0D0D0D]">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#1A1A1A] text-xs tracking-widest uppercase text-[#6B6B6B]">
            <div className="col-span-3">Name</div>
            <div className="col-span-2 hidden md:block">Property</div>
            <div className="col-span-2 hidden lg:block">Budget</div>
            <div className="col-span-2 hidden md:block">Status</div>
            <div className="col-span-2 hidden lg:block">Received</div>
            <div className="col-span-1" />
          </div>

          {filtered.map(lead => {
            const cfg = statusConfig(lead.status)
            return (
              <div
                key={lead.id}
                onClick={() => setSelected(lead)}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-[#1A1A1A] last:border-0 hover:bg-[#141414] cursor-pointer transition-colors items-center"
              >
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#C8A96E]">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-[#F5F0E8] font-medium truncate">{lead.name}</div>
                    <div className="text-xs text-[#6B6B6B] truncate">{lead.phone}</div>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block text-xs text-[#6B6B6B] truncate">{lead.property_type || '—'}</div>
                <div className="col-span-2 hidden lg:block text-xs text-[#6B6B6B] truncate">{lead.budget_tier?.split('(')[0]?.trim() || '—'}</div>
                <div className="col-span-2 hidden md:block">
                  <span className={`text-xs px-2 py-1 border font-medium capitalize ${cfg.color}`}>{lead.status}</span>
                </div>
                <div className="col-span-2 hidden lg:block text-xs text-[#6B6B6B]">{timeAgo(lead.created_at)}</div>
                <div className="col-span-1 flex justify-end">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#6B6B6B]">
                    <path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <LeadDetailPanel
          lead={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
