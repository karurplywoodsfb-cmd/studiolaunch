'use client'
// src/components/dashboard/DashboardShell.tsx

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Tenant } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { getTenantUrl } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',                label: 'Overview',       icon: 'grid' },
  { href: '/dashboard/leads',          label: 'Leads',          icon: 'inbox' },
  { href: '/dashboard/portfolio',      label: 'Portfolio',      icon: 'image' },
  { href: '/dashboard/case-studies',   label: 'Case Studies',   icon: 'book' },
  { href: '/dashboard/reviews',        label: 'Reviews',        icon: 'star' },
  { href: '/dashboard/service-areas',  label: 'Service Areas',  icon: 'map' },
  { href: '/dashboard/analytics',      label: 'Analytics',      icon: 'bar-chart' },
  { href: '/dashboard/team',           label: 'Team',           icon: 'users' },
  { href: '/dashboard/settings',       label: 'Settings',       icon: 'settings' },
]

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    inbox: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 10h3l2 2h4l2-2h3V13a1 1 0 01-1 1H2a1 1 0 01-1-1v-3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10V3a1 1 0 011-1h12a1 1 0 011 1v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    image: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.3"/><circle cx="5.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 11l4-3 3 3 2-2 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    book: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h5M5 8h5M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    'bar-chart': <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13V8M6 13V5M10 13V8M14 13V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1 13h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    settings: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    star: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.68 3.99L8 10.5l-3.58 1.88.68-3.99L2.2 5.68l4-.58z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    map: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 3l5 2 4-2 5 2v9l-5-2-4 2-5-2V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 5v9M10 3v9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    users: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 7a2.5 2.5 0 000-5M15 13c0-2.21-1.79-4-4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  }
  return <>{icons[name] || null}</>
}

interface Props {
  tenant: Tenant
  children: React.ReactNode
}

export default function DashboardShell({ tenant, children }: Props) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  const siteUrl = getTenantUrl(tenant.subdomain)
  const { branding } = tenant

  // Badge: new leads (would be fetched in real usage, shown as static for shell)
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebar = (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-60 bg-[#0D0D0D] border-r border-[#1A1A1A] flex flex-col
      transform transition-transform duration-300 lg:translate-x-0
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#1A1A1A] flex-shrink-0">
        <div className="w-7 h-7 border border-[#C8A96E] flex items-center justify-center">
          <span className="text-[#C8A96E] font-light text-base" style={{fontFamily:'Georgia,serif'}}>{branding.logo_letter}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[#F5F0E8] text-xs font-medium truncate">{branding.business_name}</div>
          <div className="text-[#6B6B6B] text-xs truncate">{tenant.subdomain}.studiolaunch.in</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 text-sm rounded-none transition-colors
                ${isActive(item.href)
                  ? 'bg-[#C8A96E]/10 text-[#C8A96E] border-l-2 border-[#C8A96E]'
                  : 'text-[#6B6B6B] hover:text-[#F5F0E8] hover:bg-[#1A1A1A] border-l-2 border-transparent'}
              `}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Plan badge */}
        <div className="mt-6 mx-2 border border-[#2A2A2A] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs tracking-widest uppercase text-[#6B6B6B]">Plan</span>
            <span className="text-xs font-medium text-[#C8A96E] capitalize">{tenant.plan}</span>
          </div>
          {tenant.plan === 'starter' && (
            <Link href="/dashboard/settings?tab=billing" className="block text-center text-xs font-semibold tracking-widest uppercase bg-[#C8A96E] text-[#0A0A0A] py-2 hover:bg-[#A8854A] transition-colors">
              Upgrade
            </Link>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-[#1A1A1A] space-y-1 flex-shrink-0">
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#6B6B6B] hover:text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          View Live Site
        </a>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#6B6B6B] hover:text-red-400 hover:bg-[#1A1A1A] transition-colors w-full text-left"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 7h8M9 4l3 3-3 3M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {sidebar}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>

          <div className="flex-1" />

          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-[#C8A96E] transition-colors border border-[#2A2A2A] px-3 py-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {tenant.subdomain}.studiolaunch.in
          </a>

          <div className="w-8 h-8 bg-[#C8A96E]/10 border border-[#C8A96E]/30 flex items-center justify-center text-[#C8A96E] text-xs font-medium">
            {branding.logo_letter}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
