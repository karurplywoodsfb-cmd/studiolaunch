// src/app/page.tsx — Marketing homepage (studiolaunch.in)
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A1A1A] bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#C8A96E] flex items-center justify-center">
              <span className="text-[#C8A96E] text-sm font-light" style={{fontFamily:'Georgia,serif'}}>S</span>
            </div>
            <span className="text-sm tracking-[0.2em] uppercase font-light">StudioLaunch</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs text-[#6B6B6B] hover:text-[#F5F0E8] tracking-widest uppercase transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-5 py-2.5 hover:bg-[#A8854A] transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-8 border border-[#C8A96E]/30 px-4 py-1.5">
            Built for Architects & Interior Designers
          </div>
          <h1 style={{fontFamily:'Georgia,serif'}} className="text-5xl md:text-7xl font-light leading-[0.95] mb-8 text-[#F5F0E8]">
            Your studio deserves<br/>a <em className="text-[#C8A96E]">better website</em>
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Launch a premium, SEO-optimised website in under 20 minutes. Built-in lead capture, portfolio manager, case study builder, and AI content — designed specifically for design studios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-[#C8A96E] text-[#0A0A0A] text-xs font-semibold tracking-widest uppercase px-8 py-4 hover:bg-[#A8854A] transition-colors inline-flex items-center gap-3 justify-center">
              Start 14-Day Free Trial
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="#how-it-works" className="border border-[#2A2A2A] text-[#F5F0E8]/70 text-xs font-medium tracking-widest uppercase px-8 py-4 hover:border-[#C8A96E]/50 transition-colors">
              See How It Works
            </Link>
          </div>
          <p className="text-[#6B6B6B] text-xs mt-6">No credit card required · Cancel anytime · Your own subdomain instantly</p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-[#1A1A1A] py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-[#6B6B6B] text-xs tracking-widest uppercase">
          <span>Chennai Studios</span>
          <span className="text-[#2A2A2A]">·</span>
          <span>Coimbatore Architects</span>
          <span className="text-[#2A2A2A]">·</span>
          <span>Bangalore Interiors</span>
          <span className="text-[#2A2A2A]">·</span>
          <span>Hyderabad Design</span>
          <span className="text-[#2A2A2A]">·</span>
          <span>Mumbai Studios</span>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-4">The Process</div>
            <h2 style={{fontFamily:'Georgia,serif'}} className="text-4xl md:text-5xl font-light text-[#F5F0E8]">Live in <em className="text-[#C8A96E]">20 minutes</em></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[#1A1A1A]">
            {[
              { n:'01', title:'Fill the wizard', body:'Answer 4 simple screens — your studio name, city, phone, and a few stats. No design skills needed.' },
              { n:'02', title:'Your site is live', body:'Instantly published at yourstudio.studiolaunch.in with all your content, schema, and SEO structure in place.' },
              { n:'03', title:'Leads come in', body:'Every consultation request lands in your inbox and dashboard. Reply directly. Convert more clients.' },
            ].map(step => (
              <div key={step.n} className="bg-[#0A0A0A] p-10">
                <div style={{fontFamily:'Georgia,serif'}} className="text-[#C8A96E] text-4xl font-light mb-6">{step.n}</div>
                <h3 className="text-[#F5F0E8] text-lg font-medium mb-3">{step.title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-28 px-6 bg-[#0D0D0D]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-[#C8A96E] text-xs tracking-[0.3em] uppercase mb-4">Pricing</div>
            <h2 style={{fontFamily:'Georgia,serif'}} className="text-4xl font-light text-[#F5F0E8]">Simple, <em className="text-[#C8A96E]">honest</em> pricing</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[#1A1A1A]">
            {[
              { name:'Starter', price:'₹999', period:'/mo', features:['Subdomain site','Consultation form + inbox','5 portfolio items','1 case study','Basic analytics'], cta:'Start Free', highlighted:false },
              { name:'Studio', price:'₹2,499', period:'/mo', features:['Everything in Starter','Custom domain + SSL','Unlimited portfolio','Unlimited case studies','AI SEO enrichment','Advanced analytics'], cta:'Most Popular', highlighted:true },
              { name:'Agency', price:'₹5,999', period:'/mo', features:['Everything in Studio','White-label branding','10 team members','Priority support','Multiple site variants'], cta:'Contact Us', highlighted:false },
            ].map(plan => (
              <div key={plan.name} className={`p-10 ${plan.highlighted ? 'bg-[#141414] border border-[#C8A96E]/30' : 'bg-[#0A0A0A]'}`}>
                {plan.highlighted && (
                  <div className="text-[#C8A96E] text-xs tracking-widest uppercase mb-4">Most Popular</div>
                )}
                <div className="text-[#F5F0E8] font-medium mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span style={{fontFamily:'Georgia,serif'}} className="text-4xl font-light text-[#C8A96E]">{plan.price}</span>
                  <span className="text-[#6B6B6B] text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-10">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#6B6B6B]">
                      <svg className="w-4 h-4 text-[#C8A96E] mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block text-center text-xs font-semibold tracking-widest uppercase py-3 transition-colors ${plan.highlighted ? 'bg-[#C8A96E] text-[#0A0A0A] hover:bg-[#A8854A]' : 'border border-[#2A2A2A] text-[#F5F0E8]/70 hover:border-[#C8A96E]/50'}`}>
                  {plan.highlighted ? 'Start Free Trial' : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[#6B6B6B]">© {new Date().getFullYear()} StudioLaunch. All rights reserved.</div>
          <div className="flex gap-6 text-xs text-[#6B6B6B]">
            <Link href="/privacy" className="hover:text-[#C8A96E] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#C8A96E] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
