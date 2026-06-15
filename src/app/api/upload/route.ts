// src/app/api/upload/route.ts — Image upload to Supabase Storage

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ALLOWED_TYPES  = ['image/jpeg','image/png','image/webp','image/gif']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get tenant
    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants').select('id, plan').eq('user_id', user.id).single()
    if (!tenant) return NextResponse.json({ error: 'No studio found' }, { status: 404 })

    const formData = await req.formData()
    const file     = formData.get('file') as File
    const folder   = (formData.get('folder') as string) || 'general'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: 'File type not allowed. Use JPEG, PNG, or WebP.' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES)
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })

    // Build storage path: tenantId/folder/timestamp-filename
    const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path     = `${tenant.id}/${folder}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer      = new Uint8Array(arrayBuffer)

    const { data, error } = await admin.storage
      .from('studio-assets')
      .upload(path, buffer, {
        contentType:  file.type,
        cacheControl: '3600',
        upsert:       false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from('studio-assets')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl, path: data.path }, { status: 201 })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
