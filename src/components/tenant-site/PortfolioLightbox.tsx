'use client'
// src/components/tenant-site/PortfolioLightbox.tsx
// Full-screen image gallery for a portfolio project. Uses PortfolioProject.images[]
// (previously collected but never displayed) alongside the cover image.

import { useEffect, useState, useCallback } from 'react'

interface Props {
  images: string[]
  title: string
  category: string
  accentColor: string
  startIndex: number
  onClose: () => void
}

export default function PortfolioLightbox({ images, title, category, accentColor, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)

  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length])
  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, next, prev])

  if (images.length === 0) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} gallery`}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(6,6,6,0.96)', backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column',
      }}
      onClick={onClose}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: accentColor }}>{category}</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', color: '#F5F0E8' }}>{title}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          aria-label="Close gallery"
          className="ts-focusable"
          style={{ background: 'transparent', border: `1px solid ${accentColor}55`, borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2l14 14M16 2L2 16" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 3.5rem' }} onClick={e => e.stopPropagation()}>
        {images.length > 1 && (
          <button
            onClick={prev}
            aria-label="Previous image"
            className="ts-focusable"
            style={{ position: 'absolute', left: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        <img
          src={images[index]}
          alt={`${title} — image ${index + 1} of ${images.length}`}
          style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }}
        />
        {images.length > 1 && (
          <button
            onClick={next}
            aria-label="Next image"
            className="ts-focusable"
            style={{ position: 'absolute', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', padding: '1.25rem' }} onClick={e => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index}
              className="ts-focusable"
              style={{ width: '7px', height: '7px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === index ? accentColor : '#3A3A3A', padding: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
