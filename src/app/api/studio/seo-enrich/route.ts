// src/app/api/studio/seo-enrich/route.ts — AI SEO enrichment via Groq

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'No studio found' }, { status: 404 })
    if (tenant.plan === 'starter')
      return NextResponse.json({ error: 'SEO enrichment requires Studio plan' }, { status: 403 })

    const { branding, location, contact } = tenant
    const city      = location.local_city
    const state     = location.state
    const studio    = branding.business_name

    // ── Groq API call ──────────────────────────────────────────────────────
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `You are an expert local SEO copywriter for architectural and interior design studios in India. 
            Write conversational, trustworthy content that ranks well for local search queries.
            Always respond with valid JSON only — no markdown, no preamble.`,
          },
          {
            role: 'user',
            content: `Generate local SEO content for ${studio}, an architectural and interior design studio in ${city}, ${state}.

            Return a JSON object with this exact structure:
            {
              "meta_description": "A 155-character meta description for the studio homepage, mentioning ${city}",
              "faqs": [
                {
                  "question": "How much does interior design cost in ${city}?",
                  "answer": "Detailed 60-80 word answer specific to ${city} pricing context"
                },
                {
                  "question": "How long does a full home interior design project take?",
                  "answer": "Detailed 60-80 word answer about typical timelines"
                },
                {
                  "question": "Do you handle turnkey projects in ${city}?",
                  "answer": "60-80 word answer about turnkey vs design-only services"
                },
                {
                  "question": "What areas near ${city} does ${studio} service?",
                  "answer": "60-80 word answer mentioning surrounding towns in ${state}"
                },
                {
                  "question": "Can I see 3D renders before work begins?",
                  "answer": "60-80 word answer about 3D visualization process and approvals"
                },
                {
                  "question": "What is the best interior design style for homes in ${city}?",
                  "answer": "60-80 word answer referencing local climate, culture, and material availability in ${state}"
                }
              ]
            }`,
          },
        ],
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'AI enrichment failed. Check your GROQ_API_KEY.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const rawContent = groqData.choices?.[0]?.message?.content || ''

    // Parse JSON from Groq response
    let parsed: { meta_description: string; faqs: { question: string; answer: string }[] }
    try {
      const clean = rawContent.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error. Raw:', rawContent)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Update tenant meta description
    await admin
      .from('tenants')
      .update({ meta_description: parsed.meta_description, seo_enriched: true })
      .eq('id', tenant.id)

    // Delete old auto-generated FAQs and insert new ones
    await admin.from('faq_items').delete().eq('tenant_id', tenant.id)

    const faqRows = parsed.faqs.map((f, i) => ({
      tenant_id:     tenant.id,
      question:      f.question,
      answer:        f.answer,
      display_order: i + 1,
    }))

    await admin.from('faq_items').insert(faqRows)

    return NextResponse.json({
      message: 'SEO enrichment complete',
      meta_description: parsed.meta_description,
      faq_count: faqRows.length,
    })
  } catch (err) {
    console.error('SEO enrich error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
