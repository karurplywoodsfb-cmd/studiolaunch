'use client'
// src/app/[domain]/areas/[city]/AreaPageClient.tsx
// Premium local SEO landing page for each service city

import { useState, useEffect } from 'react'
import { Tenant, ServiceAreaSEO, PortfolioProject } from '@/types'

interface Props {
  tenant:    Tenant
  area:      ServiceAreaSEO | null
  cityName:  string
  citySlug:  string
  portfolio: PortfolioProject[]
}

const SERVICES = [
  { title: 'Residential Interior Design',    desc: 'Full-scope design for villas, apartments, and independent homes.' },
  { title: 'Kitchen & Modular Design',       desc: 'Custom modular kitchens with premium hardware and finish options.' },
  { title: 'Commercial & Office Interiors',  desc: 'Workplace design, retail fit-out, and hospitality interiors.' },
  { title: '3D Visualization & Renders',     desc: 'Photorealistic 3D renders of every room before execution begins.' },
  { title: 'Turnkey Project Execution',      desc: 'Concept to handover — design, procurement, and site supervision.' },
  { title: 'Architectural Consultancy',      desc: 'Space planning, façade design, and structural coordination.' },
]

const PROCESS_STEPS = [
  { n: '01', title: 'Site Visit',          body: 'We visit the property and assess the space, structure, and your vision.' },
  { n: '02', title: 'Design & 3D Renders', body: 'Full space plan and photorealistic renders. Nothing is approved without your sign-off.' },
  { n: '03', title: 'Material Procurement', body: 'We source and coordinate all materials, furniture, and fixtures.' },
  { n: '04', title: 'Execution & Handover', body: 'Supervised execution with daily site updates. Final handover with styling complete.' },
]

export default function AreaPageClient({ tenant, area, cityName, citySlug, portfolio }: Props) {
  const { branding, contact, location, stats } = tenant
  const accentColor = branding.accent_color || '#C8A96E'
  const [scrolled, setScrolled]   = useState(false)
  const [formDone, setFormDone]   = useState(false)
  const [formData, setFormData]   = useState({ name: '', phone: '', project_type: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const siteRoot = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : `https://${tenant.subdomain}.studiolaunch.in`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/leads', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id:        tenant.id,
        name:             formData.name,
        phone:            formData.phone,
        property_type:    formData.project_type,
        notes:            `From area page: ${cityName}. ${formData.notes}`,
        project_location: cityName,
        source:           `area-page-${citySlug}`,
      }),
    })
    setSubmitting(false)
    setFormDone(true)
  }

  // Inline styles
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#141414', border: '1px solid #2A2A2A',
    color: '#F5F0E8', fontFamily: 'Inter,sans-serif', fontSize: '0.9rem',
    padding: '0.85rem 1rem', outline: 'none',
  }

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const nav = (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(200,169,110,0.15)' : 'none',
      transition: 'all 0.4s',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        <a href={siteRoot} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', border: `1px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: accentColor, fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: 300 }}>{branding.logo_letter}</span>
          </div>
          <span style={{ color: '#F5F0E8', fontFamily: 'Georgia,serif', fontSize: '0.9rem', fontWeight: 300, letterSpacing: '0.2em' }}>{branding.business_name}</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href={`tel:${contact.phone_number}`} style={{ color: accentColor, fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.1em' }}>{contact.phone_display}</a>
          <a href="#consult" style={{ background: accentColor, color: '#0A0A0A', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.65rem 1.25rem', textDecoration: 'none' }}>
            Book Free Visit
          </a>
        </div>
      </div>
    </nav>
  )

  // ── Hero ─────────────────────────────────────────────────────────────────────
  const hero = (
    <section style={{ minHeight: '70vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', paddingTop: '72px', position: 'relative', overflow: 'hidden' }}>
      {/* Background texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(200,169,110,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 2rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem', color: '#6B6B6B', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <a href={siteRoot} style={{ color: '#6B6B6B', textDecoration: 'none' }}>Home</a>
            <span>›</span>
            <span style={{ color: accentColor }}>Interior Design in {cityName}</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: '#F5F0E8', marginBottom: '1.5rem' }}>
            Interior Design<br/>
            in <em style={{ color: accentColor }}>{cityName}</em>
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: '1rem', lineHeight: 1.75, maxWidth: '480px', marginBottom: '2rem' }}>
            {area?.seo_intro ||
              `${branding.business_name} delivers premium residential and commercial interior design across ${cityName} and surrounding areas in ${location.state}. Every project begins with a complimentary site consultation.`}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <a href="#consult" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: accentColor, color: '#0A0A0A', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 2rem', textDecoration: 'none' }}>
              Book Free Site Consultation
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href={`tel:${contact.phone_number}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', border: `1px solid rgba(200,169,110,0.4)`, color: accentColor, fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 2rem', textDecoration: 'none' }}>
              Call {contact.phone_display}
            </a>
          </div>
          {/* Trust signals */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #1A1A1A' }}>
            {[
              [`${stats.project_count}+`, 'Projects Delivered'],
              [`${stats.years_active}yr`, 'Studio Experience'],
              [`${location.service_radius_km}km`, 'Service Radius'],
            ].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', fontWeight: 300, color: accentColor, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6B6B', marginTop: '0.35rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick lead form */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', padding: '2rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, marginBottom: '0.5rem' }}>Free Consultation</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', fontWeight: 300, color: '#F5F0E8', marginBottom: '1.5rem' }}>
            Get a call back from our<br /><em>design team today</em>
          </div>
          {formDone ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: '48px', height: '48px', border: `1px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 10l5 5 11-11" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.25rem', fontWeight: 300, color: '#F5F0E8', marginBottom: '0.5rem' }}>Thank you!</div>
              <div style={{ color: '#6B6B6B', fontSize: '0.85rem', lineHeight: 1.6 }}>We&apos;ll call you back within 2 hours on business days.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                style={inputStyle} placeholder="Your name" required />
              <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                style={inputStyle} placeholder="Phone number" required />
              <select value={formData.project_type} onChange={e => setFormData(p => ({ ...p, project_type: e.target.value }))}
                style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select project type</option>
                <option>Villa / Independent House</option>
                <option>Apartment / Flat</option>
                <option>Commercial Office</option>
                <option>Kitchen Only</option>
                <option>Other</option>
              </select>
              <button type="submit" disabled={submitting}
                style={{ background: accentColor, color: '#0A0A0A', fontFamily: 'Inter,sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Sending...' : `Get Free Consultation in ${cityName}`}
              </button>
              <div style={{ fontSize: '0.65rem', color: '#6B6B6B', textAlign: 'center' }}>No charges. No commitment. We come to you.</div>
            </form>
          )}
        </div>
      </div>
    </section>
  )

  // ── Services Grid ─────────────────────────────────────────────────────────────
  const servicesSection = (
    <section style={{ padding: '5rem 0', background: '#0D0D0D' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, marginBottom: '1rem' }}>
          What We Offer in {cityName}
        </div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: '#F5F0E8', marginBottom: '3rem' }}>
          Interior design services<br /><em style={{ color: accentColor }}>tailored to {cityName}</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1px', background: '#2A2A2A' }}>
          {SERVICES.map((s, i) => (
            <div key={i} style={{ background: '#0A0A0A', padding: '2rem' }}>
              <div style={{ width: '2rem', height: '1px', background: accentColor, marginBottom: '1.25rem' }} />
              <h3 style={{ color: '#F5F0E8', fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem' }}>{s.title}</h3>
              <p style={{ color: '#6B6B6B', fontSize: '0.85rem', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── Portfolio (city-filtered) ─────────────────────────────────────────────────
  const portfolioSection = portfolio.length > 0 && (
    <section style={{ padding: '5rem 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, marginBottom: '1rem' }}>
          Our Work in {cityName}
        </div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: '#F5F0E8' }}>
          Projects completed<br /><em style={{ color: accentColor }}>near you</em>
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1px', background: '#2A2A2A', maxWidth: '1280px', margin: '0 auto' }}>
        {portfolio.map(p => {
          const slug = (p as PortfolioProject & { slug?: string }).slug
          return (
            <div key={p.id}
              onClick={() => slug && (window.location.href = `/projects/${slug}`)}
              style={{ position: 'relative', overflow: 'hidden', background: '#141414', aspectRatio: '4/3', cursor: slug ? 'pointer' : 'default' }}
            >
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={`${p.title} interior design in ${cityName} by ${branding.business_name}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'transform 0.5s, opacity 0.3s' }}
                  loading="lazy"
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.75' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#1A1A1A' }} />
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.9), transparent)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: accentColor, marginBottom: '0.25rem' }}>{p.category}</div>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', color: '#F5F0E8' }}>{p.title}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  // ── Process ───────────────────────────────────────────────────────────────────
  const processSection = (
    <section style={{ padding: '5rem 0', background: '#0D0D0D' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, marginBottom: '1rem' }}>
          How It Works
        </div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, color: '#F5F0E8', marginBottom: '3rem' }}>
          From first call to<br /><em style={{ color: accentColor }}>finished space</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '2rem' }}>
          {PROCESS_STEPS.map(step => (
            <div key={step.n} style={{ position: 'relative', paddingLeft: '3rem' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: 'Georgia,serif', fontSize: '0.8rem', fontWeight: 500, color: accentColor, letterSpacing: '0.1em' }}>{step.n}</div>
              <h3 style={{ color: '#F5F0E8', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{step.title}</h3>
              <p style={{ color: '#6B6B6B', fontSize: '0.85rem', lineHeight: 1.65 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── Nearby areas ─────────────────────────────────────────────────────────────
  const nearbySection = area?.nearby_cities && area.nearby_cities.length > 0 && (
    <section style={{ padding: '3rem 0', background: '#0A0A0A', borderTop: '1px solid #1A1A1A' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '1rem' }}>
          Also Serving
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {area.nearby_cities.map((c: string) => (
            <a key={c} href={`/areas/${c.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ fontSize: '0.75rem', color: '#6B6B6B', border: '1px solid #2A2A2A', padding: '0.4rem 0.9rem', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#6B6B6B' }}
            >
              Interior Design in {c}
            </a>
          ))}
        </div>
      </div>
    </section>
  )

  // ── Consult CTA ───────────────────────────────────────────────────────────────
  const consultSection = (
    <section id="consult" style={{ padding: '5rem 0', background: '#0A0A0A' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, marginBottom: '1rem' }}>
          Interior Design in {cityName}
        </div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 300, color: '#F5F0E8', marginBottom: '1.5rem' }}>
          Start with a free<br /><em style={{ color: accentColor }}>site consultation</em>
        </h2>
        <p style={{ color: '#6B6B6B', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '2.5rem' }}>
          {branding.business_name} serves clients across {cityName} within {location.service_radius_km}km of {location.local_city}. Book a complimentary visit — we come to your property, assess the space, and share our design direction at no charge.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <a href={`tel:${contact.phone_number}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: accentColor, color: '#0A0A0A', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 2rem', textDecoration: 'none' }}>
            Call {contact.phone_display}
          </a>
          <a href={siteRoot} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', border: `1px solid rgba(200,169,110,0.4)`, color: accentColor, fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 2rem', textDecoration: 'none' }}>
            View All Projects
          </a>
        </div>
      </div>
    </section>
  )

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footer = (
    <footer style={{ borderTop: '1px solid #1A1A1A', padding: '2rem 0', background: '#0D0D0D' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ color: '#6B6B6B', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} {branding.business_name} · Interior Design in {cityName}, {location.state}
        </div>
        {!tenant.white_label && (
          <div style={{ color: '#6B6B6B', fontSize: '0.7rem' }}>
            Powered by{' '}
            <a href="https://studiolaunch.in" style={{ color: accentColor, textDecoration: 'none' }}>StudioLaunch</a>
          </div>
        )}
      </div>
    </footer>
  )

  return (
    <>
      {nav}
      <main>
        {hero}
        {servicesSection}
        {portfolio.length > 0 && portfolioSection}
        {processSection}
        {nearbySection}
        {consultSection}
      </main>
      {footer}
    </>
  )
}
