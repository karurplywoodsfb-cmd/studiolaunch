'use client'
// src/app/dashboard/leads/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStatus, LeadActivity } from '@/types'
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
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true)
    try {
      const res = await fetch(`/api/leads/activities?lead_id=${lead.id}`)
      const json = await res.json()
      setActivities(json.data || [])
    } finally {
      setActivitiesLoading(false)
    }
  }, [lead.id])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const addNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch('/api/leads/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, content: noteText.trim() }),
      })
      if (res.ok) {
        setNoteText('')
        fetchActivities()
      }
    } finally {
      setAddingNote(false)
    }
  }

  const updateStatus = async (status: LeadStatus) => {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    onStatusChange(lead.id, status)
    setUpdating(false)
    // The DB trigger logs the status change — refresh the timeline to show it
    fetchActivities()
  }

  const cfg = statusConfig(lead.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                className={`text-xs px-3 py-1.5 rounded-full border font-medium tracking-wide transition-all ${
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
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 text-sm text-[#F5F0E8]/80 leading-relaxed">
                {lead.notes}
              </div>
            </div>
          )}

          {/* Internal activity timeline */}
          <div>
            <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Activity</div>

            <div className="flex gap-2 mb-3">
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addNote() }}
                placeholder="Add an internal note..."
                className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-[#F5F0E8] px-3 py-2 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
              />
              <button
                onClick={addNote}
                disabled={addingNote || !noteText.trim()}
                className="text-xs px-4 py-2 rounded-xl bg-[#C8A96E] text-[#0A0A0A] font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {activitiesLoading ? (
              <div className="text-xs text-[#6B6B6B] py-2">Loading timeline...</div>
            ) : activities.length === 0 ? (
              <div className="text-xs text-[#6B6B6B] py-2">No activity yet.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activities.map(a => (
                  <div key={a.id} className="flex gap-3 text-xs border-l-2 border-[#2A2A2A] pl-3 py-1">
                    <span className={a.type === 'status_change' ? 'text-[#C8A96E]' : 'text-[#F5F0E8]/80'}>
                      {a.content}
                    </span>
                    <span className="text-[#6B6B6B] flex-shrink-0 ml-auto">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA actions */}
        <div className="px-6 py-4 border-t border-[#1A1A1A] flex gap-3">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex-1 rounded-xl bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase py-3 text-center hover:bg-[#A8854A] transition-colors"
            >
              Call Now
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}?subject=Re: Design Consultation`}
              className="flex-1 rounded-xl border border-[#2A2A2A] text-[#F5F0E8]/70 text-xs font-medium tracking-widest uppercase py-3 text-center hover:border-[#C8A96E]/50 transition-colors"
            >
              Send Email
            </a>
          )}
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=Hi ${lead.name}, thank you for your consultation request. I'd love to discuss your project further.`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-4 py-3 hover:border-green-500/50 hover:text-green-400 transition-colors"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({
  leads,
  onOpen,
  onStatusChange,
}: {
  leads: Lead[]
  onOpen: (lead: Lead) => void
  onStatusChange: (id: string, status: LeadStatus) => void
}) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [draggingId, setDraggingId]   = useState<string | null>(null)

  const moveLead = async (id: string, status: LeadStatus) => {
    onStatusChange(id, status)
    const supabase = createClient()
    await supabase.from('leads').update({ status }).eq('id', id)
  }

  const accentBar: Record<string, string> = {
    new: 'bg-[#C8A96E]', contacted: 'bg-blue-400', qualified: 'bg-purple-400',
    converted: 'bg-green-400', lost: 'bg-[#3A3A3A]',
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_OPTIONS.map(col => {
        const colLeads = leads.filter(l => l.status === col.value)
        return (
          <div
            key={col.value}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.value) }}
            onDragLeave={() => setDragOverCol(prev => prev === col.value ? null : prev)}
            onDrop={e => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/lead-id')
              if (id) moveLead(id, col.value)
              setDragOverCol(null)
              setDraggingId(null)
            }}
            className={`flex-shrink-0 w-72 rounded-2xl border transition-colors duration-200 overflow-hidden ${dragOverCol === col.value ? 'border-[#C8A96E]/60 bg-[#C8A96E]/5' : 'border-[#1A1A1A] bg-[#0D0D0D]'}`}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
              <span className={`w-1.5 h-1.5 rounded-full ${accentBar[col.value]}`} />
              <span className={`text-xs font-semibold tracking-widest uppercase ${col.color.split(' ')[0]}`}>{col.label}</span>
              <span className="text-xs text-[#6B6B6B] ml-auto bg-[#1A1A1A] rounded-full px-2 py-0.5">{colLeads.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-320px)] overflow-y-auto">
              {colLeads.length === 0 && (
                <div className="text-xs text-[#3A3A3A] text-center py-6">No leads</div>
              )}
              {colLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('text/lead-id', lead.id); setDraggingId(lead.id) }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => onOpen(lead)}
                  className={`rounded-xl bg-[#141414] border border-[#2A2A2A] p-3 cursor-grab active:cursor-grabbing hover:border-[#C8A96E]/40 hover:-translate-y-0.5 transition-all duration-200 ${draggingId === lead.id ? 'opacity-40' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#C8A96E]">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[#F5F0E8] font-medium truncate">{lead.name}</div>
                      <div className="text-xs text-[#6B6B6B] truncate">{lead.property_type || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#3A3A3A]">{timeAgo(lead.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} aria-label={`Call ${lead.name}`}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-[#C8A96E] hover:bg-[#1A1A1A] transition-colors">
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3.3 5.4c.7 1.4 1.9 2.6 3.3 3.3l1.1-1.1c.15-.15.35-.2.5-.1.55.2 1.15.3 1.8.3.3 0 .5.2.5.5V10c0 .3-.2.5-.5.5C5.85 10.5 1.5 6.15 1.5 1.5c0-.3.2-.5.5-.5h1.75c.3 0 .5.2.5.5 0 .65.1 1.25.3 1.8.05.15 0 .35-.1.5z" stroke="currentColor" strokeWidth="1"/></svg>
                      </a>
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label={`WhatsApp ${lead.name}`}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-green-400 hover:bg-[#1A1A1A] transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.1-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads]             = useState<Lead[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Lead | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch]           = useState('')
  const [view, setView]               = useState<'table' | 'pipeline'>('table')
  const [tenantId, setTenantId]       = useState<string>('')

  const fetchLeads = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tenant } = await supabase
      .from('tenants').select('id').eq('user_id', user.id).single()
    if (!tenant) return

    setTenantId(tenant.id)

    const query = supabase
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

  // Pipeline groups by status itself, so it only needs the search filter, not the status tabs
  const searchFiltered = leads.filter(l => {
    const matchSearch = !search || [l.name, l.phone, l.email, l.property_type, l.project_location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchSearch
  })

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = leads.filter(l => l.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Leads</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-3xl font-light text-[#F5F0E8]">
            Consultation <em>Inbox</em>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex border border-[#2A2A2A] rounded-full p-1">
            <button
              onClick={() => setView('table')}
              className={`text-xs px-3 py-1.5 rounded-full tracking-widest uppercase transition-colors ${view === 'table' ? 'bg-[#C8A96E] text-[#0A0A0A]' : 'text-[#6B6B6B] hover:text-[#F5F0E8]'}`}
            >Cards</button>
            <button
              onClick={() => setView('pipeline')}
              className={`text-xs px-3 py-1.5 rounded-full tracking-widest uppercase transition-colors ${view === 'pipeline' ? 'bg-[#C8A96E] text-[#0A0A0A]' : 'text-[#6B6B6B] hover:text-[#F5F0E8]'}`}
            >Pipeline</button>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light text-[#C8A96E]" style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}}>{leads.filter(l=>l.status==='new').length}</div>
            <div className="text-xs text-[#6B6B6B] tracking-widest uppercase">New</div>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      {view === 'table' && (
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs px-4 py-2 rounded-full border whitespace-nowrap transition-colors ${
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
            className={`text-xs px-4 py-2 rounded-full border whitespace-nowrap transition-colors ${
              filterStatus === opt.value
                ? opt.color
                : 'border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F5F0E8]'
            }`}
          >
            {opt.label} ({counts[opt.value] || 0})
          </button>
        ))}
      </div>
      )}

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
          className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-[#F5F0E8] pl-10 pr-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
        />
      </div>

      {/* Board */}
      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B] text-sm">Loading leads...</div>
      ) : view === 'pipeline' ? (
        <KanbanBoard leads={searchFiltered} onOpen={setSelected} onStatusChange={handleStatusChange} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D]">
          <div className="text-[#F5F0E8]/80 text-sm mb-2">
            {leads.length === 0 ? 'Share your website to start receiving consultation requests.' : 'No leads match your filters'}
          </div>
          {leads.length === 0 && (
            <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed mt-2">
              Leads will appear here automatically when someone fills out your consultation form.
            </p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lead => {
            const cfg = statusConfig(lead.status)
            return (
              <div
                key={lead.id}
                onClick={() => setSelected(lead)}
                className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] p-5 hover:border-[#C8A96E]/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#C8A96E]">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[#F5F0E8] font-medium truncate">{lead.name}</div>
                    <div className="text-xs text-[#6B6B6B] truncate">{lead.phone}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${cfg.color}`}>{lead.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 flex-1">
                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-[#6B6B6B]">Project</div>
                    <div className="text-xs text-[#F5F0E8]/80 truncate">{lead.property_type || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-[#6B6B6B]">Budget</div>
                    <div className="text-xs text-[#F5F0E8]/80 truncate">{lead.budget_tier?.split('(')[0]?.trim() || '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] tracking-widest uppercase text-[#6B6B6B]">Location</div>
                    <div className="text-xs text-[#F5F0E8]/80 truncate">{lead.project_location || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]">
                  <span className="text-xs text-[#6B6B6B]">Received {timeAgo(lead.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} aria-label={`Call ${lead.name}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-[#C8A96E] hover:bg-[#1A1A1A] transition-colors">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3.3 5.4c.7 1.4 1.9 2.6 3.3 3.3l1.1-1.1c.15-.15.35-.2.5-.1.55.2 1.15.3 1.8.3.3 0 .5.2.5.5V10c0 .3-.2.5-.5.5C5.85 10.5 1.5 6.15 1.5 1.5c0-.3.2-.5.5-.5h1.75c.3 0 .5.2.5.5 0 .65.1 1.25.3 1.8.05.15 0 .35-.1.5z" stroke="currentColor" strokeWidth="1"/></svg>
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} aria-label={`Email ${lead.name}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-blue-400 hover:bg-[#1A1A1A] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="2.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M1.5 3.5l5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                      </a>
                    )}
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}?text=Hi ${lead.name}, thank you for your consultation request.`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label={`WhatsApp ${lead.name}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-green-400 hover:bg-[#1A1A1A] transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.1-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/></svg>
                    </a>
                  </div>
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
