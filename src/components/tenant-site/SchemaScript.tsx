// src/components/tenant-site/SchemaScript.tsx
import { Tenant, FAQItem } from '@/types'

export default function SchemaScript({ tenant, faqs }: { tenant: Tenant; faqs: FAQItem[] }) {
  const { branding, contact, location } = tenant

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['ArchitecturalService', 'LocalBusiness'],
        '@id': `https://${tenant.subdomain}.studiolaunch.in/#organization`,
        name: branding.business_name,
        telephone: contact.phone_number,
        email: contact.email,
        priceRange: '₹₹₹₹',
        description: `${branding.business_name} is a premium architectural and interior design studio in ${location.local_city}.`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: location.street_address,
          addressLocality: location.local_city,
          addressRegion: location.state,
          postalCode: location.pin_code,
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: location.geo_latitude,
          longitude: location.geo_longitude,
        },
        areaServed: [{ '@type': 'City', name: location.local_city }],
      },
      faqs.length > 0 && {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ].filter(Boolean),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
