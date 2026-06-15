// src/app/admin/events/page.tsx — Tenant event audit log
import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  if (!(await isAdmin())) redirect('/login')

  const admin = createAdminClient()

  const { data: events } = await admin
    .from('tenant_events')
    .select('*, tenants(branding, subdomain)')
    .order('created_at', { ascending: false })
    .limit(100)

  const EVENT_COLOR: Record<string, string> = {
    plan_upgrade:   'text-green-400 border-green-400/30 bg-green-400/5',
    plan_cancel:    'text-red-400 border-red-400/30 bg-red-400/5',
    lead_received:  'text-[#C8A96E] border-[#C8A96E]/30 bg-[#C8A96E]/5',
    seo_enriched:   'text-blue-400 border-blue-400/30 bg-blue-400/5',
    default:        'text-[#6B6B6B] border-[#2A2A2A] bg-transparent',
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="text-red-400 text-xs tracking-[0.3em] uppercase mb-2 font-mono">Admin → Events</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          Event <em className="text-[#C8A96E]">Log</em>
        </h1>
        <p className="text-[#6B6B6B] text-xs mt-1">Last 100 platform events across all studios</p>
      </div>

      {!events || events.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#2A2A2A] text-[#6B6B6B] text-sm">
          No events logged yet. Events are written when tenants upgrade plans, receive leads, or run SEO enrichment.
        </div>
      ) : (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A]">
          {events.map((event: {
            id: number
            event_type: string
            metadata: Record<string, unknown>
            created_at: string
            tenants?: { branding?: { business_name?: string }; subdomain?: string }
          }) => {
            const colorCls = EVENT_COLOR[event.event_type] || EVENT_COLOR.default
            const studioName = event.tenants?.branding?.business_name || event.tenants?.subdomain || '—'
            return (
              <div key={event.id}
                className="flex items-start gap-4 px-5 py-4 border-b border-[#1A1A1A] last:border-0">
                <span className={`text-xs px-2 py-0.5 border font-mono flex-shrink-0 mt-0.5 ${colorCls}`}>
                  {event.event_type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#F5F0E8] truncate">{studioName}</div>
                  {Object.keys(event.metadata || {}).length > 0 && (
                    <div className="text-xs text-[#6B6B6B] font-mono mt-0.5 truncate">
                      {JSON.stringify(event.metadata)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-[#6B6B6B] flex-shrink-0">{timeAgo(event.created_at)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
