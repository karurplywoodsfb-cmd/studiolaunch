// src/app/api/case-studies/ai-rewrite/route.ts — polishes existing Project Arc text via Groq.
// Takes what the architect already wrote and tightens/elevates the prose. Never invents new
// facts, numbers, or claims that aren't already present in the input text.

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
      .select('id, plan, branding')
      .eq('user_id', user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'No studio found' }, { status: 404 })
    if (tenant.plan === 'starter')
      return NextResponse.json({ error: 'AI rewrite requires Studio plan or higher' }, { status: 403 })

    const { brief_body, challenge_body, solution_body, outcome_body } = await req.json() as Record<string, string | undefined>
    if (!brief_body && !challenge_body && !solution_body && !outcome_body) {
      return NextResponse.json({ error: 'Write at least one section first' }, { status: 400 })
    }

    const studio = tenant.branding?.business_name || 'the studio'

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        temperature: 0.6,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: `You are an editorial copywriter polishing an existing architecture/interior design case study for ${studio}.
            Rewrite each section to be more confident, concrete, and well-paced — but NEVER add new facts, numbers, materials,
            or claims that are not already present in the original text. This is a rewrite for clarity and tone, not a
            fabrication task. Respond with valid JSON only — no markdown, no preamble.`,
          },
          {
            role: 'user',
            content: `Rewrite these Project Arc sections (skip any that are empty, return "" for those):

            Brief: """${brief_body || ''}"""
            Challenge: """${challenge_body || ''}"""
            Solution: """${solution_body || ''}"""
            Outcome: """${outcome_body || ''}"""

            Return JSON: { "brief_body": "...", "challenge_body": "...", "solution_body": "...", "outcome_body": "..." }`,
          },
        ],
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'Rewrite failed. Check your GROQ_API_KEY.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const rawContent = groqData.choices?.[0]?.message?.content || ''

    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(rawContent.replace(/```json|```/g, '').trim())
    } catch {
      console.error('JSON parse error. Raw:', rawContent)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json({ data: parsed })
  } catch (err) {
    console.error('AI rewrite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
