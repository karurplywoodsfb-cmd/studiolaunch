'use client'
// src/app/invite/[token]/page.tsx — Accept team invitation

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  params: Promise<{ token: string }>
}

export default function InvitePage({ params }: Props) {
  const router = useRouter()
  const [token, setToken]         = useState('')
  const [invite, setInvite]       = useState<{ email: string; role: string; tenant_name?: string } | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [password, setPassword]   = useState('')
  const [name, setName]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      validateInvite(p.token)
    })
  }, [params])

  const validateInvite = async (t: string) => {
    const supabase = createClient()
    const admin    = createClient() // use anon client — RLS allows public read of invite

    const { data, error } = await supabase
      .from('team_members')
      .select('email, role, tenant_id, invite_accepted')
      .eq('invite_token', t)
      .single()

    if (error || !data) {
      setError('This invitation is invalid or has expired.')
      setLoading(false)
      return
    }

    if (data.invite_accepted) {
      setError('This invitation has already been accepted.')
      setLoading(false)
      return
    }

    // Fetch tenant name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('branding')
      .eq('id', data.tenant_id)
      .single()

    setInvite({
      email: data.email,
      role:  data.role,
      tenant_name: (tenant?.branding as { business_name?: string })?.business_name,
    })
    setLoading(false)
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invite) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()

    // Sign up or sign in
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email:    invite.email,
      password,
      options: { data: { full_name: name } },
    })

    if (signUpError && !signUpError.message.includes('already registered')) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    // If already registered, sign in instead
    if (signUpError?.message.includes('already registered')) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.email, password,
      })
      if (signInError) {
        setError('Incorrect password. Please try again.')
        setSubmitting(false)
        return
      }
    }

    // Mark invite as accepted via API
    const res = await fetch('/api/team/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error || 'Failed to accept invitation')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-7 h-7 border border-[#C8A96E] flex items-center justify-center">
            <span className="text-[#C8A96E] text-sm font-light" style={{fontFamily:'Georgia,serif'}}>S</span>
          </div>
          <span className="text-xs tracking-[0.2em] uppercase font-light text-[#F5F0E8]">MaSpace</span>
        </div>

        {error && !invite ? (
          <div>
            <div className="text-red-400 border border-red-400/20 bg-red-400/5 p-4 text-sm mb-6">{error}</div>
            <a href="/" className="text-[#C8A96E] text-sm hover:underline">← Back to home</a>
          </div>
        ) : invite ? (
          <>
            <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">Team Invitation</div>
            <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-3">
              Join <em>{invite.tenant_name || 'the studio'}</em>
            </h1>
            <p className="text-[#6B6B6B] text-sm mb-8 leading-relaxed">
              You&apos;ve been invited as an <span className="text-[#C8A96E] capitalize">{invite.role}</span>.
              Create a password to complete your account setup.
            </p>

            <form onSubmit={handleAccept} className="space-y-5">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Email</label>
                <div className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#6B6B6B] px-4 py-3 text-sm">
                  {invite.email}
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
                  placeholder="Your full name" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">
                  {/* If already registered */ 'Create Password'}
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
                  placeholder="Min 8 characters" minLength={8} required />
              </div>
              {error && <div className="text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">{error}</div>}
              <button type="submit" disabled={submitting}
                className="w-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase py-4 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
                {submitting ? 'Accepting...' : 'Accept & Join'}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  )
}
