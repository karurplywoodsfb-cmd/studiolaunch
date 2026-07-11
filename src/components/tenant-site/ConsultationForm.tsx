'use client'
// src/components/tenant-site/ConsultationForm.tsx
import { useState } from 'react'
import type React from 'react'

export default function ConsultationForm({ tenantId, city, accentColor = '#C8A96E' }: { tenantId: string; city: string; accentColor?: string }) {
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    name:'', phone:'', email:'', project_location:'', notes:'',
    property_type:'', scope:'', budget_tier:'',
  })

  const set = (k: string, v: string) => setForm(p => ({...p,[k]:v}))

  const choiceCard = (name: string, value: string, title: string, sub: string) => {
    const selected = form[name as keyof typeof form] === value
    const inputId = `${name}-${value}`
    return (
      <label
        key={value}
        htmlFor={inputId}
        style={{
          border:`1px solid ${selected ? accentColor : '#2A2A2A'}`,
          background: selected ? `${accentColor}10` : 'transparent',
          padding:'1rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'1rem',
          transition:'border-color 0.2s',
        }}
      >
        <input
          type="radio" id={inputId} name={name} value={value} checked={selected}
          onChange={() => set(name, value)} className="ts-sr-only ts-focusable"
        />
        <div aria-hidden="true" style={{width:'18px',height:'18px',border:`1px solid ${selected?accentColor:'#3A3A3A'}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {selected && <div style={{width:'8px',height:'8px',borderRadius:'50%',background:accentColor}} />}
        </div>
        <div>
          <div style={{fontSize:'0.9rem',fontWeight:500,color:'#F5F0E8'}}>{title}</div>
          <div style={{fontSize:'0.72rem',color:'#6B6B6B',marginTop:'0.15rem'}}>{sub}</div>
        </div>
      </label>
    )
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'#1A1A1A', border:'1px solid #2A2A2A', color:'#F5F0E8',
    fontFamily:'Inter,sans-serif', fontSize:'0.9rem', padding:'0.85rem 1rem',
    outline:'none', transition:'border-color 0.2s',
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ tenant_id: tenantId, ...form }),
      })
      if (!res.ok) throw new Error('Request failed')
      setDone(true)
    } catch {
      setError('Something went wrong sending your request. Please try again, or call/WhatsApp us directly.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div style={{textAlign:'center',padding:'3rem 0'}} role="status">
      <div style={{width:'64px',height:'64px',border:`1px solid ${accentColor}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12l7 7L22 5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h3 style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:300,color:'#F5F0E8',marginBottom:'0.75rem'}}>Thank you.</h3>
      <p style={{color:'#6B6B6B',fontSize:'0.9rem',lineHeight:1.7}}>We&apos;ve received your request and will confirm a consultation time within one business day.</p>
    </div>
  )

  const dots = [1,2,3,4].map(n => (
    <div key={n} aria-hidden="true" style={{width:'6px',height:'6px',borderRadius:'50%',background: step===n ? accentColor : step>n ? `${accentColor}66` : '#2A2A2A',transform: step===n ? 'scale(1.4)' : 'none',transition:'all 0.3s'}} />
  ))

  const btnNext = (label: string, action: ()=>void, disabled=false) => (
    <button onClick={action} disabled={disabled} className="ts-focusable" style={{background:accentColor,color:'#0A0A0A',fontFamily:'Inter,sans-serif',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem 1.75rem',border:'none',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>
      {label}
    </button>
  )
  const btnBack = (action: ()=>void) => (
    <button onClick={action} className="ts-focusable" style={{background:'transparent',color:'#6B6B6B',fontFamily:'Inter,sans-serif',fontSize:'0.7rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem 1.5rem',border:'1px solid #2A2A2A',cursor:'pointer'}}>
      Back
    </button>
  )

  return (
    <div>
      <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'2rem'}} aria-hidden="true">
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
              <label htmlFor="cf-name" style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Your Name *</label>
              <input id="cf-name" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Full name" style={inputStyle} required />
            </div>
            <div>
              <label htmlFor="cf-phone" style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Phone Number *</label>
              <input id="cf-phone" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" style={inputStyle} required />
            </div>
            <div>
              <label htmlFor="cf-email" style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Email Address</label>
              <input id="cf-email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="your@email.com" type="email" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="cf-loc" style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Project Area / Location</label>
              <input id="cf-loc" value={form.project_location} onChange={e=>set('project_location',e.target.value)} placeholder={`${city} area, layout, PIN...`} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="cf-notes" style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#6B6B6B',marginBottom:'0.5rem'}}>Anything else?</label>
              <textarea id="cf-notes" value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Timeline, specific rooms, references..." style={{...inputStyle,resize:'vertical'}} />
            </div>
          </div>
          {error && <p role="alert" style={{color:'#E08585',fontSize:'0.8rem',marginTop:'1rem'}}>{error}</p>}
          <div style={{marginTop:'2rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
            {btnBack(() => setStep(3))}
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.phone}
              className="ts-focusable"
              style={{flex:1,background:accentColor,color:'#0A0A0A',fontFamily:'Inter,sans-serif',fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',padding:'0.85rem',border:'none',cursor:'pointer',opacity:(loading||!form.name||!form.phone)?0.5:1}}
            >
              {loading ? 'Submitting...' : 'Request Consultation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
