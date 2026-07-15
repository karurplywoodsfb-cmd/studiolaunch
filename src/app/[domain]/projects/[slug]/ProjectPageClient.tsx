'use client'
// src/app/[domain]/projects/[slug]/ProjectPageClient.tsx
// Full editorial project detail page — premium, image-rich, SEO-dense

import { useState, useEffect } from 'react'
import { Tenant, PortfolioProjectSEO } from '@/types'
import AnalyticsTracker from '@/components/shared/AnalyticsTracker'

const FINISH_LABEL: Record<string, string> = {
  premium: 'Premium',
  luxury:  'Luxury',
  ultra:   'Ultra Luxury',
}

const CATEGORY_LABEL: Record<string, string> = {
  villa:       'Villa / Independent House',
  apartment:   'Apartment / Flat',
  commercial:  'Commercial',
  other:       'Other',
}

interface RelatedProject {
  id:              string
  title:           string
  slug?:           string
  cover_image_url?: string
  category:        string
  location?:       string
  year?:           number
}

interface Props {
  tenant:  Tenant
  project: PortfolioProjectSEO
  related: RelatedProject[]
}

function LightboxGallery({
  images,
  cover,
  projectTitle,
}: {
  images: string[]
  cover?: string
  projectTitle: string
}) {
  const all = [cover, ...images].filter((x): x is string => Boolean(x) && x !== cover ? true : x === cover)
  // Deduplicate: put cover first, then extras
  const allImages = cover
    ? [cover, ...(images || []).filter(i => i !== cover)]
    : (images || [])

  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox === null) return
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox(i => i !== null ? Math.min(i + 1, allImages.length - 1) : null)
      if (e.key === 'ArrowLeft')  setLightbox(i => i !== null ? Math.max(i - 1, 0) : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, allImages.length])

  if (allImages.length === 0) return null

  return (
    <>
      {/* Gallery grid */}
      <div style={{display:'grid', gridTemplateColumns: allImages.length === 1 ? '1fr' : allImages.length === 2 ? '1fr 1fr' : '2fr 1fr', gap:'2px', background:'#2A2A2A'}}>
        {allImages.slice(0, 5).map((img, i) => (
          <div
            key={i}
            onClick={() => setLightbox(i)}
            style={{
              position:'relative', overflow:'hidden', cursor:'zoom-in',
              aspectRatio: i === 0 ? (allImages.length === 1 ? '16/9' : '4/3') : '4/3',
              background:'#141414',
              gridRow: i === 0 && allImages.length > 2 ? 'span 2' : undefined,
            }}
          >
            <img
              src={img}
              alt={`${projectTitle} — image ${i + 1} by interior designer`}
              style={{width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s ease, opacity 0.3s', opacity:0.85}}
              loading={i === 0 ? 'eager' : 'lazy'}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLImageElement).style.opacity = '0.85' }}
            />
            {i === 4 && allImages.length > 5 && (
              <div style={{position:'absolute',inset:0,background:'rgba(10,10,10,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontFamily:'Georgia,serif',fontSize:'2rem',color:'#F5F0E8',fontWeight:300}}>+{allImages.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightbox(null) }}
            style={{position:'absolute',top:'1.5rem',right:'1.5rem',background:'transparent',border:'none',cursor:'pointer',color:'#F5F0E8',fontSize:'1.5rem',lineHeight:1,zIndex:10}}
          >×</button>
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(i => i !== null ? i - 1 : null) }}
              style={{position:'absolute',left:'1.5rem',top:'50%',transform:'translateY(-50%)',background:'rgba(200,169,110,0.2)',border:'1px solid rgba(200,169,110,0.4)',color:'#C8A96E',width:'44px',height:'44px',cursor:'pointer',fontSize:'1.2rem',zIndex:10}}
            >‹</button>
          )}
          {lightbox < allImages.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(i => i !== null ? i + 1 : null) }}
              style={{position:'absolute',right:'1.5rem',top:'50%',transform:'translateY(-50%)',background:'rgba(200,169,110,0.2)',border:'1px solid rgba(200,169,110,0.4)',color:'#C8A96E',width:'44px',height:'44px',cursor:'pointer',fontSize:'1.2rem',zIndex:10}}
            >›</button>
          )}
          <img
            src={allImages[lightbox]}
            alt={`${projectTitle} — image ${lightbox + 1}`}
            style={{maxWidth:'90vw',maxHeight:'90vh',objectFit:'contain'}}
            onClick={e => e.stopPropagation()}
          />
          <div style={{position:'absolute',bottom:'1.5rem',left:'50%',transform:'translateX(-50%)',color:'rgba(245,240,232,0.5)',fontSize:'0.75rem',letterSpacing:'0.2em'}}>
            {lightbox + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  )
}

export default function ProjectPageClient({ tenant, project, related }: Props) {
  const { branding, location, contact } = tenant
  const accentColor = branding.accent_color || '#C8A96E'
  const isIvory = branding.theme === 'ivory'
  const t = {
    bg:        isIvory ? '#F7F3EA' : '#0A0A0A',
    surface:   isIvory ? '#FFFFFF' : '#0D0D0D',
    text:      isIvory ? '#211D17' : '#F5F0E8',
    textSoft:  isIvory ? 'rgba(33,29,23,0.85)'   : 'rgba(245,240,232,0.85)',
    muted:     isIvory ? '#726A5C' : '#6B6B6B',
    border:    isIvory ? 'rgba(33,29,23,0.12)' : '#1A1A1A',
    borderAlt: isIvory ? 'rgba(33,29,23,0.18)' : '#2A2A2A',
    navScrolledBg: isIvory ? 'rgba(247,243,234,0.95)' : 'rgba(10,10,10,0.95)',
    heroGradient:  isIvory
      ? 'linear-gradient(to top, #F7F3EA 0%, rgba(247,243,234,0.35) 60%, transparent 100%)'
      : 'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.3) 60%, transparent 100%)',
  }
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const siteRoot = typeof window !== 'undefined'
    ? window.location.origin
    : `https://${tenant.subdomain}.maspace.in`

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const nav = (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      background: scrolled ? t.navScrolledBg : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `1px solid ${accentColor}26` : 'none',
      transition: 'all 0.4s',
    }}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:'72px'}}>
        <a href={siteRoot} style={{display:'flex',alignItems:'center',gap:'0.75rem',textDecoration:'none'}}>
          <div style={{width:'32px',height:'32px',border:`1px solid ${accentColor}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:accentColor,fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:300}}>{branding.logo_letter}</span>
          </div>
          <span style={{color:t.text,fontFamily:'Georgia,serif',fontSize:'0.9rem',fontWeight:300,letterSpacing:'0.2em'}}>{branding.business_name}</span>
        </a>

        {/* Breadcrumb */}
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.65rem',color:t.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>
          <a href={siteRoot} style={{color:t.muted,textDecoration:'none',transition:'color 0.2s'}}
            onMouseEnter={e => (e.currentTarget.style.color=accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color=t.muted)}>Home</a>
          <span>›</span>
          <a href={`${siteRoot}/#work`} style={{color:t.muted,textDecoration:'none',transition:'color 0.2s'}}
            onMouseEnter={e => (e.currentTarget.style.color=accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color=t.muted)}>Projects</a>
          <span>›</span>
          <span style={{color:t.text}}>{project.title}</span>
        </div>

        <a href={`${siteRoot}/#consult`} style={{
          background:accentColor, color:'#0A0A0A', fontSize:'0.65rem', fontWeight:600,
          letterSpacing:'0.2em', textTransform:'uppercase', padding:'0.65rem 1.25rem', textDecoration:'none',
        }}>Book Consultation</a>
      </div>
    </nav>
  )

  // ── Hero ─────────────────────────────────────────────────────────────────────
  const hero = (
    <section style={{paddingTop:'72px',position:'relative',background:t.bg}}>
      {project.cover_image_url && (
        <div style={{position:'relative',overflow:'hidden',height:'60vh',minHeight:'420px',maxHeight:'700px'}}>
          <img
            src={project.cover_image_url}
            alt={`${project.title} — ${CATEGORY_LABEL[project.category] || project.category} interior design by ${branding.business_name} in ${project.location || location.local_city}`}
            style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.6}}
            fetchPriority="high"
          />
          <div style={{position:'absolute',inset:0,background:t.heroGradient}} />
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'3rem 2rem',maxWidth:'1280px',margin:'0 auto'}}>
            <div style={{fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.3em',textTransform:'uppercase',color:accentColor,marginBottom:'1rem'}}>
              {CATEGORY_LABEL[project.category] || project.category}
              {project.location && ` · ${project.location}`}
              {project.year && ` · ${project.year}`}
            </div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2.5rem,6vw,5rem)',fontWeight:300,lineHeight:0.95,letterSpacing:'-0.02em',color:t.text,marginBottom:'1rem'}}>
              {project.title}
            </h1>
            {project.finish_tier && (
              <span style={{display:'inline-block',fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,border:`1px solid ${accentColor}40`,padding:'0.25rem 0.75rem'}}>
                {FINISH_LABEL[project.finish_tier] || project.finish_tier} Finish
              </span>
            )}
          </div>
        </div>
      )}
      {!project.cover_image_url && (
        <div style={{padding:'8rem 2rem 4rem',maxWidth:'1280px',margin:'0 auto'}}>
          <div style={{fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.3em',textTransform:'uppercase',color:accentColor,marginBottom:'1rem'}}>
            {CATEGORY_LABEL[project.category] || project.category}
          </div>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2.5rem,6vw,5rem)',fontWeight:300,color:t.text}}>
            {project.title}
          </h1>
        </div>
      )}
    </section>
  )

  // ── Main content ──────────────────────────────────────────────────────────────
  const content = (
    <section style={{background:t.bg,padding:'4rem 0 6rem'}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'4rem'}}>

          {/* Top: metadata strip */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'0',borderTop:`1px solid ${t.borderAlt}`,borderBottom:`1px solid ${t.borderAlt}`}}>
            {[
              ['Category',    CATEGORY_LABEL[project.category] || project.category],
              ['Location',    project.location || location.local_city],
              ['Area',        project.area_sqft ? `${project.area_sqft.toLocaleString('en-IN')} sq.ft` : null],
              ['Finish Tier', FINISH_LABEL[project.finish_tier] || project.finish_tier],
              ['Year',        project.year?.toString()],
              ['Studio',      branding.business_name],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k as string} style={{flex:'1 1 160px',padding:'1.25rem 1.5rem',borderRight:`1px solid ${t.borderAlt}`}}>
                <div style={{fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:t.muted,marginBottom:'0.4rem'}}>{k}</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:400,color: k==='Finish Tier' ? accentColor : t.text}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Gallery */}
          <div>
            <LightboxGallery
              images={project.images || []}
              cover={project.cover_image_url}
              projectTitle={project.title}
            />
          </div>

          {/* Two-column: description + sidebar */}
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)',gap:'5rem',alignItems:'start'}}>

            {/* Left: editorial content */}
            <div>
              {project.full_description && (
                <div style={{marginBottom:'3rem'}}>
                  <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,marginBottom:'0.75rem'}}>About This Project</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:'1.25rem',fontWeight:300,lineHeight:1.65,color:t.textSoft}}>
                    {project.full_description}
                  </div>
                </div>
              )}

              {project.challenge_text && (
                <div style={{marginBottom:'3rem',paddingLeft:'1.5rem',borderLeft:`2px solid ${accentColor}40`}}>
                  <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,marginBottom:'0.75rem'}}>The Challenge</div>
                  <p style={{color:t.muted,fontSize:'0.95rem',lineHeight:1.75}}>{project.challenge_text}</p>
                </div>
              )}

              {project.solution_text && (
                <div style={{marginBottom:'3rem',paddingLeft:'1.5rem',borderLeft:`2px solid ${accentColor}40`}}>
                  <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,marginBottom:'0.75rem'}}>The Solution</div>
                  <p style={{color:t.muted,fontSize:'0.95rem',lineHeight:1.75}}>{project.solution_text}</p>
                </div>
              )}

              {/* Materials & Specs */}
              {project.materials && project.materials.length > 0 && (
                <div style={{marginBottom:'3rem'}}>
                  <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.25em',textTransform:'uppercase',color:accentColor,marginBottom:'1rem'}}>Materials &amp; Specifications</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'0',border:`1px solid ${t.borderAlt}`}}>
                    {project.materials.map((m, i) => (
                      <div key={i} style={{padding:'1rem 1.25rem',borderRight:`1px solid ${t.borderAlt}`,borderBottom:`1px solid ${t.borderAlt}`}}>
                        <div style={{fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:t.muted,marginBottom:'0.35rem'}}>{m.label}</div>
                        <div style={{fontSize:'0.85rem',color:t.text}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'2rem'}}>
                  {project.tags.map(tag => (
                    <span key={tag} style={{fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.15em',textTransform:'uppercase',color:t.muted,border:`1px solid ${t.borderAlt}`,padding:'0.35rem 0.75rem'}}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Testimonial */}
              {project.testimonial_quote && (
                <div style={{marginTop:'3rem',padding:'2rem',borderLeft:`3px solid ${accentColor}`,background:t.surface}}>
                  <div style={{fontFamily:'Georgia,serif',fontSize:'1.2rem',fontWeight:300,fontStyle:'italic',color:t.text,lineHeight:1.6,marginBottom:'1rem'}}>
                    &ldquo;{project.testimonial_quote}&rdquo;
                  </div>
                  {project.testimonial_name && (
                    <div style={{fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:accentColor}}>
                      — {project.testimonial_name}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: sticky sidebar */}
            <div style={{position:'sticky',top:'6rem'}}>
              <div style={{border:`1px solid ${t.border}`,padding:'1.5rem',background:t.surface,marginBottom:'1.5rem'}}>
                <div style={{fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.25em',textTransform:'uppercase',color:t.muted,marginBottom:'1.25rem'}}>About the Studio</div>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{width:'36px',height:'36px',border:`1px solid ${accentColor}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{color:accentColor,fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:300}}>{branding.logo_letter}</span>
                  </div>
                  <div>
                    <div style={{color:t.text,fontSize:'0.85rem',fontWeight:500}}>{branding.business_name}</div>
                    <div style={{color:t.muted,fontSize:'0.7rem',marginTop:'1px'}}>{location.local_city}, {location.state}</div>
                  </div>
                </div>
                <p style={{color:t.muted,fontSize:'0.8rem',lineHeight:1.65,marginBottom:'1.25rem'}}>
                  Premium {CATEGORY_LABEL[project.category]?.toLowerCase() || 'interior'} design studio based in {location.local_city}.
                </p>
                <a
                  href={`${siteRoot}/#consult`}
                  style={{display:'block',textAlign:'center',background:accentColor,color:'#0A0A0A',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',padding:'0.9rem',textDecoration:'none'}}
                >
                  Book a Consultation
                </a>
                <a
                  href={`tel:${contact.phone_number}`}
                  style={{display:'block',textAlign:'center',border:`1px solid ${t.borderAlt}`,color:t.muted,fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.15em',padding:'0.75rem',textDecoration:'none',marginTop:'0.5rem'}}
                >
                  {contact.phone_display}
                </a>
              </div>

              {/* Share */}
              <div style={{border:`1px solid ${t.border}`,padding:'1.5rem',background:t.surface}}>
                <div style={{fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.25em',textTransform:'uppercase',color:t.muted,marginBottom:'1rem'}}>Share This Project</div>
                <div style={{display:'flex',gap:'0.5rem'}}>
                  {[
                    { label:'WhatsApp', href:`https://wa.me/?text=${encodeURIComponent(`${project.title} by ${branding.business_name} — ${typeof window!=='undefined' ? window.location.href : ''}`)}` },
                    { label:'LinkedIn', href:`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window!=='undefined' ? window.location.href : '')}` },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{flex:1,textAlign:'center',border:`1px solid ${t.borderAlt}`,color:t.muted,fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.15em',textTransform:'uppercase',padding:'0.6rem 0.5rem',textDecoration:'none',transition:'border-color 0.2s,color 0.2s'}}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=accentColor; e.currentTarget.style.color=accentColor }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=t.borderAlt; e.currentTarget.style.color=t.muted }}
                    >{s.label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related projects */}
          {related.length > 0 && (
            <div>
              <div style={{height:'1px',background:t.border,marginBottom:'3rem'}} />
              <div style={{fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.3em',textTransform:'uppercase',color:accentColor,marginBottom:'1rem'}}>
                More {CATEGORY_LABEL[project.category] || 'Projects'}
              </div>
              <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(1.5rem,3vw,2.5rem)',fontWeight:300,color:t.text,marginBottom:'2rem'}}>
                Related <em style={{color:accentColor}}>work</em>
              </h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1px',background:'#2A2A2A'}}>
                {related.map(r => (
                  <a
                    key={r.id}
                    href={r.slug ? `${siteRoot}/projects/${r.slug}` : `${siteRoot}/#work`}
                    style={{position:'relative',overflow:'hidden',background:'#141414',aspectRatio:'4/3',display:'block',textDecoration:'none'}}
                  >
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={`${r.title} — ${r.category} by ${branding.business_name}`}
                        style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.75,transition:'transform 0.5s, opacity 0.3s'}}
                        loading="lazy"
                        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'; (e.currentTarget as HTMLImageElement).style.opacity='1' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform='scale(1)'; (e.currentTarget as HTMLImageElement).style.opacity='0.75' }}
                      />
                    ) : (
                      <div style={{width:'100%',height:'100%',background:'#1A1A1A',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{color:'#3A3A3A',fontSize:'0.75rem'}}>No image</span>
                      </div>
                    )}
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(10,10,10,0.9),transparent)',padding:'1.25rem'}}>
                      <div style={{fontSize:'0.55rem',letterSpacing:'0.2em',textTransform:'uppercase',color:accentColor,marginBottom:'0.25rem'}}>{r.category}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:300,color:t.text}}>{r.title}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{textAlign:'center',padding:'4rem 0',borderTop:`1px solid ${t.border}`}}>
            <div style={{fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.3em',textTransform:'uppercase',color:accentColor,marginBottom:'1rem'}}>Start Your Project</div>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:300,color:t.text,marginBottom:'1.5rem'}}>
              Interested in a similar<br/><em style={{color:accentColor}}>space?</em>
            </h2>
            <p style={{color:t.muted,fontSize:'0.9rem',maxWidth:'400px',margin:'0 auto 2rem',lineHeight:1.7}}>
              Book a complimentary consultation with {branding.business_name} to discuss your project in {location.local_city}.
            </p>
            <a href={`${siteRoot}/#consult`} style={{
              display:'inline-flex',alignItems:'center',gap:'0.75rem',
              background:accentColor,color:'#0A0A0A',fontSize:'0.7rem',fontWeight:600,
              letterSpacing:'0.2em',textTransform:'uppercase',padding:'1rem 2.5rem',textDecoration:'none',
            }}>
              Book a Site Consultation
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  )

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footer = (
    <footer style={{borderTop:`1px solid ${t.border}`,padding:'2.5rem 0',background:t.surface}}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 2rem',display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
        <div style={{color:t.muted,fontSize:'0.75rem'}}>
          © {new Date().getFullYear()} {branding.business_name} · {location.local_city}, {location.state}
        </div>
        <div style={{display:'flex',gap:'1.5rem'}}>
          <a href={siteRoot} style={{color:t.muted,textDecoration:'none',fontSize:'0.75rem',transition:'color 0.2s'}}
            onMouseEnter={e => (e.currentTarget.style.color=accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color=t.muted)}>Home</a>
          <a href={`${siteRoot}/#work`} style={{color:t.muted,textDecoration:'none',fontSize:'0.75rem',transition:'color 0.2s'}}
            onMouseEnter={e => (e.currentTarget.style.color=accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color=t.muted)}>Projects</a>
          <a href={`${siteRoot}/#consult`} style={{color:accentColor,textDecoration:'none',fontSize:'0.75rem'}}>Contact</a>
        </div>
      </div>
    </footer>
  )

  return (
    <>
      <AnalyticsTracker tenantId={tenant.id} />
      {nav}
      <main>{hero}{content}</main>
      {footer}
    </>
  )
}
