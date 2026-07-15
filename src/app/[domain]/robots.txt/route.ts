// src/app/[domain]/robots.txt/route.ts
// Generates robots.txt per tenant at mystudio.studiolaunch.in/robots.txt

import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, getTenantByDomain } from '@/lib/tenant'
import { getTenantUrl } from '@/lib/utils'

async function resolveTenant(domain: string) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'studiolaunch.in'
  const subdomain  = domain.replace(`.${rootDomain}`, '').replace('.localhost', '')
  return (await getTenantBySubdomain(subdomain)) || (await getTenantByDomain(domain))
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params
  const tenant     = await resolveTenant(domain)

  if (!tenant) {
    return new NextResponse('Not found', { status: 404 })
  }

  const baseUrl = tenant.custom_domain
    ? `https://${tenant.custom_domain}`
    : `${getTenantUrl(tenant.subdomain)}`

  const txt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`

  return new NextResponse(txt, {
    status: 200,
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
