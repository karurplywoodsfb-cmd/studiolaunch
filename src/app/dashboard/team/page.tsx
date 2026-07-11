'use client'
// src/app/dashboard/team/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { TeamMember } from '@/types'
import { formatDate, timeAgo } from '@/lib/utils'

export default function TeamPage() {
  const [members, setMembers]   = useState<TeamMember[]>([])
  const [loading, setLoading]   = useState(true)
  const [plan, setPlan]         = useState('starter')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'editor' | 'owner'>('editor')
  const [inviteName, setInviteName]   = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const fetchMembers = useCallback(async () => {
    const res  = await fetch('/api/team')
    const json = await res.json()
    setMembers(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
    // Get plan from localStorage cache or fetch
    fetch('/api/studio/plan').then(r => r.json()).then(j => setPlan(j.plan || 'starter')).catch(() => {})
  }, [fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setError(''); setSuccess('')

    const res  = await fetch('/api/team', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: inviteEmail, role: inviteRole, name: inviteName }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Invite failed')
      setInviting(false)
      return
    }

    setSuccess(`Invitation sent to ${inviteEmail}`)
    setInviteEmail('')
    setInviteName('')
    await fetchMembers()
    setInviting(false)
  }

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return
    await fetch('/api/team', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleRoleChange = async (id: string, role: 'editor' | 'owner') => {
    await fetch('/api/team', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, role }),
    })
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  }

  const LIMITS: Record<string, number> = { starter: 1, studio: 3, agency: 10 }
  const limit = LIMITS[plan] || 1

  const inputCls = 'w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]'

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Team</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-3xl font-light text-[#F5F0E8]">
          Team <em>Members</em>
        </h1>
      </div>

      {/* Plan limit notice */}
      <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#1A1A1A] p-4 mb-8">
        <div className="text-sm text-[#6B6B6B]">
          <span className="text-[#F5F0E8]">{members.length}</span> of <span className="text-[#F5F0E8]">{limit}</span> team slots used
          <span className="text-[#C8A96E] ml-2 capitalize">({plan} plan)</span>
        </div>
        {plan === 'starter' && (
          <a href="/dashboard/settings?tab=billing"
            className="text-xs font-semibold tracking-widest uppercase bg-[#C8A96E] text-[#0A0A0A] px-4 py-2 hover:bg-[#A8854A] transition-colors">
            Upgrade for More Seats
          </a>
        )}
      </div>

      {/* Invite form */}
      {members.length < limit && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 mb-8">
          <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Invite a Team Member</div>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Full Name</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)}
                  className={inputCls} placeholder="Team member name" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Email *</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className={inputCls} placeholder="colleague@studio.com" required />
              </div>
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Role</label>
              <div className="flex gap-3">
                {(['editor', 'owner'] as const).map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setInviteRole(r)}
                      className={`w-4 h-4 border rounded-full flex items-center justify-center transition-colors ${inviteRole === r ? 'border-[#C8A96E]' : 'border-[#3A3A3A]'}`}
                    >
                      {inviteRole === r && <div className="w-2 h-2 rounded-full bg-[#C8A96E]" />}
                    </div>
                    <span className="text-sm text-[#F5F0E8] capitalize">{r}</span>
                    <span className="text-xs text-[#6B6B6B]">
                      {r === 'editor' ? '— can edit content' : '— full access'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error  && <div className="text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">{error}</div>}
            {success && <div className="text-green-400 text-xs border border-green-400/20 bg-green-400/5 px-4 py-3">✓ {success}</div>}

            <button type="submit" disabled={inviting}
              className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
              {inviting ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="text-center py-12 text-[#6B6B6B] text-sm">Loading...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#2A2A2A] text-[#6B6B6B] text-sm">
          No team members yet. Invite someone above.
        </div>
      ) : (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A]">
          <div className="px-5 py-3 border-b border-[#1A1A1A] grid grid-cols-12 gap-4 text-xs tracking-widest uppercase text-[#6B6B6B]">
            <div className="col-span-5">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-1" />
          </div>
          {members.map(member => (
            <div key={member.id} className="px-5 py-4 border-b border-[#1A1A1A] last:border-0 grid grid-cols-12 gap-4 items-center">
              {/* Avatar + info */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#C8A96E]">
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#F5F0E8] font-medium truncate">{member.name || '—'}</div>
                  <div className="text-xs text-[#6B6B6B] truncate">{member.email}</div>
                </div>
              </div>

              {/* Role selector */}
              <div className="col-span-3">
                <select
                  value={member.role}
                  onChange={e => handleRoleChange(member.id, e.target.value as 'editor' | 'owner')}
                  className="bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] text-xs px-2 py-1.5 outline-none focus:border-[#C8A96E] appearance-none"
                >
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {/* Status */}
              <div className="col-span-3">
                {member.invite_accepted ? (
                  <span className="text-xs text-green-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Active
                  </span>
                ) : (
                  <span className="text-xs text-[#6B6B6B]">
                    Invited {timeAgo(member.invited_at)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => handleRemove(member.id, member.email)}
                  className="text-xs text-[#6B6B6B] hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permission info */}
      <div className="mt-6 border border-[#1A1A1A] p-4 text-xs text-[#6B6B6B] leading-relaxed">
        <strong className="text-[#F5F0E8]/70">Roles:</strong>{' '}
        <span className="text-[#C8A96E]">Editors</span> can manage portfolio, case studies, and leads.{' '}
        <span className="text-[#C8A96E]">Owners</span> have full access including billing and settings.
      </div>
    </div>
  )
}
