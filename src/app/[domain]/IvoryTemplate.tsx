'use client'
// src/app/[domain]/IvoryTemplate.tsx
// Alternate tenant-site template: warm ivory/cream ground, ink typography, split-hero
// layout. Selected via tenant.branding.theme === 'ivory'. Shares the same data shape
// and lead-gen/gallery components as the Noir template, but is a genuinely distinct
// visual composition rather than a recolor.

import { useState, useEffect } from 'react'
import { Tenant, PortfolioProject, CaseStudy, FAQItem, GoogleReview } from '@/types'
import AnalyticsTracker from '@/components/shared/AnalyticsTracker'
import SchemaScript from '@/components/tenant-site/SchemaScript'
import BeforeAfterSlider, { PLACEHOLDER_IMG } from '@/components/tenant-site/BeforeAfterSlider'
import ConsultationForm from '@/components/tenant-site/ConsultationForm'
import FAQAccordion from '@/components/tenant-site/FAQAccordion'
import WhatsAppButton from '@/components/tenant-site/WhatsAppButton'
import StickyMobileCTA from '@/components/tenant-site/StickyMobileCTA'
import PortfolioLightbox from '@/components/tenant-site/PortfolioLightbox'

interface SiteData {
  portfolio:  PortfolioProject[]
  caseStudy:  CaseStudy | null
  faqs:       FAQItem[]
  reviews:    GoogleReview[]
}

interface Props {
  tenant:   Tenant
  siteData: SiteData
}

const INK = '#211D17'
const MUTED = '#726A5C'
const PAPER = '#F7F3EA'
const PAPER_DEEP = '#EFE8D8'

function eyebrow(text: string, accentColor: string) {
  return (
    <div style={{fontFamily:'Inter,sans-serif',fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.28em',textTransform:'uppercase',color:accentColor,marginBottom:'1rem'}}>
      {text}
    </div>
  )
}

export default function IvoryTemplate({ tenant, siteData }: Props) {
  const { branding, contact, location, stats, content } = tenant
  const { portfolio, caseStudy, faqs, reviews } = siteData
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [lightbox, setLightbox] = useState<{ project: PortfolioProject; index: number } | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const accentColor = branding.accent_color || '#9A7B4F'
  const whatsappNumber = contact.whatsapp_number || contact.phone_number

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const nav = (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:100,
      background: scrolled ? 'rgba(247,243,234,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `1px solid ${accentColor}22` : 'none',
      transition:'all 0.4s',
    }}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:'76px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:accentColor,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:PAPER,fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:400}}>{branding.logo_letter}</span>
          </div>
          <div>
            <div style={{color:INK,fontFamily:'Georgia,serif',fontSize:'0.95rem',fontWeight:400,letterSpacing:'0.05em'}}>{branding.business_name}</div>
            <div style={{color:MUTED,fontSize:'0.52rem',letterSpacing:'0.2em',textTransform:'uppercase',marginTop:'1px'}}>{branding.tagline}</div>
          </div>
        </div>
        <div style={{display:'none',gap:'2.5rem'}} className="lg-flex">
          {['Work','Services','Process','FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="ts-focusable" style={{fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:INK,textDecoration:'none'}}>
              {l}
            </a>
          ))}
          <a href="#consult" className="ts-focusable" style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:PAPER,background:INK,padding:'0.65rem 1.4rem',textDecoration:'none'}}>
            Book Now
          </a>
        </div>
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="lg-hidden ts-focusable"
          style={{background:'transparent',border:'none',cursor:'pointer',padding:'0.5rem',display:'flex',flexDirection:'column',gap:'5px'}}>
          <span style={{width:'22px',height:'2px',background:INK}} />
          <span style={{width:'22px',height:'2px',background:INK}} />
        </button>
      </div>
    </nav>
  )

  // ── Hero: split layout — text left, image right (distinct from Noir's full-bleed) ──
  const hero = (
    <section style={{paddingTop:'9rem',paddingBottom:'4rem',background:PAPER}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:'3.5rem',alignItems:'center'}} className="ivory-hero-grid">
        <div>
          {eyebrow(`${location.local_city}'s Design Studio`, accentColor)}
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2.25rem,5vw,4rem)',fontWeight:400,lineHeight:1.08,color:INK,marginBottom:'1.5rem'}}>
            {content.hero_headline_line1}{' '}{content.hero_headline_line2}{' '}
            <em style={{fontStyle:'italic',color:accentColor}}>{content.hero_headline_line3}</em>
          </h1>
          <p style={{color:MUTED,fontSize:'1rem',maxWidth:'480px',marginBottom:'2.25rem',lineHeight:1.75}}>
            {content.hero_subtext}
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'1rem',marginBottom:'3rem'}}>
            <a href="#consult" className="ts-focusable" style={{display:'inline-flex',alignItems:'center',gap:'0.75rem',background:INK,color:PAPER,fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',padding:'1rem 2rem',textDecoration:'none'}}>
              Book a Consultation
            </a>
            <a href="#work" className="ts-focusable" style={{display:'inline-flex',alignItems:'center',gap:'0.75rem',border:`1px solid ${INK}55`,color:INK,fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',padding:'1rem 2rem',textDecoration:'none'}}>
              View Our Work
            </a>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'2.25rem',borderTop:`1px solid ${INK}18`,paddingTop:'1.75rem'}}>
            {[
              [`${stats.project_count}+`, 'Projects'],
              [`${stats.years_active}yr`,  'Experience'],
              [`${stats.sqft_total}L+`,    'Sq.ft Designed'],
              [`${stats.city_radius}km`,   'Service Radius'],
            ].map(([v,l]) => (
              <div key={l}>
                <div style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',fontWeight:400,color:INK,lineHeight:1}}>{v}</div>
                <div style={{fontSize:'0.62rem',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:MUTED,marginTop:'0.4rem'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{position:'relative',aspectRatio:'4/5',background:PAPER_DEEP,overflow:'hidden'}}>
          {content.hero_image_url ? (
            <img src={content.hero_image_url} alt={`${branding.business_name} studio interior`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          ) : (
            <div style={{width:'100%',height:'100%',background:`linear-gradient(135deg,${PAPER_DEEP},${PAPER})`}} />
          )}
          <div style={{position:'absolute',top:'1.25rem',left:'1.25rem',background:PAPER,padding:'0.65rem 1rem',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:INK}}>
            {location.local_city}, {location.state}
          </div>
        </div>
      </div>
    </section>
  )

  // ── Portfolio: alternating list rows instead of Noir's uniform grid ──
  const portfolioSection = portfolio.length > 0 && (
    <section id="work" style={{padding:'5rem 0',background:PAPER}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',marginBottom:'3rem'}}>
        {eyebrow('Selected Work', accentColor)}
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3rem)',fontWeight:400,color:INK}}>
          Spaces we&apos;ve <em style={{fontStyle:'italic',color:accentColor}}>shaped</em>
        </h2>
      </div>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'flex',flexDirection:'column',gap:'1px'}}>
        {portfolio.map((p, i) => {
          const slug = (p as PortfolioProject & {slug?:string}).slug
          const projectUrl = slug ? `/projects/${slug}` : null
          const galleryImages = [p.cover_image_url, ...(p.images || [])].filter(Boolean)
          const reverse = i % 2 === 1
          return (
            <div key={p.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2.5rem',alignItems:'center',padding:'2.5rem 0',borderBottom:`1px solid ${INK}12`,direction: reverse ? 'rtl' : 'ltr'}} className="ivory-portfolio-row">
              <div style={{position:'relative',aspectRatio:'4/3',overflow:'hidden',background:PAPER_DEEP,cursor:projectUrl?'pointer':'default',direction:'ltr'}}
                onClick={() => projectUrl && (window.location.href = projectUrl)}>
                <img src={p.cover_image_url || PLACEHOLDER_IMG}
                  alt={`${p.title} — ${p.category} interior design by ${branding.business_name} in ${p.location || location.local_city}`}
                  style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />
                {galleryImages.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); setLightbox({ project: p, index: 0 }) }}
                    aria-label={`View ${galleryImages.length} photos of ${p.title}`}
                    className="ts-focusable"
                    style={{position:'absolute',top:'0.9rem',right:'0.9rem',background:PAPER,border:`1px solid ${INK}22`,color:INK,fontSize:'0.65rem',fontWeight:700,padding:'0.4rem 0.65rem',display:'flex',alignItems:'center',gap:'0.35rem',cursor:'pointer'}}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke={INK} strokeWidth="1.4"/><circle cx="8.5" cy="8.5" r="1.5" fill={INK}/><path d="M21 15l-5-5L5 21" stroke={INK} strokeWidth="1.4"/></svg>
                    {galleryImages.length}
                  </button>
                )}
              </div>
              <div style={{direction:'ltr'}}>
                <div style={{fontSize:'0.62rem',letterSpacing:'0.2em',textTransform:'uppercase',color:accentColor,marginBottom:'0.5rem'}}>{p.category} · {p.location || location.local_city}</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',color:INK,marginBottom:'0.75rem'}}>{p.title}</div>
                <div style={{fontSize:'0.85rem',color:MUTED,marginBottom:'1rem'}}>{p.area_sqft ? `${p.area_sqft.toLocaleString('en-IN')} sq.ft` : ''} {p.year ? `· ${p.year}` : ''}</div>
                {projectUrl && <a href={projectUrl} className="ts-focusable" style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:INK,textDecoration:'underline',textUnderlineOffset:'4px'}}>View Project →</a>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  // ── Case Study ────────────────────────────────────────────────────────────────
  const caseStudySection = caseStudy && (
    <section id="case-study" style={{padding:'5rem 0',background:PAPER_DEEP}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        {eyebrow('Case Study', accentColor)}
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3rem)',fontWeight:400,color:INK,marginBottom:'2.5rem'}}>
          {caseStudy.title}
        </h2>
        {(caseStudy.before_image_url || caseStudy.after_image_url) && (
          <BeforeAfterSlider
            beforeUrl={caseStudy.before_image_url || PLACEHOLDER_IMG}
            afterUrl={caseStudy.after_image_url || PLACEHOLDER_IMG}
            beforeAlt={`Before: ${caseStudy.title} — raw space prior to design`}
            afterAlt={`After: ${caseStudy.title} — completed by ${branding.business_name}`}
            accentColor={accentColor}
          />
        )}
      </div>
    </section>
  )

  // ── Consultation — kept as a dark focus-card floating on the ivory page ──
  const consultSection = (
    <section id="consult" style={{padding:'5rem 0',background:PAPER}}>
      <div style={{maxWidth:'900px',margin:'0 auto',padding:'0 2rem'}}>
        <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
          {eyebrow('Book a Consultation', accentColor)}
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:400,color:INK}}>Let&apos;s design your space</h2>
        </div>
        <div style={{background:'#0F0D0A',padding:'clamp(1.5rem,4vw,3rem)'}}>
          <ConsultationForm tenantId={tenant.id} city={location.local_city} accentColor={accentColor} />
        </div>
      </div>
    </section>
  )

  // ── Reviews ──────────────────────────────────────────────────────────────────
  const reviewsSection = reviews.length > 0 && (
    <section style={{padding:'4rem 0',background:PAPER_DEEP}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        {eyebrow('Client Reviews', accentColor)}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'2rem',marginTop:'1.5rem'}}>
          {reviews.slice(0,6).map((r,i) => (
            <div key={i} style={{background:PAPER,padding:'1.75rem',border:`1px solid ${INK}10`}}>
              <div style={{display:'flex',gap:'2px',marginBottom:'0.75rem'}} aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({length:5}).map((_,s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s < r.rating ? accentColor : `${INK}22`} aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z"/></svg>
                ))}
              </div>
              <p style={{color:MUTED,fontSize:'0.88rem',lineHeight:1.7,marginBottom:'1rem'}}>{r.text || ''}</p>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:INK}}>{r.author_name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── FAQ ──────────────────────────────────────────────────────────────────────
  const faqSection = faqs.length > 0 && (
    <section id="faq" style={{padding:'5rem 0',background:PAPER}}>
      <div style={{maxWidth:'860px',margin:'0 auto',padding:'0 2rem'}}>
        {eyebrow('Common Questions', accentColor)}
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:400,color:INK,marginBottom:'1rem'}}>Frequently asked</h2>
        <FAQAccordion faqs={faqs} accentColor={accentColor} textColor={INK} mutedColor={MUTED} />
      </div>
    </section>
  )

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footer = (
    <footer style={{background:INK,padding:'3rem 0 6rem'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:'1.5rem',alignItems:'center'}}>
        <div style={{color:PAPER,fontFamily:'Georgia,serif',fontSize:'1rem'}}>{branding.business_name}</div>
        <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
          <a href={`tel:${contact.phone_number}`} className="ts-focusable" style={{color:`${PAPER}99`,fontSize:'0.8rem',textDecoration:'none'}}>{contact.phone_display}</a>
          <a href={`mailto:${contact.email}`} className="ts-focusable" style={{color:`${PAPER}99`,fontSize:'0.8rem',textDecoration:'none'}}>{contact.email}</a>
        </div>
        <span style={{color:`${PAPER}66`,fontSize:'0.75rem'}}>© {new Date().getFullYear()} {branding.business_name}. All rights reserved.</span>
      </div>
    </footer>
  )

  return (
    <>
      <SchemaScript tenant={tenant} faqs={faqs} />
      <AnalyticsTracker tenantId={tenant.id} />

      <style>{`
        .lg-flex { display: none !important; }
        .lg-hidden { display: flex !important; }
        .ts-mobile-only { display: flex; }
        .ts-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .ts-focusable:focus-visible { outline: 2px solid ${accentColor}; outline-offset: 2px; }
        @media (min-width: 1024px) {
          .lg-flex   { display: flex   !important; }
          .lg-hidden { display: none   !important; }
          .ts-mobile-only { display: none !important; }
        }
        @media (max-width: 860px) {
          .ivory-hero-grid { grid-template-columns: 1fr !important; }
          .ivory-portfolio-row { grid-template-columns: 1fr !important; direction: ltr !important; }
        }
      `}</style>

      {menuOpen && (
        <div style={{position:'fixed',inset:0,background:PAPER,zIndex:200,display:'flex',flexDirection:'column',padding:'5rem 2rem 3rem'}}>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="ts-focusable" style={{position:'absolute',top:'1.5rem',right:'1.5rem',background:'transparent',border:'none',cursor:'pointer'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2 2l16 16M18 2L2 18" stroke={INK} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          {['Work','Services','Process','FAQ','Consult'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="ts-focusable"
              style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:400,color:INK,textDecoration:'none',borderBottom:`1px solid ${INK}18`,padding:'1rem 0'}}>
              {l}
            </a>
          ))}
        </div>
      )}

      {nav}
      <main>
        {hero}
        {portfolio.length > 0 && portfolioSection}
        {caseStudy && caseStudySection}
        {consultSection}
        {reviews.length > 0 && reviewsSection}
        {faqs.length > 0 && faqSection}
      </main>
      {footer}

      <WhatsAppButton phoneNumber={whatsappNumber} businessName={branding.business_name} accentColor={accentColor} bottomOffset="5.5rem" />
      <StickyMobileCTA phoneNumber={contact.phone_number} phoneDisplay={contact.phone_display} accentColor={accentColor} />

      {lightbox && (
        <PortfolioLightbox
          images={[lightbox.project.cover_image_url, ...(lightbox.project.images || [])].filter(Boolean)}
          title={lightbox.project.title}
          category={lightbox.project.category}
          accentColor={accentColor}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
