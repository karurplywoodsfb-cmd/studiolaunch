'use client'
// src/app/[domain]/case-studies/[slug]/CaseStudyPageClient.tsx

import { useState, useEffect } from 'react'
import { Tenant, CaseStudy } from '@/types'
import BeforeAfterSlider, { PLACEHOLDER_IMG } from '@/components/tenant-site/BeforeAfterSlider'
import WhatsAppButton from '@/components/tenant-site/WhatsAppButton'
import { getTenantUrl } from '@/lib/utils'

interface Props {
  tenant: Tenant
  study: CaseStudy
}

export default function CaseStudyPageClient({ tenant, study }: Props) {
  const { branding, contact, location } = tenant
  const accentColor = branding.accent_color || '#C8A96E'
  const isIvory = branding.theme === 'ivory'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t = {
    bg:        isIvory ? '#F7F3EA' : '#0A0A0A',
    surface:   isIvory ? '#FFFFFF' : '#0D0D0D',
    text:      isIvory ? '#211D17' : '#F5F0E8',
    muted:     isIvory ? '#726A5C' : '#6B6B6B',
    border:    isIvory ? 'rgba(33,29,23,0.12)' : '#1A1A1A',
    borderAlt: isIvory ? 'rgba(33,29,23,0.18)' : '#2A2A2A',
    navBg:     isIvory ? 'rgba(247,243,234,0.95)' : 'rgba(10,10,10,0.95)',
  }

  const siteRoot = getTenantUrl(tenant.subdomain)
  const whatsappNumber = contact.whatsapp_number || contact.phone_number

  const phases = [
    { heading: study.brief_heading || 'The Brief', body: study.brief_body },
    { heading: study.challenge_heading || 'The Challenge', body: study.challenge_body },
    { heading: study.solution_heading || 'The Solution', body: study.solution_body },
    { heading: study.outcome_heading || 'The Outcome', body: study.outcome_body },
  ].filter(p => p.body)

  const stats = [
    { value: study.stat_1_value, label: study.stat_1_label },
    { value: study.stat_2_value, label: study.stat_2_label },
    { value: study.stat_3_value, label: study.stat_3_label },
  ].filter(s => s.value && s.label)

  const wordCount = phases.reduce((a, p) => a + (p.body?.split(/\s+/).length || 0), 0)
  const readingMins = Math.max(1, Math.round(wordCount / 200))

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? t.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${accentColor}26` : 'none',
        transition: 'all 0.4s',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem', height: '72px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <a href={siteRoot} style={{ color: t.muted, textDecoration: 'none' }}>{branding.business_name}</a>
          <span>›</span>
          <span style={{ color: t.text }}>Case Study</span>
        </div>
      </nav>

      <header style={{ paddingTop: '9rem', paddingBottom: '3rem', maxWidth: '900px', margin: '0 auto', padding: '9rem 2rem 3rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: accentColor, marginBottom: '1rem' }}>
          {study.client_type} · {readingMins} min read
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(2.25rem,5vw,3.5rem)', fontWeight: 300, color: t.text, lineHeight: 1.1, marginBottom: '1rem' }}>
          {study.title}
        </h1>
        {study.subtitle && <p style={{ color: t.muted, fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '620px' }}>{study.subtitle}</p>}
      </header>

      {study.hero_image_url && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem 3rem' }}>
          <img src={study.hero_image_url} alt={study.title} style={{ width: '100%', borderRadius: isIvory ? '4px' : 0, display: 'block' }} />
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '1fr 240px', gap: '3rem' }} className="cs-grid">
        <div>
          {phases.map((p, i) => (
            <div key={i} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.5rem', fontWeight: 400, color: accentColor, marginBottom: '0.75rem' }}>{p.heading}</h2>
              <p style={{ color: t.muted, fontSize: '1rem', lineHeight: 1.8 }}>{p.body}</p>
            </div>
          ))}

          {(study.before_image_url || study.after_image_url) && (
            <div style={{ margin: '3rem 0' }}>
              <BeforeAfterSlider
                beforeUrl={study.before_image_url || PLACEHOLDER_IMG}
                afterUrl={study.after_image_url || PLACEHOLDER_IMG}
                beforeAlt={`Before: ${study.title}`}
                afterAlt={`After: ${study.title} by ${branding.business_name}`}
                accentColor={accentColor}
              />
            </div>
          )}

          {stats.length > 0 && (
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', borderTop: `1px solid ${t.borderAlt}`, borderBottom: `1px solid ${t.borderAlt}`, padding: '1.75rem 0', margin: '2.5rem 0' }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '2rem', fontWeight: 400, color: t.text, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginTop: '0.4rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside>
          <div style={{ border: `1px solid ${t.borderAlt}`, borderRadius: isIvory ? '4px' : 0, padding: '1.5rem', position: 'sticky', top: '6rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.muted, marginBottom: '1rem' }}>Project Details</div>
            {[
              ['Location', study.location],
              ['Area', study.area_sqft ? `${study.area_sqft.toLocaleString('en-IN')} sq.ft` : null],
              ['Scope', study.scope],
              ['Duration', study.duration_weeks ? `${study.duration_weeks} weeks` : null],
              ['Finish Tier', study.finish_tier],
              ['Year', study.year],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k as string} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginBottom: '0.25rem' }}>{k}</div>
                <div style={{ fontSize: '0.9rem', color: t.text, textTransform: k === 'Finish Tier' ? 'capitalize' : 'none' }}>{v}</div>
              </div>
            ))}
            {study.primary_materials?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginBottom: '0.5rem' }}>Materials</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {study.primary_materials.map(m => (
                    <span key={m} style={{ fontSize: '0.7rem', color: t.text, border: `1px solid ${t.borderAlt}`, padding: '0.25rem 0.6rem', borderRadius: '999px' }}>{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div style={{ textAlign: 'center', padding: '4rem 2rem', borderTop: `1px solid ${t.border}`, marginTop: '3rem' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 300, color: t.text, marginBottom: '1.25rem' }}>
          Have a similar project in mind?
        </h2>
        <a href={`${siteRoot}/#consult`} style={{ display: 'inline-block', background: accentColor, color: '#0A0A0A', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '1rem 2.25rem', textDecoration: 'none', borderRadius: isIvory ? '999px' : 0 }}>
          Book a Consultation
        </a>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .cs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <WhatsAppButton phoneNumber={whatsappNumber} businessName={branding.business_name} accentColor={accentColor} />
    </div>
  )
}
