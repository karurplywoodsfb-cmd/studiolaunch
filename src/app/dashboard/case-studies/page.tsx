'use client'
// src/app/dashboard/case-studies/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { CaseStudy, FinishTier } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'
import { getTenantUrl } from '@/lib/utils'

const EMPTY: Partial<CaseStudy> = {
  title: '', subtitle: '', slug: '',
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
    <div className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] overflow-hidden">
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
  const [rewriting, setRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState('')

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const rewriteWithAI = async () => {
    setRewriting(true)
    setRewriteError('')
    try {
      const res = await fetch('/api/case-studies/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief_body: form.brief_body, challenge_body: form.challenge_body,
          solution_body: form.solution_body, outcome_body: form.outcome_body,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setRewriteError(json.error || 'Rewrite failed'); return }
      if (json.data.brief_body)     set('brief_body', json.data.brief_body)
      if (json.data.challenge_body) set('challenge_body', json.data.challenge_body)
      if (json.data.solution_body)  set('solution_body', json.data.solution_body)
      if (json.data.outcome_body)   set('outcome_body', json.data.outcome_body)
    } catch {
      setRewriteError('Something went wrong. Please try again.')
    } finally {
      setRewriting(false)
    }
  }

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
        <Field label="URL Slug" hint="Leave blank to auto-generate from the title">
          <input value={form.slug || ''} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            className={inputCls} placeholder="the-whitefield-villa" />
        </Field>
        <ImageUploader
          value={form.hero_image_url} onChange={url => set('hero_image_url', url)}
          folder="case-studies" label="Hero Image" aspectHint="16:9 · Min 1400px wide"
        />
      </Section>

      {/* 02 — Project Arc */}
      <Section title="02 — Project Arc (The Brief → Outcome)">
        <div className="flex items-center justify-between -mt-2 mb-1">
          <p className="text-xs text-[#6B6B6B] max-w-xs">Write your rough draft below, then let AI tighten the prose without inventing new facts.</p>
          <button
            type="button"
            onClick={rewriteWithAI}
            disabled={rewriting || (!form.brief_body && !form.challenge_body && !form.solution_body && !form.outcome_body)}
            className="flex-shrink-0 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full bg-[#C8A96E]/10 border border-[#C8A96E]/30 text-[#C8A96E] hover:bg-[#C8A96E]/20 transition-colors disabled:opacity-40"
          >
            {rewriting ? 'Rewriting...' : '✦ AI Rewrite'}
          </button>
        </div>
        {rewriteError && <div className="text-red-400 text-xs">{rewriteError}</div>}
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
            className="rounded-full border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-6 py-3 hover:border-[#6B6B6B] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(form)} disabled={saving || !form.title}
            className="rounded-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50">
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
  const [siteBase, setSiteBase] = useState('')

  const fetchStudies = useCallback(async () => {
    const res  = await fetch('/api/case-studies')
    const json = await res.json()
    setStudies(json.data || [])
    if (json.tenant) {
      setSiteBase(json.tenant.custom_domain ? `https://${json.tenant.custom_domain}` : getTenantUrl(json.tenant.subdomain))
    }
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
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Case Studies</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-3xl font-light text-[#F5F0E8]">
            Project <em>Arc</em> Builder
          </h1>
        </div>
        {!editing && (
          <button onClick={() => { setEditing({...EMPTY}); setError('') }}
            className="rounded-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors flex items-center gap-2">
            <span>＋</span> New Case Study
          </button>
        )}
      </div>

      {editing && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{fontFamily:"'Cormorant Garamond',Georgia,serif"}} className="text-xl font-light text-[#F5F0E8]">
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
          <div className="text-center py-20 rounded-2xl border border-dashed border-[#2A2A2A]">
            <div className="text-[#6B6B6B] text-sm mb-4">No case studies yet</div>
            <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed mb-6">
              Case studies are the most powerful SEO content on your site. Each one can rank for specific project types in your city.
            </p>
            <button onClick={() => setEditing({...EMPTY})}
              className="rounded-full bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors">
              Create First Case Study
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {studies.map(study => {
              const wordCount = [study.brief_body, study.challenge_body, study.solution_body, study.outcome_body]
                .filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length
              const readingMins = wordCount > 0 ? Math.max(1, Math.round(wordCount / 200)) : null
              const hasBeforeAfter = !!(study.before_image_url && study.after_image_url)
              const previewUrl = study.slug && siteBase ? `${siteBase}/case-studies/${study.slug}` : null
              return (
                <div key={study.id} className="rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] overflow-hidden hover:border-[#C8A96E]/40 transition-colors">
                  <div className="relative h-40 bg-[#141414]">
                    {study.hero_image_url ? (
                      <img src={study.hero_image_url} alt={study.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#3A3A3A] text-xs">No cover image</div>
                    )}
                    <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${study.published ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-[#1A1A1A] text-[#6B6B6B] border border-[#2A2A2A]'}`}>
                      {study.published ? 'Live' : 'Draft'}
                    </div>
                    {hasBeforeAfter && (
                      <div className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full bg-[#0A0A0A]/80 backdrop-blur-sm border border-[#2A2A2A] text-[#C8A96E]">
                        Before / After
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium text-[#F5F0E8] mb-0.5">{study.title}</div>
                    {study.subtitle && <div className="text-xs text-[#6B6B6B] mb-3 line-clamp-2">{study.subtitle}</div>}

                    <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B6B6B] mb-3">
                      {study.duration_weeks && <span className="px-2 py-0.5 rounded-full bg-[#141414]">{study.duration_weeks}wk timeline</span>}
                      {study.year && <span className="px-2 py-0.5 rounded-full bg-[#141414]">{study.year}</span>}
                      {readingMins && <span className="px-2 py-0.5 rounded-full bg-[#141414]">{readingMins} min read</span>}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-[#1A1A1A] text-xs">
                      <button onClick={() => setEditing(study)} className="text-[#C8A96E] hover:text-[#F5F0E8] transition-colors">Edit</button>
                      <span className="text-[#2A2A2A]">·</span>
                      {previewUrl ? (
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors">Preview</a>
                      ) : (
                        <span className="text-[#3A3A3A]" title="Publish this case study to get a live preview link">Preview</span>
                      )}
                      <span className="text-[#2A2A2A]">·</span>
                      <button onClick={() => handleDelete(study.id)} className="text-[#6B6B6B] hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
