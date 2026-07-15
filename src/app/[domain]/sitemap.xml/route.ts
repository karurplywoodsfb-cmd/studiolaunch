// src/app/[domain]/sitemap.xml/route.ts
// Generates sitemap.xml dynamically for each tenant's subdomain/domain
// URL: mystudio.studiolaunch.in/sitemap.xml

import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, getTenantByDomain } from '@/lib/tenant'
import { getTenantUrl } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

async function resolveTenant(domain: string) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'studiolaunch.in'
  const subdomain  = domain.replace(`.${rootDomain}`, '').replace('.localhost', '')
  return (await getTenantBySubdomain(subdomain)) || (await getTenantByDomain(domain))
}

// This must live at [domain]/sitemap.xml/route.ts to be served as a route handler
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

  const admin = createAdminClient()

  // Fetch all published portfolio items (for project pages)
  const { data: projects } = await admin
    .from('portfolio_projects')
    .select('slug, created_at')
    .eq('tenant_id', tenant.id)
    .eq('published', true)
    .not('slug', 'is', null)

  // Fetch all service areas
  const { data: areas } = await admin
    .from('service_areas')
    .select('city')
    .eq('tenant_id', tenant.id)

  const now = new Date().toISOString().split('T')[0]

  // Build URL entries
  const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [
    // Homepage
    {
      loc:        baseUrl + '/',
      lastmod:    tenant.updated_at?.split('T')[0] || now,
      priority:   '1.0',
      changefreq: 'weekly',
    },
    // Portfolio anchor
    {
      loc:        baseUrl + '/#work',
      lastmod:    now,
      priority:   '0.8',
      changefreq: 'weekly',
    },
    // Individual project pages
    ...(projects || []).map(p => ({
      loc:        `${baseUrl}/projects/${p.slug}`,
      lastmod:    p.created_at?.split('T')[0] || now,
      priority:   '0.9',
      changefreq: 'monthly',
    })),
    // Service area pages
    ...(areas || []).map(a => ({
      loc:        `${baseUrl}/areas/${a.city.toLowerCase().replace(/\s+/g, '-')}`,
      lastmod:    now,
      priority:   '0.8',
      changefreq: 'monthly',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag':  'noindex', // sitemap itself shouldn't be indexed
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;')
}
