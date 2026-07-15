// middleware.ts  — Multi-tenant subdomain routing + auth session refresh

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'maspace.in'
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function middleware(request: NextRequest) {
  const url      = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''

  // ── Strip port for local dev ──────────────────────────────────────────────
  const host = hostname.replace(':3000', '').replace(':3001', '')

  // ── Determine if this is a tenant subdomain ───────────────────────────────
  // Matches: mystudio.maspace.in  OR  mystudio.localhost
  const isSubdomain =
    host.endsWith(`.${ROOT_DOMAIN}`) ||
    (host.includes('.') && host.endsWith('.localhost'))

  const subdomain = isSubdomain
    ? host.split('.')[0]
    : null

  // ── Reserved subdomains that are NOT tenants ──────────────────────────────
  const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'cdn', 'dashboard', 'login', 'signup', 'onboarding', 'invite']
  const isTenantRequest = subdomain && !RESERVED.includes(subdomain)

  // ── Supabase session refresh ──────────────────────────────────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Route: Tenant site request ────────────────────────────────────────────
  if (isTenantRequest) {
    // Rewrite to /[domain]/... — the tenant site renderer
    url.pathname = `/${subdomain}${url.pathname}`
    response = NextResponse.rewrite(url)
    return response
  }

  // ── Route: Dashboard — require auth ──────────────────────────────────────
  if (url.pathname.startsWith('/dashboard')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // ── Route: Auth pages — redirect if already logged in ────────────────────
  if ((url.pathname === '/login' || url.pathname === '/signup') && user) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Route: Onboarding — require auth ─────────────────────────────────────
  if (url.pathname.startsWith('/onboarding') && !user) {
    url.pathname = '/signup'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
