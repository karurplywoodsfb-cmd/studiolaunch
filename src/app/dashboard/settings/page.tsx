'use client'
// src/app/dashboard/settings/page.tsx

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tenant } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'

type Tab = 'content' | 'contact' | 'seo' | 'domain' | 'whitelabel' | 'billing'

const TABS: { value: Tab; label: string; description: string }[] = [
  { value: 'content',    label: 'Site Content',     description: 'Your homepage headline, hero image, and the stats that build trust at a glance.' },
  { value: 'contact',    label: 'Contact & Branding', description: 'Business identity, colors, template, and how visitors reach you.' },
  { value: 'seo',        label: 'SEO Enrichment',    description: 'AI-generated meta description and FAQ content to help you rank locally.' },
  { value: 'domain',     label: 'Custom Domain',     description: 'Connect your own domain (e.g. www.yourstudio.com) instead of the default subdomain.' },
  { value: 'whitelabel', label: 'White Label',       description: 'Remove StudioLaunch branding from your public site footer.' },
  { value: 'billing',    label: 'Plan & Billing',    description: 'Your current plan, usage limits, and upgrade options.' },
]

const inputCls = 'w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]'
const labelCls = 'block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2'

function DomainVerificationPanel({
  tenant,
  onUpdate,
}: {
  tenant: Tenant
  onUpdate: (t: Tenant) => void
}) {
  const [domainInput, setDomainInput] = useState(tenant.custom_domain || '')
  const [saving, setSaving]           = useState(false)
  const [verifying, setVerifying]     = useState(false)
  const [message, setMessage]         = useState<{ text: string; ok: boolean } | null>(null)

  const claimDomain = async () => {
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/tenants/domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domainInput }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setMessage({ text: json.error, ok: false }); return }
    onUpdate({ ...tenant, ...json.data })
    setMessage({ text: 'Domain saved. Add the TXT record below, then verify.', ok: true })
  }

  const verifyDomain = async () => {
    setVerifying(true)
    setMessage(null)
    const res = await fetch('/api/tenants/domain')
    const json = await res.json()
    setVerifying(false)
    if (json.verified) {
      onUpdate({ ...tenant, domain_verified: true })
      setMessage({ text: 'Domain verified! Your site is now live on this domain.', ok: true })
    } else {
      setMessage({ text: json.error || 'Not verified yet.', ok: false })
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-[#6B6B6B] text-sm leading-relaxed">
        Connect your own domain in two steps: save it, then prove ownership with a DNS TXT record
        before it goes live.
      </p>

      <div>
        <label className={labelCls}>Your Domain</label>
        <div className="flex gap-3">
          <input
            value={domainInput}
            onChange={e => setDomainInput(e.target.value)}
            className={inputCls}
            placeholder="www.yourstudio.com"
          />
          <button
            onClick={claimDomain}
            disabled={saving || !domainInput.trim()}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {tenant.custom_domain && (
        <>
          <div className="bg-[#141414] border border-[#2A2A2A] p-4 text-xs space-y-3">
            <div className="text-[#C8A96E] font-medium tracking-widest uppercase">Step 1 — Point your domain</div>
            <div className="text-[#6B6B6B] space-y-1">
              <div>Type: <span className="font-mono text-[#F5F0E8]/70">CNAME</span></div>
              <div>Name: <span className="font-mono text-[#F5F0E8]/70">www</span></div>
              <div>Value: <span className="font-mono text-[#C8A96E]">cname.studiolaunch.in</span></div>
            </div>

            <div className="text-[#C8A96E] font-medium tracking-widest uppercase pt-2">Step 2 — Verify ownership</div>
            <div className="text-[#6B6B6B] space-y-1">
              <div>Type: <span className="font-mono text-[#F5F0E8]/70">TXT</span></div>
              <div>Name: <span className="font-mono text-[#F5F0E8]/70">_studiolaunch-verify.{tenant.custom_domain}</span></div>
              <div>Value: <span className="font-mono text-[#C8A96E] break-all">{tenant.domain_verification_token}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={verifyDomain}
              disabled={verifying || tenant.domain_verified}
              className="border border-[#2A2A2A] text-[#F5F0E8] text-xs font-medium tracking-widest uppercase px-6 py-3 hover:border-[#C8A96E]/50 disabled:opacity-40 transition-colors"
            >
              {tenant.domain_verified ? 'Verified ✓' : verifying ? 'Checking DNS…' : 'Verify Domain'}
            </button>
            {tenant.domain_verified && (
              <span className="text-xs text-green-400">Live at {tenant.custom_domain}</span>
            )}
          </div>
        </>
      )}

      {message && (
        <p className={`text-xs ${message.ok ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>
      )}
    </div>
  )
}

function SettingsInner() {
  const searchParams   = useSearchParams()
  const [tab, setTab]  = useState<Tab>((searchParams.get('tab') as Tab) || 'content')
  const [tenant, setTenant]   = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoResult, setSeoResult]   = useState('')

  useEffect(() => {
    const fetchTenant = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('tenants').select('*').eq('user_id', user.id).single()
      setTenant(data as Tenant)
      setLoading(false)
    }
    fetchTenant()
  }, [])

  const update = (section: keyof Tenant, key: string, value: unknown) => {
    setTenant(prev => {
      if (!prev) return prev
      const sectionData = prev[section] as unknown as Record<string, unknown>
      return { ...prev, [section]: { ...sectionData, [key]: value } }
    })
  }

  const handleSave = async () => {
    if (!tenant) return
    setSaving(true); setSaved(false)
    const supabase = createClient()
    await supabase.from('tenants').update({
      branding: tenant.branding, contact: tenant.contact,
      location: tenant.location, stats:    tenant.stats,
      content:  tenant.content,  custom_domain: tenant.custom_domain,
      white_label: tenant.white_label,
      custom_footer_text: tenant.custom_footer_text,
    }).eq('id', tenant.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const runSeoEnrichment = async () => {
    setSeoLoading(true); setSeoResult('')
    const res  = await fetch('/api/studio/seo-enrich', { method: 'POST' })
    const json = await res.json()
    setSeoResult(res.ok
      ? '✓ SEO enrichment complete — FAQs and meta description updated.'
      : `Error: ${json.error}`)
    if (res.ok) setTenant(prev => prev ? { ...prev, seo_enriched: true } : prev)
    setSeoLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-[#6B6B6B] text-sm">Loading settings...</div>
  if (!tenant) return null

  const showSave = tab === 'content' || tab === 'contact' || tab === 'domain' || tab === 'whitelabel'

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Settings</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-3xl font-light text-[#F5F0E8]">
          Studio <em>Configuration</em>
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left settings nav */}
        <aside className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`text-left text-sm px-3 py-2.5 rounded-xl whitespace-nowrap transition-colors ${
                  tab === t.value ? 'bg-[#C8A96E]/10 text-[#C8A96E]' : 'text-[#6B6B6B] hover:text-[#F5F0E8] hover:bg-[#1A1A1A]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 pb-6 border-b border-[#1A1A1A]">
            <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-lg">
              {TABS.find(t => t.value === tab)?.description}
            </p>
          </div>

      {/* ── TAB: Site Content ── */}
      {tab === 'content' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
          <div>
            <label className={labelCls}>Hero Headline Line 1</label>
            <input value={tenant.content.hero_headline_line1} onChange={e => update('content','hero_headline_line1',e.target.value)} className={inputCls} placeholder="Space" />
          </div>
          <div>
            <label className={labelCls}>Hero Headline Line 2</label>
            <input value={tenant.content.hero_headline_line2} onChange={e => update('content','hero_headline_line2',e.target.value)} className={inputCls} placeholder="designed" />
          </div>
          <div>
            <label className={labelCls}>Hero Headline Line 3 (italic, gold accent)</label>
            <input value={tenant.content.hero_headline_line3} onChange={e => update('content','hero_headline_line3',e.target.value)} className={inputCls} placeholder="with precision" />
          </div>
          <div>
            <label className={labelCls}>Hero Subtext</label>
            <textarea value={tenant.content.hero_subtext} onChange={e => update('content','hero_subtext',e.target.value)} className={inputCls + ' resize-y'} rows={3} />
          </div>
          <ImageUploader
            value={tenant.content.hero_image_url} onChange={url => update('content','hero_image_url',url)}
            folder="hero" label="Hero Background Image" aspectHint="3:2 or wider · Min 2400px · High quality architectural photo"
          />
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1A1A1A]">
            {([['project_count','Projects Count','number'],['years_active','Years Active','number'],['sqft_total','Sq.ft Total (Lakhs)','text'],['city_radius','Service Radius (km)','number']] as const).map(([key,lbl,type]) => (
              <div key={key}>
                <label className={labelCls}>{lbl}</label>
                <input type={type} value={String(tenant.stats[key as keyof typeof tenant.stats])} onChange={e => update('stats', key, type === 'number' ? Number(e.target.value) : e.target.value)} className={inputCls} />
              </div>
            ))}
          </div>
          </div>

          {/* Live preview */}
          <div className="lg:sticky lg:top-6 self-start">
            <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Live Preview</div>
            <div className="rounded-2xl overflow-hidden border border-[#1A1A1A]" style={{ background: '#0A0A0A', aspectRatio: '4/5' }}>
              <div className="relative w-full h-full flex flex-col justify-end p-6" style={{
                backgroundImage: tenant.content.hero_image_url ? `linear-gradient(to top, rgba(10,10,10,0.95), rgba(10,10,10,0.3)), url(${tenant.content.hero_image_url})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}>
                <div className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: tenant.branding.accent_color }}>
                  {tenant.location.local_city}&apos;s Design Studio
                </div>
                <h3 className="leading-tight mb-2" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.6rem', fontWeight: 300, color: '#F5F0E8' }}>
                  {tenant.content.hero_headline_line1} {tenant.content.hero_headline_line2}{' '}
                  <em style={{ color: tenant.branding.accent_color, fontStyle: 'italic' }}>{tenant.content.hero_headline_line3}</em>
                </h3>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'rgba(245,240,232,0.7)' }}>{tenant.content.hero_subtext}</p>
                <div className="flex gap-4 mt-4 pt-4 text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,232,0.5)' }}>
                  <span>{tenant.stats.project_count}+ Projects</span>
                  <span>{tenant.stats.years_active}yr Experience</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#3A3A3A] mt-2">Approximate — actual layout varies by template (Noir/Ivory) and screen size.</p>
          </div>
        </div>
      )}

      {/* ── TAB: Contact & Branding ── */}
      {tab === 'contact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div><label className={labelCls}>Business Name</label><input value={tenant.branding.business_name} onChange={e => update('branding','business_name',e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Tagline</label><input value={tenant.branding.tagline} onChange={e => update('branding','tagline',e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Logo Letter</label><input value={tenant.branding.logo_letter} maxLength={1} onChange={e => update('branding','logo_letter',e.target.value.charAt(0).toUpperCase())} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Accent Color</label>
              <div className="flex gap-2">
                <input type="color" value={tenant.branding.accent_color} onChange={e => update('branding','accent_color',e.target.value)} className="w-12 h-12 bg-transparent border border-[#2A2A2A] cursor-pointer p-1" />
                <input value={tenant.branding.accent_color} onChange={e => update('branding','accent_color',e.target.value)} className={inputCls + ' flex-1'} placeholder="#C8A96E" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Site Template</label>
              <select value={tenant.branding.theme || 'noir'} onChange={e => update('branding','theme', e.target.value)} className={inputCls}>
                <option value="noir">Noir — full-bleed dark editorial</option>
                <option value="ivory">Ivory — light, split-hero minimal</option>
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-[#1A1A1A] grid grid-cols-2 gap-5">
            <div><label className={labelCls}>Phone Number</label><input value={tenant.contact.phone_number} onChange={e => update('contact','phone_number',e.target.value)} className={inputCls} type="tel" /></div>
            <div><label className={labelCls}>Phone Display</label><input value={tenant.contact.phone_display} onChange={e => update('contact','phone_display',e.target.value)} className={inputCls} placeholder="+91 98765 43210" /></div>
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input value={tenant.contact.whatsapp_number || ''} onChange={e => update('contact','whatsapp_number',e.target.value)} className={inputCls} type="tel" placeholder="919876543210 (defaults to phone number)" />
            </div>
            <div><label className={labelCls}>Email</label><input value={tenant.contact.email} onChange={e => update('contact','email',e.target.value)} className={inputCls} type="email" /></div>
            <div>
              <label className={labelCls}>Instagram Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] text-sm">@</span>
                <input value={tenant.contact.instagram_handle} onChange={e => update('contact','instagram_handle',e.target.value)} className={inputCls + ' pl-8'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SEO Enrichment ── */}
      {tab === 'seo' && (
        <div className="space-y-6">
          <div className="border border-[#1A1A1A] bg-[#0D0D0D] p-6">
            <div className="text-[#C8A96E] text-xs tracking-widest uppercase mb-3">AI SEO Enrichment</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-xl font-light text-[#F5F0E8] mb-3">Auto-generate your local SEO content</h3>
            <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">
              Generates city-specific FAQ answers, an optimised meta description, and keyword content tuned to your location. Runs in ~10 seconds via AI.
            </p>
            {tenant.seo_enriched && (
              <div className="mb-4 border border-green-400/20 bg-green-400/5 p-4 text-sm text-green-400">
                ✓ SEO enrichment has been run. Re-run anytime to refresh content.
              </div>
            )}
            {seoResult && (
              <div className={`mb-4 p-4 text-sm border ${seoResult.startsWith('Error') ? 'border-red-400/20 bg-red-400/5 text-red-400' : 'border-green-400/20 bg-green-400/5 text-green-400'}`}>{seoResult}</div>
            )}
            <button onClick={runSeoEnrichment} disabled={seoLoading || tenant.plan === 'starter'}
              className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50 flex items-center gap-3">
              {seoLoading ? <><div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />Generating...</> : 'Run AI SEO Enrichment'}
            </button>
            {tenant.plan === 'starter' && (
              <p className="text-xs text-[#6B6B6B] mt-3">Available on Studio and Agency plans. <button onClick={() => setTab('billing')} className="text-[#C8A96E] hover:underline">Upgrade now</button></p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Custom Domain ── */}
      {tab === 'domain' && (
        <div className="space-y-6">
          <div className="border border-[#1A1A1A] bg-[#0D0D0D] p-6">
            <div className="text-[#C8A96E] text-xs tracking-widest uppercase mb-3">Custom Domain</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-xl font-light text-[#F5F0E8] mb-4">Connect your own domain</h3>
            {tenant.plan === 'starter' ? (
              <div>
                <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">Custom domains are on Studio and Agency plans. Your site is live at <span className="text-[#C8A96E]">{tenant.subdomain}.studiolaunch.in</span></p>
                <button onClick={() => setTab('billing')} className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors">Upgrade to Studio Plan</button>
              </div>
            ) : (
              <DomainVerificationPanel tenant={tenant} onUpdate={setTenant} />
            )}
          </div>
        </div>
      )}

      {/* ── TAB: White Label ── */}
      {tab === 'whitelabel' && (
        <div className="space-y-6">
          <div className="border border-[#1A1A1A] bg-[#0D0D0D] p-6">
            <div className="text-[#C8A96E] text-xs tracking-widest uppercase mb-3">White Label</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-xl font-light text-[#F5F0E8] mb-3">
              Remove StudioLaunch branding
            </h3>
            {tenant.plan !== 'agency' ? (
              <div>
                <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">
                  White labelling removes all &ldquo;Powered by StudioLaunch&rdquo; references from your site. Available on the Agency plan.
                </p>
                <button onClick={() => setTab('billing')}
                  className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors">
                  Upgrade to Agency Plan
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-[#6B6B6B] text-sm leading-relaxed">
                  When enabled, &ldquo;Powered by StudioLaunch&rdquo; is removed from your site footer. You can optionally show your own custom footer text instead.
                </p>

                {/* Toggle */}
                <label className="flex items-center gap-4 cursor-pointer">
                  <div
                    onClick={() => setTenant(prev => prev ? { ...prev, white_label: !prev.white_label } : prev)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${tenant.white_label ? 'bg-[#C8A96E]' : 'bg-[#2A2A2A]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${tenant.white_label ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-sm text-[#F5F0E8]/80">
                    {tenant.white_label ? 'White label enabled — StudioLaunch branding hidden' : 'White label disabled — StudioLaunch branding shown'}
                  </span>
                </label>

                {/* Custom footer text */}
                <div>
                  <label className={labelCls}>Custom Footer Text (optional)</label>
                  <input
                    value={tenant.custom_footer_text || ''}
                    onChange={e => setTenant(prev => prev ? { ...prev, custom_footer_text: e.target.value } : prev)}
                    className={inputCls}
                    placeholder="e.g. Designed by Forma Studio · All rights reserved"
                  />
                  <p className="text-xs text-[#6B6B6B] mt-1.5">Shown in footer when white label is enabled. Leave blank for no attribution text.</p>
                </div>

                {/* Preview */}
                <div className="border border-[#2A2A2A] p-4 bg-[#141414]">
                  <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Footer Preview</div>
                  <div className="flex justify-between items-center text-xs text-[#6B6B6B]">
                    <span>© {new Date().getFullYear()} {tenant.branding.business_name}. All rights reserved.</span>
                    {!tenant.white_label
                      ? <span className="text-[#C8A96E]">Powered by StudioLaunch</span>
                      : tenant.custom_footer_text
                        ? <span>{tenant.custom_footer_text}</span>
                        : <span className="italic opacity-40">No attribution</span>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Billing ── */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="border border-[#1A1A1A] bg-[#0D0D0D] p-6 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[#C8A96E] text-xs tracking-widest uppercase mb-1">Current Plan</div>
                <div className="text-2xl font-light text-[#F5F0E8] capitalize" style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}}>{tenant.plan}</div>
              </div>
              <span className={`text-xs px-3 py-1 border font-medium capitalize ${['active','trialing'].includes(tenant.plan_status) ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>{tenant.plan_status}</span>
            </div>
            {tenant.plan_status === 'trialing' && <p className="text-[#6B6B6B] text-sm">You&apos;re on a 14-day free trial.</p>}
          </div>
          {[
            { plan:'starter', name:'Starter', price:'₹999/mo',   features:['Subdomain site','Lead inbox','5 portfolio items','1 case study'] },
            { plan:'studio',  name:'Studio',  price:'₹2,499/mo', features:['Custom domain','Unlimited portfolio','AI SEO enrichment','Analytics'], highlight:true },
            { plan:'agency',  name:'Agency',  price:'₹5,999/mo', features:['White-label','10 team members','Priority support'] },
          ].map(p => (
            <div key={p.plan} className={`border p-5 flex items-center justify-between gap-4 ${p.highlight ? 'border-[#C8A96E]/30 bg-[#C8A96E]/5' : 'border-[#1A1A1A] bg-[#0D0D0D]'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[#F5F0E8] font-medium">{p.name}</span>
                  {p.plan === tenant.plan && <span className="text-xs text-[#C8A96E] border border-[#C8A96E]/30 px-2 py-0.5">Current</span>}
                </div>
                <div className="text-[#6B6B6B] text-xs">{p.features.join(' · ')}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[#C8A96E] font-light mb-2" style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}}>{p.price}</div>
                {p.plan !== tenant.plan && (
                  <a href={`/api/studio/create-checkout?plan=${p.plan}`} className="text-xs font-semibold tracking-widest uppercase px-4 py-2 bg-[#C8A96E] text-[#0A0A0A] hover:bg-[#A8854A] transition-colors inline-block">
                    {p.plan === 'starter' ? 'Downgrade' : 'Upgrade'}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      {showSave && (
        <div className="mt-8 flex items-center gap-4 pt-6 border-t border-[#1A1A1A]">
          <button onClick={handleSave} disabled={saving}
            className="rounded-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-8 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-400 text-xs flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Saved</span>}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-[#6B6B6B] text-sm">Loading...</div>}>
      <SettingsInner />
    </Suspense>
  )
}
