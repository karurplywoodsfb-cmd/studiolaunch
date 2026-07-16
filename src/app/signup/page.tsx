'use client'
// src/app/signup/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/brand/Logo'

export default function SignupPage() {
  const router  = useRouter()
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirect to onboarding (session may be auto-confirmed in dev)
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <Logo size={28} dark />
        </Link>

        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">14-day free trial</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-10">
          Create your<br/><em>studio account</em>
        </h1>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
              placeholder="Ravi Shankar"
              required
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
              placeholder="ravi@studio.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
              placeholder="Min 8 characters"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase py-4 hover:bg-[#A8854A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account — Free'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B6B6B]">
          By signing up you agree to our{' '}
          <Link href="/terms" className="text-[#C8A96E]">Terms</Link>
          {' & '}
          <Link href="/privacy" className="text-[#C8A96E]">Privacy Policy</Link>
        </p>

        <p className="mt-6 text-center text-sm text-[#6B6B6B]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C8A96E] hover:text-[#F5F0E8] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
