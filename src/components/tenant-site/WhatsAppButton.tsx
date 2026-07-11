'use client'
// src/components/tenant-site/WhatsAppButton.tsx
// Floating WhatsApp click-to-chat button — high-intent lead channel for Indian SME visitors.
// Falls back to phone_number if no dedicated whatsapp_number is set.

interface Props {
  phoneNumber: string
  businessName: string
  accentColor: string
  bottomOffset?: string // leave room when a sticky mobile CTA bar is also shown
}

function toWhatsAppDigits(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  // Assume Indian numbers passed without country code need a 91 prefix
  if (digits.length === 10) return `91${digits}`
  return digits
}

export default function WhatsAppButton({ phoneNumber, businessName, accentColor, bottomOffset = '1.5rem' }: Props) {
  const digits = toWhatsAppDigits(phoneNumber)
  if (!digits) return null

  const message = encodeURIComponent(`Hi ${businessName}, I'd like to enquire about a design consultation.`)
  const href = `https://wa.me/${digits}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${businessName} on WhatsApp`}
      style={{
        position: 'fixed',
        right: '1.25rem',
        bottom: bottomOffset,
        zIndex: 150,
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 6px 24px rgba(0,0,0,0.35), 0 0 0 2px ${accentColor}22`,
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      className="ts-focusable"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.1-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
          fill="#fff"
        />
        <path
          d="M12 3.4a8.6 8.6 0 00-7.34 13.06l.2.33-.78 2.85 2.92-.77.32.19A8.6 8.6 0 1012 3.4zm4.98 12.2c-.21.6-1.24 1.15-1.71 1.19-.44.05-.99.07-1.6-.1-.37-.1-.84-.27-1.44-.53-2.54-1.1-4.2-3.66-4.33-3.83-.13-.18-1.03-1.37-1.03-2.62 0-1.24.65-1.85.88-2.1.23-.25.5-.31.67-.31l.48.01c.15 0 .36-.06.56.43.21.5.71 1.73.77 1.86.06.13.1.28.02.45-.08.17-.12.28-.24.43-.12.15-.25.33-.36.44-.12.12-.24.25-.1.49.13.24.59.98 1.28 1.58.88.78 1.62 1.03 1.86 1.15.24.12.38.1.52-.06.15-.17.62-.72.79-.97.16-.24.33-.2.55-.12.23.08 1.44.68 1.68.8.25.13.41.19.47.3.06.11.06.6-.15 1.2z"
          fill="#25D366"
        />
      </svg>
    </a>
  )
}
