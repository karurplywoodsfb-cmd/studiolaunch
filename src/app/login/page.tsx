'use client'
// src/app/login/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-12 group">
          <div className="w-8 h-8 border border-[#C8A96E] flex items-center justify-center">
            <span className="text-[#C8A96E] text-lg font-light" style={{fontFamily:'Georgia,serif'}}>S</span>
          </div>
          <span className="text-sm tracking-[0.2em] uppercase font-light text-[#F5F0E8]">MaSpace</span>
        </Link>

        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">Welcome back</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-10">
          Sign in to your<br/><em>studio dashboard</em>
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
              placeholder="you@studio.com"
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
              placeholder="••••••••"
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
            className="w-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase py-4 hover:bg-[#A8854A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#6B6B6B]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#C8A96E] hover:text-[#F5F0E8] transition-colors">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
