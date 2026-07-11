'use client'
// src/components/shared/ImageUploader.tsx

import { useState, useRef, useCallback } from 'react'

interface Props {
  value?:      string
  onChange:    (url: string) => void
  folder?:     string
  label?:      string
  aspectHint?: string  // e.g. "16:9 recommended"
  className?:  string
}

const MAX_DIMENSION = 2400   // longest side, px — plenty for full-bleed hero use, well under typical smartphone output
const WEBP_QUALITY   = 0.82
const SKIP_BELOW     = 250 * 1024  // don't bother re-encoding files already under 250KB

// Re-encodes an oversized smartphone photo down to a capped, WebP-compressed file
// entirely in the browser — no server-side image processing needed. Animated GIFs
// are passed through untouched since canvas would flatten them to one frame.
async function compressImage(file: File): Promise<{ file: File; originalKB: number; finalKB: number }> {
  const originalKB = Math.round(file.size / 1024)

  if (file.type === 'image/gif' || file.size <= SKIP_BELOW) {
    return { file, originalKB, finalKB: originalKB }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return { file, originalKB, finalKB: originalKB }
    ctx.drawImage(bitmap, 0, 0, w, h)

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    )
    if (!blob || blob.size >= file.size) {
      // Compression didn't help (rare, e.g. already-optimized webp) — keep original
      return { file, originalKB, finalKB: originalKB }
    }

    const newName = file.name.replace(/\.\w+$/, '') + '.webp'
    const compressed = new File([blob], newName, { type: 'image/webp' })
    return { file: compressed, originalKB, finalKB: Math.round(blob.size / 1024) }
  } catch {
    // createImageBitmap/canvas unsupported or failed — fall back to the original file
    return { file, originalKB, finalKB: originalKB }
  }
}

export default function ImageUploader({
  value, onChange, folder = 'general', label = 'Upload Image', aspectHint, className = '',
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [dragOver, setDragOver]   = useState(false)
  const [savedPct, setSavedPct]   = useState<number | null>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (rawFile: File) => {
    setUploading(true)
    setError('')
    setSavedPct(null)

    const { file, originalKB, finalKB } = await compressImage(rawFile)
    if (finalKB < originalKB) {
      setSavedPct(Math.round((1 - finalKB / originalKB) * 100))
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res  = await fetch('/api/upload', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Upload failed')
      setUploading(false)
      return
    }

    onChange(json.url)
    setUploading(false)
  }, [folder, onChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs tracking-widest uppercase text-[#6B6B6B] mb-2">{label}</label>
      )}

      {/* Preview or dropzone */}
      {value ? (
        <div className="relative group">
          <div className="relative overflow-hidden bg-[#141414] border border-[#2A2A2A]" style={{aspectRatio:'16/9'}}>
            <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-4 py-2 hover:bg-[#A8854A] transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-[#1A1A1A] text-[#F5F0E8] text-xs font-medium tracking-widest uppercase px-4 py-2 border border-[#2A2A2A] hover:border-red-400/50 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
          {aspectHint && (
            <div className="text-xs text-[#6B6B6B] mt-1.5">{aspectHint}</div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed cursor-pointer transition-all
            flex flex-col items-center justify-center gap-3 py-10
            ${dragOver
              ? 'border-[#C8A96E] bg-[#C8A96E]/5'
              : 'border-[#2A2A2A] hover:border-[#C8A96E]/40 bg-[#0D0D0D]'}
          `}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-[#6B6B6B]">Uploading...</div>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#6B6B6B]">
                <path d="M4 16l4-4 4 4M12 12l4-6 4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div className="text-center">
                <div className="text-sm text-[#F5F0E8]/70 mb-1">
                  Drop image here or <span className="text-[#C8A96E]">browse</span>
                </div>
                <div className="text-xs text-[#6B6B6B]">
                  JPEG, PNG, WebP · Max 10MB
                  {aspectHint && ` · ${aspectHint}`}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-400 text-xs mt-2 border border-red-400/20 bg-red-400/5 px-3 py-2">
          {error}
        </div>
      )}

      {!error && savedPct !== null && savedPct > 0 && (
        <div className="text-xs text-[#6B6B6B] mt-2">
          Compressed to WebP — {savedPct}% smaller, faster loading for visitors.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
