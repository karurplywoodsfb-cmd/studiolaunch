// src/app/[domain]/projects/[slug]/page.tsx
// Individual project SEO page — /[studio-subdomain]/projects/[project-slug]
// Each published portfolio item gets its own indexable URL with full schema

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySubdomain, getTenantByDomain } from '@/lib/tenant'
import { getTenantUrl } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { Tenant, PortfolioProjectSEO } from '@/types'
import ProjectPageClient from './ProjectPageClient'

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

async function getProject(tenantId: string, slug: string): Promise<PortfolioProjectSEO | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('portfolio_projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data as PortfolioProjectSEO | null
}

async function getRelatedProjects(tenantId: string, currentId: string, category: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('portfolio_projects')
    .select('id, title, slug, cover_image_url, category, location, year')
    .eq('tenant_id', tenantId)
    .eq('published', true)
    .eq('category', category)
    .neq('id', currentId)
    .limit(3)
  return data || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, slug } = await params
  const tenant  = await resolveTenant(domain)
  if (!tenant) return { title: 'Not Found' }

  const project = await getProject(tenant.id, slug)
  if (!project) return { title: 'Not Found' }

  const { branding, location } = tenant
  const title = project.seo_title ||
    `${project.title} — ${project.category} interior design in ${project.location || location.local_city} | ${branding.business_name}`
  const description = project.seo_description ||
    `${project.title} by ${branding.business_name}. A ${project.area_sqft ? project.area_sqft.toLocaleString('en-IN') + ' sq.ft ' : ''}${project.finish_tier} ${project.category} interior design project in ${project.location || location.local_city}.`

  const canonical = tenant.custom_domain
    ? `https://${tenant.custom_domain}/projects/${slug}`
    : `${getTenantUrl(tenant.subdomain)}/projects/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type:   'article',
      images: project.cover_image_url ? [{ url: project.cover_image_url, width: 1200, height: 800 }] : [],
    },
    alternates: { canonical },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { domain, slug } = await params
  const tenant  = await resolveTenant(domain)
  if (!tenant) notFound()

  const project = await getProject(tenant.id, slug)
  if (!project) notFound()

  const related = await getRelatedProjects(tenant.id, project.id, project.category)

  // Build JSON-LD for the project page
  const { branding, location, contact } = tenant
  const projectSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id':   `${getTenantUrl(tenant.subdomain)}/projects/${slug}#project`,
        name:    project.title,
        description: project.seo_description || project.full_description,
        image:   project.images?.length ? project.images : (project.cover_image_url ? [project.cover_image_url] : []),
        dateCreated: project.year ? `${project.year}-01-01` : undefined,
        creator: {
          '@type': 'LocalBusiness',
          name:    branding.business_name,
          address: {
            '@type':          'PostalAddress',
            addressLocality:  location.local_city,
            addressRegion:    location.state,
            addressCountry:   'IN',
          },
        },
        locationCreated: {
          '@type': 'Place',
          name:    project.location || location.local_city,
          address: {
            '@type':          'PostalAddress',
            addressLocality:  project.location || location.local_city,
            addressRegion:    location.state,
            addressCountry:   'IN',
          },
          ...(project.geo_latitude && project.geo_longitude ? {
            geo: {
              '@type':    'GeoCoordinates',
              latitude:   project.geo_latitude,
              longitude:  project.geo_longitude,
            },
          } : {}),
        },
      },
      // BreadcrumbList for rich results
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type':    'ListItem',
            position:   1,
            name:       branding.business_name,
            item:       `${getTenantUrl(tenant.subdomain)}/`,
          },
          {
            '@type':    'ListItem',
            position:   2,
            name:       'Projects',
            item:       `${getTenantUrl(tenant.subdomain)}/projects`,
          },
          {
            '@type':    'ListItem',
            position:   3,
            name:       project.title,
            item:       `${getTenantUrl(tenant.subdomain)}/projects/${slug}`,
          },
        ],
      },
      // Review / testimonial if present
      project.testimonial_quote && project.testimonial_name && {
        '@type':       'Review',
        itemReviewed: { '@type': 'LocalBusiness', name: branding.business_name },
        author:        { '@type': 'Person', name: project.testimonial_name },
        reviewBody:    project.testimonial_quote,
        reviewRating:  { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      },
    ].filter(Boolean),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }}
      />
      <ProjectPageClient tenant={tenant} project={project} related={related} />
    </>
  )
}
