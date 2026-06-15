// src/app/[domain]/areas/[city]/page.tsx
// Local SEO landing page — one per city in studio's service radius
// URL pattern: mystudio.studiolaunch.in/areas/coimbatore

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySubdomain, getTenantByDomain } from '@/lib/tenant'
import { createAdminClient } from '@/lib/supabase/server'
import { Tenant, ServiceAreaSEO, PortfolioProject } from '@/types'
import AreaPageClient from './AreaPageClient'

interface Props {
  params: Promise<{ domain: string; city: string }>
}

async function resolveTenant(domain: string): Promise<Tenant | null> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'studiolaunch.in'
  const subdomain  = domain.replace(`.${rootDomain}`, '').replace('.localhost', '')
  return (await getTenantBySubdomain(subdomain)) || (await getTenantByDomain(domain))
}

async function getArea(tenantId: string, citySlug: string): Promise<ServiceAreaSEO | null> {
  const admin     = createAdminClient()
  // city slug is lowercased-hyphenated version of city name
  const cityName  = citySlug.replace(/-/g, ' ')

  const { data } = await admin
    .from('service_areas')
    .select('*')
    .eq('tenant_id', tenantId)
    .ilike('city', cityName)
    .single()

  return data as ServiceAreaSEO | null
}

async function getAreaPortfolio(tenantId: string, cityName: string): Promise<PortfolioProject[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('portfolio_projects')
    .select('id, title, slug, cover_image_url, category, location, year, finish_tier')
    .eq('tenant_id', tenantId)
    .eq('published', true)
    .ilike('location', `%${cityName}%`)
    .limit(6)

  return (data || []) as unknown as PortfolioProject[]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, city } = await params
  const tenant = await resolveTenant(domain)
  if (!tenant) return { title: 'Not Found' }

  const cityName  = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const { branding, location } = tenant

  const title       = `Interior Design in ${cityName} | ${branding.business_name}`
  const description = `${branding.business_name} provides premium interior design services in ${cityName}, ${location.state}. Residential villas, apartments, and commercial interiors. Book a free consultation.`

  const canonical = tenant.custom_domain
    ? `https://${tenant.custom_domain}/areas/${city}`
    : `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/areas/${city}`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical },
  }
}

export default async function AreaPage({ params }: Props) {
  const { domain, city } = await params
  const tenant = await resolveTenant(domain)
  if (!tenant) notFound()

  const cityName   = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const area       = await getArea(tenant.id, city)
  const portfolio  = await getAreaPortfolio(tenant.id, cityName)

  // Build rich local schema for this area page
  const { branding, location, contact } = tenant
  const areaSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['LocalBusiness', 'ArchitecturalService'],
        '@id':   `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/areas/${city}#localbusiness`,
        name:    branding.business_name,
        description: `${branding.business_name} provides premium interior design and architectural services in ${cityName}, ${location.state}.`,
        telephone:   contact.phone_number,
        email:       contact.email,
        address: {
          '@type':          'PostalAddress',
          addressLocality:  location.local_city,
          addressRegion:    location.state,
          postalCode:       location.pin_code,
          addressCountry:   'IN',
        },
        areaServed: {
          '@type': 'City',
          name:    cityName,
          containedInPlace: {
            '@type': 'State',
            name:    location.state,
          },
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name:    `Interior Design Services in ${cityName}`,
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: `Residential Interior Design in ${cityName}` } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: `Villa Interior Design in ${cityName}` } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: `Apartment Interior Design in ${cityName}` } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: `Commercial Interior Design in ${cityName}` } },
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: branding.business_name, item: `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/areas` },
          { '@type': 'ListItem', position: 3, name: `Interior Design in ${cityName}`, item: `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/areas/${city}` },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(areaSchema) }}
      />
      <AreaPageClient
        tenant={tenant}
        area={area}
        cityName={cityName}
        citySlug={city}
        portfolio={portfolio}
      />
    </>
  )
}
