// src/app/[domain]/case-studies/[slug]/page.tsx
// Individual case-study SEO page — /[studio-subdomain]/case-studies/[case-study-slug]
// Mirrors the portfolio project page pattern; case studies previously had no public URL.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySubdomain, getTenantByDomain } from '@/lib/tenant'
import { getTenantUrl } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { Tenant, CaseStudy } from '@/types'
import CaseStudyPageClient from './CaseStudyPageClient'

interface Props {
  params: Promise<{ domain: string; slug: string }>
}

async function resolveTenant(domain: string): Promise<Tenant | null> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'maspace.in'
  const subdomain  = domain.replace(`.${rootDomain}`, '').replace('.localhost', '')
  const bySubdomain = await getTenantBySubdomain(subdomain)
  if (bySubdomain) return bySubdomain
  return getTenantByDomain(domain)
}

async function getCaseStudy(tenantId: string, slug: string): Promise<CaseStudy | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('case_studies')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data as CaseStudy | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, slug } = await params
  const tenant = await resolveTenant(domain)
  if (!tenant) return { title: 'Not Found' }

  const study = await getCaseStudy(tenant.id, slug)
  if (!study) return { title: 'Not Found' }

  const { branding, location } = tenant
  const title = study.seo_title ||
    `${study.title} — ${study.client_type} Case Study in ${study.location || location.local_city} | ${branding.business_name}`
  const description = study.seo_description || study.subtitle ||
    `${study.title} by ${branding.business_name}: a ${study.area_sqft ? study.area_sqft.toLocaleString('en-IN') + ' sq.ft ' : ''}${study.client_type} project in ${study.location || location.local_city}.`

  const canonical = tenant.custom_domain
    ? `https://${tenant.custom_domain}/case-studies/${slug}`
    : `${getTenantUrl(tenant.subdomain)}/case-studies/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: study.hero_image_url ? [{ url: study.hero_image_url, width: 1200, height: 800 }] : [],
    },
    alternates: { canonical },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { domain, slug } = await params
  const tenant = await resolveTenant(domain)
  if (!tenant) notFound()

  const study = await getCaseStudy(tenant.id, slug)
  if (!study) notFound()

  const { branding, location } = tenant
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const base = `https://${tenant.subdomain}.${rootDomain}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id':   `${base}/case-studies/${slug}#article`,
        headline: study.title,
        description: study.seo_description || study.subtitle,
        image: study.hero_image_url ? [study.hero_image_url] : [],
        datePublished: study.created_at,
        author: { '@type': 'Organization', name: branding.business_name },
        about: {
          '@type': 'Place',
          name: study.location || location.local_city,
          address: { '@type': 'PostalAddress', addressLocality: study.location || location.local_city, addressRegion: location.state, addressCountry: 'IN' },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: branding.business_name, item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Case Studies', item: `${base}/case-studies` },
          { '@type': 'ListItem', position: 3, name: study.title, item: `${base}/case-studies/${slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <CaseStudyPageClient tenant={tenant} study={study} />
    </>
  )
}
