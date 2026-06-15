'use client'
// src/app/onboarding/page.tsx
// 4-step wizard: Branding → Location → Contact → Stats & Subdomain → LIVE

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingData } from '@/types'
import { slugify, getTenantUrl } from '@/lib/utils'

// ── Step indicators ───────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Branding' },
  { n: 2, label: 'Location' },
  { n: 3, label: 'Contact' },
  { n: 4, label: 'Go Live' },
]

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
]

// ── Input component ───────────────────────────────────────────────────────────
function Field({
  label, hint, children
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#6B6B6B]/60 mt-1.5">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors appearance-none"
    >
      {props.children}
    </select>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
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

  const next = () => { setError(''); setStep(s => Math.min(s + 1, 4)) }
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 1)) }

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
    if (step < 4) { next(); return }
    handleSubmit()
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

    router.push(`/dashboard?welcome=1`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">

      {/* Left panel — progress + preview */}
      <div className="hidden lg:flex flex-col w-80 bg-[#0D0D0D] border-r border-[#1A1A1A] p-10 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-7 h-7 border border-[#C8A96E] flex items-center justify-center">
              <span className="text-[#C8A96E] text-sm font-light" style={{fontFamily:'Georgia,serif'}}>S</span>
            </div>
            <span className="text-xs tracking-[0.2em] uppercase font-light text-[#F5F0E8]">StudioLaunch</span>
          </div>

          <div className="space-y-6">
            {STEPS.map(s => (
              <div key={s.n} className="flex items-center gap-4">
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-medium border transition-all ${
                  step > s.n  ? 'bg-[#C8A96E] border-[#C8A96E] text-[#0A0A0A]' :
                  step === s.n ? 'border-[#C8A96E] text-[#C8A96E]' :
                                  'border-[#2A2A2A] text-[#3A3A3A]'
                }`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-sm transition-colors ${step === s.n ? 'text-[#F5F0E8]' : step > s.n ? 'text-[#6B6B6B]' : 'text-[#3A3A3A]'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live preview box */}
        <div className="border border-[#2A2A2A] p-5">
          <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">Your site URL</div>
          <div className="text-[#C8A96E] text-sm font-mono break-all">
            {data.subdomain
              ? `${data.subdomain}.studiolaunch.in`
              : 'yourstudio.studiolaunch.in'}
          </div>
          {data.business_name && (
            <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
              <div className="text-[#F5F0E8] text-sm font-medium">{data.business_name}</div>
              <div className="text-[#6B6B6B] text-xs mt-1">{data.local_city || '—'}, {data.state}</div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-start justify-center p-6 pt-16 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Mobile progress */}
          <div className="lg:hidden mb-8">
            <div className="flex justify-between text-xs text-[#6B6B6B] mb-2">
              <span>{STEPS[step-1].label}</span>
              <span>Step {step} of {STEPS.length}</span>
            </div>
            <div className="h-0.5 bg-[#1A1A1A]">
              <div className="h-full bg-[#C8A96E] transition-all duration-500" style={{width:`${progress}%`}} />
            </div>
          </div>

          {/* ── STEP 1: Branding ────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">Step 1 of 4</div>
              <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-2">
                Your studio<br/><em>identity</em>
              </h2>
              <p className="text-[#6B6B6B] text-sm mb-10">This appears on your site header, footer, and all SEO metadata.</p>

              <div className="space-y-6">
                <Field label="Studio / Business Name" hint="E.g. Forma Studio, Vignesh Interiors, Studio Aura">
                  <Input
                    value={data.business_name}
                    onChange={e => set('business_name', e.target.value)}
                    placeholder="Forma Studio"
                    required
                  />
                </Field>

                <Field label="Studio Tagline" hint="Shown under your logo — keep it short">
                  <Input
                    value={data.tagline}
                    onChange={e => set('tagline', e.target.value)}
                    placeholder="Architectural Design Studio"
                  />
                </Field>

                <Field label="Logo Letter" hint="Single letter shown in your logo mark">
                  <Input
                    value={data.logo_letter}
                    onChange={e => set('logo_letter', e.target.value.charAt(0).toUpperCase())}
                    placeholder="F"
                    maxLength={1}
                  />
                </Field>

                {/* Logo preview */}
                {data.logo_letter && (
                  <div className="flex items-center gap-4 p-5 bg-[#141414] border border-[#2A2A2A]">
                    <div className="w-10 h-10 border border-[#C8A96E] flex items-center justify-center">
                      <span className="text-[#C8A96E] text-xl font-light" style={{fontFamily:'Georgia,serif'}}>{data.logo_letter}</span>
                    </div>
                    <div>
                      <div className="text-[#F5F0E8] text-sm tracking-widest">{data.business_name || 'Your Studio Name'}</div>
                      <div className="text-[#6B6B6B] text-xs tracking-widest mt-0.5">{data.tagline}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Location ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">Step 2 of 4</div>
              <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-2">
                Studio<br/><em>location</em>
              </h2>
              <p className="text-[#6B6B6B] text-sm mb-10">Used in your Local SEO schema, footer, and location-targeted content.</p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" hint="Primary city you operate in">
                    <Input
                      value={data.local_city}
                      onChange={e => set('local_city', e.target.value)}
                      placeholder="Coimbatore"
                      required
                    />
                  </Field>
                  <Field label="State">
                    <Select value={data.state} onChange={e => set('state', e.target.value)}>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                </div>

                <Field label="Street Address" hint="Shown in footer and Google Business schema">
                  <Input
                    value={data.street_address}
                    onChange={e => set('street_address', e.target.value)}
                    placeholder="14 Race Course Road"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="PIN Code">
                    <Input
                      value={data.pin_code}
                      onChange={e => set('pin_code', e.target.value)}
                      placeholder="641018"
                      maxLength={6}
                    />
                  </Field>
                  <Field label="Service Radius (km)" hint="How far you travel">
                    <Input
                      type="number"
                      value={data.service_radius_km}
                      onChange={e => set('service_radius_km', Number(e.target.value))}
                      placeholder="60"
                      min={5}
                      max={500}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude" hint="Optional — for precise map schema">
                    <Input
                      value={data.geo_latitude}
                      onChange={e => set('geo_latitude', e.target.value)}
                      placeholder="11.0168"
                    />
                  </Field>
                  <Field label="Longitude">
                    <Input
                      value={data.geo_longitude}
                      onChange={e => set('geo_longitude', e.target.value)}
                      placeholder="76.9558"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Contact ──────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">Step 3 of 4</div>
              <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-2">
                Contact<br/><em>details</em>
              </h2>
              <p className="text-[#6B6B6B] text-sm mb-10">These appear on your site and in your local business schema.</p>

              <div className="space-y-6">
                <Field label="Phone Number" hint="10-digit mobile number — we auto-format it">
                  <Input
                    type="tel"
                    value={data.phone_number}
                    onChange={e => set('phone_number', e.target.value)}
                    placeholder="98765 43210"
                    required
                  />
                  {data.phone_display && (
                    <div className="text-[#C8A96E] text-xs mt-1.5">Displays as: {data.phone_display}</div>
                  )}
                </Field>

                <Field label="Studio Email" hint="For lead notifications and site display">
                  <Input
                    type="email"
                    value={data.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="hello@yourstudio.com"
                    required
                  />
                </Field>

                <Field label="Instagram Handle" hint="Without the @ symbol">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] text-sm">@</span>
                    <input
                      value={data.instagram_handle}
                      onChange={e => set('instagram_handle', e.target.value)}
                      placeholder="yourstudio"
                      className="w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] pl-8 pr-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
                    />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 4: Stats + Subdomain ────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-3">Step 4 of 4</div>
              <h2 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8] mb-2">
                Final details &<br/><em>go live</em>
              </h2>
              <p className="text-[#6B6B6B] text-sm mb-10">Your stats appear in the hero section. Choose your permanent subdomain.</p>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Projects Done">
                    <Input
                      type="number"
                      value={data.project_count}
                      onChange={e => set('project_count', Number(e.target.value))}
                      placeholder="120"
                      min={0}
                    />
                  </Field>
                  <Field label="Years Active">
                    <Input
                      type="number"
                      value={data.years_active}
                      onChange={e => set('years_active', Number(e.target.value))}
                      placeholder="9"
                      min={1}
                    />
                  </Field>
                  <Field label="Sq.ft (Lakhs)" hint="E.g. 12 = 12L sq.ft">
                    <Input
                      value={data.sqft_total}
                      onChange={e => set('sqft_total', e.target.value)}
                      placeholder="12"
                    />
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
                      className="flex-1 bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]"
                    />
                    <div className="bg-[#1A1A1A] border border-l-0 border-[#2A2A2A] px-4 py-3 text-xs text-[#6B6B6B] whitespace-nowrap flex items-center">
                      .studiolaunch.in
                    </div>
                  </div>
                  {/* Subdomain status */}
                  {subdomainStatus === 'checking' && (
                    <div className="text-[#6B6B6B] text-xs mt-1.5">Checking availability...</div>
                  )}
                  {subdomainStatus === 'available' && (
                    <div className="text-green-400 text-xs mt-1.5">✓ Available — this subdomain is yours</div>
                  )}
                  {subdomainStatus === 'taken' && (
                    <div className="text-red-400 text-xs mt-1.5">✗ Already taken — try a different name</div>
                  )}
                </Field>

                {/* Preview card */}
                {data.subdomain && subdomainStatus === 'available' && (
                  <div className="border border-[#C8A96E]/30 bg-[#141414] p-5">
                    <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Your site will be live at</div>
                    <div className="text-[#C8A96E] font-mono">{data.subdomain}.studiolaunch.in</div>
                    <div className="text-[#6B6B6B] text-xs mt-3">
                      {data.business_name} · {data.local_city}, {data.state} · {data.phone_display}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-[#1A1A1A]">
            {step > 1 ? (
              <button onClick={back} className="text-xs tracking-widest uppercase text-[#6B6B6B] border border-[#2A2A2A] px-6 py-3 hover:border-[#6B6B6B] transition-colors">
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-8 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? 'Launching...' : step === 4 ? 'Launch My Site' : 'Continue'}
              {!loading && (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
