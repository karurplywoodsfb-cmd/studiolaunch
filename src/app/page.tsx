// src/app/page.tsx — Marketing homepage (maspace.in)
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'Pricing', href: '#pricing' },
]

const FEATURES = [
  { title: 'Visual Builder', body: 'Drag, drop and design with total freedom — no code required.' },
  { title: 'Lead Inbox', body: 'Every consultation request lands in your dashboard, ready to reply.' },
  { title: 'Portfolio Manager', body: 'Organise projects, case studies and images with total control.' },
  { title: 'Local SEO Engine', body: 'Built-in schema and location pages so you rank in your city.' },
  { title: 'Google Reviews Sync', body: 'Pull your reviews in automatically to build trust on-site.' },
  { title: 'Performance', body: 'Lightweight, fast-loading pages tuned for design-led studios.' },
]

const TEMPLATES = [
  { name: 'Atelier', tag: 'Warm · Timeless' },
  { name: 'Forma', tag: 'Clean · Minimal' },
  { name: 'Terra', tag: 'Organic · Textured' },
  { name: 'Renaissance', tag: 'Classic · Elegant' },
  { name: 'Gallery', tag: 'Bold · Editorial' },
  { name: 'Noir', tag: 'Dark · Refined' },
]

const PROCESS = [
  { n: '01', title: 'Fill the wizard', body: 'Answer a few simple screens — your studio name, city, phone, and a few stats. No design skills needed.' },
  { n: '02', title: 'Your site is live', body: 'Instantly published at yourstudio.maspace.in with all your content, schema, and SEO structure in place.' },
  { n: '03', title: 'Leads come in', body: 'Every consultation request lands in your inbox and dashboard. Reply directly. Convert more clients.' },
]

const PLANS = [
  { name: 'Starter', price: '₹999', period: '/mo', features: ['Subdomain site', 'Consultation form + inbox', '5 portfolio items', '1 case study', 'Basic analytics'], cta: 'Start Free', highlighted: false },
  { name: 'Studio', price: '₹2,499', period: '/mo', features: ['Everything in Starter', 'Custom domain + SSL', 'Unlimited portfolio', 'Unlimited case studies', 'AI SEO enrichment', 'Advanced analytics'], cta: 'Most Popular', highlighted: true },
  { name: 'Agency', price: '₹5,999', period: '/mo', features: ['Everything in Studio', 'White-label branding', '10 team members', 'Priority support', 'Multiple site variants'], cta: 'Contact Us', highlighted: false },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ivory text-graphite" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-stone/60 bg-ivory/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Logo size={26} />
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-graphite/70 hover:text-graphite transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden sm:block text-sm text-graphite/70 hover:text-graphite transition-colors">
              Login
            </Link>
            <Link href="/signup" className="bg-graphite text-ivory text-sm font-medium px-5 py-2.5 hover:bg-graphite/85 transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-5">Design Operating System</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-5xl md:text-6xl font-light leading-[1.05] mb-6">
            Your studio deserves a <em className="text-bronze not-italic">better website</em>
          </h1>
          <p className="text-graphite/60 text-lg leading-relaxed mb-8 max-w-md">
            Launch a premium, SEO-optimised website in under 20 minutes. Built-in lead capture, portfolio manager, case study builder, and AI content — designed specifically for architects and interior designers.
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            <Link href="/signup" className="bg-graphite text-ivory text-sm font-medium px-7 py-3.5 hover:bg-graphite/85 transition-colors inline-flex items-center gap-2">
              Start Free Trial
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <a href="#templates" className="border border-graphite/20 text-graphite text-sm font-medium px-7 py-3.5 hover:border-graphite/50 transition-colors">
              View Templates
            </a>
          </div>
          <p className="text-graphite/45 text-xs">No credit card required · Cancel anytime · Your own subdomain instantly</p>
        </div>

        {/* Hero visual */}
        <div className="relative aspect-[4/3] bg-stone/40 rounded-sm overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 400 300" fill="none" preserveAspectRatio="xMidYMid slice">
              <rect width="400" height="300" fill="#D9D2C4" />
              <rect x="40" y="40" width="120" height="220" fill="#EDE8DE" />
              <rect x="180" y="40" width="180" height="100" fill="#C9B89A" />
              <circle cx="270" cy="90" r="18" fill="#A8ADA1" />
            </svg>
          </div>
          <div className="absolute bottom-6 left-6 right-6 bg-ivory shadow-xl rounded-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-2 h-2 rounded-full bg-stone" />
              <div className="w-2 h-2 rounded-full bg-stone" />
              <div className="w-2 h-2 rounded-full bg-stone" />
            </div>
            <div className="bg-graphite text-ivory p-4">
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-lg">Spaces that inspire life.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-stone/60 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-graphite/40 text-xs tracking-widest uppercase">
          <span>Chennai Studios</span>
          <span>·</span>
          <span>Coimbatore Architects</span>
          <span>·</span>
          <span>Bangalore Interiors</span>
          <span>·</span>
          <span>Hyderabad Design</span>
          <span>·</span>
          <span>Mumbai Studios</span>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-xl mb-14">
          <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-4">All You Need</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-4xl font-light">
            Everything you need, in one intelligent platform.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone/60 border border-stone/60">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-ivory p-8">
              <h3 className="font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-graphite/55 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates / design systems */}
      <section id="templates" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-xl mb-14">
          <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-4">Design Systems</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-4xl font-light">
            Choose a design system that matches your style.
          </h2>
          <p className="text-graphite/55 mt-3">6 master design systems. Unlimited possibilities.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t, i) => (
            <div key={t.name} className="group cursor-pointer">
              <div className={`aspect-[4/3] mb-3 ${i === TEMPLATES.length - 1 ? 'bg-graphite' : 'bg-stone/50'} flex items-center justify-center transition-transform group-hover:-translate-y-1`}>
                <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className={`text-2xl ${i === TEMPLATES.length - 1 ? 'text-ivory' : 'text-graphite/70'}`}>
                  {t.name}
                </span>
              </div>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-graphite/45">{t.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-graphite text-ivory py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-4">The Process</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-4xl font-light">
              Live in <em className="text-bronze not-italic">20 minutes</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-ivory/10">
            {PROCESS.map(step => (
              <div key={step.n} className="bg-graphite p-10">
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-bronze text-4xl font-light mb-6">{step.n}</div>
                <h3 className="text-lg font-medium mb-3">{step.title}</h3>
                <p className="text-ivory/55 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-bronze text-xs tracking-[0.2em] uppercase mb-4">Pricing</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-4xl font-light">
            Simple, <em className="text-bronze not-italic">honest</em> pricing
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-stone/60 border border-stone/60">
          {PLANS.map(plan => (
            <div key={plan.name} className={`p-10 ${plan.highlighted ? 'bg-ivory border-2 border-bronze' : 'bg-ivory'}`}>
              {plan.highlighted && (
                <div className="text-bronze text-xs tracking-widest uppercase mb-4">Most Popular</div>
              )}
              <div className="font-medium mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-8">
                <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-4xl font-light text-bronze">{plan.price}</span>
                <span className="text-graphite/50 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-10">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-graphite/60">
                    <svg className="w-4 h-4 text-bronze mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`block text-center text-sm font-medium py-3 transition-colors ${plan.highlighted ? 'bg-graphite text-ivory hover:bg-graphite/85' : 'border border-graphite/25 text-graphite hover:border-graphite/60'}`}>
                {plan.highlighted ? 'Start Free Trial' : plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-stone/40 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }} className="text-3xl font-light mb-2">
              Ready to design spaces that leave a lasting impression?
            </h2>
            <p className="text-graphite/55">Start building your studio&apos;s digital presence today.</p>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <Link href="/signup" className="bg-graphite text-ivory text-sm font-medium px-7 py-3.5 hover:bg-graphite/85 transition-colors whitespace-nowrap">
              Start Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-graphite text-ivory/70 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-ivory/10">
          <div>
            <Logo size={26} dark />
            <p className="text-xs text-ivory/40 mt-4 max-w-[220px]">Design operating system for architects &amp; interior designers.</p>
          </div>
          <div>
            <div className="text-ivory text-sm font-medium mb-4">Product</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-ivory transition-colors">Features</a></li>
              <li><a href="#templates" className="hover:text-ivory transition-colors">Templates</a></li>
              <li><a href="#pricing" className="hover:text-ivory transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="text-ivory text-sm font-medium mb-4">Company</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="hover:text-ivory transition-colors">Login</Link></li>
              <li><Link href="/signup" className="hover:text-ivory transition-colors">Start Free</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-ivory text-sm font-medium mb-4">Legal</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-ivory transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-ivory transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-6 text-xs text-ivory/35">
          © {new Date().getFullYear()} MaSpace. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
