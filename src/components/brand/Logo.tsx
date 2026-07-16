// src/components/brand/Logo.tsx
// The MaSpace mark: an open black square bracket (the threshold) with a small
// bronze bracket echoing it in the missing corner — from the brand guide.

export function LogoMark({ size = 24, dark = false }: { size?: number; dark?: boolean }) {
  const line = dark ? '#F7F5F0' : '#1A1A1A'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Black bracket: left side, top, right side (partial), bottom (partial) — open at bottom-right */}
      <path
        d="M100 65 V20 H20 V100 H64"
        stroke={line}
        strokeWidth="7"
        strokeLinecap="square"
      />
      {/* Bronze bracket echoing the missing corner */}
      <path
        d="M78 88 H110 V100"
        stroke="#B38B59"
        strokeWidth="7"
        strokeLinecap="square"
      />
    </svg>
  )
}

export function Logo({
  size = 24,
  dark = false,
  tagline = false,
}: {
  size?: number
  dark?: boolean
  tagline?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} dark={dark} />
      <div>
        <span
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
          className={`text-xl tracking-wide ${dark ? 'text-[#F7F5F0]' : 'text-[#1A1A1A]'}`}
        >
          MaSpace
        </span>
        {tagline && (
          <div className={`text-[10px] tracking-[0.25em] uppercase -mt-0.5 ${dark ? 'text-[#F7F5F0]/50' : 'text-[#B38B59]'}`}>
            Designed by principles.
          </div>
        )}
      </div>
    </div>
  )
}
