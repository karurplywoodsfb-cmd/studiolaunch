'use client'
// src/app/dashboard/service-areas/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { ServiceAreaSEO } from '@/types'

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Puducherry',
]

const inputCls = 'w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]'
const labelCls = 'block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2'

const EMPTY: Partial<ServiceAreaSEO> = {
  city: '', state: 'Tamil Nadu', is_primary: false, display_order: 0,
  pin_codes: [], nearby_cities: [], seo_h1: '', seo_intro: '', seo_description: '',
}

function AreaForm({
  initial, onSave, onCancel, saving,
}: {
  initial: Partial<ServiceAreaSEO>
  onSave: (d: Partial<ServiceAreaSEO>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm]           = useState(initial)
  const [pinInput, setPinInput]   = useState('')
  const [cityInput, setCityInput] = useState('')

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const addPin = () => {
    const p = pinInput.trim()
    if (p && !form.pin_codes?.includes(p)) {
      set('pin_codes', [...(form.pin_codes || []), p])
      setPinInput('')
    }
  }
  const addNearby = () => {
    const c = cityInput.trim()
    if (c && !form.nearby_cities?.includes(c)) {
      set('nearby_cities', [...(form.nearby_cities || []), c])
      setCityInput('')
    }
  }

  // Auto-generate SEO fields from city name
  const autoFill = () => {
    if (!form.city) return
    set('seo_h1', `Interior Design in ${form.city}`)
    set('seo_intro', `Premium residential and commercial interior design services in ${form.city}, ${form.state}. We transform villas, apartments, and offices into extraordinary spaces.`)
    set('seo_description', `${form.city}'s trusted interior design studio. Full-home design, kitchen remodels, and commercial fit-outs. Free site consultation.`)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 md:col-span-1">
          <label className={labelCls}>City Name *</label>
          <input value={form.city || ''} onChange={e => set('city', e.target.value)}
            className={inputCls} placeholder="e.g. Coimbatore" required />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className={labelCls}>State</label>
          <select value={form.state || 'Tamil Nadu'} onChange={e => set('state', e.target.value)}
            className={inputCls + ' appearance-none'}>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Display Order</label>
          <input type="number" value={form.display_order ?? 0} onChange={e => set('display_order', Number(e.target.value))}
            className={inputCls} min={0} />
        </div>
        <div className="flex items-center gap-4 pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('is_primary', !form.is_primary)}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${form.is_primary ? 'bg-[#C8A96E]' : 'bg-[#2A2A2A]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_primary ? 'left-5' : 'left-0.5'}`} />
            </div>
            <span className="text-sm text-[#F5F0E8]/80">Primary City</span>
          </label>
        </div>
      </div>

      {/* PIN codes */}
      <div>
        <label className={labelCls}>PIN Codes Served</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {form.pin_codes?.map(p => (
            <span key={p} className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#F5F0E8] px-2.5 py-1 flex items-center gap-1.5">
              {p}
              <button type="button" onClick={() => set('pin_codes', form.pin_codes?.filter(x => x !== p))}
                className="text-[#6B6B6B] hover:text-red-400">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={pinInput} onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPin() } }}
            className={inputCls} placeholder="6-digit PIN (press Enter)" maxLength={6} />
          <button type="button" onClick={addPin}
            className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#C8A96E] px-4 text-sm hover:border-[#C8A96E]/50 transition-colors whitespace-nowrap">
            Add
          </button>
        </div>
      </div>

      {/* Nearby cities */}
      <div>
        <label className={labelCls}>Nearby Cities <span className="text-[#6B6B6B] normal-case tracking-normal">(shown as internal links on area page)</span></label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {form.nearby_cities?.map(c => (
            <span key={c} className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#F5F0E8] px-2.5 py-1 flex items-center gap-1.5">
              {c}
              <button type="button" onClick={() => set('nearby_cities', form.nearby_cities?.filter(x => x !== c))}
                className="text-[#6B6B6B] hover:text-red-400">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={cityInput} onChange={e => setCityInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNearby() } }}
            className={inputCls} placeholder="e.g. Tirupur (press Enter)" />
          <button type="button" onClick={addNearby}
            className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#C8A96E] px-4 text-sm hover:border-[#C8A96E]/50 transition-colors whitespace-nowrap">
            Add
          </button>
        </div>
      </div>

      {/* SEO content */}
      <div className="pt-4 border-t border-[#1A1A1A]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs tracking-widest uppercase text-[#C8A96E]">SEO Page Content</div>
          <button type="button" onClick={autoFill}
            className="text-xs text-[#6B6B6B] border border-[#2A2A2A] px-3 py-1.5 hover:border-[#C8A96E]/40 hover:text-[#C8A96E] transition-colors">
            Auto-fill from city name
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Page H1 Heading</label>
            <input value={form.seo_h1 || ''} onChange={e => set('seo_h1', e.target.value)}
              className={inputCls} placeholder={`Interior Design in ${form.city || '[City]'}`} />
          </div>
          <div>
            <label className={labelCls}>Hero Intro Paragraph <span className="text-[#6B6B6B] normal-case tracking-normal">(shown on the area landing page)</span></label>
            <textarea value={form.seo_intro || ''} onChange={e => set('seo_intro', e.target.value)}
              className={inputCls + ' resize-y'} rows={3}
              placeholder="Premium interior design services in [city], [state]..." />
          </div>
          <div>
            <label className={labelCls}>Meta Description <span className="text-[#6B6B6B] normal-case tracking-normal">(155 chars)</span></label>
            <textarea value={form.seo_description || ''} onChange={e => set('seo_description', e.target.value)}
              className={inputCls + ' resize-y'} rows={2} maxLength={160}
              placeholder="Short description shown in Google search results..." />
          </div>
        </div>
      </div>

      {/* URL preview */}
      {form.city && (
        <div className="bg-[#141414] border border-[#2A2A2A] p-3 text-xs">
          <span className="text-[#6B6B6B]">Area page URL: </span>
          <span className="text-[#C8A96E] font-mono">
            yourstudio.studiolaunch.in/areas/{form.city.toLowerCase().replace(/\s+/g, '-')}
          </span>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-[#1A1A1A]">
        <button type="button" onClick={() => onSave(form)} disabled={saving || !form.city}
          className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Area'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-6 py-3 hover:border-[#6B6B6B] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ServiceAreasPage() {
  const [areas, setAreas]   = useState<ServiceAreaSEO[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<ServiceAreaSEO> | null>(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const fetchAreas = useCallback(async () => {
    const res  = await fetch('/api/service-areas')
    const json = await res.json()
    setAreas(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAreas() }, [fetchAreas])

  const handleSave = async (data: Partial<ServiceAreaSEO>) => {
    if (!data.city?.trim()) { setError('City name is required'); return }
    setSaving(true); setError('')

    const method = data.id ? 'PATCH' : 'POST'
    const res    = await fetch('/api/service-areas', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Save failed'); setSaving(false); return }

    await fetchAreas()
    setEditing(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this service area?')) return
    await fetch('/api/service-areas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAreas(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Service Areas</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-3xl font-light text-[#F5F0E8]">
            Local SEO <em>Pages</em>
          </h1>
        </div>
        {!editing && (
          <button onClick={() => { setEditing({ ...EMPTY }); setError('') }}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors flex items-center gap-2">
            <span>＋</span> Add City
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="border border-[#1A1A1A] bg-[#0D0D0D] p-4 mb-6 text-xs text-[#6B6B6B] leading-relaxed">
        <strong className="text-[#F5F0E8]/70">How it works:</strong> Each city you add gets its own SEO landing page at{' '}
        <code className="text-[#C8A96E] bg-[#141414] px-1.5 py-0.5">yourstudio.studiolaunch.in/areas/[city]</code>.
        These pages rank for &ldquo;interior designer in [city]&rdquo; searches and link back to your main site. Each area page is automatically included in your sitemap.xml.
      </div>

      {/* Edit form */}
      {editing && (
        <div className="mb-8 bg-[#0D0D0D] border border-[#2A2A2A] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-xl font-light text-[#F5F0E8]">
              {editing.id ? `Edit: ${editing.city}` : 'New Service Area'}
            </h2>
            <button onClick={() => setEditing(null)} className="text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
          {error && <div className="mb-4 text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">{error}</div>}
          <AreaForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}

      {/* Areas list */}
      {loading ? (
        <div className="text-center py-12 text-[#6B6B6B] text-sm">Loading...</div>
      ) : areas.length === 0 && !editing ? (
        <div className="text-center py-16 border border-dashed border-[#2A2A2A]">
          <div className="text-[#6B6B6B] text-sm mb-3">No service areas yet</div>
          <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed mb-5">
            Add the cities you operate in. Each becomes a dedicated SEO page that ranks for local interior design searches.
          </p>
          <button onClick={() => setEditing({ ...EMPTY })}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors">
            Add First City
          </button>
        </div>
      ) : (
        <div className="space-y-px bg-[#1A1A1A]">
          {areas.map(area => (
            <div key={area.id} className="bg-[#0A0A0A] flex items-center gap-4 px-5 py-4 hover:bg-[#0D0D0D] transition-colors">
              {area.is_primary && (
                <span className="text-xs text-[#C8A96E] border border-[#C8A96E]/30 px-2 py-0.5 flex-shrink-0">Primary</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#F5F0E8]">{area.city}</div>
                <div className="text-xs text-[#6B6B6B] mt-0.5">
                  {area.state}
                  {area.pin_codes?.length > 0 && ` · ${area.pin_codes.length} PINs`}
                  {area.nearby_cities && area.nearby_cities.length > 0 && ` · ${area.nearby_cities.length} nearby cities`}
                </div>
              </div>
              <div className="text-xs font-mono text-[#6B6B6B] hidden md:block">
                /areas/{area.city.toLowerCase().replace(/\s+/g, '-')}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                <button onClick={() => setEditing(area)} className="text-[#6B6B6B] hover:text-[#C8A96E] transition-colors">Edit</button>
                <span className="text-[#2A2A2A]">·</span>
                <button onClick={() => handleDelete(area.id)} className="text-[#6B6B6B] hover:text-red-400 transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
