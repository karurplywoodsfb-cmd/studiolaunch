'use client'
// src/components/tenant-site/BeforeAfterSlider.tsx
import { useState, useRef, useEffect, useCallback } from 'react'

export const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%23141414%22/%3E%3C/svg%3E'

export default function BeforeAfterSlider({ beforeUrl, afterUrl, beforeAlt, afterAlt, accentColor = '#C8A96E' }: {
  beforeUrl: string; afterUrl: string; beforeAlt: string; afterAlt: string; accentColor?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pct, setPct] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const getX = (e: MouseEvent | TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e
    return touch.clientX
  }

  const setPos = useCallback((x: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newPct = Math.max(2, Math.min(98, ((x - rect.left) / rect.width) * 100))
    setPct(newPct)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => { if (dragging) setPos(getX(e)) }
    const onEnd = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove as EventListener, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove as EventListener)
      window.removeEventListener('touchend', onEnd)
    }
  }, [dragging, setPos])

  const step = (delta: number) => setPct(p => Math.max(2, Math.min(98, p + delta)))

  return (
    <div
      ref={containerRef}
      onMouseDown={e => { setDragging(true); setPos(e.clientX) }}
      onTouchStart={e => { setDragging(true); setPos(e.touches[0].clientX) }}
      role="slider"
      tabIndex={0}
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') step(-5)
        if (e.key === 'ArrowRight') step(5)
      }}
      className="ts-focusable"
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'ew-resize',
        height: 'clamp(280px,52vw,620px)', background: '#141414', userSelect: 'none',
      }}
    >
      <img src={beforeUrl || PLACEHOLDER_IMG} alt={beforeAlt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} loading="lazy" />

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pct}%` }}>
        <img src={afterUrl || PLACEHOLDER_IMG} alt={afterAlt}
          style={{ position: 'absolute', top: 0, left: 0, width: containerWidth || '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          loading="lazy" />
      </div>

      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: '3px', background: accentColor, transform: 'translateX(-50%)', zIndex: 10, boxShadow: `0 0 20px ${accentColor}66` }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '44px', height: '44px', borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M5 9H1M1 9l3-3M1 9l3 3M13 9h4M17 9l-3-3M17 9l-3 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <span style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', padding: '0.35rem 0.75rem', background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(8px)', color: '#6B6B6B' }}>Before</span>
      <span style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', padding: '0.35rem 0.75rem', background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(8px)', color: accentColor }}>After</span>
    </div>
  )
}
