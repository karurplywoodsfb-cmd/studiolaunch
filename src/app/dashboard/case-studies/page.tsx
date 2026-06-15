'use client'
// src/app/dashboard/case-studies/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { CaseStudy, FinishTier } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'

const EMPTY: Partial<CaseStudy> = {
  title: '', subtitle: '',
  brief_heading: '', brief_body: '',
  challenge_heading: '', challenge_body: '',
  solution_heading: '', solution_body: '',
  outcome_heading: '', outcome_body: '',
  client_type: 'Private Residential', location: '',
  area_sqft: undefined, scope: '', duration_weeks: undefined,
  finish_tier: 'premium', primary_materials: [], year: new Date().getFullYear(),
  stat_1_value: '', stat_1_label: '', stat_2_value: '', stat_2_label: '',
  stat_3_value: '', stat_3_label: '',
  hero_image_url: '', before_image_url: '', after_image_url: '',
  published: false,
}

const TIERS: { value: FinishTier; label: string }[] = [
  { value: 'premium', label: 'Premium' },
  { value: 'luxury',  label: 'Luxury' },
  { value: 'ultra',   label: 'Ultra Luxury' },
]

// Section divider
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#1A1A1A] bg-[#0D0D0D]">
      <div className="px-5 py-3 border-b border-[#1A1A1A] bg-[#141414]">
        <div className="text-xs tracking-widest uppercase text-[#C8A96E] font-medium">{title}</div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#6B6B6B]/60 mt-1.5">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]'
const textareaCls = inputCls + ' resize-y'

function CaseStudyForm({
  initial, onSave, onCancel, saving
}: {
  initial: Partial<CaseStudy>
  onSave: (d: Partial<CaseStudy>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const [materialInput, setMaterialInput] = useState('')

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const addMaterial = () => {
    const m = materialInput.trim()
    if (m && !form.primary_materials?.includes(m)) {
      set('primary_materials', [...(form.primary_materials || []), m])
      setMaterialInput('')
    }
  }
  const removeMaterial = (m: string) =>
    set('primary_materials', form.primary_materials?.filter(x => x !== m) || [])

  return (
    <div className="space-y-6">

      {/* 01 — Project Identity */}
      <Section title="01 — Project Identity">
        <Field label="Case Study Title *">
          <input value={form.title || ''} onChange={e => set('title', e.target.value)}
            className={inputCls} placeholder="The Whitefield Villa" />
        </Field>
        <Field label="Subtitle" hint="One line that captures the essence">
          <input value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)}
            className={inputCls} placeholder="A 4,200 sq.ft family villa redesigned for modern living" />
        </Field>
        <ImageUploader
          value={form.hero_image_url} onChange={url => set('hero_image_url', url)}
          folder="case-studies" label="Hero Image" aspectHint="16:9 · Min 1400px wide"
        />
      </Section>

      {/* 02 — Project Arc */}
      <Section title="02 — Project Arc (The Brief → Outcome)">
        {[
          ['brief',     'The Brief',     'What was the client asking for?'],
          ['challenge', 'The Challenge', 'What made this project difficult?'],
          ['solution',  'The Solution',  'How did you solve it?'],
          ['outcome',   'The Outcome',   'What was achieved at handover?'],
        ].map(([key, label, hint]) => (
          <div key={key} className="space-y-3 pb-5 border-b border-[#1A1A1A] last:border-0 last:pb-0">
            <div className="text-xs font-medium text-[#C8A96E] tracking-widest uppercase">{label}</div>
            <Field label="Heading">
              <input value={(form as Record<string,unknown>)[`${key}_heading`] as string || ''}
                onChange={e => set(`${key}_heading`, e.target.value)}
                className={inputCls} placeholder={hint} />
            </Field>
            <Field label="Body Text">
              <textarea value={(form as Record<string,unknown>)[`${key}_body`] as string || ''}
                onChange={e => set(`${key}_body`, e.target.value)}
                className={textareaCls} rows={4} placeholder="Write the detailed narrative here..." />
            </Field>
          </div>
        ))}
      </Section>

      {/* 03 — Before / After */}
      <Section title="03 — Before / After Images">
        <div className="grid grid-cols-2 gap-5">
          <ImageUploader
            value={form.before_image_url} onChange={url => set('before_image_url', url)}
            folder="case-studies" label="Before Image" aspectHint="Same ratio as After"
          />
          <ImageUploader
            value={form.after_image_url} onChange={url => set('after_image_url', url)}
            folder="case-studies" label="After Image" aspectHint="Same ratio as Before"
          />
        </div>
      </Section>

      {/* 04 — Project Metadata */}
      <Section title="04 — Project Metadata (Sidebar)">
        <div className="grid grid-cols-2 gap-5">
          <Field label="Client Type">
            <input value={form.client_type || ''} onChange={e => set('client_type', e.target.value)}
              className={inputCls} placeholder="Private Residential" />
          </Field>
          <Field label="Location">
            <input value={form.location || ''} onChange={e => set('location', e.target.value)}
              className={inputCls} placeholder="Peelamedu, Coimbatore" />
          </Field>
          <Field label="Area (sq.ft)">
            <input type="number" value={form.area_sqft || ''} onChange={e => set('area_sqft', Number(e.target.value))}
              className={inputCls} placeholder="4200" min={100} />
          </Field>
          <Field label="Duration (weeks)">
            <input type="number" value={form.duration_weeks || ''} onChange={e => set('duration_weeks', Number(e.target.value))}
              className={inputCls} placeholder="14" min={1} />
          </Field>
          <Field label="Scope">
            <input value={form.scope || ''} onChange={e => set('scope', e.target.value)}
              className={inputCls} placeholder="Full Home Interior" />
          </Field>
          <Field label="Finish Tier">
            <select value={form.finish_tier} onChange={e => set('finish_tier', e.target.value)}
              className={inputCls + ' appearance-none'}>
              {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <input type="number" value={form.year || ''} onChange={e => set('year', Number(e.target.value))}
              className={inputCls} placeholder="2024" min={2000} max={2099} />
          </Field>
        </div>

        {/* Materials */}
        <Field label="Primary Materials">
          <div className="flex gap-2 mb-2 flex-wrap">
            {form.primary_materials?.map(m => (
              <span key={m} className="flex items-center gap-1.5 text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#F5F0E8] px-2.5 py-1">
                {m}
                <button type="button" onClick={() => removeMaterial(m)} className="text-[#6B6B6B] hover:text-red-400 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={materialInput} onChange={e => setMaterialInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMaterial() } }}
              className={inputCls} placeholder="e.g. Calacatta Marble (press Enter)" />
            <button type="button" onClick={addMaterial}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#C8A96E] px-4 text-sm hover:border-[#C8A96E]/50 transition-colors whitespace-nowrap">
              Add
            </button>
          </div>
        </Field>
      </Section>

      {/* 05 — Outcome Stats */}
      <Section title="05 — Outcome Stats (displayed in hero row)">
        <div className="grid grid-cols-3 gap-5">
          {[1,2,3].map(n => (
            <div key={n} className="space-y-3">
              <div className="text-xs text-[#C8A96E] tracking-widest uppercase font-medium">Stat {n}</div>
              <Field label="Value">
                <input value={(form as Record<string,unknown>)[`stat_${n}_value`] as string || ''}
                  onChange={e => set(`stat_${n}_value`, e.target.value)}
                  className={inputCls} placeholder="14" />
              </Field>
              <Field label="Label">
                <input value={(form as Record<string,unknown>)[`stat_${n}_label`] as string || ''}
                  onChange={e => set(`stat_${n}_label`, e.target.value)}
                  className={inputCls} placeholder="Weeks to Handover" />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      {/* Publish toggle */}
      <div className="flex items-center justify-between py-4 border-t border-[#1A1A1A]">
        <label className="flex items-center gap-4 cursor-pointer">
          <div
            onClick={() => set('published', !form.published)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${form.published ? 'bg-[#C8A96E]' : 'bg-[#2A2A2A]'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.published ? 'left-6' : 'left-1'}`} />
          </div>
          <span className="text-sm text-[#F5F0E8]/80">
            {form.published ? 'Published — visible on your site' : 'Draft — not visible on your site'}
          </span>
        </label>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-6 py-3 hover:border-[#6B6B6B] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(form)} disabled={saving || !form.title}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Case Study'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<CaseStudy> | null>(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const fetchStudies = useCallback(async () => {
    const res  = await fetch('/api/case-studies')
    const json = await res.json()
    setStudies(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchStudies() }, [fetchStudies])

  const handleSave = async (data: Partial<CaseStudy>) => {
    if (!data.title?.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const method = data.id ? 'PATCH' : 'POST'
    const res    = await fetch('/api/case-studies', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()

    if (!res.ok) { setError(json.error || 'Save failed'); setSaving(false); return }

    await fetchStudies()
    setEditing(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this case study?')) return
    await fetch('/api/case-studies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setStudies(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Case Studies</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
            Project <em>Arc</em> Builder
          </h1>
        </div>
        {!editing && (
          <button onClick={() => { setEditing({...EMPTY}); setError('') }}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors flex items-center gap-2">
            <span>＋</span> New Case Study
          </button>
        )}
      </div>

      {editing && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{fontFamily:'Georgia,serif'}} className="text-xl font-light text-[#F5F0E8]">
              {editing.id ? `Editing: ${editing.title}` : 'New Case Study'}
            </h2>
          </div>
          {error && <div className="mb-4 text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">{error}</div>}
          <CaseStudyForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}

      {!editing && (
        loading ? (
          <div className="text-center py-20 text-[#6B6B6B] text-sm">Loading...</div>
        ) : studies.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#2A2A2A]">
            <div className="text-[#6B6B6B] text-sm mb-4">No case studies yet</div>
            <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed mb-6">
              Case studies are the most powerful SEO content on your site. Each one can rank for specific project types in your city.
            </p>
            <button onClick={() => setEditing({...EMPTY})}
              className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors">
              Create First Case Study
            </button>
          </div>
        ) : (
          <div className="space-y-px bg-[#1A1A1A]">
            {studies.map(study => (
              <div key={study.id} className="bg-[#0A0A0A] flex gap-5 p-5 hover:bg-[#0D0D0D] transition-colors">
                {/* Thumbnail */}
                <div className="w-24 h-16 bg-[#141414] flex-shrink-0 overflow-hidden">
                  {study.hero_image_url
                    ? <img src={study.hero_image_url} alt={study.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center text-[#3A3A3A] text-xs">No image</div>
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-[#F5F0E8]">{study.title}</div>
                      {study.subtitle && <div className="text-xs text-[#6B6B6B] mt-0.5 truncate">{study.subtitle}</div>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 border flex-shrink-0 ${study.published ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-[#6B6B6B] border-[#2A2A2A] bg-[#1A1A1A]'}`}>
                      {study.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-[#6B6B6B]">
                    {study.location && <span>{study.location}</span>}
                    {study.area_sqft && <><span className="text-[#2A2A2A]">·</span><span>{study.area_sqft.toLocaleString('en-IN')} sq.ft</span></>}
                    {study.year && <><span className="text-[#2A2A2A]">·</span><span>{study.year}</span></>}
                    <span className="text-[#2A2A2A]">·</span>
                    <button onClick={() => setEditing(study)} className="text-[#C8A96E] hover:text-[#F5F0E8] transition-colors">Edit</button>
                    <span className="text-[#2A2A2A]">·</span>
                    <button onClick={() => handleDelete(study.id)} className="hover:text-red-400 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
