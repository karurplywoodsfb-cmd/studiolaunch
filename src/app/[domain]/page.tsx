// src/app/[domain]/page.tsx
// Renders the full public studio site for any subdomain or custom domain

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySubdomain, getTenantByDomain, getSiteData } from '@/lib/tenant'
import { Tenant } from '@/types'
import TenantSite from './TenantSite'

interface Props {
  params: Promise<{ domain: string }>
}

// Resolve tenant from subdomain OR custom domain
async function resolveTenant(domain: string): Promise<Tenant | null> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'studiolaunch.in'

  // Strip root domain suffix if present (rewrite adds subdomain as path segment)
  const subdomain = domain.replace(`.${rootDomain}`, '').replace('.localhost', '')

  // Try subdomain first, then custom domain
  const bySubdomain = await getTenantBySubdomain(subdomain)
  if (bySubdomain) return bySubdomain

  const byDomain = await getTenantByDomain(domain)
  return byDomain
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params
  const tenant = await resolveTenant(domain)
  if (!tenant) return { title: 'Not Found' }

  const { branding, location, contact } = tenant
  const title = `${branding.business_name} — ${branding.tagline} | ${location.local_city}`

  return {
    title,
    description: tenant.meta_description || `${branding.business_name} is ${location.local_city}'s premium architectural and interior design studio. Book a consultation today.`,
    openGraph: {
      title,
      description: tenant.meta_description || '',
      type: 'website',
    },
    alternates: {
      canonical: tenant.custom_domain
        ? `https://${tenant.custom_domain}/`
        : `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/`,
    },
  }
}

export default async function TenantPage({ params }: Props) {
  const { domain } = await params
  const tenant = await resolveTenant(domain)
  if (!tenant) notFound()

  // Check plan is active
  if (tenant.plan_status === 'canceled') notFound()

  const siteData = await getSiteData(tenant.id)

  return <TenantSite tenant={tenant} siteData={siteData} />
}
