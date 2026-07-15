'use client'
// src/app/onboarding/page.tsx
// Card-based wizard: Welcome → Identity → Location → Contact → Stats & Subdomain → Complete

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingData } from '@/types'
import { slugify, getTenantUrl } from '@/lib/utils'

const TOTAL_STEPS = 6 // 0=Welcome, 1..4=form, 5=Complete

const STEP_LABELS = [
  'Welcome',
  'Studio Identity',
  'Location',
  'Contact',
  'Stats & Subdomain',
  'Complete',
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
function MaSpaceMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M2 2h13v13" stroke="#1A1A1A" strokeWidth="1.3" />
        <path d="M22 22H9V9" stroke="#B38B59" strokeWidth="1.3" />
      </svg>
      <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-lg tracking-wide text-graphite">
        MaSpace
      </span>
    </div>
  )
}

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

  const [data, setData] = useState<OnboardingData>({
    business_name: '',
    tagline: 'Architectural Design Studio',
    logo_letter: '',
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

  // Check subdomain availability
  const checkSubdomain = async (value: string) => {
    if (!value || value.length < 3) return
    setSubdomainStatus('checking')
    const res  = await fetch(`/api/tenants/check-subdomain?subdomain=${value}`)
    const json = await res.json()
    setSubdomainStatus(json.available ? 'available' : 'taken')
  }

  const next = () => { setError(''); setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)) }
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!data.business_name.trim()) { setError('Business name is required'); return false }
    }
    if (step === 2) {
      if (!data.local_city.trim())    { setError('City is required'); return false }
      if (!data.street_address.trim()){ setError('Address is required'); return false }
    }
    if (step === 3) {
      if (!data.phone_number.trim())  { setError('Phone number is required'); return false }
      if (!data.email.trim())         { setError('Email is required'); return false }
    }
    if (step === 4) {
      if (!data.subdomain.trim())     { setError('Subdomain is required'); return false }
      if (subdomainStatus === 'taken') { setError('That subdomain is taken'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    if (step === 4) { handleSubmit(); return }
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

    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user_id: user.id }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    next() // advance to Complete screen
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const progress = (step / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="min-h-screen bg-ivory flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <div className="border-b border-stone/60 px-6 h-16 flex items-center justify-between">
        <MaSpaceMark />
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div className="text-xs tracking-widest uppercase text-graphite/40">
            Step {step} of {TOTAL_STEPS - 2}
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
              <div className="w-14 h-14 border border-bronze rounded-md flex items-center justify-center mx-auto mb-6">
                <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-bronze text-2xl font-light">M</span>
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
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}

          {/* ── STEP 1: Identity ─────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-3">Step 1 of 4</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-2xl font-light text-graphite mb-2">
                Your studio identity
              </h2>
              <p className="text-graphite/50 text-sm mb-8">This appears on your site header, footer, and all SEO metadata.</p>

              <div className="space-y-5">
                <Field label="Studio / Business Name" hint="E.g. Forma Studio, Vignesh Interiors, Studio Aura">
                  <Input value={data.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Forma Studio" required />
                </Field>

                <Field label="Studio Tagline" hint="Shown under your logo — keep it short">
                  <Input value={data.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Architectural Design Studio" />
                </Field>

                <Field label="Logo Letter" hint="Single letter shown in your logo mark">
                  <Input value={data.logo_letter} onChange={e => set('logo_letter', e.target.value.charAt(0).toUpperCase())} placeholder="F" maxLength={1} />
                </Field>

                {data.logo_letter && (
                  <div className="flex items-center gap-4 p-4 bg-ivory border border-stone rounded-md">
                    <div className="w-10 h-10 border border-bronze rounded-md flex items-center justify-center">
                      <span className="text-bronze text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{data.logo_letter}</span>
                    </div>
                    <div>
                      <div className="text-graphite text-sm tracking-wide">{data.business_name || 'Your Studio Name'}</div>
                      <div className="text-graphite/45 text-xs mt-0.5">{data.tagline}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Location ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-3">Step 2 of 4</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-2xl font-light text-graphite mb-2">
                Studio location
              </h2>
              <p className="text-graphite/50 text-sm mb-8">Used in your Local SEO schema, footer, and location-targeted content.</p>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" hint="Primary city you operate in">
                    <Input value={data.local_city} onChange={e => set('local_city', e.target.value)} placeholder="Coimbatore" required />
                  </Field>
                  <Field label="State">
                    <Select value={data.state} onChange={e => set('state', e.target.value)}>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                </div>

                <Field label="Street Address" hint="Shown in footer and Google Business schema">
                  <Input value={data.street_address} onChange={e => set('street_address', e.target.value)} placeholder="14 Race Course Road" required />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="PIN Code">
                    <Input value={data.pin_code} onChange={e => set('pin_code', e.target.value)} placeholder="641018" maxLength={6} />
                  </Field>
                  <Field label="Service Radius (km)" hint="How far you travel">
                    <Input type="number" value={data.service_radius_km} onChange={e => set('service_radius_km', Number(e.target.value))} placeholder="60" min={5} max={500} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude" hint="Optional — for precise map schema">
                    <Input value={data.geo_latitude} onChange={e => set('geo_latitude', e.target.value)} placeholder="11.0168" />
                  </Field>
                  <Field label="Longitude">
                    <Input value={data.geo_longitude} onChange={e => set('geo_longitude', e.target.value)} placeholder="76.9558" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Contact ──────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-3">Step 3 of 4</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-2xl font-light text-graphite mb-2">
                Contact details
              </h2>
              <p className="text-graphite/50 text-sm mb-8">These appear on your site and in your local business schema.</p>

              <div className="space-y-5">
                <Field label="Phone Number" hint="10-digit mobile number — we auto-format it">
                  <Input type="tel" value={data.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="98765 43210" required />
                  {data.phone_display && <div className="text-bronze text-xs mt-1.5">Displays as: {data.phone_display}</div>}
                </Field>

                <Field label="Studio Email" hint="For lead notifications and site display">
                  <Input type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="hello@yourstudio.com" required />
                </Field>

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

          {/* ── STEP 4: Stats + Subdomain ────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-3">Step 4 of 4</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-2xl font-light text-graphite mb-2">
                Final details &amp; go live
              </h2>
              <p className="text-graphite/50 text-sm mb-8">Your stats appear in the hero section. Choose your permanent subdomain.</p>

              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Projects Done">
                    <Input type="number" value={data.project_count} onChange={e => set('project_count', Number(e.target.value))} placeholder="120" min={0} />
                  </Field>
                  <Field label="Years Active">
                    <Input type="number" value={data.years_active} onChange={e => set('years_active', Number(e.target.value))} placeholder="9" min={1} />
                  </Field>
                  <Field label="Sq.ft (Lakhs)" hint="E.g. 12 = 12L sq.ft">
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

                {data.subdomain && subdomainStatus === 'available' && (
                  <div className="border border-bronze/40 bg-ivory p-5 rounded-md">
                    <div className="text-xs tracking-widest uppercase text-graphite/45 mb-3">Your site will be live at</div>
                    <div className="text-bronze font-mono text-sm">{data.subdomain}.maspace.in</div>
                    <div className="text-graphite/45 text-xs mt-3">
                      {data.business_name} · {data.local_city}, {data.state} · {data.phone_display}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: Complete ─────────────────────────────────────────── */}
          {step === 5 && (
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
              {data.subdomain && (
                <div className="text-bronze font-mono text-sm mb-8">{getTenantUrl(data.subdomain)}</div>
              )}
              <button
                onClick={() => router.push('/dashboard?welcome=1')}
                className="bg-graphite text-ivory text-sm font-medium px-8 py-3.5 hover:bg-graphite/85 transition-colors inline-flex items-center gap-2 rounded-md"
              >
                Go to Dashboard
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

              <button
                onClick={handleNext}
                disabled={loading}
                className="bg-graphite text-ivory text-xs font-semibold tracking-widest uppercase px-8 py-3 hover:bg-graphite/85 transition-colors disabled:opacity-50 flex items-center gap-3 rounded-md"
              >
                {loading ? 'Launching...' : step === 4 ? 'Launch My Site' : 'Continue'}
                {!loading && (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
