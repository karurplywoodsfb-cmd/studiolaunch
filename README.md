# StudioLaunch — Production Deployment Guide

Premium SaaS website builder for Architects & Interior Design Studios.

## Architecture

```
studiolaunch.in              → Marketing homepage + auth
[subdomain].studiolaunch.in  → Tenant studio sites (dynamic)
```

## Stack
Next.js 16 App Router · TypeScript · Supabase · Stripe · Resend · Groq API · Vercel

---

## Day 1 — Supabase Setup

1. Create project at https://supabase.com
2. Storage → New bucket: `studio-assets` (Public, 10MB limit, image/* types)
3. SQL Editor → run `supabase/migrations/001_initial_schema.sql`
4. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Day 2 — Stripe Setup

1. Create 3 products: Starter (₹999), Studio (₹2,499), Agency (₹5,999)
2. Webhooks → Add `https://yourdomain.com/api/webhooks/stripe`
   Events: `customer.subscription.*`, `invoice.payment_*`
3. Copy price IDs and webhook secret to `.env.local`

## Day 3 — Resend + Groq

- Resend: https://resend.com → verify domain → API key
- Groq: https://console.groq.com → API key (free tier sufficient)

## Local Dev

```bash
cp .env.local.example .env.local   # fill Supabase values minimum
npm install
npm run dev
```

Test tenant sites at: `http://localhost:3000/[subdomain]`

## Vercel Deployment

```bash
git init && git add . && git commit -m "init"
npx vercel --prod
```

DNS: Add `A @ 76.76.21.21` and `CNAME * cname.vercel-dns.com`
Vercel Domains: Add `studiolaunch.in` + `*.studiolaunch.in`

## User Journey

```
/signup → /onboarding (4 steps) → POST /api/tenants → /dashboard?welcome=1
Site live at [subdomain].studiolaunch.in ✅
Upload portfolio → case study → AI SEO → leads arrive → upgrade plan
```

## Routes Built

| Route | Purpose |
|-------|---------|
| `/` | Marketing homepage |
| `/signup`, `/login` | Auth |
| `/onboarding` | 4-step wizard — creates tenant |
| `/[domain]` | Dynamic tenant site renderer |
| `/dashboard` | Overview + stats |
| `/dashboard/leads` | Lead inbox + status management |
| `/dashboard/portfolio` | Portfolio CRUD manager |
| `/dashboard/case-studies` | Project Arc builder |
| `/dashboard/analytics` | Page views + lead funnel |
| `/dashboard/settings` | Content, branding, SEO, domain, billing |
| `/api/tenants` | Create tenant |
| `/api/tenants/check-subdomain` | Availability check |
| `/api/leads` | Lead submission + email notify |
| `/api/portfolio` | Portfolio CRUD |
| `/api/case-studies` | Case study CRUD |
| `/api/upload` | Image upload → Supabase Storage |
| `/api/studio/seo-enrich` | Groq AI SEO generation |
| `/api/studio/create-checkout` | Stripe checkout |
| `/api/webhooks/stripe` | Subscription lifecycle |
| `/api/analytics/track` | Page view recording |

## Plans

| Plan | Price | Portfolio | Domain | AI SEO |
|------|-------|-----------|--------|--------|
| Starter | ₹999/mo | 5 items | ✗ | ✗ |
| Studio | ₹2,499/mo | Unlimited | ✅ | ✅ |
| Agency | ₹5,999/mo | Unlimited | ✅ | ✅ |
