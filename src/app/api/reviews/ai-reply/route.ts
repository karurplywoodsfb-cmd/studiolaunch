// src/app/api/reviews/ai-reply/route.ts — drafts a suggested reply to a Google review via Groq.
// This does NOT post to Google — there's no Business Profile API integration here. It returns
// a draft the architect reviews and pastes into their own Google Business dashboard.

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
      return NextResponse.json({ error: 'AI reply drafts require Studio plan or higher' }, { status: 403 })

    const { author_name, rating, text } = await req.json() as { author_name?: string; rating?: number; text?: string }
    if (!author_name || !rating) {
      return NextResponse.json({ error: 'Missing review details' }, { status: 400 })
    }

    const studio = tenant.branding?.business_name || 'the studio'
    const tone = rating >= 4 ? 'warm and appreciative' : rating === 3 ? 'gracious but attentive to feedback' : 'sincere, apologetic, and solution-focused — without being defensive'

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You write short, genuine-sounding replies to Google Business reviews for ${studio}, a premium architecture/interior design studio. Keep it to 2-4 sentences. Never invent specific project details the review didn't mention. Respond with plain text only — no markdown, no quotation marks around it.`,
          },
          {
            role: 'user',
            content: `Write a ${tone} reply to this ${rating}-star review from ${author_name}${text ? `:\n"""${text}"""` : ' (no written comment, just a star rating).'}`,
          },
        ],
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'Draft generation failed. Check your GROQ_API_KEY.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const reply = (groqData.choices?.[0]?.message?.content || '').trim()
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI reply error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
