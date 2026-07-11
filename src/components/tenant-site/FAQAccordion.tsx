'use client'
// src/components/tenant-site/FAQAccordion.tsx
import { useState } from 'react'
import { FAQItem } from '@/types'

export default function FAQAccordion({ faqs, accentColor = '#C8A96E', textColor = '#F5F0E8', mutedColor = '#6B6B6B' }: {
  faqs: FAQItem[]; accentColor?: string; textColor?: string; mutedColor?: string
}) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      {faqs.map(faq => {
        const isOpen = open === faq.id
        const panelId = `faq-panel-${faq.id}`
        const buttonId = `faq-button-${faq.id}`
        return (
          <div key={faq.id} style={{ borderBottom: '1px solid #2A2A2A' }}>
            <button
              id={buttonId}
              onClick={() => setOpen(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="ts-focusable"
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
            >
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', fontWeight: 400, color: isOpen ? accentColor : textColor, transition: 'color 0.2s', lineHeight: 1.4 }}>
                {faq.question}
              </span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s', color: accentColor }}>
                <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={buttonId} style={{ paddingBottom: '1.5rem', color: mutedColor, fontSize: '0.9rem', lineHeight: 1.75 }}>
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
