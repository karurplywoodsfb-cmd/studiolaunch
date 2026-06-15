'use client'
// src/app/dashboard/reviews/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { GoogleReview } from '@/types'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8.15 3.22 9.55l.53-3.1L1.5 4.25l3.1-.45z"
            fill={i <= rating ? '#C8A96E' : '#2A2A2A'} />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews]       = useState<GoogleReview[]>([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [placeId, setPlaceId]       = useState('')
  const [rating, setRating]         = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState('')
  const [error, setError]           = useState('')

  const fetchReviews = useCallback(async () => {
    const res  = await fetch('/api/reviews')
    const json = await res.json()
    setReviews(json.data || [])
    setPlaceId(json.google_place_id || '')
    setRating(json.google_rating)
    setReviewCount(json.google_review_count)
    setLastSynced(json.reviews_last_synced)
    setLoading(false)
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleSync = async () => {
    if (!placeId.trim()) {
      setError('Enter your Google Place ID first')
      return
    }
    setSyncing(true); setError(''); setSyncResult('')

    const res  = await fetch('/api/reviews', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: placeId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Sync failed')
    } else {
      setSyncResult(`✓ ${json.message}`)
      await fetchReviews()
    }
    setSyncing(false)
  }

  const toggleFeatured = async (review: GoogleReview) => {
    await fetch('/api/reviews', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: review.id, is_featured: !review.is_featured }),
    })
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_featured: !r.is_featured } : r))
  }

  const removeReview = async (id: string) => {
    if (!confirm('Hide this review from your site?')) return
    await fetch('/api/reviews', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const inputCls = 'w-full bg-[#141414] border border-[#2A2A2A] text-[#F5F0E8] px-4 py-3 text-sm outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3A3A]'

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-2">Reviews</div>
        <h1 style={{fontFamily:'Georgia,serif'}} className="text-3xl font-light text-[#F5F0E8]">
          Google <em>Reviews</em>
        </h1>
      </div>

      {/* Aggregate stats */}
      {rating && (
        <div className="grid grid-cols-3 gap-px bg-[#1A1A1A] mb-8">
          <div className="bg-[#0A0A0A] p-6">
            <div className="text-3xl font-light text-[#C8A96E] mb-1" style={{fontFamily:'Georgia,serif'}}>{rating.toFixed(1)}</div>
            <div className="text-xs text-[#6B6B6B]">Average Rating</div>
            <StarRating rating={Math.round(rating)} />
          </div>
          <div className="bg-[#0A0A0A] p-6">
            <div className="text-3xl font-light text-[#C8A96E] mb-1" style={{fontFamily:'Georgia,serif'}}>{reviewCount}</div>
            <div className="text-xs text-[#6B6B6B]">Total Reviews</div>
          </div>
          <div className="bg-[#0A0A0A] p-6">
            <div className="text-3xl font-light text-[#C8A96E] mb-1" style={{fontFamily:'Georgia,serif'}}>{reviews.filter(r => r.is_featured).length}</div>
            <div className="text-xs text-[#6B6B6B]">Featured on Site</div>
          </div>
        </div>
      )}

      {/* Sync panel */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 mb-8">
        <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-3">Google Places Sync</div>
        <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4">
          Enter your Google Place ID to pull your reviews automatically. Find it at{' '}
          <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-[#C8A96E] hover:underline">
            Google Place Finder
          </a>
          .
        </p>
        <div className="flex gap-3 mb-4">
          <input
            value={placeId}
            onChange={e => setPlaceId(e.target.value)}
            className={inputCls + ' flex-1'}
            placeholder="ChIJ... (your Google Place ID)"
          />
          <button onClick={handleSync} disabled={syncing}
            className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-3 hover:bg-[#A8854A] transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
            {syncing ? <><div className="w-3 h-3 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />Syncing...</> : 'Sync Reviews'}
          </button>
        </div>
        {error      && <div className="text-red-400 text-xs border border-red-400/20 bg-red-400/5 px-4 py-3">{error}</div>}
        {syncResult && <div className="text-green-400 text-xs border border-green-400/20 bg-green-400/5 px-4 py-3">{syncResult}</div>}
        {lastSynced && !syncResult && <div className="text-xs text-[#6B6B6B]">Last synced: {new Date(lastSynced).toLocaleString('en-IN')}</div>}

        <div className="mt-4 pt-4 border-t border-[#1A1A1A] text-xs text-[#6B6B6B] leading-relaxed">
          <strong className="text-[#F5F0E8]/70">Note:</strong> Add <code className="text-[#C8A96E] bg-[#141414] px-1.5 py-0.5">GOOGLE_PLACES_API_KEY</code> to your environment variables. Enable the Places API in Google Cloud Console.
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-12 text-[#6B6B6B] text-sm">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#2A2A2A]">
          <div className="text-[#6B6B6B] text-sm mb-2">No reviews synced yet</div>
          <p className="text-[#6B6B6B] text-xs max-w-xs mx-auto leading-relaxed">
            Add your Google Place ID above and click &ldquo;Sync Reviews&rdquo; to import your Google reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs tracking-widest uppercase text-[#6B6B6B] mb-4">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} cached — toggle to show/feature on your site
          </div>
          {reviews.map(review => (
            <div key={review.id} className={`border bg-[#0D0D0D] p-5 transition-colors ${review.is_featured ? 'border-[#C8A96E]/30' : 'border-[#1A1A1A]'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {review.author_photo ? (
                    <img src={review.author_photo} alt={review.author_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xs font-medium text-[#C8A96E] flex-shrink-0">
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-[#F5F0E8]">{review.author_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} />
                      {review.relative_time && (
                        <span className="text-xs text-[#6B6B6B]">{review.relative_time}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {review.is_featured && (
                    <span className="text-xs text-[#C8A96E] border border-[#C8A96E]/30 px-2 py-0.5">Featured</span>
                  )}
                  <button onClick={() => toggleFeatured(review)}
                    className={`text-xs font-medium tracking-wide transition-colors ${review.is_featured ? 'text-[#6B6B6B] hover:text-[#F5F0E8]' : 'text-[#C8A96E] hover:text-[#F5F0E8]'}`}>
                    {review.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => removeReview(review.id)}
                    className="text-xs text-[#6B6B6B] hover:text-red-400 transition-colors">
                    Hide
                  </button>
                </div>
              </div>
              {review.text && (
                <p className="text-[#6B6B6B] text-sm leading-relaxed line-clamp-3">{review.text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
