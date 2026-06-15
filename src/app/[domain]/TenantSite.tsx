'use client'
// src/app/[domain]/TenantSite.tsx
// Full rendered studio site — driven entirely by tenant data

import { useState, useRef, useEffect, useCallback } from 'react'
import { Tenant, PortfolioProject, CaseStudy, FAQItem, GoogleReview } from '@/types'
import AnalyticsTracker from '@/components/shared/AnalyticsTracker'

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
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%23141414%22/%3E%3C/svg%3E'

function eyebrow(text: string) {
  return (
    <div style={{fontFamily:'Inter,sans-serif',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.3em',textTransform:'uppercase',color:'#C8A96E',marginBottom:'1rem'}}>
      {text}
    </div>
  )
}

// ── Schema JSON-LD ────────────────────────────────────────────────────────────
function SchemaScript({ tenant, faqs }: { tenant: Tenant; faqs: FAQItem[] }) {
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

// ── Before/After Slider ───────────────────────────────────────────────────────
function BeforeAfterSlider({ beforeUrl, afterUrl, beforeAlt, afterAlt }: {
  beforeUrl: string; afterUrl: string; beforeAlt: string; afterAlt: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pct, setPct]       = useState(50)
  const [dragging, setDragging] = useState(false)

  const getX = (e: MouseEvent | TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e
    return touch.clientX
  }

  const setPos = useCallback((x: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newPct = Math.max(2, Math.min(98, ((x - rect.left) / rect.width) * 100))
    setPct(newPct)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => { if (dragging) setPos(getX(e)) }
    const onEnd  = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',  onEnd)
    window.addEventListener('touchmove', onMove as EventListener, { passive: true })
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',  onEnd)
      window.removeEventListener('touchmove', onMove as EventListener)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [dragging, setPos])

  return (
    <div
      ref={containerRef}
      onMouseDown={e => { setDragging(true); setPos(e.clientX) }}
      onTouchStart={e => { setDragging(true); setPos(e.touches[0].clientX) }}
      style={{
        position:'relative', overflow:'hidden', cursor:'ew-resize',
        height:'clamp(280px,52vw,620px)', background:'#141414', userSelect:'none',
      }}
      role="img"
      aria-label="Before and after comparison slider"
    >
      {/* Before */}
      <img src={beforeUrl || PLACEHOLDER_IMG} alt={beforeAlt}
        style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}} loading="lazy" />

      {/* After (clipped) */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',width:`${pct}%`}}>
        <img src={afterUrl || PLACEHOLDER_IMG} alt={afterAlt}
          style={{position:'absolute',top:0,left:0,width:containerRef.current?.offsetWidth||'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}
          loading="lazy" />
      </div>

      {/* Handle */}
      <div style={{position:'absolute',top:0,bottom:0,left:`${pct}%`,width:'3px',background:'#C8A96E',transform:'translateX(-50%)',zIndex:10,boxShadow:'0 0 20px rgba(200,169,110,0.4)'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'44px',height:'44px',borderRadius:'50%',background:'#C8A96E',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.5)'}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 9H1M1 9l3-3M1 9l3 3M13 9h4M17 9l-3-3M17 9l-3 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <span style={{position:'absolute',bottom:'1.25rem',left:'1.25rem',fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',padding:'0.35rem 0.75rem',background:'rgba(10,10,10,0.75)',backdropFilter:'blur(8px)',color:'#6B6B6B'}}>Before</span>
      <span style={{position:'absolute',bottom:'1.25rem',right:'1.25rem',fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',padding:'0.35rem 0.75rem',background:'rgba(10,10,10,0.75)',backdropFilter:'blur(8px)',color:'#C8A96E'}}>After</span>
    </div>
  )
}

// ── Consultation Form ─────────────────────────────────────────────────────────
function ConsultationForm({ tenantId, city }: { tenantId: string; city: string }) {
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [form, setForm]       = useState({
    name:'', phone:'', email:'', project_location:'', notes:'',
    property_type:'', scope:'', budget_tier:'',
  })

  const set = (k: string, v: string) => setForm(p => ({...p,[k]:v}))

  const choiceCard = (name: string, value: string, title: string, sub: string) => {
    const selected = form[name as keyof typeof form] === value
    return (
      <div
        key={value}
        onClick={() => set(name, value)}
        style={{
          border:`1px solid ${selected ? '#C8A96E' : '#2A2A2A'}`,
          background: selected ? 'rgba(200,169,110,0.06)' : 'transparent',
          padding:'1rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'1rem',
          transition:'border-color 0.2s',
        }}
      >
        <div style={{width:'18px',height:'18px',border:`1px solid ${selected?'#C8A96E':'#3A3A3A'}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {selected && <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#C8A96E'}} />}
        </div>
        <div>
          <div style={{fontSize:'0.9rem',fontWeight:500,color:'#F5F0E8'}}>{title}</div>
          <div style={{fontSize:'0.72rem',color:'#6B6B6B',marginTop:'0.15rem'}}>{sub}</div>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'#1A1A1A', border:'1px solid #2A2A2A', color:'#F5F0E8',
    fontFamily:'Inter,sans-serif', fontSize:'0.9rem', padding:'0.85rem 1rem',
    outline:'none', transition:'border-color 0.2s',
  }

  const handleSubmit = async () => {
    setLoading(true)
    await fetch('/api/leads', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ tenant_id: tenantId, ...form }),
    })
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <div style={{textAlign:'center',padding:'3rem 0'}}>
      <div style={{width:'64px',height:'64px',border:'1px solid #C8A96E',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M2 12l7 7L22 5" stroke="#C8A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h3 style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:300,color:'#F5F0E8',marginBottom:'0.75rem'}}>Thank you.</h3>
      <p style={{color:'#6B6B6B',fontSize:'0.9rem',lineHeight:1.7}}>We&apos;ve received your request and will confirm a consultation time within one business day.</p>
    </div>
  )

  const dots = [1,2,3,4].map(n => (
    <div key={n} style={{width:'6px',height:'6px',borderRadius:'50%',background: step===n ? '#C8A96E' : step>n ? 'rgba(200,169,110,0.4)' : '#2A2A2A',transform: step===n ? 'scale(1.4)' : 'none',transition:'all 0.3s'}} />
  ))

  const btnNext = (label: string, action: ()=>void, disabled=false) => (
    <button onClick={action} disabled={disabled} style={{background:'#C8A96E',color:'#0A0A0A',fontFamily:'Inter,sans-serif',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem 1.75rem',border:'none',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>
      {label}
    </button>
  )
  const btnBack = (action: ()=>void) => (
    <button onClick={action} style={{background:'transparent',color:'#6B6B6B',fontFamily:'Inter,sans-serif',fontSize:'0.7rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem 1.5rem',border:'1px solid #2A2A2A',cursor:'pointer'}}>
      Back
    </button>
  )

  return (
    <div>
      <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'2rem'}}>
        {dots}
        <span style={{marginLeft:'auto',fontSize:'0.6rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#6B6B6B'}}>Step {step} of 4</span>
      </div>

      {step === 1 && (
        <div>
          <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',fontWeight:300,color:'#F5F0E8',marginBottom:'0.5rem'}}>What type of property?</h3>
          <p style={{color:'#6B6B6B',fontSize:'0.8rem',marginBottom:'1.5rem'}}>Select the option that best describes your project.</p>
          <div style={{display:'grid',gap:'0.75rem'}}>
            {choiceCard('property_type','Villa / Independent House','Villa / Independent House','Standalone residential property')}
            {choiceCard('property_type','Apartment / Flat','Apartment / Flat','Multi-unit residential building')}
            {choiceCard('property_type','Commercial Office','Commercial Office','Workspace, retail, or hospitality')}
            {choiceCard('property_type','Other','Other / Not Sure','We\'ll discuss in the consultation')}
          </div>
          <div style={{marginTop:'2rem',display:'flex',justifyContent:'flex-end'}}>
            {btnNext('Continue', () => setStep(2))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',fontWeight:300,color:'#F5F0E8',marginBottom:'0.5rem'}}>Project scope?</h3>
          <p style={{color:'#6B6B6B',fontSize:'0.8rem',marginBottom:'1.5rem'}}>How much of the space are we designing?</p>
          <div style={{display:'grid',gap:'0.75rem'}}>
            {choiceCard('scope','Full Home','Full Home / Complete Interior','All rooms — living, bedrooms, kitchen, bathrooms')}
            {choiceCard('scope','Living & Dining Only','Living & Dining Space','Primary entertainment and family areas')}
            {choiceCard('scope','Kitchen Only','Kitchen Only','Modular or custom kitchen design')}
            {choiceCard('scope','Custom Scope','Custom / Select Rooms','I\'ll specify which rooms in the consultation')}
          </div>
          <div style={{marginTop:'2rem',display:'flex',justifyContent:'space-between'}}>
            {btnBack(() => setStep(1))}
            {btnNext('Continue', () => setStep(3))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',fontWeight:300,color:'#F5F0E8',marginBottom:'0.5rem'}}>Finish tier?</h3>
          <p style={{color:'#6B6B6B',fontSize:'0.8rem',marginBottom:'1.5rem'}}>Helps us recommend the right approach.</p>
          <div style={{display:'grid',gap:'0.75rem'}}>
            {choiceCard('budget_tier','Premium (₹800–1,500/sq.ft)','Premium','₹800–₹1,500 per sq.ft · Quality materials, refined finish')}
            {choiceCard('budget_tier','Luxury (₹1,500–3,000/sq.ft)','Luxury','₹1,500–₹3,000 per sq.ft · Imported materials, bespoke joinery')}
            {choiceCard('budget_tier','Ultra Luxury (₹3,000+/sq.ft)','Ultra Luxury','₹3,000+ per sq.ft · No-limit finishes, full bespoke')}
            {choiceCard('budget_tier','To Discuss','I\'d Like to Discuss','We\'ll explore options in the consultation')}
          </div>
          <div style={{marginTop:'2rem',display:'flex',justifyContent:'space-between'}}>
            {btnBack(() => setStep(2))}
            {btnNext('Continue', () => setStep(4))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',fontWeight:300,color:'#F5F0E8',marginBottom:'0.5rem'}}>How can we reach you?</h3>
          <p style={{color:'#6B6B6B',fontSize:'0.8rem',marginBottom:'1.5rem'}}>We&apos;ll confirm a time within one business day.</p>
          <div style={{display:'grid',gap:'1.25rem'}}>
            <div>
              <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Your Name *</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Phone Number *</label>
              <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" style={inputStyle} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Email Address</label>
              <input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="your@email.com" type="email" style={inputStyle} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Project Area / Location</label>
              <input value={form.project_location} onChange={e=>set('project_location',e.target.value)} placeholder={`${city} area, layout, PIN...`} style={inputStyle} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Anything else?</label>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Timeline, specific rooms, references..." style={{...inputStyle,resize:'vertical'}} />
            </div>
          </div>
          <div style={{marginTop:'2rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
            {btnBack(() => setStep(3))}
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.phone}
              style={{flex:1,background:'#C8A96E',color:'#0A0A0A',fontFamily:'Inter,sans-serif',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem',border:'none',cursor:'pointer',opacity:(loading||!form.name||!form.phone)?0.5:1}}
            >
              {loading ? 'Submitting...' : 'Request Consultation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      {faqs.map(faq => (
        <div key={faq.id} style={{borderBottom:'1px solid #2A2A2A'}}>
          <button
            onClick={() => setOpen(open === faq.id ? null : faq.id)}
            style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1.5rem 0',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',gap:'1rem'}}
          >
            <span style={{fontFamily:'Georgia,serif',fontSize:'1.2rem',fontWeight:400,color: open===faq.id ? '#C8A96E' : '#F5F0E8',transition:'color 0.2s',lineHeight:1.4}}>
              {faq.question}
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,transform: open===faq.id ? 'rotate(45deg)' : 'none',transition:'transform 0.3s',color:'#C8A96E'}}>
              <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {open === faq.id && (
            <div style={{paddingBottom:'1.5rem',color:'#6B6B6B',fontSize:'0.9rem',lineHeight:1.75}}>
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main TenantSite component ─────────────────────────────────────────────────
export default function TenantSite({ tenant, siteData }: Props) {
  const { branding, contact, location, stats, content } = tenant
  const { portfolio, caseStudy, faqs, reviews } = siteData
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const accentColor = branding.accent_color || '#C8A96E'

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
          <button onClick={() => setMenuOpen(true)} style={{background:'transparent',border:'none',cursor:'pointer',padding:'0.5rem',display:'flex',flexDirection:'column',gap:'5px'}} aria-label="Open menu" className="lg-hidden">
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
            <ConsultationForm tenantId={tenant.id} city={location.local_city} />
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
        @media (min-width: 1024px) {
          .lg-flex   { display: flex   !important; }
          .lg-block  { display: block  !important; }
          .lg-hidden { display: none   !important; }
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
          <button onClick={() => setMenuOpen(false)} style={{position:'absolute',top:'1.5rem',right:'1.5rem',background:'transparent',border:'none',cursor:'pointer'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 2l16 16M18 2L2 18" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          {['Work','Services','Process','FAQ','Consult'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}
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
    </>
  )
}