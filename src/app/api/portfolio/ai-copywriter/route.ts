// src/app/api/portfolio/ai-copywriter/route.ts — AI "Project Arc" copywriter via Groq
// Takes the architect's rough, informal bullet points about a project and turns them into
// premium editorial case-study text: full_description, challenge_text, solution_text.
// Deliberately does NOT generate a testimonial — a client quote must be the client's real words.

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, plan, branding, location')
      .eq('user_id', user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'No studio found' }, { status: 404 })
    if (tenant.plan === 'starter')
      return NextResponse.json({ error: 'AI copywriting requires Studio plan or higher' }, { status: 403 })

    const body = await req.json()
    const { title, category, location, area_sqft, finish_tier, notes } = body as {
      title?: string; category?: string; location?: string
      area_sqft?: number; finish_tier?: string; notes?: string
    }

    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: 'Add a few bullet points about the project first' }, { status: 400 })
    }

    const city = tenant.location?.local_city || location || ''
    const studio = tenant.branding?.business_name || 'the studio'

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: `You are an editorial copywriter for premium architecture and interior design studios in India.
            Write confident, concrete, sensory prose — never generic filler. Never invent specific facts (materials,
            costs, timelines, or people) that are not implied by the bullet points given. Never fabricate a client
            quote or testimonial. Always respond with valid JSON only — no markdown, no preamble.`,
          },
          {
            role: 'user',
            content: `Write case-study copy for a project called "${title || 'this project'}" ` +
              `(${category || 'residential'}, ${area_sqft ? area_sqft + ' sq.ft, ' : ''}${finish_tier || ''} finish) ` +
              `by ${studio} in ${city}.

            The architect's rough notes on the project:
            """${notes.trim()}"""

            Return a JSON object with this exact structure:
            {
              "full_description": "150-200 word editorial overview of the project — the brief, the space, the intent. First-person plural ('we') from the studio's perspective.",
              "challenge_text": "40-70 words describing the specific challenge or constraint this project presented, grounded only in the notes given.",
              "solution_text": "40-70 words describing how the design solved that challenge, grounded only in the notes given.",
              "suggested_tags": ["3 to 5 short lowercase tags like 'modern', 'compact-living', 'natural-light'"]
            }`,
          },
        ],
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'AI generation failed. Check your GROQ_API_KEY.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const rawContent = groqData.choices?.[0]?.message?.content || ''

    let parsed: { full_description: string; challenge_text: string; solution_text: string; suggested_tags?: string[] }
    try {
      const clean = rawContent.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error. Raw:', rawContent)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json({ data: parsed })
  } catch (err) {
    console.error('AI copywriter error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
