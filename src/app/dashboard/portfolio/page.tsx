'use client'
// src/app/dashboard/portfolio/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { PortfolioProject, ProjectCategory, FinishTier } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'

// Extended type with SEO fields
type PortfolioFormData = Partial<PortfolioProject> & {
  slug?:               string
  seo_title?:          string
  seo_description?:    string
  full_description?:   string
  challenge_text?:     string
  solution_text?:      string
  testimonial_quote?:  string
  testimonial_name?:   string
}

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'villa',       label: 'Villa / Independent House' },
  { value: 'apartment',   label: 'Apartment / Flat' },
  { value: 'commercial',  label: 'Commercial' },
  { value: 'other',       label: 'Other' },
]
const TIERS: { value: FinishTier; label: string }[] = [
  { value: 'premium', label: 'Premium' },
  { value: 'luxury',  label: 'Luxury' },
  { value: 'ultra',   label: 'Ultra Luxury' },
]

const EMPTY: PortfolioFormData = {
  title: '', category: 'villa', location: '', area_sqft: undefined,
  finish_tier: 'premium', year: new Date().getFullYear(),
  cover_image_url: '', tags: [], published: false, display_order: 0,
  slug: '', seo_title: '', seo_description: '', full_description: '',
  challenge_text: '', solution_text: '', testimonial_quote: '', testimonial_name: '',
}

function PortfolioForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: PortfolioFormData
  onSave: (data: PortfolioFormData) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<PortfolioFormData>(initial)
  const [tagInput, setTagInput] = useState('')

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags?.includes(t)) {
      set('tags', [...(form.tags || []), t])
      setTagInput('')
    }
  }

  const removeTag = (t: string) =>
    set('tags', form.tags?.filter(x => x !== t) || [])

  const inputCls = 'w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]'
  const labelCls = 'block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2'

  return (
    <div className="space-y-6">
      {/* Cover image */}
      <ImageUploader
        value={form.cover_image_url}
        onChange={url => set('cover_image_url', url)}
        folder="portfolio"
        label="Cover Image"
        aspectHint="4:3 recommended · Min 800px wide"
      />

      <div className="grid grid-cols-2 gap-5">
        {/* Title */}
        <div className="col-span-2">
          <label className={labelCls}>Project Title *</label>
          <input value={form.title || ''} onChange={e => set('title', e.target.value)}
            className={inputCls} placeholder="The Meridian House" required />
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className={inputCls + ' appearance-none'}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Finish tier */}
        <div>
          <label className={labelCls}>Finish Tier</label>
          <select value={form.finish_tier} onChange={e => set('finish_tier', e.target.value)}
            className={inputCls + ' appearance-none'}>
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className={labelCls}>Location</label>
          <input value={form.location || ''} onChange={e => set('location', e.target.value)}
            className={inputCls} placeholder="Peelamedu, Coimbatore" />
        </div>

        {/* Year */}
        <div>
          <label className={labelCls}>Year</label>
          <input type="number" value={form.year || ''} onChange={e => set('year', Number(e.target.value))}
            className={inputCls} placeholder="2024" min={2000} max={2099} />
        </div>

        {/* Area */}
        <div>
          <label className={labelCls}>Area (sq.ft)</label>
          <input type="number" value={form.area_sqft || ''} onChange={e => set('area_sqft', Number(e.target.value))}
            className={inputCls} placeholder="2400" min={100} />
        </div>

        {/* Display order */}
        <div>
          <label className={labelCls}>Display Order</label>
          <input type="number" value={form.display_order || 0} onChange={e => set('display_order', Number(e.target.value))}
            className={inputCls} placeholder="0" min={0} />
        </div>

        {/* Tags */}
        <div className="col-span-2">
          <label className={labelCls}>Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {form.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#F5F0E8] px-2.5 py-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-[#6B6B6B] hover:text-red-400 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              className={inputCls}
              placeholder="e.g. marble, open-plan (press Enter to add)"
            />
            <button type="button" onClick={addTag}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#C8A96E] px-4 text-sm hover:border-[#C8A96E]/50 transition-colors whitespace-nowrap">
              Add
            </button>
          </div>
        </div>

        {/* SEO Section */}
        <div className="col-span-2 pt-4 border-t border-[#1A1A1A]">
          <div className="text-xs tracking-widest uppercase text-[#C8A96E] mb-4">SEO & Project Page Content</div>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>URL Slug <span className="text-[#6B6B6B] normal-case tracking-normal">(auto-generated from title if blank)</span></label>
              <div className="flex items-center gap-2">
                <span className="text-[#6B6B6B] text-sm flex-shrink-0">yourstudio.studiolaunch.in/projects/</span>
                <input
                  value={(form as PortfolioFormData).slug || ''}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className={inputCls}
                  placeholder="the-meridian-house"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>SEO Page Title <span className="text-[#6B6B6B] normal-case tracking-normal">(shown in Google — 60 chars max)</span></label>
              <input value={(form as PortfolioFormData).seo_title || ''} onChange={e => set('seo_title', e.target.value)}
                className={inputCls} placeholder="e.g. 4BHK Villa Interior Design in Coimbatore — Forma Studio" maxLength={70} />
            </div>
            <div>
              <label className={labelCls}>SEO Description <span className="text-[#6B6B6B] normal-case tracking-normal">(155 chars max)</span></label>
              <textarea value={(form as PortfolioFormData).seo_description || ''} onChange={e => set('seo_description', e.target.value)}
                className={inputCls + ' resize-y'} rows={2} maxLength={160}
                placeholder="Luxury 4200 sq.ft villa interior designed by Forma Studio in Coimbatore. Italian marble flooring, custom joinery, full home design." />
            </div>
            <div>
              <label className={labelCls}>Project Description <span className="text-[#6B6B6B] normal-case tracking-normal">(shown on project page)</span></label>
              <textarea value={(form as PortfolioFormData).full_description || ''} onChange={e => set('full_description', e.target.value)}
                className={inputCls + ' resize-y'} rows={4}
                placeholder="Write the full editorial description of this project — context, design intent, client goals..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Challenge</label>
                <textarea value={(form as PortfolioFormData).challenge_text || ''} onChange={e => set('challenge_text', e.target.value)}
                  className={inputCls + ' resize-y'} rows={3} placeholder="What made this project difficult?" />
              </div>
              <div>
                <label className={labelCls}>Solution</label>
                <textarea value={(form as PortfolioFormData).solution_text || ''} onChange={e => set('solution_text', e.target.value)}
                  className={inputCls + ' resize-y'} rows={3} placeholder="How did you solve it?" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Client Testimonial</label>
                <textarea value={(form as PortfolioFormData).testimonial_quote || ''} onChange={e => set('testimonial_quote', e.target.value)}
                  className={inputCls + ' resize-y'} rows={3} placeholder="&ldquo;What the client said about the project...&rdquo;" />
              </div>
              <div>
                <label className={labelCls}>Client Name</label>
                <input value={(form as PortfolioFormData).testimonial_name || ''} onChange={e => set('testimonial_name', e.target.value)}
                  className={inputCls} placeholder="e.g. Ravi & Priya Shankar" />
              </div>
            </div>
          </div>
        </div>

        {/* Published toggle */}
        <div className="col-span-2">
          <label className="flex items-center gap-4 cursor-pointer group">
            <div
              onClick={() => set('published', !form.published)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.published ? 'bg-[#C8A96E]' : 'bg-[#2A2A2A]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.published ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm text-[#F5F0E8]/80">
              {form.published ? 'Published — visible on your site' : 'Draft — not visible on your site'}
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#1A1A1A]">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.title}
          className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Project'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-[#2A2A2A] text-[#6B6B6B] text-xs font-medium tracking-widest uppercase px-6 py-3 hover:border-[#6B6B6B] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState<PortfolioFormData | null>(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [limitError, setLimitError] = useState('')

  const fetchProjects = useCallback(async () => {
    const res  = await fetch('/api/portfolio')
    const json = await res.json()
    setProjects(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleSave = async (data: PortfolioFormData) => {
    if (!data.title?.trim()) { setError('Project title is required'); return }
    setSaving(true)
    setError('')

    const method = data.id ? 'PATCH' : 'POST'
    const res    = await fetch('/api/portfolio', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()

    if (!res.ok) {
      if (json.upgrade) setLimitError(json.error)
      else setError(json.error || 'Save failed')
      setSaving(false)
      return
    }

    await fetchProjects()
    setEditing(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await fetch('/api/portfolio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const togglePublish = async (project: PortfolioProject) => {
    const res = await fetch('/api/portfolio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: project.id, published: !project.published }),
    })
    if (res.ok) {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, published: !p.published } : p))
    }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Portfolio</div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
            Your <em>Projects</em>
          </h1>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing({ ...EMPTY }); setError(''); setLimitError('') }}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors flex items-center gap-2"
          >
            <span>＋</span> Add Project
          </button>
        )}
      </div>

      {/* Plan limit error */}
      {limitError && (
        <div className="mb-6 border border-[#C8A96E]/30 bg-[#C8A96E]/5 p-4 flex items-center justify-between">
          <div className="text-sm text-[#F5F0E8]">{limitError}</div>
          <a href="/dashboard/settings?tab=billing"
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-4 py-2 hover:bg-[#A8854A] transition-colors whitespace-nowrap ml-4">
            Upgrade Plan
          </a>
        </div>
      )}

      {/* Edit / Create form */}
      {editing && (
        <div className="mb-8 bg-[#0D0D0D] border border-[#2A2A2A] p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{fontFamily:'Georgia,serif'}} className="text-xl font-light text-[#F5F0E8]">
              {editing.id ? 'Edit Project' : 'New Project'}
            </h2>
            <button onClick={() => setEditing(null)} className="text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">{error}</div>
          )}

          <PortfolioForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        </div>
      )}

      {/* Project grid */}
      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B] text-sm">Loading projects...</div>
      ) : projects.length === 0 && !editing ? (
        <div className="text-center py-20 border border-dashed border-[#2A2A2A]">
          <div className="text-[#6B6B6B] text-sm mb-4">No projects yet</div>
          <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed mb-6">
            Add your first project to populate your site&apos;s portfolio section.
          </p>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors"
          >
            Add First Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1A1A1A]">
          {projects.map(project => (
            <div key={project.id} className="bg-[#0A0A0A] group relative">
              {/* Cover image */}
              <div className="relative overflow-hidden bg-[#141414]" style={{aspectRatio:'4/3'}}>
                {project.cover_image_url ? (
                  <img src={project.cover_image_url} alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#3A3A3A]">
                      <rect x="2" y="4" width="28" height="24" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="11" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 22l8-6 6 6 4-4 10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {/* Published indicator */}
                <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 font-medium ${project.published ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-[#1A1A1A] text-[#6B6B6B] border border-[#2A2A2A]'}`}>
                  {project.published ? 'Live' : 'Draft'}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-medium text-[#F5F0E8] leading-tight">{project.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#6B6B6B] capitalize">{project.category}</span>
                  {project.location && <>
                    <span className="text-[#3A3A3A]">·</span>
                    <span className="text-xs text-[#6B6B6B]">{project.location}</span>
                  </>}
                  {project.year && <>
                    <span className="text-[#3A3A3A]">·</span>
                    <span className="text-xs text-[#6B6B6B]">{project.year}</span>
                  </>}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1A1A1A]">
                  <button
                    onClick={() => setEditing(project)}
                    className="text-xs text-[#6B6B6B] hover:text-[#C8A96E] transition-colors"
                  >Edit</button>
                  <span className="text-[#2A2A2A]">·</span>
                  <button
                    onClick={() => togglePublish(project)}
                    className="text-xs text-[#6B6B6B] hover:text-[#F5F0E8] transition-colors"
                  >
                    {project.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <span className="text-[#2A2A2A]">·</span>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-xs text-[#6B6B6B] hover:text-red-400 transition-colors"
                  >Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
