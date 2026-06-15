// src/app/api/reviews/route.ts — Google Reviews sync + CRUD

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tenants').select('*').eq('user_id', user.id).single()
  return data
}

// GET — fetch cached reviews for dashboard display
export async function GET() {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: reviews } = await admin
    .from('google_reviews')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('display_order', { ascending: true })

  return NextResponse.json({
    data:               reviews || [],
    google_place_id:    tenant.google_place_id,
    google_rating:      tenant.google_rating,
    google_review_count: tenant.google_review_count,
    reviews_last_synced: tenant.reviews_last_synced,
  })
}

// POST — sync reviews from Google Places API
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body     = await req.json().catch(() => ({}))
  const placeId  = body.place_id || tenant.google_place_id

  if (!placeId) {
    return NextResponse.json({
      error: 'No Google Place ID provided. Find yours at https://developers.google.com/maps/documentation/places/web-service/place-id',
    }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  // Fetch from Google Places Details API
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&language=en&key=${apiKey}`

  const res  = await fetch(url)
  const json = await res.json()

  if (json.status !== 'OK') {
    return NextResponse.json({
      error: `Google Places API error: ${json.status} — ${json.error_message || 'Check your Place ID and API key'}`,
    }, { status: 400 })
  }

  const place   = json.result
  const reviews = (place.reviews || []) as Array<{
    author_name:          string
    profile_photo_url?:   string
    rating:               number
    text:                 string
    time:                 number
    relative_time_description: string
  }>

  const admin = createAdminClient()

  // Update tenant with aggregate data + place id
  await admin.from('tenants').update({
    google_place_id:      placeId,
    google_rating:        place.rating || null,
    google_review_count:  place.user_ratings_total || 0,
    reviews_last_synced:  new Date().toISOString(),
  }).eq('id', tenant.id)

  // Delete old cached reviews and insert fresh ones
  await admin.from('google_reviews').delete().eq('tenant_id', tenant.id)

  if (reviews.length > 0) {
    // Only cache 4+ star reviews (show the studio in best light)
    const goodReviews = reviews.filter(r => r.rating >= 4)

    await admin.from('google_reviews').insert(
      goodReviews.map((r, i) => ({
        tenant_id:     tenant.id,
        google_place_id: placeId,
        author_name:   r.author_name,
        author_photo:  r.profile_photo_url || null,
        rating:        r.rating,
        text:          r.text || null,
        time:          r.time,
        relative_time: r.relative_time_description,
        display_order: i,
        is_featured:   i < 3, // feature first 3
      }))
    )
  }

  return NextResponse.json({
    message:      `Synced ${reviews.length} reviews (${reviews.filter(r=>r.rating>=4).length} shown)`,
    rating:       place.rating,
    total_reviews: place.user_ratings_total,
    synced_count:  reviews.filter(r => r.rating >= 4).length,
  })
}

// PATCH — update a review (toggle featured, reorder)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('google_reviews')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE — remove a review from display
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const tenant   = await getTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const admin  = createAdminClient()
  await admin.from('google_reviews').delete().eq('id', id).eq('tenant_id', tenant.id)
  return NextResponse.json({ message: 'Removed' })
}
