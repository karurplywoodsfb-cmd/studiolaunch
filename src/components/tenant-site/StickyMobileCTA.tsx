'use client'
// src/components/tenant-site/StickyMobileCTA.tsx
// Mobile-only sticky bottom bar — keeps "Call" and "Book Consultation" always in thumb reach.
// Desktop already has these in the nav, so this is hidden at lg breakpoint via the .ts-mobile-only class.

interface Props {
  phoneNumber: string
  phoneDisplay: string
  accentColor: string
}

export default function StickyMobileCTA({ phoneNumber, phoneDisplay, accentColor }: Props) {
  return (
    <div
      className="ts-mobile-only"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 140,
        display: 'flex',
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <a
        href={`tel:${phoneNumber}`}
        aria-label={`Call ${phoneDisplay}`}
        className="ts-focusable"
        style={{
          flex: '0 0 30%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.9rem 0',
          color: '#F5F0E8',
          textDecoration: 'none',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.7 21 3 12.3 3 2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" stroke="#F5F0E8" strokeWidth="1.4"/>
        </svg>
        Call
      </a>
      <a
        href="#consult"
        className="ts-focusable"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.9rem 0',
          background: accentColor,
          color: '#0A0A0A',
          textDecoration: 'none',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Book Consultation
      </a>
    </div>
  )
}
