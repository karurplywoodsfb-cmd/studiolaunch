'use client'
// src/app/onboarding/page.tsx
// Welcome → Persona → Identity → Design System → Location & Contact →
// Brand → Stats & Subdomain → Invite Team → Complete

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingData, Persona, TemplateId } from '@/types'
import { slugify, getTenantUrl } from '@/lib/utils'
import { Logo, LogoMark } from '@/components/brand/Logo'

const TOTAL_STEPS = 9 // 0=Welcome, 1..7=form, 8=Complete
const LAST_FORM_STEP = 7

const PERSONAS: { value: Persona; label: string }[] = [
  { value: 'architect',          label: 'Architect' },
  { value: 'interior_designer',  label: 'Interior Designer' },
  { value: 'design_studio',      label: 'Design Studio' },
  { value: 'other',              label: 'Other' },
]

const TEMPLATES: { value: TemplateId; label: string; tag: string }[] = [
  { value: 'atelier',     label: 'Atelier',     tag: 'Warm · Timeless' },
  { value: 'forma',       label: 'Forma',       tag: 'Clean · Minimal' },
  { value: 'terra',       label: 'Terra',       tag: 'Organic · Textured' },
  { value: 'renaissance', label: 'Renaissance', tag: 'Classic · Elegant' },
  { value: 'gallery',     label: 'Gallery',     tag: 'Bold · Editorial' },
  { value: 'noir',        label: 'Noir',        tag: 'Dark · Refined' },
]

const ACCENT_SWATCHES = [
  { hex: '#B38B59', label: 'Bronze' },
  { hex: '#1A1A1A', label: 'Graphite' },
  { hex: '#A8ADA1', label: 'Sage' },
  { hex: '#8C6D4F', label: 'Terracotta' },
  { hex: '#6B7280', label: 'Slate' },
]

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
]

// ── Shared bits ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-graphite/50 mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-graphite/40 mt-1.5">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-ivory border border-stone text-graphite px-4 py-3 text-sm outline-none focus:border-bronze transition-colors placeholder:text-graphite/30 rounded-md"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full bg-ivory border border-stone text-graphite px-4 py-3 text-sm outline-none focus:border-bronze transition-colors rounded-md"
    >
      {props.children}
    </select>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0) // 0 = Welcome
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [subdomainStatus, setSubdomainStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const [logoUploading, setLogoUploading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [finalSubdomain, setFinalSubdomain] = useState('')

  const [data, setData] = useState<OnboardingData>({
    persona: '',
    business_name: '',
    tagline: 'Architectural Design Studio',
    logo_letter: '',
    logo_url: '',
    accent_color: '#B38B59',
    template_id: 'atelier',
    local_city: '',
    state: 'Tamil Nadu',
    street_address: '',
    pin_code: '',
    geo_latitude: '',
    geo_longitude: '',
    service_radius_km: 60,
    phone_number: '',
    phone_display: '',
    email: '',
    instagram_handle: '',
    project_count: 0,
    years_active: 1,
    sqft_total: '1',
    subdomain: '',
    team_invites: [],
  })

  const set = (key: keyof OnboardingData, value: string | number) =>
    setData(prev => ({ ...prev, [key]: value }))

  // Auto-derive logo letter and subdomain from business name
  useEffect(() => {
    if (data.business_name) {
      set('logo_letter', data.business_name.charAt(0).toUpperCase())
      const suggested = slugify(data.business_name)
      if (!data.subdomain || data.subdomain === slugify(data.business_name.slice(0, -1))) {
        set('subdomain', suggested)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.business_name])

  // Auto-format phone display
  useEffect(() => {
    const digits = data.phone_number.replace(/\D/g, '')
    if (digits.length === 10) {
      set('phone_display', `+91 ${digits.slice(0,5)} ${digits.slice(5)}`)
    } else if (digits.length === 12 && digits.startsWith('91')) {
      set('phone_display', `+91 ${digits.slice(2,7)} ${digits.slice(7)}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.phone_number])

  const checkSubdomain = async (value: string) => {
    if (!value || value.length < 3) return
    setSubdomainStatus('checking')
    const res  = await fetch(`/api/tenants/check-subdomain?subdomain=${value}`)
    const json = await res.json()
    setSubdomainStatus(json.available ? 'available' : 'taken')
  }

  const uploadLogo = async (file: File) => {
    setLogoUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'logo')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Logo upload failed'); return }
      set('logo_url', json.url)
    } catch {
      setError('Logo upload failed. Please try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  const addInvite = () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return }
    if (data.team_invites.some(i => i.email === email)) { setError('Already added'); return }
    setError('')
    setData(prev => ({ ...prev, team_invites: [...prev.team_invites, { email, role: 'editor' }] }))
    setInviteEmail('')
  }

  const removeInvite = (email: string) =>
    setData(prev => ({ ...prev, team_invites: prev.team_invites.filter(i => i.email !== email) }))

  const next = () => { setError(''); setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)) }
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const validateStep = (): boolean => {
    if (step === 1 && !data.persona) { setError('Choose the option that best describes you'); return false }
    if (step === 2 && !data.business_name.trim()) { setError('Studio name is required'); return false }
    if (step === 4) {
      if (!data.local_city.trim())    { setError('City is required'); return false }
      if (!data.street_address.trim()){ setError('Address is required'); return false }
      if (!data.phone_number.trim())  { setError('Phone number is required'); return false }
      if (!data.email.trim())         { setError('Email is required'); return false }
    }
    if (step === 6) {
      if (!data.subdomain.trim())      { setError('Subdomain is required'); return false }
      if (subdomainStatus === 'taken') { setError('That subdomain is taken'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    if (step === LAST_FORM_STEP) { handleSubmit(); return }
    next()
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      return
    }

    const { team_invites, ...tenantPayload } = data

    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tenantPayload, user_id: user.id }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // Fire team invites now that the tenant exists (best-effort — failures
    // here shouldn't block the user from reaching their new dashboard)
    for (const invite of team_invites) {
      try {
        await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: invite.email, role: invite.role }),
        })
      } catch {
        // non-fatal — they can re-invite from the dashboard
      }
    }

    setFinalSubdomain(data.subdomain)
    setLoading(false)
    next() // advance to Complete screen
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const progress = (step / LAST_FORM_STEP) * 100

  return (
    <div className="min-h-screen bg-ivory flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <div className="border-b border-stone/60 px-6 h-16 flex items-center justify-between">
        <Logo size={24} />
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div className="text-xs tracking-widest uppercase text-graphite/40">
            Step {step} of {LAST_FORM_STEP}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="h-0.5 bg-stone/50">
          <div className="h-full bg-bronze transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg bg-white border border-stone/60 rounded-2xl shadow-sm p-10">

          {/* ── STEP 0: Welcome ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <LogoMark size={44} />
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-3xl font-light text-graphite mb-3">
                Welcome to MaSpace
              </h2>
              <p className="text-graphite/55 text-sm mb-10 max-w-sm mx-auto">
                The design operating system for architects &amp; interior designers. A few simple steps to get your studio site live.
              </p>
              <button
                onClick={next}
                className="bg-graphite text-ivory text-sm font-medium px-8 py-3.5 hover:bg-graphite/85 transition-colors inline-flex items-center gap-2 rounded-md"
              >
                Get Started
                <ArrowIcon />
              </button>
            </div>
          )}

          {/* ── STEP 1: Persona ─────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <StepHeader n={1} title="What best describes you?" hint="This helps us personalize your experience." />
              <div className="space-y-3">
                {PERSONAS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => set('persona', p.value)}
                    className={`w-full text-left px-5 py-4 border rounded-md transition-colors ${
                      data.persona === p.value ? 'border-bronze bg-bronze/5' : 'border-stone hover:border-graphite/30'
                    }`}
                  >
                    <span className="text-sm text-graphite">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Studio Identity ─────────────────────────────────── */}
          {step === 2 && (
            <div>
              <StepHeader n={2} title="Your studio identity" hint="This appears on your site header, footer, and all SEO metadata." />
              <div className="space-y-5">
                <Field label="Studio / Business Name" hint="E.g. Forma Studio, Vignesh Interiors, Studio Aura">
                  <Input value={data.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Forma Studio" required />
                </Field>
                <Field label="Studio Tagline" hint="Shown under your logo — keep it short">
                  <Input value={data.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Architectural Design Studio" />
                </Field>
                {data.business_name && (
                  <div className="flex items-center gap-4 p-4 bg-ivory border border-stone rounded-md">
                    <div className="w-10 h-10 border border-bronze rounded-md flex items-center justify-center">
                      <span className="text-bronze text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{data.logo_letter}</span>
                    </div>
                    <div>
                      <div className="text-graphite text-sm tracking-wide">{data.business_name}</div>
                      <div className="text-graphite/45 text-xs mt-0.5">{data.tagline}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Design System ────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <StepHeader n={3} title="Choose your design system" hint="You can change this anytime from your dashboard." />
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => set('template_id', t.value)}
                    className={`text-left border rounded-md overflow-hidden transition-colors ${
                      data.template_id === t.value ? 'border-bronze' : 'border-stone hover:border-graphite/30'
                    }`}
                  >
                    <div className={`aspect-[4/3] flex items-center justify-center ${t.value === 'noir' ? 'bg-graphite' : 'bg-stone/40'}`}>
                      <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className={`text-lg ${t.value === 'noir' ? 'text-ivory' : 'text-graphite/70'}`}>
                        {t.label}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-medium text-graphite flex items-center justify-between">
                        {t.label}
                        {data.template_id === t.value && <CheckIcon />}
                      </div>
                      <div className="text-[11px] text-graphite/45">{t.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-graphite/40 mt-4">
                Your subdomain site currently renders on one shared layout — full per-template visual rendering for all six systems is on our roadmap. Your choice is saved now so it&apos;s ready the moment it ships.
              </p>
            </div>
          )}

          {/* ── STEP 4: Location & Contact ───────────────────────────────── */}
          {step === 4 && (
            <div>
              <StepHeader n={4} title="Location & contact" hint="Used in your Local SEO schema, footer, and lead notifications." />
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City">
                    <Input value={data.local_city} onChange={e => set('local_city', e.target.value)} placeholder="Coimbatore" required />
                  </Field>
                  <Field label="State">
                    <Select value={data.state} onChange={e => set('state', e.target.value)}>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label="Street Address">
                  <Input value={data.street_address} onChange={e => set('street_address', e.target.value)} placeholder="14 Race Course Road" required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="PIN Code">
                    <Input value={data.pin_code} onChange={e => set('pin_code', e.target.value)} placeholder="641018" maxLength={6} />
                  </Field>
                  <Field label="Service Radius (km)">
                    <Input type="number" value={data.service_radius_km} onChange={e => set('service_radius_km', Number(e.target.value))} min={5} max={500} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone Number" hint="Auto-formats as you type">
                    <Input type="tel" value={data.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="98765 43210" required />
                  </Field>
                  <Field label="Studio Email">
                    <Input type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="hello@yourstudio.com" required />
                  </Field>
                </div>
                {data.phone_display && <div className="text-bronze text-xs -mt-3">Displays as: {data.phone_display}</div>}
                <Field label="Instagram Handle" hint="Without the @ symbol">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite/40 text-sm">@</span>
                    <input
                      value={data.instagram_handle}
                      onChange={e => set('instagram_handle', e.target.value)}
                      placeholder="yourstudio"
                      className="w-full bg-ivory border border-stone text-graphite pl-8 pr-4 py-3 text-sm outline-none focus:border-bronze transition-colors placeholder:text-graphite/30 rounded-md"
                    />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 5: Brand ────────────────────────────────────────────── */}
          {step === 5 && (
            <div>
              <StepHeader n={5} title="Add your brand" hint="Upload your logo and choose your accent color." />
              <div className="space-y-6">
                <Field label="Logo (optional)" hint="PNG, JPG or WebP · up to 10MB">
                  <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-stone rounded-md py-8 cursor-pointer hover:border-bronze/60 transition-colors">
                    {data.logo_url ? (
                      <img src={data.logo_url} alt="Uploaded logo" className="w-16 h-16 object-contain" />
                    ) : (
                      <UploadIcon />
                    )}
                    <span className="text-xs text-graphite/50">
                      {logoUploading ? 'Uploading...' : data.logo_url ? 'Replace logo' : 'Upload your logo'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
                    />
                  </label>
                </Field>

                <Field label="Brand Accent Color">
                  <div className="flex flex-wrap gap-3">
                    {ACCENT_SWATCHES.map(s => (
                      <button
                        key={s.hex}
                        onClick={() => set('accent_color', s.hex)}
                        title={s.label}
                        className={`w-10 h-10 rounded-full border-2 transition-transform ${data.accent_color === s.hex ? 'border-graphite scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: s.hex }}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 6: Stats + Subdomain ────────────────────────────────── */}
          {step === 6 && (
            <div>
              <StepHeader n={6} title="Final details & go live" hint="Your stats appear in the hero section. Choose your permanent subdomain." />
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Projects Done">
                    <Input type="number" value={data.project_count} onChange={e => set('project_count', Number(e.target.value))} min={0} />
                  </Field>
                  <Field label="Years Active">
                    <Input type="number" value={data.years_active} onChange={e => set('years_active', Number(e.target.value))} min={1} />
                  </Field>
                  <Field label="Sq.ft (Lakhs)">
                    <Input value={data.sqft_total} onChange={e => set('sqft_total', e.target.value)} placeholder="12" />
                  </Field>
                </div>

                <Field label="Choose Your Subdomain" hint="3–30 characters, lowercase letters, numbers, hyphens only">
                  <div className="flex">
                    <input
                      value={data.subdomain}
                      onChange={e => {
                        const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')
                        set('subdomain', v)
                        setSubdomainStatus('idle')
                      }}
                      onBlur={() => checkSubdomain(data.subdomain)}
                      placeholder="yourstudio"
                      className="flex-1 bg-ivory border border-stone text-graphite px-4 py-3 text-sm outline-none focus:border-bronze transition-colors placeholder:text-graphite/30 rounded-l-md"
                    />
                    <div className="bg-stone/50 border border-l-0 border-stone px-4 py-3 text-xs text-graphite/50 whitespace-nowrap flex items-center rounded-r-md">
                      .maspace.in
                    </div>
                  </div>
                  {subdomainStatus === 'checking' && <div className="text-graphite/45 text-xs mt-1.5">Checking availability...</div>}
                  {subdomainStatus === 'available' && <div className="text-green-700 text-xs mt-1.5">✓ Available — this subdomain is yours</div>}
                  {subdomainStatus === 'taken' && <div className="text-red-600 text-xs mt-1.5">✗ Already taken — try a different name</div>}
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 7: Invite Team ──────────────────────────────────────── */}
          {step === 7 && (
            <div>
              <StepHeader n={7} title="Invite your team" hint="Optional — you can always invite more people later from the dashboard." />
              <div className="space-y-5">
                <Field label="Email Address">
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInvite() } }}
                      placeholder="name@domain.com"
                      className="flex-1 bg-ivory border border-stone text-graphite px-4 py-3 text-sm outline-none focus:border-bronze transition-colors placeholder:text-graphite/30 rounded-md"
                    />
                    <button onClick={addInvite} className="border border-graphite/25 text-graphite text-sm px-5 rounded-md hover:border-graphite/50 transition-colors whitespace-nowrap">
                      + Add
                    </button>
                  </div>
                </Field>

                {data.team_invites.length > 0 && (
                  <div>
                    <div className="text-xs tracking-widest uppercase text-graphite/50 mb-2">Invited Members</div>
                    <div className="space-y-2">
                      {data.team_invites.map(inv => (
                        <div key={inv.email} className="flex items-center justify-between border border-stone rounded-md px-4 py-3">
                          <div>
                            <div className="text-sm text-graphite">{inv.email}</div>
                            <div className="text-xs text-graphite/45">Editor</div>
                          </div>
                          <button onClick={() => removeInvite(inv.email)} className="text-graphite/40 hover:text-red-600 text-xs">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 8: Complete ─────────────────────────────────────────── */}
          {step === 8 && (
            <div className="text-center">
              <div className="w-14 h-14 border border-bronze rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6L20 6" stroke="#B38B59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-3xl font-light text-graphite mb-3">
                You&apos;re all set!
              </h2>
              <p className="text-graphite/55 text-sm mb-8 max-w-sm mx-auto">
                Your studio site is ready. Let&apos;s build something amazing.
              </p>
              {finalSubdomain && (
                <div className="text-bronze font-mono text-sm mb-8">{getTenantUrl(finalSubdomain)}</div>
              )}
              <button
                onClick={() => router.push('/dashboard?welcome=1')}
                className="bg-graphite text-ivory text-sm font-medium px-8 py-3.5 hover:bg-graphite/85 transition-colors inline-flex items-center gap-2 rounded-md"
              >
                Go to Dashboard
                <ArrowIcon />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 text-red-600 text-xs border border-red-200 bg-red-50 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Navigation */}
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone/60">
              {step > 1 ? (
                <button onClick={back} className="text-xs tracking-widest uppercase text-graphite/50 border border-stone px-6 py-3 hover:border-graphite/40 transition-colors rounded-md">
                  Back
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                {step === 7 && data.team_invites.length === 0 && (
                  <button onClick={handleNext} disabled={loading} className="text-xs tracking-widest uppercase text-graphite/45 hover:text-graphite px-4 py-3 transition-colors">
                    Skip
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={loading || logoUploading}
                  className="bg-graphite text-ivory text-xs font-semibold tracking-widest uppercase px-8 py-3 hover:bg-graphite/85 transition-colors disabled:opacity-50 flex items-center gap-3 rounded-md"
                >
                  {loading ? 'Launching...' : step === LAST_FORM_STEP ? 'Launch My Site' : 'Continue'}
                  {!loading && <ArrowIcon small />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Small shared pieces ──────────────────────────────────────────────────────
function StepHeader({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <>
      <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-3">Step {n} of {LAST_FORM_STEP}</div>
      <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-2xl font-light text-graphite mb-2">{title}</h2>
      <p className="text-graphite/50 text-sm mb-8">{hint}</p>
    </>
  )
}

function ArrowIcon({ small = false }: { small?: boolean }) {
  const s = small ? 12 : 14
  return (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
      <path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="7" fill="#B38B59" />
      <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="#B38B59" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
