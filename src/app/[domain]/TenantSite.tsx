'use client'
// src/app/[domain]/TenantSite.tsx
// Full rendered studio site — driven entirely by tenant data

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function eyebrow(text: string) {
  return (
    <div style={{fontFamily:'Inter,sans-serif',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.3em',textTransform:'uppercase',color:'#C8A96E',marginBottom:'1rem'}}>
      {text}
    </div>
  )
}

// ── Main TenantSite component ─────────────────────────────────────────────────
export default function TenantSite({ tenant, siteData }: Props) {
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

  const accentColor = branding.accent_color || '#C8A96E'
  const whatsappNumber = contact.whatsapp_number || contact.phone_number


  // ── Nav ──────────────────────────────────────────────────────────────────────
  const nav = (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:100,
      background: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(200,169,110,0.15)' : 'none',
      transition:'all 0.4s',
    }}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:'72px'}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <div style={{width:'32px',height:'32px',border:`1px solid ${accentColor}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:accentColor,fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:300}}>{branding.logo_letter}</span>
          </div>
          <div>
            <div style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontSize:'0.9rem',fontWeight:300,letterSpacing:'0.2em'}}>{branding.business_name}</div>
            <div style={{color:accentColor,fontSize:'0.52rem',letterSpacing:'0.2em',textTransform:'uppercase',marginTop:'1px'}}>{branding.tagline}</div>
          </div>
        </div>
        {/* Desktop links */}
        <div style={{display:'none',gap:'2.5rem'}} className="lg-flex">
          {['Work','Services','Process','FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{fontSize:'0.7rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(245,240,232,0.6)',textDecoration:'none',transition:'color 0.2s'}}
              onMouseEnter={e => (e.currentTarget.style.color=accentColor)}
              onMouseLeave={e => (e.currentTarget.style.color='rgba(245,240,232,0.6)')}
            >{l}</a>
          ))}
        </div>
        {/* CTA */}
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <a href={`tel:${contact.phone_number}`} style={{fontSize:'0.6rem',letterSpacing:'0.2em',textTransform:'uppercase',color:accentColor,textDecoration:'none',display:'none'}} className="lg-block">
            {contact.phone_display}
          </a>
          <a href="#consult" style={{background:accentColor,color:'#0A0A0A',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.75rem 1.5rem',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'0.5rem',transition:'background 0.2s'}}
            onMouseEnter={e => (e.currentTarget.style.background='#A8854A')}
            onMouseLeave={e => (e.currentTarget.style.background=accentColor)}
          >
            Book Consultation
          </a>
          {/* Mobile menu btn */}
          <button onClick={() => setMenuOpen(true)} style={{background:'transparent',border:'none',cursor:'pointer',padding:'0.5rem',display:'flex',flexDirection:'column',gap:'5px'}} aria-label="Open menu" aria-expanded={menuOpen} className="lg-hidden ts-focusable">
            <span style={{display:'block',width:'22px',height:'1px',background:'#F5F0E8'}} />
            <span style={{display:'block',width:'16px',height:'1px',background:accentColor}} />
            <span style={{display:'block',width:'19px',height:'1px',background:'#F5F0E8'}} />
          </button>
        </div>
      </div>
    </nav>
  )

  // ── Hero ─────────────────────────────────────────────────────────────────────
  const hero = (
    <section style={{minHeight:'100svh',position:'relative',display:'flex',alignItems:'flex-end',paddingBottom:'5rem',paddingTop:'5rem'}}>
      <div style={{position:'absolute',inset:0,overflow:'hidden',background:'#141414'}}>
        {content.hero_image_url ? (
          <img src={content.hero_image_url} alt={`${branding.business_name} studio interior`} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.45}} />
        ) : (
          <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#141414 0%,#1A1A1A 50%,#0F0F0F 100%)'}} />
        )}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,10,10,0.92) 0%,rgba(10,10,10,0.4) 50%,rgba(10,10,10,0.2) 100%)'}} />
      </div>
      <div style={{position:'relative',zIndex:10,maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',width:'100%'}}>
        <div style={{maxWidth:'800px'}}>
          {eyebrow(`${location.local_city}'s Architectural Design Studio`)}
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2.5rem,8vw,8rem)',fontWeight:300,lineHeight:0.92,letterSpacing:'-0.02em',color:'#F5F0E8',marginBottom:'2rem'}}>
            {content.hero_headline_line1}<br/>
            {content.hero_headline_line2}<br/>
            <em style={{fontStyle:'italic',color:accentColor}}>{content.hero_headline_line3}</em>
          </h1>
          <p style={{color:'rgba(245,240,232,0.6)',fontSize:'1rem',maxWidth:'520px',marginBottom:'2.5rem',lineHeight:1.7,fontWeight:300}}>
            {content.hero_subtext}
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'1rem'}}>
            <a href="#consult" style={{display:'inline-flex',alignItems:'center',gap:'0.75rem',background:accentColor,color:'#0A0A0A',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',padding:'1rem 2rem',textDecoration:'none'}}>
              Book a Site Consultation
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="#work" style={{display:'inline-flex',alignItems:'center',gap:'0.75rem',border:`1px solid rgba(200,169,110,0.5)`,color:accentColor,fontSize:'0.7rem',fontWeight:500,letterSpacing:'0.2em',textTransform:'uppercase',padding:'1rem 2rem',textDecoration:'none'}}>
              View Selected Work
            </a>
          </div>
        </div>
        {/* Stats */}
        <div style={{marginTop:'4rem',display:'flex',flexWrap:'wrap',gap:'3rem',borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:'2rem'}}>
          {[
            [`${stats.project_count}+`, 'Projects Delivered'],
            [`${stats.years_active}yr`,  'Studio Experience'],
            [`${stats.sqft_total}L+`,    'Sq.ft Designed'],
            [`${stats.city_radius}km`,   'Service Radius'],
          ].map(([v,l]) => (
            <div key={l}>
              <div style={{fontFamily:'Georgia,serif',fontSize:'clamp(1.75rem,4vw,3rem)',fontWeight:300,color:accentColor,lineHeight:1}}>{v}</div>
              <div style={{fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,marginTop:'0.5rem',opacity:0.7}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── Portfolio ─────────────────────────────────────────────────────────────────
  const portfolioSection = portfolio.length > 0 && (
    <section id="work" style={{padding:'5rem 0'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',marginBottom:'3rem'}}>
        {eyebrow('Selected Work')}
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:300,color:'#F5F0E8'}}>
          A decade of<br/><em style={{color:accentColor}}>considered spaces</em>
        </h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1px',background:'#2A2A2A'}}>
        {portfolio.map(p => {
          const slug = (p as PortfolioProject & {slug?:string}).slug
          const projectUrl = slug ? `/projects/${slug}` : null
          const galleryImages = [p.cover_image_url, ...(p.images || [])].filter(Boolean)
          return (
            <div
              key={p.id}
              style={{position:'relative',overflow:'hidden',background:'#141414',aspectRatio:'4/3',cursor: projectUrl ? 'pointer' : 'default'}}
              onClick={() => projectUrl && (window.location.href = projectUrl)}
            >
              <img src={p.cover_image_url || PLACEHOLDER_IMG}
                alt={`${p.title} — ${p.category} interior design by ${branding.business_name} in ${p.location || location.local_city}`}
                style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.7s ease, opacity 0.3s',opacity:0.75}}
                loading="lazy"
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.opacity='1' }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='0.75' }}
              />
              {galleryImages.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); setLightbox({ project: p, index: 0 }) }}
                  aria-label={`View ${galleryImages.length} photos of ${p.title}`}
                  className="ts-focusable"
                  style={{position:'absolute',top:'0.9rem',right:'0.9rem',background:'rgba(10,10,10,0.7)',backdropFilter:'blur(6px)',border:`1px solid ${accentColor}55`,color:'#F5F0E8',fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.05em',padding:'0.4rem 0.65rem',display:'flex',alignItems:'center',gap:'0.35rem',cursor:'pointer'}}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#F5F0E8" strokeWidth="1.4"/><circle cx="8.5" cy="8.5" r="1.5" fill="#F5F0E8"/><path d="M21 15l-5-5L5 21" stroke="#F5F0E8" strokeWidth="1.4"/></svg>
                  {galleryImages.length}
                </button>
              )}
              <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(10,10,10,0.9),transparent)',padding:'1.5rem'}}>
                <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,marginBottom:'0.25rem'}}>{p.category}</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'#F5F0E8'}}>{p.title}</div>
                {projectUrl && <div style={{fontSize:'0.55rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(200,169,110,0.6)',marginTop:'0.4rem'}}>View Project →</div>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  // ── Case Study ────────────────────────────────────────────────────────────────
  const caseStudySection = caseStudy && (
    <section id="case-study" style={{padding:'5rem 0',background:'#0D0D0D'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        {eyebrow('Case Study')}
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:300,color:'#F5F0E8',marginBottom:'3rem'}}>
          Project Arc: <em style={{color:accentColor}}>{caseStudy.title}</em>
        </h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'3rem'}}>
          {/* Before/After if available */}
          {(caseStudy.before_image_url || caseStudy.after_image_url) && (
            <BeforeAfterSlider
              beforeUrl={caseStudy.before_image_url || PLACEHOLDER_IMG}
              afterUrl={caseStudy.after_image_url || PLACEHOLDER_IMG}
              beforeAlt={`Before: ${caseStudy.title} — raw space prior to design`}
              afterAlt={`After: ${caseStudy.title} — completed by ${branding.business_name}`}
            />
          )}
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)',gap:'4rem',alignItems:'start'}}>
            {/* Arc phases */}
            <div style={{display:'flex',flexDirection:'column',gap:'3rem'}}>
              {[
                ['01 — The Brief',    caseStudy.brief_heading,    caseStudy.brief_body],
                ['02 — The Challenge',caseStudy.challenge_heading,caseStudy.challenge_body],
                ['03 — The Solution', caseStudy.solution_heading, caseStudy.solution_body],
                ['04 — The Outcome',  caseStudy.outcome_heading,  caseStudy.outcome_body],
              ].map(([tag, heading, body]) => heading && (
                <div key={tag as string}>
                  <div style={{display:'inline-block',fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:accentColor,border:`1px solid rgba(200,169,110,0.3)`,padding:'0.25rem 0.6rem',marginBottom:'0.75rem'}}>
                    {tag}
                  </div>
                  <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:300,color:'#F5F0E8',marginBottom:'1rem'}}>{heading}</h3>
                  <p style={{color:'#6B6B6B',fontSize:'0.9rem',lineHeight:1.75}}>{body}</p>
                </div>
              ))}
              {/* Outcome stats */}
              {caseStudy.stat_1_value && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',borderTop:'1px solid #2A2A2A',paddingTop:'2rem'}}>
                  {[[caseStudy.stat_1_value, caseStudy.stat_1_label],[caseStudy.stat_2_value, caseStudy.stat_2_label],[caseStudy.stat_3_value, caseStudy.stat_3_label]].map(([v,l]) => (
                    <div key={l}>
                      <div style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:300,color:accentColor,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:'0.55rem',fontWeight:500,letterSpacing:'0.2em',textTransform:'uppercase',color:'#6B6B6B',marginTop:'0.5rem'}}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Sidebar metadata */}
            <div style={{position:'sticky',top:'6rem'}}>
              <div style={{fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.25em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'1.5rem'}}>Project Details</div>
              {[
                ['Client Type',       caseStudy.client_type],
                ['Location',          caseStudy.location],
                ['Total Area',        caseStudy.area_sqft ? `${caseStudy.area_sqft.toLocaleString('en-IN')} sq.ft` : null],
                ['Scope',             caseStudy.scope],
                ['Duration',          caseStudy.duration_weeks ? `${caseStudy.duration_weeks} Weeks` : null],
                ['Finish Tier',       caseStudy.finish_tier],
                ['Year',              caseStudy.year?.toString()],
              ].filter(([,v]) => v).map(([k,v]) => (
                <div key={k as string} style={{borderTop:'1px solid #2A2A2A',paddingTop:'0.75rem',marginBottom:'0.75rem'}}>
                  <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.25rem'}}>{k}</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:500,color: k==='Finish Tier' ? accentColor : '#F5F0E8',textTransform: k==='Finish Tier' ? 'capitalize' : 'none'}}>{v}</div>
                </div>
              ))}
              <div style={{marginTop:'1.5rem'}}>
                <a href="#consult" style={{display:'flex',justifyContent:'center',background:accentColor,color:'#0A0A0A',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem',textDecoration:'none'}}>
                  Start a Similar Project
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )

  // ── Consultation ──────────────────────────────────────────────────────────────
  const consultSection = (
    <section id="consult" style={{padding:'5rem 0',background:'#0A0A0A'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'start'}}>
          <div style={{position:'sticky',top:'6rem'}}>
            {eyebrow('Book a Consultation')}
            <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:300,color:'#F5F0E8',marginBottom:'1.5rem'}}>
              Let&apos;s discuss<br/>your <em style={{color:accentColor}}>project</em>
            </h2>
            <p style={{color:'#6B6B6B',fontSize:'0.9rem',lineHeight:1.7,maxWidth:'380px',marginBottom:'2rem'}}>
              Our first conversation is complimentary — on-site or via video call. Share a few details and we&apos;ll confirm a time within one business day.
            </p>
            <div style={{borderTop:'1px solid #2A2A2A',paddingTop:'1.5rem'}}>
              <div style={{fontSize:'0.6rem',letterSpacing:'0.25em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Call directly</div>
              <a href={`tel:${contact.phone_number}`} style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',color:'#F5F0E8',textDecoration:'none'}}>{contact.phone_display}</a>
              <div style={{fontSize:'0.7rem',color:'#6B6B6B',marginTop:'0.25rem'}}>Mon–Fri 9:30am–6:30pm</div>
            </div>
          </div>
          <div style={{background:'#0D0D0D',border:'1px solid #1A1A1A',padding:'2.5rem'}}>
            <ConsultationForm tenantId={tenant.id} city={location.local_city} accentColor={accentColor} />
          </div>
        </div>
      </div>
    </section>
  )


  // ── Reviews Section ──────────────────────────────────────────────────────────
  const reviewsSection = reviews.length > 0 && (
    <section style={{padding:'5rem 0',background:'#0A0A0A'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        {eyebrow('Client Reviews')}
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'3rem'}}>
          {/* Header row */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:300,color:'#F5F0E8'}}>
              What clients<br/><em style={{color:accentColor}}>say about us</em>
            </h2>
            {tenant.google_rating && (
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'Georgia,serif',fontSize:'3rem',fontWeight:300,color:accentColor,lineHeight:1}}>{tenant.google_rating}</div>
                <div style={{display:'flex',gap:'3px',justifyContent:'flex-end',margin:'4px 0'}}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1l1.6 3.2 3.6.52-2.6 2.54.62 3.6L7 9.1 3.78 10.86l.62-3.6L1.8 4.72l3.6-.52z"
                        fill={i <= Math.round(tenant.google_rating || 0) ? accentColor : '#2A2A2A'} />
                    </svg>
                  ))}
                </div>
                <div style={{fontSize:'0.6rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#6B6B6B'}}>
                  {tenant.google_review_count} Google Reviews
                </div>
              </div>
            )}
          </div>

          {/* Review cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1px',background:'#1A1A1A'}}>
            {reviews.map(review => (
              <div key={review.id} style={{background:'#0D0D0D',padding:'2rem'}}>
                {/* Stars */}
                <div style={{display:'flex',gap:'3px',marginBottom:'1rem'}}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8.15 3.22 9.55l.53-3.1L1.5 4.25l3.1-.45z"
                        fill={i <= review.rating ? accentColor : '#2A2A2A'} />
                    </svg>
                  ))}
                </div>
                {/* Review text */}
                {review.text && (
                  <p style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:300,fontStyle:'italic',color:'rgba(245,240,232,0.8)',lineHeight:1.7,marginBottom:'1.25rem'}}>
                    &ldquo;{review.text.length > 180 ? review.text.slice(0, 180) + '...' : review.text}&rdquo;
                  </p>
                )}
                {/* Author */}
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  {review.author_photo ? (
                    <img src={review.author_photo} alt={review.author_name}
                      style={{width:'32px',height:'32px',borderRadius:'50%',objectFit:'cover'}}
                      loading="lazy" />
                  ) : (
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#1A1A1A',border:'1px solid #2A2A2A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:accentColor,fontWeight:600}}>
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{fontSize:'0.8rem',fontWeight:500,color:'#F5F0E8'}}>{review.author_name}</div>
                    {review.relative_time && (
                      <div style={{fontSize:'0.65rem',color:'#6B6B6B'}}>{review.relative_time}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )

  // ── FAQ ───────────────────────────────────────────────────────────────────────
  const faqSection = faqs.length > 0 && (
    <section id="faq" style={{padding:'5rem 0',background:'#0D0D0D'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'4rem',alignItems:'start'}}>
          <div>
            {eyebrow('Common Questions')}
            <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,3vw,3rem)',fontWeight:300,color:'#F5F0E8'}}>
              What clients<br/>ask us <em style={{color:accentColor}}>first</em>
            </h2>
          </div>
          <FAQAccordion faqs={faqs} />
        </div>
      </div>
    </section>
  )

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footer = (
    <footer style={{borderTop:'1px solid #1A1A1A',padding:'4rem 0',background:'#0D0D0D'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'3rem',marginBottom:'3rem'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
              <div style={{width:'32px',height:'32px',border:`1px solid ${accentColor}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:accentColor,fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:300}}>{branding.logo_letter}</span>
              </div>
              <span style={{fontFamily:'Georgia,serif',fontSize:'0.9rem',fontWeight:300,letterSpacing:'0.2em',color:'#F5F0E8'}}>{branding.business_name}</span>
            </div>
            <p style={{color:'#6B6B6B',fontSize:'0.85rem',lineHeight:1.7,maxWidth:'320px',marginBottom:'1rem'}}>
              A design studio dedicated to thoughtful, precise, enduring interiors. Based in {location.local_city}.
            </p>
            <address style={{fontStyle:'normal',color:'#6B6B6B',fontSize:'0.8rem',lineHeight:1.7}}>
              {location.street_address}<br/>
              {location.local_city}, {location.state} — {location.pin_code}<br/>
              <a href={`tel:${contact.phone_number}`} style={{color:'#6B6B6B',textDecoration:'none'}}>{contact.phone_display}</a>
            </address>
          </div>
          <div>
            <div style={{fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.25em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'1rem'}}>Studio</div>
            {['Work','Services','Process','FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{display:'block',color:'#6B6B6B',textDecoration:'none',fontSize:'0.85rem',marginBottom:'0.5rem'}}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.25em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'1rem'}}>Connect</div>
            {contact.instagram_handle && (
              <a href={`https://instagram.com/${contact.instagram_handle}`} target="_blank" rel="noopener noreferrer" style={{display:'block',color:'#6B6B6B',textDecoration:'none',fontSize:'0.85rem',marginBottom:'0.5rem'}}>Instagram</a>
            )}
            <a href={`mailto:${contact.email}`} style={{display:'block',color:'#6B6B6B',textDecoration:'none',fontSize:'0.85rem',marginBottom:'1.5rem'}}>Email Studio</a>
            <a href="#consult" style={{background:accentColor,color:'#0A0A0A',fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.75rem 1.25rem',textDecoration:'none',display:'inline-block'}}>
              Book Consultation
            </a>
          </div>
        </div>
        <div style={{borderTop:'1px solid #1A1A1A',paddingTop:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'#6B6B6B',fontSize:'0.75rem'}}>
            © {new Date().getFullYear()} {branding.business_name}. All rights reserved.
          </div>
          <div style={{color:'#6B6B6B',fontSize:'0.7rem'}}>
            {!tenant.white_label
              ? <a href="https://studiolaunch.in" style={{color:accentColor,textDecoration:'none'}}>Powered by StudioLaunch</a>
              : tenant.custom_footer_text
                ? <span>{tenant.custom_footer_text}</span>
                : null
            }
          </div>
        </div>
      </div>
    </footer>
  )

  return (
    <>
      <SchemaScript tenant={tenant} faqs={faqs} />
      <AnalyticsTracker tenantId={tenant.id} />

      {/* Responsive style shim */}
      <style>{`
        .lg-flex { display: none !important; }
        .lg-block { display: none !important; }
        .lg-hidden { display: flex !important; }
        .ts-mobile-only { display: flex; }
        .ts-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .ts-focusable:focus-visible { outline: 2px solid ${accentColor}; outline-offset: 2px; }
        @media (min-width: 1024px) {
          .lg-flex   { display: flex   !important; }
          .lg-block  { display: block  !important; }
          .lg-hidden { display: none   !important; }
          .ts-mobile-only { display: none !important; }
        }
        @media (max-width: 768px) {
          #case-study .grid-2col,
          #consult .grid-2col,
          #faq .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div style={{position:'fixed',inset:0,background:'#0A0A0A',zIndex:200,display:'flex',flexDirection:'column',padding:'5rem 2rem 3rem'}}>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="ts-focusable" style={{position:'absolute',top:'1.5rem',right:'1.5rem',background:'transparent',border:'none',cursor:'pointer'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2 2l16 16M18 2L2 18" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          {['Work','Services','Process','FAQ','Consult'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="ts-focusable"
              style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:300,color:'#F5F0E8',textDecoration:'none',borderBottom:'1px solid #1A1A1A',padding:'1rem 0'}}>
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