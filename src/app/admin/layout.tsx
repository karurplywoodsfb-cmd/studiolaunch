// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) redirect('/login')

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Admin top bar */}
      <div className="bg-[#0D0D0D] border-b border-red-900/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-red-400 tracking-widest uppercase">Admin Console</span>
          </div>
          <span className="text-[#2A2A2A]">|</span>
          <span className="text-xs text-[#6B6B6B]" style={{fontFamily:'Georgia,serif'}}>MaSpace</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-[#6B6B6B] hover:text-[#C8A96E] transition-colors tracking-widest uppercase">
            → Dashboard
          </Link>
          <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors">
            Home
          </Link>
        </div>
      </div>

      {/* Admin sidebar + content */}
      <div className="flex min-h-[calc(100vh-45px)]">
        <aside className="w-52 bg-[#0A0A0A] border-r border-[#1A1A1A] p-4 flex-shrink-0">
          <nav className="space-y-1">
            {[
              { href: '/admin',          label: 'Overview' },
              { href: '/admin/tenants',  label: 'Studios' },
              { href: '/admin/revenue',  label: 'Revenue' },
              { href: '/admin/events',   label: 'Events' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center px-3 py-2.5 text-xs text-[#6B6B6B] hover:text-[#F5F0E8] hover:bg-[#141414] transition-colors tracking-widest uppercase">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
