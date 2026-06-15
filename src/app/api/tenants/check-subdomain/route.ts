// src/app/api/tenants/check-subdomain/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { isSubdomainAvailable } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  const subdomain = req.nextUrl.searchParams.get('subdomain') || ''

  if (!subdomain || subdomain.length < 3) {
    return NextResponse.json({ available: false, reason: 'Too short' })
  }
  if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) {
    return NextResponse.json({ available: false, reason: 'Invalid characters' })
  }

  const available = await isSubdomainAvailable(subdomain)
  return NextResponse.json({ available })
}
